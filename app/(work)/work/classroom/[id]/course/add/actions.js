"use server";

import { getTeacherClassRoomById } from "../../../../../../../lib/work/teacher/myClassroom.js";
import { addCourseToClass, getAvailableCoursesForClass, getAvailableCoursesForClassCount } from "../../../../../../../lib/work/teacher/myCourse.js";

/**
 * 获取可为班级添加的课程列表
 */
export async function getAvailableCoursesAction(classId, {
  pageNum = 0,
  pageSize = 20,
  keyword = "",
  subject = "",
  status = "使用中"
} = {}) {
  try {
    return await getAvailableCoursesForClass(classId, {
      pageNum,
      pageSize,
      keyword,
      subject,
      status
    });
  } catch (error) {
    console.error("获取可添加课程列表失败:", error);
    throw error;
  }
}

/**
 * 获取可为班级添加的课程总数
 */
export async function getAvailableCoursesCountAction(classId, {
  keyword = "",
  subject = "",
  status = "使用中"
} = {}) {
  try {
    return await getAvailableCoursesForClassCount(classId, {
      keyword,
      subject,
      status
    });
  } catch (error) {
    console.error("获取可添加课程总数失败:", error);
    throw error;
  }
}

/**
 * 添加课程到班级
 */
export async function addCourseToClassAction(classId, courseId) {
  try {
    if (!classId.trim() || !courseId.trim()) {
      return {
        success: false,
        error: "班级ID和课程ID不能为空"
      };
    }
    const success = await addCourseToClass(classId, courseId);
    if (success) {
      return {
        success: true
      };
    } else {
      return {
        success: false,
        error: "添加课程失败"
      };
    }
  } catch (error) {
    console.error("添加课程到班级失败:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "添加课程失败"
    };
  }
}

/**
 * 获取班级信息
 */
export async function getClassRoomInfoAction(classId) {
  try {
    const classRoom = await getTeacherClassRoomById(classId);
    return {
      classRoom
    };
  } catch (error) {
    console.error("获取班级信息失败:", error);
    return {
      classRoom: null,
      error: error instanceof Error ? error.message : "获取班级信息失败"
    };
  }
}
