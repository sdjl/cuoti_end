import { NextResponse } from "next/server";
import { atomicGetAndMarkClassZipsForCleaning, processClassZipsCleaning } from "./classZipCleaning.js";
import { atomicGetAndMarkClassZipTask, processClassZip } from "./classZipGenerator.js";
import { atomicGetAndMarkStudentPdfsForCleaning, processStudentPdfsCleaning } from "./studentPdfCleaning.js";
import { atomicGetAndMarkStudentPdfs, processStudentPdfs } from "./studentPdfGenerator.js";
import { atomicGetAndMarkTaskZipsForCleaning, processTaskZipsCleaning } from "./taskZipCleaning.js";
import { atomicGetAndMarkAllZipTask, processAllZip } from "./taskZipGenerator.js";
import { checkAndHandleTimeouts } from "./timeoutChecker.js";
import { API_SECRET, checkTaskStatus, cleanupExpiredTempDirs, safeAfter } from "./utils.js";


async function handleTimeoutCheck() {
  await checkAndHandleTimeouts();
  return null; // 返回null让后续步骤继续执行
}


async function handleStudentPdfGeneration() {
  // 原子性地获取并标记学生PDF为生成中状态
  // 使用processingToken避免多个实例同时处理相同的任务
  const studentPdfs = await atomicGetAndMarkStudentPdfs();
  if (studentPdfs.length === 0) {
    return null;
  }

  // 使用 safeAfter 在后台执行PDF生成工作，带超时保护
  safeAfter(async signal => {
    await processStudentPdfs({
      studentPdfs,
      signal
    });
  });

  // 有任务需要处理，返回响应，后续步骤不再执行
  return NextResponse.json({
    success: true,
    message: `已开始处理 ${studentPdfs.length} 个学生的PDF生成任务`,
    processed: studentPdfs.length,
    type: "student_pdf"
  });
}


async function handleClassZipGeneration() {
  // 原子性地获取并标记班级ZIP任务为生成中状态
  // 这样可以避免多个实例同时处理相同的任务
  const classZipTask = await atomicGetAndMarkClassZipTask();
  if (!classZipTask) {
    return null;
  }

  // 使用 safeAfter 在后台执行班级ZIP生成，带超时保护
  safeAfter(async signal => {
    await processClassZip({
      classTaskId: classZipTask.classTaskId,
      taskId: classZipTask.taskId,
      taskName: classZipTask.taskName,
      classId: classZipTask.classId,
      tempDir: classZipTask.tempDir,
      signal
    });
  });
  return NextResponse.json({
    success: true,
    message: `已开始生成班级 ${classZipTask.className} 的打包文件`,
    processed: 1,
    type: "class_zip"
  });
}


async function handleAllZipGeneration() {
  // 原子性地获取并标记全部ZIP任务为生成中状态
  // 这样可以避免多个实例同时处理相同的任务
  const allZipTask = await atomicGetAndMarkAllZipTask();
  if (!allZipTask) {
    return null;
  }

  // 使用 safeAfter 在后台执行全部ZIP生成，带超时保护
  safeAfter(async signal => {
    await processAllZip({
      taskId: allZipTask.taskId,
      taskName: allZipTask.taskName,
      tempDir: allZipTask.tempDir,
      signal
    });
  });
  return NextResponse.json({
    success: true,
    message: `已开始生成任务 ${allZipTask.taskName} 的全部打包文件`,
    processed: 1,
    type: "all_zip"
  });
}


async function handleStudentPdfCleaning() {
  // 原子性地获取并标记学生PDF为清理中状态
  // 这样可以避免多个实例同时处理相同的任务
  const studentPdfs = await atomicGetAndMarkStudentPdfsForCleaning();
  if (studentPdfs.length === 0) {
    return null;
  }

  // 使用 safeAfter 在后台执行清理工作，带超时保护
  safeAfter(async signal => {
    await processStudentPdfsCleaning({
      studentPdfs,
      signal
    });
  });
  return NextResponse.json({
    success: true,
    message: `已开始清理 ${studentPdfs.length} 个学生的PDF文件`,
    processed: studentPdfs.length,
    type: "clean_student_pdf"
  });
}


async function handleClassZipCleaning() {
  // 原子性地获取并标记班级ZIP为清理中状态
  // 这样可以避免多个实例同时处理相同的任务
  const classTasks = await atomicGetAndMarkClassZipsForCleaning();
  if (classTasks.length === 0) {
    return null;
  }

  // 使用 safeAfter 在后台执行清理工作，带超时保护
  safeAfter(async signal => {
    await processClassZipsCleaning({
      classTasks,
      signal
    });
  });
  return NextResponse.json({
    success: true,
    message: `已开始清理 ${classTasks.length} 个班级的ZIP文件`,
    processed: classTasks.length,
    type: "clean_class_zip"
  });
}


async function handleAllZipCleaning() {
  // 原子性地获取并标记全部ZIP为清理中状态
  // 这样可以避免多个实例同时处理相同的任务
  const tasks = await atomicGetAndMarkTaskZipsForCleaning();
  if (tasks.length === 0) {
    return null;
  }

  // 使用 safeAfter 在后台执行清理工作，带超时保护
  safeAfter(async signal => {
    await processTaskZipsCleaning({
      tasks,
      signal
    });
  });
  return NextResponse.json({
    success: true,
    message: `已开始清理 ${tasks.length} 个任务的全部ZIP文件`,
    processed: tasks.length,
    type: "clean_all_zip"
  });
}

/**
 * 主处理函数：按优先级处理各类任务
 * 优先级：超时检查 > 学生PDF生成 > 班级ZIP生成 > 全部ZIP生成 > 学生PDF清理 > 班级ZIP清理 > 全部ZIP清理
 */
export async function GET(request) {
  try {
    // 验证API密码
    const secret = request.nextUrl.searchParams.get("secret");
    if (secret !== API_SECRET) {
      return NextResponse.json({
        success: false,
        error: "访问被拒绝：密码错误"
      }, {
        status: 403
      });
    }

    // 先清理过期的临时目录（每次API调用时执行一次）
    try {
      cleanupExpiredTempDirs();
    } catch (error) {
      console.error("清理过期临时目录失败:", error);
      // 清理失败不影响后续流程
    }

    // 先检查是否有需要处理的任务，避免不必要的数据库查询
    const {
      hasGeneratingTasks,
      hasCleaningTasks
    } = await checkTaskStatus();

    // 如果没有任何任务需要处理，直接返回
    if (!hasGeneratingTasks && !hasCleaningTasks) {
      return NextResponse.json({
        success: true,
        message: "暂无等待处理的任务",
        processed: 0
      });
    }

    // 1. 检查并处理超时的任务（总是要执行）
    await handleTimeoutCheck();

    // 如果有生成中的任务，执行生成相关的步骤（2、3、4）
    if (hasGeneratingTasks) {
      // 2. 处理学生PDF生成任务
      const studentPdfResponse = await handleStudentPdfGeneration();
      if (studentPdfResponse) {
        return studentPdfResponse;
      }

      // 3. 处理班级ZIP生成任务
      const classZipResponse = await handleClassZipGeneration();
      if (classZipResponse) {
        return classZipResponse;
      }

      // 4. 处理全部ZIP生成任务
      const allZipResponse = await handleAllZipGeneration();
      if (allZipResponse) {
        return allZipResponse;
      }
    }

    // 如果有清理中的任务，执行清理相关的步骤（5、6、7）
    if (hasCleaningTasks) {
      // 5. 处理学生PDF清理任务
      const studentPdfCleaningResponse = await handleStudentPdfCleaning();
      if (studentPdfCleaningResponse) {
        return studentPdfCleaningResponse;
      }

      // 6. 处理班级ZIP清理任务
      const classZipCleaningResponse = await handleClassZipCleaning();
      if (classZipCleaningResponse) {
        return classZipCleaningResponse;
      }

      // 7. 处理全部ZIP清理任务
      const allZipCleaningResponse = await handleAllZipCleaning();
      if (allZipCleaningResponse) {
        return allZipCleaningResponse;
      }
    }

    // 8. 没有任何待处理任务
    return NextResponse.json({
      success: true,
      message: "暂无等待处理的任务",
      processed: 0
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: `运行任务失败: ${error instanceof Error ? error.message : "未知错误"}`
    }, {
      status: 500
    });
  }
}
