import fs from "node:fs";
import path from "node:path";
import JSZip from "jszip";
import { allDocs, command, updateDoc, updateMatch } from "../../../lib/common/database.js";
import { getFileURL, uploadFile } from "../../../lib/common/file.js";
import { randomString } from "../../../lib/common/random.js";
import { checkMemoryUsage, cleanupTaskTempDir, downloadFileToLocal, ensureDirExists, getTaskZipTempDir, InsufficientMemoryError, MAX_RETRY_COUNT, MAX_TASK_ZIP_SIZE_MB, removeDirRecursive, throwIfAborted } from "./utils.js";

/**
 * 说明：
 * 本文件负责处理任务级别的全部ZIP文件生成
 * 生成整个任务的zip时，使用所有班级的zip文件打包，而不是用pdf文件
 * 并不需要在这个文件中把生成状态改成failed，只需要在有异常的时候抛出异常就够了，
 * 因为handleTimeoutCheck函数会检查超时任务，并重新尝试生成
 */

/**
 * 原子性地获取并标记下一个需要生成全部ZIP的任务
 * 逻辑：读取所有还没有生成allZipFile的任务，检查每个任务的所有班级ZIP是否都已完成
 * 使用processingToken避免并发冲突
 *
 * 重要：确保同一时间只有一个ZIP生成任务在执行（班级ZIP或任务ZIP）
 * 班级ZIP和任务ZIP是互斥的，不能同时进行，避免多个任务的临时文件同时占用内存
 */
export async function atomicGetAndMarkAllZipTask() {
  const _ = command();

  // 1. 先检查是否有正在执行中的任务ZIP
  const generatingTaskZips = await allDocs({
    c: "mistake_batch_task",
    match: {
      status: "generating"
    },
    only: "_id"
  });

  // 如果有正在执行中的任务ZIP，直接返回 null，不开启新任务
  if (generatingTaskZips.length > 0) {
    console.log(`已有 ${generatingTaskZips.length} 个任务ZIP正在执行中，跳过开启新任务`);
    return null;
  }

  // 2. 检查是否有正在执行中的班级ZIP（班级ZIP和任务ZIP互斥）
  const generatingClassTasks = await allDocs({
    c: "mistake_batch_class_task",
    match: {
      status: "generating"
    },
    only: "_id"
  });

  // 如果有正在执行中的班级ZIP，直接返回 null，不开启任务ZIP
  if (generatingClassTasks.length > 0) {
    console.log(`已有 ${generatingClassTasks.length} 个班级ZIP正在执行中，跳过开启任务ZIP`);
    return null;
  }

  // 3. 生成唯一的处理令牌（20位随机字符串）
  const processingToken = randomString(20);

  // 4. 查找所有状态为waiting的任务
  const tasks = await allDocs({
    c: "mistake_batch_task",
    match: {
      status: "waiting",
      processingToken: ""
    },
    sort: {
      created: 1
    },
    only: "_id,taskName"
  });
  if (tasks.length === 0) return null;

  // 5. 批量读取所有相关任务的班级任务状态
  const taskIds = tasks.map(t => t._id);

  // 一次性读取所有相关的班级任务记录（包含 zipFile 以便计算总大小）
  const allClassTasks = await allDocs({
    c: "mistake_batch_class_task",
    match: {
      taskId: _.in(taskIds)
    },
    only: "taskId,status,zipFile"
  });

  // 6. 按 taskId 分组统计班级任务状态和文件信息
  const classTasksByTask = new Map();
  for (const classTask of allClassTasks) {
    if (!classTasksByTask.has(classTask.taskId)) {
      classTasksByTask.set(classTask.taskId, []);
    }
    classTasksByTask.get(classTask.taskId).push({
      status: classTask.status,
      zipFile: classTask.zipFile
    });
  }

  // 7. 遍历任务，找到第一个所有班级ZIP都已完成的任务
  for (const task of tasks) {
    const classTasks = classTasksByTask.get(task._id) || [];

    // 如果该任务没有班级任务记录，跳过
    if (classTasks.length === 0) {
      continue;
    }

    // 检查该任务的所有班级任务是否都已完成
    const allClassTasksCompleted = classTasks.every(classTask => classTask.status === "completed");
    if (allClassTasksCompleted) {
      // 找到了一个所有班级任务都已完成的主任务

      // 特殊情况1：如果只有一个班级，直接标记任务为完成，不需要生成任务ZIP
      if (classTasks.length === 1) {
        console.log(`任务 ${task.taskName} 只有一个班级，跳过任务ZIP生成，直接标记为完成`);

        // 原子性地将任务标记为completed状态
        // 使用 updateMatch 确保只有状态为 waiting 的任务才会被更新（避免多实例重复操作）
        await updateMatch("mistake_batch_task", {
          _id: task._id,
          status: "waiting"
        }, {
          status: "completed",
          completedTime: Date.now()
        });

        // 无论更新成功与否，都继续查找下一个任务
        // （如果更新失败，说明其他实例已经处理了这个任务）
        continue;
      }

      // 特殊情况2：检查所有班级ZIP文件的总大小是否超过限制
      const totalSize = classTasks.reduce((sum, classTask) => sum + (classTask.zipFile?.fileSize || 0), 0);
      const maxSizeBytes = MAX_TASK_ZIP_SIZE_MB * 1024 * 1024;
      if (totalSize > maxSizeBytes) {
        const totalSizeMB = (totalSize / 1024 / 1024).toFixed(2);
        console.log(`任务 ${task.taskName} 的总文件大小为 ${totalSizeMB}MB，` + `超过限制 ${MAX_TASK_ZIP_SIZE_MB}MB，跳过任务ZIP生成，直接标记为完成`);

        // 原子性地将任务标记为completed状态
        await updateMatch("mistake_batch_task", {
          _id: task._id,
          status: "waiting"
        }, {
          status: "completed",
          completedTime: Date.now()
        });

        // 继续查找下一个任务
        continue;
      }

      // 正常情况：有多个班级，需要生成任务ZIP
      // 生成临时目录路径
      const tempDir = getTaskZipTempDir(task._id);

      // 原子性地尝试将其标记为generating状态，并保存临时目录路径
      await updateMatch("mistake_batch_task", {
        _id: task._id,
        status: "waiting",
        processingToken: "" // 关键：只更新processingToken为空的文档
      }, {
        status: "generating",
        processingToken,
        // 设置为当前实例的唯一令牌
        startTime: Date.now(),
        tempDir // 保存临时目录路径
      });

      // 8. 根据processingToken查询是否成功标记
      const markedTask = await allDocs({
        c: "mistake_batch_task",
        match: {
          _id: task._id,
          processingToken // 只查询带有当前实例令牌的文档
        },
        only: "_id,tempDir"
      });

      // 如果成功标记，返回任务信息
      if (markedTask.length > 0) {
        return {
          taskId: task._id,
          taskName: task.taskName,
          tempDir: markedTask[0].tempDir || tempDir // 使用数据库中的tempDir，如果没有则使用新生成的
        };
      }
      // 如果没有成功标记，说明其他实例已经获取了这个任务，继续查找下一个
    }
  }
  return null;
}

/**
 * 处理全部ZIP生成
 * 使用所有班级的ZIP文件打包，而不是用PDF文件
 */
export async function processAllZip({
  taskId,
  taskName,
  tempDir,
  signal
}) {
  try {
    await generateAllZip({
      taskId,
      taskName,
      tempDir,
      signal
    });
  } catch (error) {
    // 如果是内存不足错误，直接标记为失败且不再重试
    if (error instanceof InsufficientMemoryError) {
      await updateDoc("mistake_batch_task", taskId, {
        status: "failed",
        retryCount: MAX_RETRY_COUNT,
        failureReason: error.message,
        processingToken: ""
      });
      // 清理临时目录（达到最大重试次数）
      cleanupTaskTempDir(taskId);
      return;
    }
    // 其他错误继续抛出，由超时检查机制处理
    throw error;
  }
}

/**
 * 生成全部ZIP的核心逻辑（支持临时目录、增量下载和ZIP缓存）
 * 优化：如果已有生成的ZIP文件，直接上传，无需重新下载和生成
 */
async function generateAllZip({
  taskId,
  taskName,
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

    // 1. 获取该任务的所有已完成的班级任务（包含班级ZIP文件）
    const classTasks = await allDocs({
      c: "mistake_batch_class_task",
      match: {
        taskId,
        status: "completed"
      },
      only: "className,zipFile"
    });
    if (classTasks.length === 0) {
      throw new Error("没有已完成的班级ZIP文件");
    }

    // 再次检查是否已超时
    throwIfAborted(signal);

    // 2. 下载所有班级ZIP文件到临时目录（支持增量下载）
    let downloadedDataSize = 0;
    for (const classTask of classTasks) {
      // 在每个班级ZIP处理前检查是否超时
      throwIfAborted(signal);
      if (classTask.zipFile?.fileUrl) {
        const classZipFileName = `${taskName}-${classTask.className}.zip`;
        const classZipFilePath = path.join(tempDir, classZipFileName);
        try {
          const fileSize = await downloadFileToLocal({
            fileUrl: classTask.zipFile.fileUrl,
            localFilePath: classZipFilePath,
            onProgress: () => throwIfAborted(signal)
          });
          downloadedDataSize += fileSize;
          // 检查当前内存使用率（总是乘以2评估）
          checkMemoryUsage(`任务总ZIP生成（共${classTasks.length}个班级，已下载${downloadedDataSize}字节）`);
        } catch (error) {
          console.error(`下载班级ZIP失败: ${classZipFileName}`, error);
          // 个别文件下载失败，忽略并继续
        }
      }
    }

    // 在生成ZIP前检查是否超时
    throwIfAborted(signal);

    // 3. 从临时目录创建总ZIP文件
    const zip = new JSZip();

    // 添加临时目录中的所有班级ZIP文件到ZIP（排除 final.zip 和 createdAt.txt）
    const files = fs.readdirSync(tempDir);
    for (const file of files) {
      // 跳过 final.zip 和 createdAt.txt
      if (file === "final.zip" || file === "createdAt.txt") {
        continue;
      }
      const filePath = path.join(tempDir, file);
      const stats = fs.statSync(filePath);
      if (stats.isFile()) {
        const fileBuffer = fs.readFileSync(filePath);
        // ZIP文件已经是压缩过的，不需要再次压缩，使用STORE模式
        zip.file(file, fileBuffer, {
          compression: "STORE"
        });
      }
    }

    // 在生成ZIP前检查是否超时
    throwIfAborted(signal);

    // 4. 生成总ZIP文件
    // 由于内部已经是ZIP文件，外层ZIP不需要再次压缩
    zipBlob = await zip.generateAsync({
      type: "nodebuffer",
      compression: "STORE"
    });

    // 5. 保存ZIP文件到临时目录（用于下次重试时直接上传）
    fs.writeFileSync(finalZipPath, zipBlob);
    console.log(`已生成并保存ZIP文件: ${finalZipPath}, 大小: ${zipBlob.length} 字节`);

    // 6. 删除下载的班级ZIP文件，节约内存
    for (const file of files) {
      if (file !== "final.zip" && file !== "createdAt.txt") {
        const filePath = path.join(tempDir, file);
        try {
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log(`已删除临时文件（节约内存）: ${filePath}`);
          }
        } catch (error) {
          console.error(`删除临时文件失败: ${filePath}`, error);
          // 删除失败不影响流程
        }
      }
    }
  }

  // 在上传前检查是否超时
  throwIfAborted(signal);

  // 7. 上传到云存储（添加时间戳避免CDN缓存）
  const timestamp = Date.now();
  const allZipFileName = `${taskName}-${timestamp}.zip`;
  const filePath = `cuoti/mistake_batch/${taskId}/${allZipFileName}`;
  const uploadResult = await uploadFile(filePath, zipBlob);
  const fileUrl = await getFileURL(uploadResult.fileID);

  // 8. 更新任务的全部ZIP文件信息
  const zipFileInfo = {
    filePath,
    fileUrl,
    fileID: uploadResult.fileID,
    fileSize: zipBlob.length
  };
  await updateDoc("mistake_batch_task", taskId, {
    status: "completed",
    allZipFile: zipFileInfo,
    completedTime: Date.now(),
    tempDir: undefined // 清除tempDir字段
  });

  // 9. 清理临时目录（上传成功后）
  try {
    removeDirRecursive(tempDir);
    console.log(`已清理任务ZIP临时目录: ${tempDir}`);
  } catch (error) {
    console.error("清理临时目录失败:", error);
    // 清理失败不影响流程
  }
}
