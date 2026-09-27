"use server";

import { getGuestProblemQuestionTeacherHelpCount, getMistakePracticeTeacherHelpCount, getProblemQuestionTeacherHelpCount } from "./datas.js";

/**
 * 获取老师帮助统计数据
 */
export async function getTeacherHelpStats() {
  try {
    const [mistakeCount, problemCount, guestProblemCount] = await Promise.all([getMistakePracticeTeacherHelpCount(), getProblemQuestionTeacherHelpCount(), getGuestProblemQuestionTeacherHelpCount()]);
    return {
      mistakePracticeTeacherHelpCount: mistakeCount,
      problemQuestionTeacherHelpCount: problemCount,
      guestProblemQuestionTeacherHelpCount: guestProblemCount
    };
  } catch (error) {
    console.error("获取老师帮助数量失败:", error);
    return {
      mistakePracticeTeacherHelpCount: 0,
      problemQuestionTeacherHelpCount: 0,
      guestProblemQuestionTeacherHelpCount: 0
    };
  }
}
