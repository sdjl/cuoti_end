"use server";

import { allDocs, command, getDoc } from "../../../../../../../../lib/common/database.js";

/**
 * 获取题集信息和题目列表
 */
export async function getQuestionPackWithQuestions(questionPackId) {
  try {
    // 获取题集信息
    const questionPack = await getDoc("question_pack", questionPackId);
    if (!questionPack) {
      return {
        success: false,
        error: "题集不存在"
      };
    }

    // 获取题目列表
    if (!questionPack.questionIds || questionPack.questionIds.length === 0) {
      return {
        success: true,
        data: {
          questionPack,
          questions: []
        }
      };
    }
    const _ = command();
    const questions = await allDocs({
      c: "exam_question",
      match: {
        _id: _.in(questionPack.questionIds)
      }
    });

    // 按照题集中的顺序排列题目
    const sortedQuestions = questionPack.questionIds.map(id => questions.find(q => q._id === id)).filter(Boolean);
    return {
      success: true,
      data: {
        questionPack,
        questions: sortedQuestions
      }
    };
  } catch (error) {
    console.error("获取题集和题目失败:", error);
    return {
      success: false,
      error: "获取题集和题目失败"
    };
  }
}
