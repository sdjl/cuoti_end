"use server";

import { addDoc, allDocs, getOne, removeDoc } from "../../../../../lib/common/database.js";

// 集合名称常量
const EXAM_QUESTION_COLLECTION = "exam_question";
const QUESTION_INTERACTION_COLLECTION = "question_interaction";

/**
 * 根据试卷ID、页码、题目号获取题目信息
 */
export async function getQuestionByParamsFromDB(examId, pageNumber, questionNumber) {
  try {
    const question = await getOne(EXAM_QUESTION_COLLECTION, {
      examPaperId: examId,
      pageNumber,
      questionNumber
    });
    return question;
  } catch (error) {
    console.error("数据库获取题目信息失败:", error);
    throw error;
  }
}

/**
 * 根据题目ID获取互动问题列表
 */
export async function getQuestionInteractionsFromDB(questionId) {
  try {
    const interactions = await allDocs({
      c: QUESTION_INTERACTION_COLLECTION,
      match: {
        questionId
      }
    });
    return interactions;
  } catch (error) {
    console.error("数据库获取互动问题失败:", error);
    throw error;
  }
}

/**
 * 删除互动问题
 */
export async function deleteInteractionFromDB(interactionId) {
  try {
    const success = await removeDoc(QUESTION_INTERACTION_COLLECTION, interactionId);
    return success;
  } catch (error) {
    console.error("数据库删除互动问题失败:", error);
    throw error;
  }
}

/**
 * 添加互动问题
 */
export async function addInteractionToDB(questionId, questionText, answer) {
  try {
    const docId = await addDoc(QUESTION_INTERACTION_COLLECTION, {
      questionId,
      questionText,
      answer
    });
    return docId;
  } catch (error) {
    console.error("数据库添加互动问题失败:", error);
    throw error;
  }
}
