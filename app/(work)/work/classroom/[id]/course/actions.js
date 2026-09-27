"use server";

import { getQuestionPacksByIds } from "../../../../../../lib/collection/course.js";
import { getTeacherClassRoomById } from "../../../../../../lib/work/teacher/myClassroom.js";
import { getClassCourses, removeCourseFromClass } from "../../../../../../lib/work/teacher/myCourse.js";
import { getClassCourseByIdFromDB, getClassCoursesFromDB, updateClassCourseStatusInDB } from "./datas.js";

/**
 * 获取班级课程列表，包含完成状态
 */
export async function getClassCoursesAction(classId) {
  try {
    // 1. 获取班级课程列表
    const courses = await getClassCourses(classId);
    if (courses.length === 0) {
      return [];
    }

    // 2. 获取班级课程关联记录（包含 isCompleted 字段）
    const classCourses = await getClassCoursesFromDB(classId);

    // 3. 合并课程信息和完成状态
    const coursesWithStatus = courses.map(course => {
      const classCourse = classCourses.find(cc => cc.courseId === course._id);
      return {
        ...course,
        isCompleted: classCourse?.isCompleted || false
      };
    });
    return coursesWithStatus;
  } catch (error) {
    console.error("获取班级课程失败:", error);
    throw error;
  }
}

/**
 * 获取班级课程完成状态信息
 */
export async function getClassCourseStatusAction(classId, courseId) {
  try {
    // 获取班级课程关联记录
    const classCourse = await getClassCourseByIdFromDB(classId, courseId);
    if (!classCourse) {
      return {
        classCourse: null,
        questionPacks: [],
        error: "未找到班级课程关联记录"
      };
    }

    // 获取课程信息
    const courses = await getClassCourses(classId);
    const course = courses.find(c => c._id === courseId);
    if (!course) {
      return {
        classCourse: null,
        questionPacks: [],
        error: "未找到课程信息"
      };
    }

    // 获取题集信息
    const questionPacks = course.questionPackIds && course.questionPackIds.length > 0 ? await getQuestionPacksByIds(course.questionPackIds) : [];
    return {
      classCourse,
      questionPacks
    };
  } catch (error) {
    console.error("获取班级课程状态失败:", error);
    return {
      classCourse: null,
      questionPacks: [],
      error: error instanceof Error ? error.message : "获取班级课程状态失败"
    };
  }
}

/**
 * 更新班级课程完成状态
 */
export async function updateClassCourseStatusAction(classId, courseId, isCompleted, completedQuestionPackIds) {
  try {
    if (!classId.trim() || !courseId.trim()) {
      return {
        success: false,
        error: "班级ID和课程ID不能为空"
      };
    }

    // 更新班级课程状态
    const updatedCount = await updateClassCourseStatusInDB(classId, courseId, isCompleted, completedQuestionPackIds);
    if (updatedCount > 0) {
      return {
        success: true
      };
    } else {
      return {
        success: false,
        error: "未找到要更新的记录"
      };
    }
  } catch (error) {
    console.error("更新班级课程状态失败:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "更新班级课程状态失败"
    };
  }
}

/**
 * 从班级中移除课程
 */
export async function removeClassCourseAction(classId, courseId) {
  try {
    if (!classId.trim() || !courseId.trim()) {
      return {
        success: false,
        error: "班级ID和课程ID不能为空"
      };
    }
    const success = await removeCourseFromClass(classId, courseId);
    if (success) {
      return {
        success: true
      };
    } else {
      return {
        success: false,
        error: "移除课程失败"
      };
    }
  } catch (error) {
    console.error("移除班级课程失败:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "移除课程失败"
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
