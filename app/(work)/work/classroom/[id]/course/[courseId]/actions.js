"use server";

import { getTeacherClassRoomById } from "../../../../../../../lib/work/teacher/myClassroom.js";
import { getCourseById } from "../../../../../../../lib/work/teacher/myCourse.js";
import { getClassCourseFromDB, getQuestionPackSubmitStatsFromDB, getStudentCountFromDB, updateCourseCompletionInDB, updateQuestionPackCompletionInDB } from "./datas.js";

/**
 * 获取班级信息
 */
export async function getClassRoomInfoAction(classId) {
  try {
    const classRoom = await getTeacherClassRoomById(classId);
    return {
      classRoom,
      error: null
    };
  } catch (error) {
    console.error("获取班级信息失败:", error);
    return {
      classRoom: null,
      error: error instanceof Error ? error.message : "获取班级信息失败"
    };
  }
}

/**
 * 获取课程题集数据，包括完成状态、学生提交统计和学生人数
 */
export async function getCourseQuestionPacksAction(classId, courseId) {
  try {
    // 获取课程信息（包含题集列表）
    const course = await getCourseById(courseId);
    if (!course) {
      return {
        course: null,
        classCourse: null,
        studentAnswerStats: null,
        studentCount: null,
        error: "课程不存在"
      };
    }

    // 获取班级课程关联信息（包含完成状态）
    const classCourse = await getClassCourseFromDB(classId, courseId);
    if (!classCourse) {
      return {
        course,
        classCourse: null,
        studentAnswerStats: null,
        studentCount: null,
        error: "班级未关联该课程"
      };
    }

    // 获取班级学生总数
    const studentCount = await getStudentCountFromDB(classId);

    // 使用 aggregate 一次性获取所有题集的学生提交统计
    let studentAnswerStats = {};
    if (course.questionPacks && course.questionPacks.length > 0) {
      const questionPackIds = course.questionPacks.map(pack => pack._id);
      studentAnswerStats = await getQuestionPackSubmitStatsFromDB(classId, courseId, questionPackIds);
    }
    return {
      course,
      classCourse,
      studentAnswerStats,
      studentCount,
      error: null
    };
  } catch (error) {
    console.error("获取课程题集数据失败:", error);
    return {
      course: null,
      classCourse: null,
      studentAnswerStats: null,
      studentCount: null,
      error: error instanceof Error ? error.message : "获取数据失败"
    };
  }
}

/**
 * 更新课程完成状态
 */
export async function updateCourseCompletionAction(classId, courseId, isCompleted) {
  try {
    const classCourse = await getClassCourseFromDB(classId, courseId);
    if (!classCourse) {
      return {
        success: false,
        error: "班级课程关联不存在"
      };
    }
    const success = await updateCourseCompletionInDB(classCourse._id, isCompleted);
    return {
      success,
      error: null
    };
  } catch (error) {
    console.error("更新课程完成状态失败:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "更新失败"
    };
  }
}

/**
 * 更新题集完成状态
 */
export async function updateQuestionPackCompletionAction(classId, courseId, questionPackId, isCompleted) {
  try {
    // 获取当前班级课程信息
    const classCourse = await getClassCourseFromDB(classId, courseId);
    if (!classCourse) {
      return {
        success: false,
        error: "班级课程关联不存在"
      };
    }

    // 更新完成的题集列表
    let updatedCompletedIds = [...(classCourse.completedQuestionPackIds || [])];
    if (isCompleted) {
      // 添加到已完成列表
      if (!updatedCompletedIds.includes(questionPackId)) {
        updatedCompletedIds.push(questionPackId);
      }
    } else {
      // 从已完成列表中移除
      updatedCompletedIds = updatedCompletedIds.filter(id => id !== questionPackId);
    }
    const success = await updateQuestionPackCompletionInDB(classCourse._id, updatedCompletedIds);
    return {
      success,
      error: null
    };
  } catch (error) {
    console.error("更新题集完成状态失败:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "更新失败"
    };
  }
}
