import fs from "node:fs";
import path from "node:path";
import JSZip from "jszip";
import { allDocs, command, getDoc, updateDoc, updateMatch } from "../../../lib/common/database.js";
import { getFileURL, uploadFile } from "../../../lib/common/file.js";
import { randomString } from "../../../lib/common/random.js";
import { checkMemoryUsage, cleanupClassTempDir, downloadFileToLocal, ensureDirExists, getClassZipTempDir, InsufficientMemoryError, MAX_RETRY_COUNT, removeDirRecursive, throwIfAborted } from "./utils.js";

/**
 * 说明：
 * 本文件负责处理班级级别的ZIP文件生成
 * 并不需要在这个文件中把生成状态改成failed，只需要在有异常的时候抛出异常就够了，
 * 因为handleTimeoutCheck函数会检查超时任务，并重新尝试生成
 */

/**
 * 原子性地获取并标记下一个需要生成班级ZIP的任务
 * 逻辑：读取所有waiting状态的班级任务，检查每个班级的所有学生PDF是否都已完成
 * 使用processingToken避免并发冲突
 *
 * 重要：确保同一时间只有一个ZIP生成任务在执行（班级ZIP或任务ZIP）
 * 班级ZIP和任务ZIP是互斥的，不能同时进行，避免多个任务的临时文件同时占用内存
 */
export async function atomicGetAndMarkClassZipTask() {
  const _ = command();

  // 1. 先检查是否有正在执行中的班级ZIP任务
  const generatingClassTasks = await allDocs({
    c: "mistake_batch_class_task",
    match: {
      status: "generating"
    },
    only: "_id"
  });

  // 如果有正在执行中的班级ZIP任务，直接返回 null，不开启新任务
  if (generatingClassTasks.length > 0) {
    console.log(`已有 ${generatingClassTasks.length} 个班级ZIP任务正在执行中，跳过开启新任务`);
    return null;
  }

  // 2. 检查是否有正在执行中的任务ZIP（班级ZIP和任务ZIP互斥）
  const generatingTaskZips = await allDocs({
    c: "mistake_batch_task",
    match: {
      status: "generating"
    },
    only: "_id"
  });

  // 如果有正在执行中的任务ZIP，直接返回 null，不开启班级ZIP
  if (generatingTaskZips.length > 0) {
    console.log(`已有 ${generatingTaskZips.length} 个任务ZIP正在执行中，跳过开启班级ZIP任务`);
    return null;
  }

  // 3. 生成唯一的处理令牌（20位随机字符串）
  const processingToken = randomString(20);

  // 4. 获取所有等待中的班级任务（按创建时间升序）
  const classTasks = await allDocs({
    c: "mistake_batch_class_task",
    match: {
      status: "waiting",
      processingToken: ""
    },
    sort: {
      created: 1
    },
    only: "_id,taskId,classId,className"
  });
  if (classTasks.length === 0) return null;

  // 5. 一次性读取所有任务信息
  const taskIds = [...new Set(classTasks.map(t => t.taskId))];
  const tasks = await allDocs({
    c: "mistake_batch_task",
    match: {
      _id: _.in(taskIds)
    },
    only: "_id,taskName"
  });
  const tasksMap = new Map(tasks.map(t => [t._id, t]));

  // 6. 批量读取所有相关班级的学生PDF状态
  const classIds = classTasks.map(t => t.classId);

  // 一次性读取所有相关的学生PDF记录
  const allStudentPdfs = await allDocs({
    c: "mistake_batch_student_pdf",
    match: {
      taskId: _.in(taskIds),
      classId: _.in(classIds)
    },
    only: "taskId,classId,status"
  });

  // 7. 按 taskId-classId 分组统计学生PDF状态
  const studentPdfsByClass = new Map();
  for (const pdf of allStudentPdfs) {
    const key = `${pdf.taskId}-${pdf.classId}`;
    if (!studentPdfsByClass.has(key)) {
      studentPdfsByClass.set(key, []);
    }
    studentPdfsByClass.get(key).push({
      status: pdf.status
    });
  }

  // 8. 遍历班级任务，找到第一个所有学生PDF都已完成的班级
  for (const classTask of classTasks) {
    const key = `${classTask.taskId}-${classTask.classId}`;
    const studentPdfs = studentPdfsByClass.get(key) || [];

    // 如果该班级没有学生PDF记录，跳过
    if (studentPdfs.length === 0) {
      continue;
    }

    // 检查该班级的所有学生PDF是否都已完成
    const allStudentPdfsCompleted = studentPdfs.every(pdf => pdf.status === "completed");
    if (allStudentPdfsCompleted) {
      // 找到了一个所有学生PDF都已完成的班级任务
      // 生成临时目录路径
      const tempDir = getClassZipTempDir(classTask.taskId, classTask.classId);

      // 原子性地尝试将其标记为generating状态，并保存临时目录路径
      await updateMatch("mistake_batch_class_task", {
        _id: classTask._id,
        status: "waiting",
        processingToken: "" // 关键：只更新processingToken为空的文档
      }, {
        status: "generating",
        processingToken,
        // 设置为当前实例的唯一令牌
        startTime: Date.now(),
        tempDir // 保存临时目录路径
      });

      // 9. 根据processingToken查询是否成功标记
      const markedTask = await allDocs({
        c: "mistake_batch_class_task",
        match: {
          _id: classTask._id,
          processingToken // 只查询带有当前实例令牌的文档
        },
        only: "_id,tempDir"
      });

      // 如果成功标记，返回任务信息
      if (markedTask.length > 0) {
        const task = tasksMap.get(classTask.taskId);
        return {
          taskId: classTask.taskId,
          taskName: task?.taskName || "",
          classId: classTask.classId,
          className: classTask.className,
          classTaskId: classTask._id,
          tempDir: markedTask[0].tempDir || tempDir // 使用数据库中的tempDir，如果没有则使用新生成的
        };
      }
      // 如果没有成功标记，说明其他实例已经获取了这个任务，继续查找下一个
    }
  }
  return null;
}

/**
 * 处理班级ZIP生成
 */
export async function processClassZip({
  classTaskId,
  taskId,
  taskName,
  classId,
  tempDir,
  signal
}) {
  try {
    await generateClassZip({
      classTaskId,
      taskId,
      taskName,
      classId,
      tempDir,
      signal
    });
  } catch (error) {
    // 如果是内存不足错误，直接标记为失败且不再重试
    if (error instanceof InsufficientMemoryError) {
      await updateDoc("mistake_batch_class_task", classTaskId, {
        status: "failed",
        retryCount: MAX_RETRY_COUNT,
        failureReason: error.message,
        processingToken: ""
      });
      // 清理临时目录（达到最大重试次数）
      cleanupClassTempDir(taskId, classId);
      return;
    }
    // 其他错误继续抛出，由超时检查机制处理
    throw error;
  }
}

/**
 * 生成班级ZIP的核心逻辑（支持临时目录、增量下载和ZIP缓存）
 * 优化：如果已有生成的ZIP文件，直接上传，无需重新下载和生成
 */
async function generateClassZip({
  classTaskId,
  taskId,
  taskName,
  classId,
  tempDir,
  signal
}) {
  // 检查是否已超时
  throwIfAborted(signal);

  // 确保临时目录存在
  ensureDirExists(tempDir);

  // 最终ZIP文件的路径（保存在临时目录中）
  const finalZipPath = path.join(tempDir, "final.zip");

  // 优化：检查是否已有生成的ZIP文件
  let zipBlob;
  if (fs.existsSync(finalZipPath)) {
    console.log(`发现已生成的ZIP文件，直接上传: ${finalZipPath}`);
    // 直接读取已生成的ZIP文件
    zipBlob = fs.readFileSync(finalZipPath);
  } else {
    // 需要重新生成ZIP文件
    console.log(`未发现已生成的ZIP文件，开始生成...`);

    // 1. 获取该班级的所有已完成的学生PDF
    const allStudentPdfs = await allDocs({
      c: "mistake_batch_student_pdf",
      match: {
        taskId,
        classId,
        status: "completed"
      },
      only: "studentName,mistakePdf,answerPdf"
    });
    const validStudentPdfs = allStudentPdfs.filter(pdf => pdf.mistakePdf && pdf.answerPdf);
    if (validStudentPdfs.length === 0) {
      throw new Error("该班级没有已完成的学生PDF");
    }

    // 再次检查是否已超时
    throwIfAborted(signal);

    // 2. 下载所有PDF文件到临时目录（支持增量下载）
    let downloadedDataSize = 0;
    for (const studentPdf of validStudentPdfs) {
      // 在每个学生PDF处理前检查是否超时
      throwIfAborted(signal);

      // 创建学生子目录
      const studentDir = path.join(tempDir, studentPdf.studentName);
      ensureDirExists(studentDir);

      // 下载错题PDF
      if (studentPdf.mistakePdf?.fileUrl) {
        const mistakeFileName = `${taskName}-${studentPdf.studentName}-错题集.pdf`;
        const mistakeFilePath = path.join(studentDir, mistakeFileName);
        try {
          const fileSize = await downloadFileToLocal({
            fileUrl: studentPdf.mistakePdf.fileUrl,
            localFilePath: mistakeFilePath,
            onProgress: () => throwIfAborted(signal)
          });
          downloadedDataSize += fileSize;
          // 检查当前内存使用率（总是乘以2评估）
          checkMemoryUsage(`班级ZIP生成（共${validStudentPdfs.length}个学生，已下载${downloadedDataSize}字节）`);
        } catch (error) {
          console.error(`下载错题PDF失败: ${mistakeFileName}`, error);
          // 个别文件下载失败，忽略并继续
        }
      }

      // 下载答案PDF
      if (studentPdf.answerPdf?.fileUrl) {
        const answerFileName = `${taskName}-${studentPdf.studentName}-答案.pdf`;
        const answerFilePath = path.join(studentDir, answerFileName);
        try {
          const fileSize = await downloadFileToLocal({
            fileUrl: studentPdf.answerPdf.fileUrl,
            localFilePath: answerFilePath,
            onProgress: () => throwIfAborted(signal)
          });
          downloadedDataSize += fileSize;
          // 检查当前内存使用率（总是乘以2评估）
          checkMemoryUsage(`班级ZIP生成（共${validStudentPdfs.length}个学生，已下载${downloadedDataSize}字节）`);
        } catch (error) {
          console.error(`下载答案PDF失败: ${answerFileName}`, error);
          // 个别文件下载失败，忽略并继续
        }
      }
    }

    // 3. 从临时目录创建ZIP文件
    // 在生成ZIP前检查是否已超时
    throwIfAborted(signal);
    const zip = new JSZip();

    // 递归添加临时目录中的所有文件到ZIP（排除 final.zip 和 createdAt.txt）
    const addDirectoryToZip = (dirPath, zipPath = "") => {
      const files = fs.readdirSync(dirPath);
      for (const file of files) {
        // 跳过 final.zip 和 createdAt.txt
        if (file === "final.zip" || file === "createdAt.txt") {
          continue;
        }
        const filePath = path.join(dirPath, file);
        const stats = fs.statSync(filePath);
        if (stats.isDirectory()) {
          // 递归处理子目录
          addDirectoryToZip(filePath, path.join(zipPath, file));
        } else {
          // 添加文件到ZIP
          const fileBuffer = fs.readFileSync(filePath);
          zip.file(path.join(zipPath, file), fileBuffer, {
            compression: "DEFLATE",
            compressionOptions: {
              level: 9
            }
          });
        }
      }
    };
    addDirectoryToZip(tempDir);

    // 在生成ZIP前检查是否超时
    throwIfAborted(signal);
    zipBlob = await zip.generateAsync({
      type: "nodebuffer",
      compression: "DEFLATE",
      compressionOptions: {
        level: 9
      }
    });

    // 4. 保存ZIP文件到临时目录（用于下次重试时直接上传）
    fs.writeFileSync(finalZipPath, zipBlob);
    console.log(`已生成并保存ZIP文件: ${finalZipPath}, 大小: ${zipBlob.length} 字节`);

    // 5. 删除下载的PDF文件（学生子目录），节约内存
    const files = fs.readdirSync(tempDir);
    for (const file of files) {
      if (file !== "final.zip" && file !== "createdAt.txt") {
        const filePath = path.join(tempDir, file);
        try {
          const stats = fs.statSync(filePath);
          if (stats.isDirectory()) {
            // 删除学生子目录
            removeDirRecursive(filePath);
            console.log(`已删除临时目录（节约内存）: ${filePath}`);
          }
        } catch (error) {
          console.error(`删除临时目录失败: ${filePath}`, error);
          // 删除失败不影响流程
        }
      }
    }
  }

  // 在上传前检查是否超时
  throwIfAborted(signal);

  // 6. 上传ZIP文件到云存储（添加时间戳避免CDN缓存）
  const classTask = await getDoc("mistake_batch_class_task", classTaskId, {
    only: "className"
  });
  const className = classTask?.className || classId;
  const timestamp = Date.now();
  const zipFileName = `${taskName}-${className}-${timestamp}.zip`;
  const filePath = `cuoti/mistake_batch/${taskId}/class/${zipFileName}`;
  const uploadResult = await uploadFile(filePath, zipBlob);
  const fileUrl = await getFileURL(uploadResult.fileID);

  // 7. 更新班级任务数据库
  const zipFileInfo = {
    filePath,
    fileUrl,
    fileID: uploadResult.fileID,
    fileSize: zipBlob.length
  };
  await updateDoc("mistake_batch_class_task", classTaskId, {
    status: "completed",
    zipFile: zipFileInfo,
    completedTime: Date.now(),
    tempDir: undefined // 清除tempDir字段
  });

  // 8. 清理临时目录（上传成功后）
  try {
    removeDirRecursive(tempDir);
    console.log(`已清理班级ZIP临时目录: ${tempDir}`);
  } catch (error) {
    console.error("清理临时目录失败:", error);
    // 清理失败不影响流程
  }
}
