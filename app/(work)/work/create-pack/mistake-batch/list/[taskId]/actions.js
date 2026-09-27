"use server";

import { deleteFile } from "../../../../../../../lib/common/file.js";
import { countFailedTasks, deleteClassTaskZipFile, deleteTaskAllZipFileAndResetStatus, getClassTask, getStudentPdfForDownload, getStudentPdfForRegenerate, getTaskClassTasks, getTaskDetail, getTaskStudentPdfs, regenerateClassAllStudentsPdf, resetStudentPdfToWaiting, retryAllCleanFailedTasks, retryAllFailedTasks } from "./datas.js";
/**
 * 获取任务详情
 */
export async function getTaskDetailAction(taskId) {
  try {
    const task = await getTaskDetail(taskId);
    return task;
  } catch (error) {
    console.error("获取任务详情失败:", error);
    throw new Error("获取任务详情失败");
  }
}

/**
 * 获取任务的班级任务列表
 */
export async function getTaskClassTasksAction(taskId) {
  try {
    const classTasks = await getTaskClassTasks(taskId);
    return classTasks;
  } catch (error) {
    console.error("获取班级任务列表失败:", error);
    throw new Error("获取班级任务列表失败");
  }
}

/**
 * 获取任务的所有学生PDF记录
 */
export async function getTaskStudentPdfsAction(taskId) {
  try {
    const studentPdfs = await getTaskStudentPdfs(taskId);
    return studentPdfs;
  } catch (error) {
    console.error("获取学生PDF记录失败:", error);
    throw new Error("获取学生PDF记录失败");
  }
}

/**
 * 重新生成学生PDF
 */
export async function regenerateStudentPdfAction(studentPdfId) {
  try {
    // 1. 获取学生PDF记录和任务信息
    const data = await getStudentPdfForRegenerate(studentPdfId);
    if (!data) {
      return {
        success: false,
        error: "学生PDF记录不存在"
      };
    }
    const {
      studentPdf,
      task
    } = data;

    // 2. 收集要删除的文件ID
    const filesToDelete = [];
    if (studentPdf.mistakePdf?.fileID) {
      filesToDelete.push(studentPdf.mistakePdf.fileID);
    }
    if (studentPdf.answerPdf?.fileID) {
      filesToDelete.push(studentPdf.answerPdf.fileID);
    }

    // 3. 删除云盘中的文件
    if (filesToDelete.length > 0) {
      try {
        await deleteFile(filesToDelete);
      } catch (error) {
        console.error("删除PDF文件失败:", error);
        // 即使删除失败也继续执行，因为可能文件已经不存在
      }
    }

    // 4. 检查并删除该班级的打包文件
    if (task) {
      try {
        // 查找该班级的任务并删除其ZIP文件
        await deleteClassTaskZipFile(studentPdf.taskId, studentPdf.classId);
      } catch (error) {
        console.error("删除班级打包文件失败:", error);
      }

      // 5. 删除全部打包文件并重置任务状态
      try {
        await deleteTaskAllZipFileAndResetStatus(studentPdf.taskId);
      } catch (error) {
        console.error("删除全部打包文件并重置任务状态失败:", error);
      }
    }

    // 6. 将学生PDF状态改为等待中
    await resetStudentPdfToWaiting(studentPdfId);
    return {
      success: true
    };
  } catch (error) {
    console.error("重新生成学生PDF失败:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "重新生成PDF失败"
    };
  }
}

/**
 * 重新生成班级打包文件
 */
export async function regenerateClassZipAction(classTaskId) {
  try {
    // 1. 获取班级任务信息
    const classTask = await getClassTask(classTaskId);
    if (!classTask) {
      return {
        success: false,
        error: "班级任务不存在"
      };
    }

    // 2. 删除班级打包文件
    if (classTask.zipFile?.fileID) {
      try {
        await deleteFile([classTask.zipFile.fileID]);
      } catch (error) {
        console.error("删除班级打包文件失败:", error);
        // 即使删除失败也继续执行
      }
    }

    // 3. 删除全部打包文件并重置任务状态
    try {
      await deleteTaskAllZipFileAndResetStatus(classTask.taskId);
    } catch (error) {
      console.error("删除全部打包文件并重置任务状态失败:", error);
    }

    // 4. 重置班级任务状态为等待中（删除ZIP文件信息并重置状态）
    await deleteClassTaskZipFile(classTask.taskId, classTask.classId);
    return {
      success: true
    };
  } catch (error) {
    console.error("重新生成班级打包文件失败:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "重新生成打包文件失败"
    };
  }
}

/**
 * 重新生成任务全部打包文件
 */
export async function regenerateTaskAllZipAction(taskId) {
  try {
    await deleteTaskAllZipFileAndResetStatus(taskId);
    return {
      success: true
    };
  } catch (error) {
    console.error("重新生成任务全部打包文件失败:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "重新生成全部打包文件失败"
    };
  }
}

/**
 * 批量重新生成班级所有学生的PDF文件
 */
export async function regenerateClassAllStudentsPdfAction(classTaskId) {
  try {
    await regenerateClassAllStudentsPdf(classTaskId);
    return {
      success: true
    };
  } catch (error) {
    console.error("批量重新生成班级所有学生PDF失败:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "批量重新生成班级所有学生PDF失败"
    };
  }
}

/**
 * 批量重试失败的任务
 */
export async function retryAllFailedTasksAction(taskId) {
  try {
    const count = await retryAllFailedTasks(taskId);
    return {
      success: true,
      count
    };
  } catch (error) {
    console.error("批量重试失败任务失败:", error);
    return {
      success: false,
      count: 0,
      error: error instanceof Error ? error.message : "批量重试失败任务失败"
    };
  }
}

/**
 * 批量重试清理失败的任务
 */
export async function retryAllCleanFailedTasksAction(taskId) {
  try {
    const count = await retryAllCleanFailedTasks(taskId);
    return {
      success: true,
      count
    };
  } catch (error) {
    console.error("批量重试清理失败任务失败:", error);
    return {
      success: false,
      count: 0,
      error: error instanceof Error ? error.message : "批量重试清理失败任务失败"
    };
  }
}

/**
 * 统计失败任务数量
 */
export async function countFailedTasksAction(taskId) {
  try {
    return await countFailedTasks(taskId);
  } catch (error) {
    console.error("统计失败任务数量失败:", error);
    return {
      failedCount: 0,
      cleanFailedCount: 0
    };
  }
}

/**
 * 打包下载学生的PDF文件
 */
export async function downloadStudentPdfZipAction(studentPdfId) {
  try {
    // 1. 获取学生PDF数据和任务信息
    const data = await getStudentPdfForDownload(studentPdfId);
    if (!data) {
      return {
        success: false,
        error: "学生PDF记录不存在"
      };
    }
    const {
      studentPdf,
      task
    } = data;

    // 2. 检查PDF文件是否存在
    if (!studentPdf.mistakePdf?.fileUrl || !studentPdf.answerPdf?.fileUrl) {
      return {
        success: false,
        error: "PDF文件尚未生成完成"
      };
    }

    // 3. 动态导入所需模块
    const JSZip = (await import("jszip")).default;

    // 4. 下载PDF文件
    const [mistakePdfResponse, answerPdfResponse] = await Promise.all([fetch(studentPdf.mistakePdf.fileUrl), fetch(studentPdf.answerPdf.fileUrl)]);
    if (!mistakePdfResponse.ok || !answerPdfResponse.ok) {
      return {
        success: false,
        error: "下载PDF文件失败"
      };
    }
    const [mistakePdfBuffer, answerPdfBuffer] = await Promise.all([mistakePdfResponse.arrayBuffer(), answerPdfResponse.arrayBuffer()]);

    // 5. 创建ZIP文件
    const zip = new JSZip();

    // 生成文件名
    const mistakePdfFileName = `${task.taskName}-${studentPdf.studentName}-错题集.pdf`;
    const answerPdfFileName = `${task.taskName}-${studentPdf.studentName}-答案.pdf`;
    zip.file(mistakePdfFileName, mistakePdfBuffer);
    zip.file(answerPdfFileName, answerPdfBuffer);

    // 6. 生成ZIP文件的Base64字符串
    const zipBase64 = await zip.generateAsync({
      type: "base64"
    });
    const fileName = `${task.taskName}-${studentPdf.studentName}.zip`;
    return {
      success: true,
      zipBase64,
      fileName
    };
  } catch (error) {
    console.error("打包下载学生PDF失败:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "打包下载失败"
    };
  }
}
