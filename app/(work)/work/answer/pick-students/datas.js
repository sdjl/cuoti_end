"use server";

import { addDoc, allDocs, command, getDoc, updateDoc } from "../../../../../lib/common/database.js";

/**
 * 从数据库获取学生答卷列表
 */
export async function getStudentAnswersFromDB(classId, courseId, questionPackId) {
  return await allDocs({
    c: "student_answer",
    match: {
      classId,
      courseId,
      questionPackId
    },
    sort: {
      created: -1
    }
  });
}

/**
 * 从数据库获取多个学生答卷的答题条目
 */
export async function getAnswerItemsByAnswerIdsFromDB(answerIds) {
  const _ = command();
  return await allDocs({
    c: "student_answer_item",
    match: {
      studentAnswerId: _.in(answerIds)
    }
  });
}

/**
 * 从数据库获取学生信息
 */
export async function getStudentFromDB(studentId) {
  return await getDoc("student", studentId);
}

/**
 * 更新学生信息
 */
export async function updateStudentInDB(studentId, updateData) {
  return await updateDoc("student", studentId, updateData);
}

/**
 * 创建学生成长记录
 */
export async function addStudentGrowthInDB(growthData) {
  return await addDoc("student_growth", growthData);
}

/**
 * 更新学生答卷
 */
export async function updateStudentAnswerInDB(answerId, updateData) {
  return await updateDoc("student_answer", answerId, updateData);
}
