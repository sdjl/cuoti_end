"use server";

import { DISPLAY_TEXT } from "../../../../../../lib/config/constants.js";
import { getMyQuizById, getMySchoolGrades, updateMyQuiz } from "../../../../../../lib/work/teacher/myQuiz.js";

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
 * 更新口述核心知识点
 */
export async function updateQuizAction(quizId, data) {
  try {
    const updateData = {
      title: data.title,
      description: data.description || "",
      subject: data.subject,
      grade: data.grade || "",
      teamEnabled: data.teamEnabled,
      teamMaxSize: data.teamMaxSize || 5,
      teamEndTime: data.teamEndTime
    };
    const success = await updateMyQuiz(quizId, updateData);
    if (success) {
      return {
        success: true
      };
    } else {
      return {
        success: false,
        error: `更新${DISPLAY_TEXT.ORAL_KNOWLEDGE_QUIZ}失败`
      };
    }
  } catch (error) {
    console.error(`更新${DISPLAY_TEXT.ORAL_KNOWLEDGE_QUIZ}失败:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : `更新${DISPLAY_TEXT.ORAL_KNOWLEDGE_QUIZ}失败`
    };
  }
}

/**
 * 获取当前校园的年级列表
 */
export async function getSchoolGradesAction() {
  try {
    return await getMySchoolGrades();
  } catch (error) {
    console.error("获取年级列表失败:", error);
    return [];
  }
}
