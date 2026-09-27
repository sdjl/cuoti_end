"use server";

import { checkIsPrincipalAction } from "../../../../classroom/actions.js";
import { getMyCourseById, getMyPublicQuestionPacks, getMyPublicQuestionPacksCount, getMyQuestionPacksByIds, updateCourseQuestionPacks } from "../../../../../../../lib/work/principal/myCourse.js";

/**
 * 获取公共题集列表（schoolId和studentId都为null，type为试卷）
 */
export async function getPublicQuestionPacksAction({
  pageNum = 0,
  pageSize = 20,
  keyword = "",
  subject = ""
} = {}) {
  return getMyPublicQuestionPacks({
    pageNum,
    pageSize,
    keyword,
    subject
  });
}

/**
 * 获取公共题集总数
 */
export async function getPublicQuestionPacksCountAction({
  keyword = "",
  subject = ""
} = {}) {
  return getMyPublicQuestionPacksCount({
    keyword,
    subject
  });
}

/**
 * 获取当前课程信息
 */
export async function getCourseAction(courseId) {
  try {
    return await getMyCourseById(courseId);
  } catch (error) {
    console.error("获取课程信息失败:", error);
    return null;
  }
}

/**
 * 根据ID列表获取题集详情
 */
export async function getQuestionPacksByIdsAction(questionPackIds) {
  return getMyQuestionPacksByIds(questionPackIds);
}

/**
 * 更新课程的题集列表
 */
export async function updateCourseQuestionPacksAction(courseId, questionPackIds) {
  try {
    // 检查用户权限
    const isPrincipal = await checkIsPrincipalAction();
    if (!isPrincipal) {
      return {
        success: false,
        error: "只有校长可以编辑课程题集"
      };
    }
    await updateCourseQuestionPacks(courseId, questionPackIds);
    return {
      success: true
    };
  } catch (error) {
    console.error("更新课程题集失败:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "更新课程题集失败"
    };
  }
}
