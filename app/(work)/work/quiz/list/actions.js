"use server";

import { DISPLAY_TEXT } from "../../../../../lib/config/constants.js";
import { deleteMyQuiz, getMyQuizzes, getMyQuizzesCount, getMySchoolGrades, updateMyQuiz } from "../../../../../lib/work/teacher/myQuiz.js";
import { getQuizParticipantCounts } from "./datas.js";

/**
 * 获取口述核心知识点列表
 */
export async function getQuizzesAction({
  pageNum = 0,
  pageSize = 20,
  keyword = "",
  subject = "all",
  grade = "all",
  status = "all",
  teamEnabled = "all",
  activityStatus = "all"
} = {}) {
  return getMyQuizzes({
    pageNum,
    pageSize,
    keyword,
    subject,
    grade,
    status,
    teamEnabled,
    activityStatus
  });
}

/**
 * 获取口述核心知识点总数
 */
export async function getQuizzesCountAction({
  keyword = "",
  subject = "all",
  grade = "all",
  status = "all",
  teamEnabled = "all",
  activityStatus = "all"
} = {}) {
  return getMyQuizzesCount({
    keyword,
    subject,
    grade,
    status,
    teamEnabled,
    activityStatus
  });
}

/**
 * 删除口述核心知识点
 */
export async function deleteQuizAction(quizId) {
  try {
    const success = await deleteMyQuiz(quizId);
    if (success) {
      return {
        success: true
      };
    } else {
      return {
        success: false,
        error: `删除${DISPLAY_TEXT.ORAL_KNOWLEDGE_QUIZ}失败`
      };
    }
  } catch (error) {
    console.error(`删除${DISPLAY_TEXT.ORAL_KNOWLEDGE_QUIZ}失败:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : `删除${DISPLAY_TEXT.ORAL_KNOWLEDGE_QUIZ}失败`
    };
  }
}

/**
 * 更新口述核心知识点状态
 */
export async function updateQuizStatusAction(quizId, status) {
  try {
    const success = await updateMyQuiz(quizId, {
      status
    });
    if (success) {
      return {
        success: true
      };
    } else {
      return {
        success: false,
        error: `更新${DISPLAY_TEXT.ORAL_KNOWLEDGE_QUIZ}状态失败`
      };
    }
  } catch (error) {
    console.error(`更新${DISPLAY_TEXT.ORAL_KNOWLEDGE_QUIZ}状态失败:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : `更新${DISPLAY_TEXT.ORAL_KNOWLEDGE_QUIZ}状态失败`
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

/**
 * 获取口述核心知识点参与人数
 */
export async function getQuizParticipantCountsAction(quizIds) {
  try {
    return await getQuizParticipantCounts(quizIds);
  } catch (error) {
    console.error("获取口述核心知识点参与人数失败:", error);
    const counts = {};
    quizIds.forEach(quizId => {
      counts[quizId] = 0;
    });
    return counts;
  }
}
