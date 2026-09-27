import { allDocs, command, updateDoc } from "../../../lib/common/database.js";
import { deleteFile } from "../../../lib/common/file.js";
import { cleanupClassTempDir, cleanupTaskTempDir, MAX_RETRY_COUNT, TASK_TIMEOUT_MINUTES } from "./utils.js";

/**
 * 检查并处理超时的生成任务（包括学生PDF、班级ZIP、全部ZIP）
 */
export async function checkAndHandleTimeouts() {
  const now = Date.now();
  const timeoutMs = TASK_TIMEOUT_MINUTES * 60 * 1000;

  // 1. 检查学生PDF超时（generating和cleaning状态）
  await checkStudentPdfTimeouts({
    now,
    timeoutMs
  });

  // 2. 检查班级ZIP超时（generating和cleaning状态）
  await checkClassZipTimeouts({
    now,
    timeoutMs
  });

  // 3. 检查全部ZIP超时（generating和cleaning状态）
  await checkAllZipTimeouts({
    now,
    timeoutMs
  });
}

/**
 * 检查学生PDF任务超时（包括generating和cleaning状态）
 */
async function checkStudentPdfTimeouts({
  now,
  timeoutMs
}) {
  const _ = command();
  const timeoutThreshold = now - timeoutMs;

  // 一次性查询 generating、cleaning、failed 和 clean_failed 状态的超时记录
  const timeoutPdfs = await allDocs({
    c: "mistake_batch_student_pdf",
    match: _.or(
    // generating 状态：startTime 超时
    {
      status: "generating",
      startTime: _.lt(timeoutThreshold)
    },
    // cleaning 状态：cleaningStartTime 超时
    {
      status: "cleaning",
      cleaningStartTime: _.lt(timeoutThreshold)
    },
    // failed 状态：需要重新尝试
    {
      status: "failed"
    },
    // clean_failed 状态：需要重新尝试
    {
      status: "clean_failed"
    }),
    only: "_id,status,mistakePdf,answerPdf,retryCount"
  });
  if (timeoutPdfs.length === 0) return;

  // 收集所有需要删除的文件ID
  const filesToDelete = [];
  for (const pdf of timeoutPdfs) {
    if (pdf.mistakePdf?.fileID) {
      filesToDelete.push(pdf.mistakePdf.fileID);
    }
    if (pdf.answerPdf?.fileID) {
      filesToDelete.push(pdf.answerPdf.fileID);
    }
  }

  // 一次性删除所有文件
  if (filesToDelete.length > 0) {
    await deleteFile(filesToDelete);
  }

  // 处理每个超时记录，根据状态和重试次数决定下一步操作
  for (const pdf of timeoutPdfs) {
    const currentRetryCount = (pdf.retryCount || 0) + 1;
    if (pdf.status === "generating") {
      // 处理 generating 状态超时
      if (currentRetryCount <= MAX_RETRY_COUNT) {
        // 还可以重试，改为waiting状态
        await updateDoc("mistake_batch_student_pdf", pdf._id, {
          status: "waiting",
          processingToken: "",
          retryCount: currentRetryCount,
          mistakePdf: _.remove(),
          answerPdf: _.remove(),
          startTime: _.remove(),
          completedTime: _.remove()
        });
      } else {
        // 已达到最大重试次数，标记为失败
        await updateDoc("mistake_batch_student_pdf", pdf._id, {
          status: "failed",
          failureReason: `PDF生成超时（超过${TASK_TIMEOUT_MINUTES}分钟），已重试${MAX_RETRY_COUNT}次`,
          mistakePdf: _.remove(),
          answerPdf: _.remove(),
          startTime: _.remove()
        });
      }
    } else if (pdf.status === "cleaning") {
      // 处理 cleaning 状态超时
      if (currentRetryCount <= MAX_RETRY_COUNT) {
        // 还可以重试，改为waiting_clean状态，等待下次清理
        await updateDoc("mistake_batch_student_pdf", pdf._id, {
          status: "waiting_clean",
          processingToken: "",
          retryCount: currentRetryCount,
          cleaningStartTime: _.remove()
        });
      } else {
        // 已达到最大重试次数，标记为清理失败
        await updateDoc("mistake_batch_student_pdf", pdf._id, {
          status: "clean_failed",
          failureReason: `文件清理超时（超过${TASK_TIMEOUT_MINUTES}分钟），已重试${MAX_RETRY_COUNT}次`,
          mistakePdf: _.remove(),
          answerPdf: _.remove()
        });
      }
    } else if (pdf.status === "failed") {
      // 处理 failed 状态，需要重新尝试
      if (currentRetryCount <= MAX_RETRY_COUNT) {
        // 还可以重试，改为waiting状态
        await updateDoc("mistake_batch_student_pdf", pdf._id, {
          status: "waiting",
          processingToken: "",
          retryCount: currentRetryCount,
          mistakePdf: _.remove(),
          answerPdf: _.remove(),
          startTime: _.remove(),
          completedTime: _.remove(),
          failureReason: _.remove()
        });
      }
      // 如果已达到最大重试次数，保持 failed 状态不变
    } else if (pdf.status === "clean_failed") {
      // 处理 clean_failed 状态，需要重新尝试
      if (currentRetryCount <= MAX_RETRY_COUNT) {
        // 还可以重试，改为waiting_clean状态
        await updateDoc("mistake_batch_student_pdf", pdf._id, {
          status: "waiting_clean",
          processingToken: "",
          retryCount: currentRetryCount,
          cleaningStartTime: _.remove(),
          failureReason: _.remove()
        });
      }
      // 如果已达到最大重试次数，保持 clean_failed 状态不变
    }
  }
}

/**
 * 检查班级ZIP超时（包括generating和cleaning状态）
 */
async function checkClassZipTimeouts({
  now,
  timeoutMs
}) {
  const _ = command();
  const timeoutThreshold = now - timeoutMs;

  // 一次性查询 generating、cleaning、failed 和 clean_failed 状态的超时记录
  const timeoutTasks = await allDocs({
    c: "mistake_batch_class_task",
    match: _.or(
    // generating 状态：startTime 超时
    {
      status: "generating",
      startTime: _.lt(timeoutThreshold)
    },
    // cleaning 状态：cleaningStartTime 超时
    {
      status: "cleaning",
      cleaningStartTime: _.lt(timeoutThreshold)
    },
    // failed 状态：需要重新尝试
    {
      status: "failed"
    },
    // clean_failed 状态：需要重新尝试
    {
      status: "clean_failed"
    }),
    only: "_id,status,zipFile,retryCount,taskId,classId"
  });
  if (timeoutTasks.length === 0) return;

  // 收集所有需要删除的文件ID
  const filesToDelete = [];
  for (const task of timeoutTasks) {
    if (task.zipFile?.fileID) {
      filesToDelete.push(task.zipFile.fileID);
    }
  }

  // 一次性删除所有文件
  if (filesToDelete.length > 0) {
    await deleteFile(filesToDelete);
  }

  // 处理每个超时记录，根据状态和重试次数决定下一步操作
  for (const task of timeoutTasks) {
    const currentRetryCount = (task.retryCount || 0) + 1;
    if (task.status === "generating") {
      // 处理 generating 状态超时
      if (currentRetryCount <= MAX_RETRY_COUNT) {
        // 还可以重试，改为waiting状态
        await updateDoc("mistake_batch_class_task", task._id, {
          status: "waiting",
          processingToken: "",
          retryCount: currentRetryCount,
          zipFile: _.remove(),
          startTime: _.remove(),
          completedTime: _.remove()
        });
      } else {
        // 已达到最大重试次数，标记为失败
        await updateDoc("mistake_batch_class_task", task._id, {
          status: "failed",
          failureReason: `班级ZIP生成超时（超过${TASK_TIMEOUT_MINUTES}分钟），已重试${MAX_RETRY_COUNT}次`,
          zipFile: _.remove(),
          startTime: _.remove()
        });
        // 清理临时目录（达到最大重试次数）
        cleanupClassTempDir(task.taskId, task.classId);
      }
    } else if (task.status === "cleaning") {
      // 处理 cleaning 状态超时
      if (currentRetryCount <= MAX_RETRY_COUNT) {
        // 还可以重试，改为waiting_clean状态，等待下次清理
        await updateDoc("mistake_batch_class_task", task._id, {
          status: "waiting_clean",
          processingToken: "",
          retryCount: currentRetryCount,
          cleaningStartTime: _.remove()
        });
      } else {
        // 已达到最大重试次数，标记为清理失败
        await updateDoc("mistake_batch_class_task", task._id, {
          status: "clean_failed",
          failureReason: `班级ZIP清理超时（超过${TASK_TIMEOUT_MINUTES}分钟），已重试${MAX_RETRY_COUNT}次`,
          zipFile: _.remove()
        });
      }
    } else if (task.status === "failed") {
      // 处理 failed 状态，需要重新尝试
      if (currentRetryCount <= MAX_RETRY_COUNT) {
        // 还可以重试，改为waiting状态
        await updateDoc("mistake_batch_class_task", task._id, {
          status: "waiting",
          processingToken: "",
          retryCount: currentRetryCount,
          zipFile: _.remove(),
          startTime: _.remove(),
          completedTime: _.remove(),
          failureReason: _.remove()
        });
      }
      // 如果已达到最大重试次数，保持 failed 状态不变
    } else if (task.status === "clean_failed") {
      // 处理 clean_failed 状态，需要重新尝试
      if (currentRetryCount <= MAX_RETRY_COUNT) {
        // 还可以重试，改为waiting_clean状态
        await updateDoc("mistake_batch_class_task", task._id, {
          status: "waiting_clean",
          processingToken: "",
          retryCount: currentRetryCount,
          cleaningStartTime: _.remove(),
          failureReason: _.remove()
        });
      }
      // 如果已达到最大重试次数，保持 clean_failed 状态不变
    }
  }
}

/**
 * 检查全部ZIP超时（包括generating和cleaning状态）
 */
async function checkAllZipTimeouts({
  now,
  timeoutMs
}) {
  const _ = command();
  const timeoutThreshold = now - timeoutMs;

  // 一次性查询 generating、cleaning、failed 和 clean_failed 状态的超时记录
  const timeoutTasks = await allDocs({
    c: "mistake_batch_task",
    match: _.or(
    // generating 状态：startTime 超时且未完成
    {
      status: "generating",
      startTime: _.lt(timeoutThreshold)
    },
    // cleaning 状态：cleaningStartTime
    {
      status: "cleaning",
      cleaningStartTime: _.lt(timeoutThreshold)
    },
    // failed 状态：需要重新尝试
    {
      status: "failed"
    },
    // clean_failed 状态：需要重新尝试
    {
      status: "clean_failed"
    }),
    only: "_id,status,allZipFile,retryCount"
  });
  if (timeoutTasks.length === 0) return;

  // 收集所有需要删除的文件ID
  const filesToDelete = [];
  for (const task of timeoutTasks) {
    if (task.allZipFile?.fileID) {
      filesToDelete.push(task.allZipFile.fileID);
    }
  }

  // 一次性删除所有文件
  if (filesToDelete.length > 0) {
    await deleteFile(filesToDelete);
  }

  // 处理每个超时记录，根据状态和重试次数决定下一步操作
  for (const task of timeoutTasks) {
    const currentRetryCount = (task.retryCount || 0) + 1;
    if (task.status === "generating") {
      // 处理 generating 状态超时
      if (currentRetryCount <= MAX_RETRY_COUNT) {
        // 还可以重试，清除allZipFile、startTime、completedTime并增加重试次数
        await updateDoc("mistake_batch_task", task._id, {
          status: "waiting",
          processingToken: "",
          allZipFile: _.remove(),
          startTime: _.remove(),
          completedTime: _.remove(),
          retryCount: currentRetryCount
        });
      } else {
        // 已达到最大重试次数，标记为失败
        await updateDoc("mistake_batch_task", task._id, {
          status: "failed",
          failureReason: `全部ZIP生成超时（超过${TASK_TIMEOUT_MINUTES}分钟），已重试${MAX_RETRY_COUNT}次`,
          allZipFile: _.remove(),
          startTime: _.remove()
        });
        // 清理临时目录（达到最大重试次数）
        cleanupTaskTempDir(task._id);
      }
    } else if (task.status === "cleaning") {
      // 处理 cleaning 状态超时
      if (currentRetryCount <= MAX_RETRY_COUNT) {
        // 还可以重试，改为waiting_clean状态，等待下次清理
        await updateDoc("mistake_batch_task", task._id, {
          status: "waiting_clean",
          processingToken: "",
          retryCount: currentRetryCount,
          cleaningStartTime: _.remove()
        });
      } else {
        // 已达到最大重试次数，标记为清理失败
        await updateDoc("mistake_batch_task", task._id, {
          status: "clean_failed",
          failureReason: `全部ZIP清理超时（超过${TASK_TIMEOUT_MINUTES}分钟），已重试${MAX_RETRY_COUNT}次`,
          allZipFile: _.remove()
        });
      }
    } else if (task.status === "failed") {
      // 处理 failed 状态，需要重新尝试
      if (currentRetryCount <= MAX_RETRY_COUNT) {
        // 还可以重试，改为waiting状态，等待重新生成
        await updateDoc("mistake_batch_task", task._id, {
          status: "waiting",
          processingToken: "",
          retryCount: currentRetryCount,
          allZipFile: _.remove(),
          startTime: _.remove(),
          completedTime: _.remove(),
          failureReason: _.remove()
        });
      }
      // 如果已达到最大重试次数，保持 failed 状态不变
    } else if (task.status === "clean_failed") {
      // 处理 clean_failed 状态，需要重新尝试
      if (currentRetryCount <= MAX_RETRY_COUNT) {
        // 还可以重试，改为waiting_clean状态
        await updateDoc("mistake_batch_task", task._id, {
          status: "waiting_clean",
          processingToken: "",
          retryCount: currentRetryCount,
          cleaningStartTime: _.remove(),
          failureReason: _.remove()
        });
      }
      // 如果已达到最大重试次数，保持 clean_failed 状态不变
    }
  }
}
