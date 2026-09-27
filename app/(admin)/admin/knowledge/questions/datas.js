"use server";

import { command, count, docs } from "../../../../../lib/common/database.js";

/**
 * 从数据库查询题目列表
 */
export async function getQuestionsByKnowledgePointFromDB(knowledgePoint, pageNum, pageSize) {
  const _ = command();

  // 根据是否有知识点参数构建查询条件
  const whereCondition = knowledgePoint ? {
    knowledgePoints: _.in([knowledgePoint])
  } : {}; // 空条件表示查询所有题目

  return await docs({
    c: "exam_question",
    w: whereCondition,
    pageNum: pageNum - 1,
    pageSize
  });
}

/**
 * 从数据库查询题目总数
 */
export async function getQuestionsCountByKnowledgePointFromDB(knowledgePoint) {
  const _ = command();

  // 根据是否有知识点参数构建查询条件
  const whereCondition = knowledgePoint ? {
    knowledgePoints: _.in([knowledgePoint])
  } : {}; // 空条件表示查询所有题目

  return await count("exam_question", whereCondition);
}
