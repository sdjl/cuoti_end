import { allDocs, command, updateMatch } from "../../../lib/common/database.js";
import { deleteFile } from "../../../lib/common/file.js";
import { randomString } from "../../../lib/common/random.js";
import { MAX_CLEANING_PER_RUN, throwIfAborted } from "./utils.js";

/**
 * 说明：
 * 本文件负责处理学生PDF清理任务
 * 只关注 mistake_batch_student_pdf 集合，不涉及其他集合
 * 并不需要在这个文件中把清理状态改成clean_failed，只需要在有异常的时候抛出异常就够了，
 * 因为handleTimeoutCheck函数会检查超时任务，并重新尝试清理
 */

/**
 * 原子性地获取并标记等待清理的学生PDF记录为清理中状态
 * 使用processingToken避免并发冲突
 * 返回实际被成功标记的学生PDF记录
 */
export async function atomicGetAndMarkStudentPdfsForCleaning() {
  const _ = command();

  // 1. 生成唯一的处理令牌（20位随机字符串）
  const processingToken = randomString(20);

  // 2. 查询等待清理的学生PDF记录（只获取ID，减少数据传输）
  const waitingPdfs = await allDocs({
    c: "mistake_batch_student_pdf",
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
  if (waitingPdfs.length === 0) {
    return [];
  }
  const pdfIds = waitingPdfs.map(pdf => pdf._id);

  // 3. 原子性地更新：只更新processingToken为空字符串的文档
  // 这样即使多个实例同时尝试更新，也只有一个能成功
  await updateMatch("mistake_batch_student_pdf", {
    _id: _.in(pdfIds),
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
    c: "mistake_batch_student_pdf",
    match: {
      processingToken,
      // 只查询带有当前实例令牌的文档
      status: "cleaning"
    },
    only: "_id,mistakePdf,answerPdf"
  });
}

/**
 * 处理学生PDF清理任务
 */
export async function processStudentPdfsCleaning({
  studentPdfs,
  signal
}) {
  const _ = command();

  // 检查是否已超时
  throwIfAborted(signal);

  // 收集所有需要删除的文件ID
  const filesToDelete = [];
  for (const pdf of studentPdfs) {
    if (pdf.mistakePdf?.fileID) {
      filesToDelete.push(pdf.mistakePdf.fileID);
    }
    if (pdf.answerPdf?.fileID) {
      filesToDelete.push(pdf.answerPdf.fileID);
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

  // 所有文件删除成功，标记所有PDF为已清理（只改状态，不删除数据库记录）
  const successIds = studentPdfs.map(pdf => pdf._id);
  await updateMatch("mistake_batch_student_pdf", {
    _id: _.in(successIds)
  }, {
    status: "cleaned",
    mistakePdf: _.remove(),
    answerPdf: _.remove(),
    cleaningCompletedTime: Date.now()
  });
}
