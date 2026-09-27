"use server";

import { getCurrentSchoolId } from "../../../../../../lib/work/teacher/mySchool.js";
import { deleteAnswersPdfData, deleteQuestionsPdfData, generateAnswersPdfData, generateQuestionsPdfData, getFrequentMistakesCountFromDB, getFrequentMistakesFromDB, getQuestionsByIdsFromDB } from "./datas.js";

/**
 * 获取高频错题集分页数据
 */
export async function getFrequentMistakeListAction(params) {
  const schoolId = await getCurrentSchoolId();
  return await getFrequentMistakesFromDB({
    pageNum: params.pageNum,
    pageSize: params.pageSize,
    schoolId,
    searchTerm: params.searchTerm,
    subject: params.subject,
    generationType: params.generationType
  });
}

/**
 * 获取高频错题集总数
 */
export async function getFrequentMistakeCountAction(params) {
  const schoolId = await getCurrentSchoolId();
  return await getFrequentMistakesCountFromDB({
    schoolId,
    searchTerm: params.searchTerm,
    subject: params.subject,
    generationType: params.generationType
  });
}

/**
 * 获取题目详情
 */
export async function getQuestionsAction(questionIds) {
  return await getQuestionsByIdsFromDB(questionIds);
}

/**
 * 生成题目PDF
 */
export async function generateQuestionsPdfAction(frequentMistakeId) {
  return await generateQuestionsPdfData(frequentMistakeId);
}

/**
 * 生成答案PDF
 */
export async function generateAnswersPdfAction(frequentMistakeId) {
  return await generateAnswersPdfData(frequentMistakeId);
}

/**
 * 删除题目PDF
 */
export async function deleteQuestionsPdfAction(frequentMistakeId) {
  return await deleteQuestionsPdfData(frequentMistakeId);
}

/**
 * 删除答案PDF
 */
export async function deleteAnswersPdfAction(frequentMistakeId) {
  return await deleteAnswersPdfData(frequentMistakeId);
}
