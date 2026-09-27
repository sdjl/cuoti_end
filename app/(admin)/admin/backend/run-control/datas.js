"use server";

import { allDocs, command, removeMatch, updateDoc, updateMatch } from "../../../../../lib/common/database.js";

/**
 * 从数据库获取所有exam_question文档
 */
export async function getAllExamQuestionsFromDB() {
  return await allDocs({
    c: "exam_question"
  });
}

/**
 * 删除exam_question集合中的所有文档
 */
export async function deleteAllExamQuestionsFromDB() {
  const _ = command();
  return await removeMatch("exam_question", {
    _id: _.exists(true)
  });
}

/**
 * 更新所有exam_paper文档的isLocked字段为false
 */
export async function unlockAllExamPapersInDB() {
  const _ = command();
  return await updateMatch("exam_paper", {
    _id: _.exists(true)
  }, {
    isLocked: false
  });
}

/**
 * 删除类型为"试卷"的question_pack文档
 */
export async function deleteExamPaperQuestionPacksFromDB() {
  return await removeMatch("question_pack", {
    type: "试卷"
  });
}

/**
 * 根据openid查询wx_user文档
 */
export async function getWxUserByOpenidFromDB(openid) {
  return await allDocs({
    c: "wx_user",
    match: {
      openid
    },
    limit: 1
  });
}

/**
 * 更新wx_user文档，删除workSetting.currentSchool字段
 */
export async function removeCurrentSchoolFromWxUserInDB(userId, timestamp) {
  await updateDoc("wx_user", userId, {
    "workSetting.currentSchool": command().remove(),
    updated: timestamp
  });
}
