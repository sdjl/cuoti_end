"use server";

import { allDocs } from "../../../../../lib/common/database.js";

// 数据库集合名称常量
const QUIZ_TAKE_COLLECTION = "quiz_take";


export async function getQuizParticipantCounts(quizIds) {
  if (quizIds.length === 0) {
    return {};
  }
  try {
    // 一次性获取所有相关的QuizTakeDoc数据
    const quizTakeDocs = await allDocs({
      c: QUIZ_TAKE_COLLECTION,
      match: {
        quizId: {
          $in: quizIds
        }
      }
    });

    // 统计每个口述核心知识点的参与人数
    const counts = {};

    // 初始化所有口述核心知识点的计数为0
    quizIds.forEach(quizId => {
      counts[quizId] = 0;
    });

    // 计算每个口述核心知识点的参与人数
    quizTakeDocs.forEach(doc => {
      if (counts[doc.quizId] !== undefined) {
        counts[doc.quizId]++;
      }
    });
    return counts;
  } catch (error) {
    console.error("获取口述核心知识点参与人数失败:", error);
    // 返回所有计数为0的对象
    const counts = {};
    quizIds.forEach(quizId => {
      counts[quizId] = 0;
    });
    return counts;
  }
}
