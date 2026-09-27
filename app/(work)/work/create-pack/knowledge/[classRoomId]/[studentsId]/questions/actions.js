"use server";

import { getQuestionPackWithQuestions } from "./datas.js";

/**
 * 获取题集信息和题目列表
 */
export async function getQuestionPackData(questionPackId) {
  return await getQuestionPackWithQuestions(questionPackId);
}
