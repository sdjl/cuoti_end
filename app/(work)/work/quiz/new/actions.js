"use server";

import { DISPLAY_TEXT } from "../../../../../lib/config/constants.js";
import { createMyQuiz, getMySchoolGrades } from "../../../../../lib/work/teacher/myQuiz.js";

/**
 * 创建口述核心知识点
 */
export async function createQuizAction(data) {
  try {
    const quizData = {
      title: data.title,
      description: data.description || "",
      subject: data.subject,
      grade: data.grade || "",
      questionIds: [],
      // 新建口述核心知识点时题目列表为空
      status: "unlocked"
    };
    const quizId = await createMyQuiz(quizData);
    return {
      success: true,
      quizId
    };
  } catch (error) {
    console.error(`创建${DISPLAY_TEXT.ORAL_KNOWLEDGE_QUIZ}失败:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : `创建${DISPLAY_TEXT.ORAL_KNOWLEDGE_QUIZ}失败`
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
