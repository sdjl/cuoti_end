"use server";

import { getSubjectKnowledgePoints } from "../../../../../../../lib/config/knowledgeTree.js";
import { getMyQuizById, updateMyQuiz } from "../../../../../../../lib/work/teacher/myQuiz.js";
import { getQuestionsByIds, searchQuestions, updateQuestionParse } from "./datas.js";

/**
 * 获取口述核心知识点
 */
export async function getQuizAction(quizId) {
  try {
    return await getMyQuizById(quizId);
  } catch (error) {
    console.error("获取口述核心知识点失败:", error);
    return null;
  }
}

/**
 * 更新口述核心知识点题目列表
 */
export async function updateQuizQuestionsAction(quizId, questionIds, parseChanges) {
  try {
    // 更新Quiz的questionIds
    const success = await updateMyQuiz(quizId, {
      questionIds
    });
    if (!success) {
      return {
        success: false,
        error: "更新题目列表失败"
      };
    }

    // 更新有变动的题目parse
    if (parseChanges && parseChanges.size > 0) {
      try {
        for (const [questionId, parse] of parseChanges) {
          await updateQuestionParse(questionId, parse);
        }
      } catch (parseError) {
        console.error("更新题目解析失败:", parseError);
        return {
          success: false,
          error: "更新题目解析失败"
        };
      }
    }
    return {
      success: true
    };
  } catch (error) {
    console.error("更新题目列表失败:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "更新题目列表失败"
    };
  }
}

/**
 * 搜索题目
 */
export async function searchQuestionsAction(params) {
  try {
    return await searchQuestions(params);
  } catch (error) {
    console.error("搜索题目失败:", error);
    return [];
  }
}

/**
 * 获取指定科目的知识点列表
 */
export async function getKnowledgePointsAction(subject) {
  try {
    return await getSubjectKnowledgePoints(subject);
  } catch (error) {
    console.error("获取知识点失败:", error);
    return [];
  }
}

/**
 * 批量获取题目详情
 */
export async function getQuestionsAction(questionIds) {
  try {
    return await getQuestionsByIds(questionIds);
  } catch (error) {
    console.error("获取题目详情失败:", error);
    return [];
  }
}

/**
 * 获取指定学科的知识树配置
 */
export async function getKnowledgeTreeConfigAction(subject) {
  // 使用统一的知识树配置获取函数
  const {
    getKnowledgeTreeConfig
  } = await import("../../../../../../../lib/config/knowledgeTree");
  return await getKnowledgeTreeConfig(subject);
}
