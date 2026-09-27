import { allDocs, command, count, updateMatch } from "../../../lib/common/database.js";
import { deleteFile } from "../../../lib/common/file.js";
import { randomString } from "../../../lib/common/random.js";
import { MAX_CLEANING_PER_RUN, throwIfAborted } from "./utils.js";

/**
 * 说明：
 * 本文件负责处理任务ZIP清理任务
 * 只关注 mistake_batch_task 集合，不涉及其他集合
 * 并不需要在这个文件中把清理状态改成clean_failed，只需要在有异常的时候抛出异常就够了，
 * 因为handleTimeoutCheck函数会检查超时任务，并重新尝试清理
 */


async function checkAllRelatedDataCleaned(taskId) {
  const _ = command();

  // 检查是否有状态不为cleaned的学生PDF
  const uncleanedStudentPdfsCount = await count("mistake_batch_student_pdf", {
    taskId,
    status: _.neq("cleaned")
  });
  if (uncleanedStudentPdfsCount > 0) {
    return false;
  }

  // 检查是否有状态不为cleaned的班级ZIP
  const uncleanedClassTasksCount = await count("mistake_batch_class_task", {
    taskId,
    status: _.neq("cleaned")
  });
  if (uncleanedClassTasksCount > 0) {
    return false;
  }
  return true;
}

/**
 * 原子性地获取并标记等待清理的任务ZIP为清理中状态
 * 注意：只返回所有关联数据（学生PDF和班级ZIP）都已清理完成的任务
 * 使用processingToken避免并发冲突
 */
export async function atomicGetAndMarkTaskZipsForCleaning() {
  // 1. 生成唯一的处理令牌（20位随机字符串）
  const processingToken = randomString(20);

  // 2. 查找所有 waiting_clean 状态的任务
  const waitingTasks = await allDocs({
    c: "mistake_batch_task",
    match: {
      status: "waiting_clean",
      processingToken: ""
    },
    sort: {
      created: 1
    },
    only: "_id"
  });

  // 3. 过滤出所有关联数据都已清理完成的任务，并尝试原子性地标记为cleaning状态
  const successfullyMarkedTaskIds = [];
  for (const task of waitingTasks) {
    // 检查关联数据是否都已清理
    const allCleaned = await checkAllRelatedDataCleaned(task._id);
    if (!allCleaned) {
      continue;
    }

    // 原子性地尝试标记为清理中状态
    await updateMatch("mistake_batch_task", {
      _id: task._id,
      status: "waiting_clean",
      processingToken: "" // 关键：只更新processingToken为空的文档
    }, {
      status: "cleaning",
      processingToken,
      // 设置为当前实例的唯一令牌
      cleaningStartTime: Date.now()
    });

    // 记录任务ID，稍后一起查询
    successfullyMarkedTaskIds.push(task._id);

    // 达到每次处理上限就停止
    if (successfullyMarkedTaskIds.length >= MAX_CLEANING_PER_RUN) {
      break;
    }
  }

  // 4. 根据processingToken查询被当前实例成功标记的文档
  if (successfullyMarkedTaskIds.length === 0) {
    return [];
  }
  return await allDocs({
    c: "mistake_batch_task",
    match: {
      processingToken,
      // 只查询带有当前实例令牌的文档
      status: "cleaning"
    },
    only: "_id,allZipFile"
  });
}

/**
 * 处理任务ZIP清理
 */
export async function processTaskZipsCleaning({
  tasks,
  signal
}) {
  const _ = command();
  const now = Date.now();

  // 检查是否已超时
  throwIfAborted(signal);

  // 收集所有需要删除的文件ID
  const filesToDelete = [];
  for (const task of tasks) {
    if (task.allZipFile?.fileID) {
      filesToDelete.push(task.allZipFile.fileID);
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

  // 所有文件删除成功，标记所有任务为已清理（只改状态，不删除数据库记录）
  // 注意：能执行到这里的任务，都是在 getWaitingTaskZipsForCleaning 中已经检查过关联数据都已清理完成的
  const successIds = tasks.map(task => task._id);
  await updateMatch("mistake_batch_task", {
    _id: _.in(successIds)
  }, {
    status: "cleaned",
    allZipFile: _.remove(),
    cleaningCompletedTime: now
  });
}
