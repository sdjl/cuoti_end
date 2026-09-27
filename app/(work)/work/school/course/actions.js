"use server";

import { checkIsPrincipalAction } from "../../classroom/actions.js";
import { createMyCourse, deleteMyCourse, getMyCourses, getMyCoursesCount, updateMyCourse } from "../../../../../lib/work/principal/myCourse.js";

/**
 * 获取课程列表
 */
export async function getCoursesAction({
  pageNum = 0,
  pageSize = 20,
  keyword = "",
  subject = "",
  status = "all"
} = {}) {
  return getMyCourses({
    pageNum,
    pageSize,
    keyword,
    subject: subject === "all" ? "" : subject,
    status: status
  });
}

/**
 * 获取课程总数
 */
export async function getCoursesCountAction({
  keyword = "",
  subject = "",
  status = "all"
} = {}) {
  return getMyCoursesCount({
    keyword,
    subject: subject === "all" ? "" : subject,
    status: status
  });
}

/**
 * 添加课程
 */
export async function addCourseAction(data) {
  try {
    // 检查用户权限
    const isPrincipal = await checkIsPrincipalAction();
    if (!isPrincipal) {
      return {
        success: false,
        error: "只有校长可以添加课程"
      };
    }
    await createMyCourse(data);
    return {
      success: true
    };
  } catch (error) {
    console.error("添加课程失败:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "添加课程失败"
    };
  }
}

/**
 * 更新课程
 */
export async function updateCourseAction(courseId, data) {
  try {
    // 检查用户权限
    const isPrincipal = await checkIsPrincipalAction();
    if (!isPrincipal) {
      return {
        success: false,
        error: "只有校长可以编辑课程"
      };
    }
    await updateMyCourse(courseId, data);
    return {
      success: true
    };
  } catch (error) {
    console.error("更新课程失败:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "更新课程失败"
    };
  }
}

/**
 * 删除课程
 */
export async function deleteCourseAction(courseId) {
  try {
    if (!courseId.trim()) {
      return {
        success: false,
        error: "课程ID不能为空"
      };
    }

    // 检查用户权限
    const isPrincipal = await checkIsPrincipalAction();
    if (!isPrincipal) {
      return {
        success: false,
        error: "只有校长可以删除课程"
      };
    }
    await deleteMyCourse(courseId);
    return {
      success: true
    };
  } catch (error) {
    console.error("删除课程失败:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "删除课程失败"
    };
  }
}
