"use server";

import { agg, aggregate, command, count, getOne, updateDoc } from "../../../../../../../lib/common/database.js";
const CLASS_COURSE_COLLECTION = "class_course";
const STUDENT_CLASS_COLLECTION = "student_class";
const STUDENT_ANSWER_COLLECTION = "student_answer";

/**
 * 获取班级课程关联记录
 */
export async function getClassCourseFromDB(classId, courseId) {
  return await getOne(CLASS_COURSE_COLLECTION, {
    classId,
    courseId
  });
}

/**
 * 获取班级学生总数
 */
export async function getStudentCountFromDB(classId) {
  return await count(STUDENT_CLASS_COLLECTION, {
    classRoomId: classId
  });
}

/**
 * 获取题集的学生提交统计
 */
export async function getQuestionPackSubmitStatsFromDB(classId, courseId, questionPackIds) {
  try {
    const $ = aggregate();
    const _ = command();
    const pipeline = agg(STUDENT_ANSWER_COLLECTION).match({
      classId,
      courseId,
      questionPackId: _.in(questionPackIds)
    }).group({
      _id: "$questionPackId",
      count: $.sum(1)
    }).limit(100000);
    const result = await pipeline.end();
    const stats = {};
    for (const item of result.data || []) {
      stats[item._id] = item.count || 0;
    }

    // 确保所有题集都有统计数据（未提交的为0）
    questionPackIds.forEach(packId => {
      if (!(packId in stats)) {
        stats[packId] = 0;
      }
    });
    return stats;
  } catch (error) {
    console.error("获取提交统计失败:", error);
    // 降级处理：如果聚合查询失败，设置所有为0
    const stats = {};
    questionPackIds.forEach(packId => {
      stats[packId] = 0;
    });
    return stats;
  }
}

/**
 * 更新课程完成状态
 */
export async function updateCourseCompletionInDB(classCourseId, isCompleted) {
  return await updateDoc(CLASS_COURSE_COLLECTION, classCourseId, {
    isCompleted
  });
}

/**
 * 更新题集完成状态
 */
export async function updateQuestionPackCompletionInDB(classCourseId, completedQuestionPackIds) {
  return await updateDoc(CLASS_COURSE_COLLECTION, classCourseId, {
    completedQuestionPackIds
  });
}
