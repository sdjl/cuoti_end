"use server";

import { allDocs, command } from "../../../../../../../../lib/common/database.js";
const STUDENT_ANSWER_ITEM_COLLECTION = "student_answer_item";
const EXAM_QUESTION_COLLECTION = "exam_question";
const STUDENT_ANSWER_COLLECTION = "student_answer";

/**
 * 获取选中答卷的错题记录
 */
export async function getStudentAnswerItemsFromDB(answerIds) {
  if (answerIds.length === 0) {
    return [];
  }
  const _ = command();
  return await allDocs({
    c: STUDENT_ANSWER_ITEM_COLLECTION,
    match: {
      studentAnswerId: _.in(answerIds)
    },
    sort: {
      _id: 1
    } // 按_id排序，相当于按创建时间排序
  });
}

/**
 * 获取对应的题目信息
 */
export async function getQuestionsByIdsFromDB(questionIds) {
  if (questionIds.length === 0) {
    return [];
  }
  const _ = command();
  return await allDocs({
    c: EXAM_QUESTION_COLLECTION,
    match: {
      _id: _.in(questionIds)
    }
  });
}

/**
 * 获取对应的答卷信息
 */
export async function getStudentAnswersFromDB(answerIds) {
  if (answerIds.length === 0) {
    return [];
  }
  const _ = command();
  return await allDocs({
    c: STUDENT_ANSWER_COLLECTION,
    match: {
      _id: _.in(answerIds)
    }
  });
}
