import { allDocs, command, updateMatch } from "../../../lib/common/database.js";
import { deleteFile } from "../../../lib/common/file.js";
import { randomString } from "../../../lib/common/random.js";
import { MAX_CLEANING_PER_RUN, throwIfAborted } from "./utils.js";

/**
 * 说明：
 * 本文件负责处理班级ZIP清理任务
 * 只关注 mistake_batch_class_task 集合，不涉及其他集合
 * 并不需要在这个文件中把清理状态改成clean_failed，只需要在有异常的时候抛出异常就够了，
 * 因为handleTimeoutCheck函数会检查超时任务，并重新尝试清理
 */

/**
 * 原子性地获取并标记等待清理的班级ZIP任务为清理中状态
 * 使用processingToken避免并发冲突
 */
export async function atomicGetAndMarkClassZipsForCleaning() {
  const _ = command();

  // 1. 查询等待清理的班级任务（只获取ID）
  const waitingTasks = await allDocs({
    c: "mistake_batch_class_task",
    match: {
      status: "waiting_clean",
      processingToken: ""
    },
    sort: {
      created: 1
    },
    limit: MAX_CLEANING_PER_RUN,
    only: "_id"
  });
  if (waitingTasks.length === 0) {
    return [];
  }
  const taskIds = waitingTasks.map(task => task._id);

  // 2. 生成唯一的处理令牌（20位随机字符串）
  const processingToken = randomString(20);

  // 3. 原子性地更新：只更新processingToken为空字符串的文档
  // 这样即使多个实例同时尝试更新，也只有一个能成功
  await updateMatch("mistake_batch_class_task", {
    _id: _.in(taskIds),
    status: "waiting_clean",
    processingToken: "" // 关键：只更新processingToken为空的文档
  }, {
    status: "cleaning",
    processingToken,
    // 设置为当前实例的唯一令牌
    cleaningStartTime: Date.now()
  });

  // 4. 根据processingToken查询被当前实例成功标记的文档
  return await allDocs({
    c: "mistake_batch_class_task",
    match: {
      processingToken,
      // 只查询带有当前实例令牌的文档
      status: "cleaning"
    },
    only: "_id,zipFile"
  });
}

/**
 * 处理班级ZIP清理
 */
export async function processClassZipsCleaning({
  classTasks,
  signal
}) {
  const _ = command();

  // 检查是否已超时
  throwIfAborted(signal);

  // 收集所有需要删除的文件ID
  const filesToDelete = [];
  for (const task of classTasks) {
    if (task.zipFile?.fileID) {
      filesToDelete.push(task.zipFile.fileID);
    }
  }

  // 在删除文件前检查是否超时
  throwIfAborted(signal);

  // 尝试删除所有文件
  if (filesToDelete.length > 0) {
    await deleteFile(filesToDelete);
  }

  // 在更新数据库前检查是否超时
  throwIfAborted(signal);

  // 所有文件删除成功，标记所有班级任务为已清理（只改状态，不删除数据库记录）
  const successIds = classTasks.map(task => task._id);
  await updateMatch("mistake_batch_class_task", {
    _id: _.in(successIds)
  }, {
    status: "cleaned",
    zipFile: _.remove(),
    cleaningCompletedTime: Date.now()
  });
}
