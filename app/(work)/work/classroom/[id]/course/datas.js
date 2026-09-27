"use server";

import { allDocs, updateMatch } from "../../../../../../lib/common/database.js";
const CLASS_COURSE_COLLECTION = "class_course";

/**
 * 获取班级课程关联记录列表
 */
export async function getClassCoursesFromDB(classId) {
  return await allDocs({
    c: CLASS_COURSE_COLLECTION,
    match: {
      classId
    }
  });
}

/**
 * 根据班级ID和课程ID查询班级课程关联记录
 */
export async function getClassCourseByIdFromDB(classId, courseId) {
  const classCourses = await allDocs({
    c: CLASS_COURSE_COLLECTION,
    match: {
      classId,
      courseId
    }
  });
  return classCourses.length > 0 ? classCourses[0] : null;
}

/**
 * 更新班级课程状态
 */
export async function updateClassCourseStatusInDB(classId, courseId, isCompleted, completedQuestionPackIds) {
  return await updateMatch(CLASS_COURSE_COLLECTION, {
    classId,
    courseId
  }, {
    isCompleted,
    completedQuestionPackIds
  });
}
