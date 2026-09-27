"use server";

import { allDocs, command, getDoc, updateDoc } from "../../../../../../lib/common/database.js";

/**
 * 从数据库获取学生答卷记录
 */
export async function getStudentAnswerFromDB(studentAnswerId) {
  return await getDoc("student_answer", studentAnswerId);
}

/**
 * 从数据库获取学生信息
 */
export async function getStudentFromDB(studentId) {
  return await getDoc("student", studentId);
}

/**
 * 从数据库获取班级信息
 */
export async function getClassRoomFromDB(classId) {
  return await getDoc("classroom", classId);
}

/**
 * 从数据库获取课程信息
 */
export async function getCourseFromDB(courseId) {
  return await getDoc("course", courseId);
}

/**
 * 从数据库获取题集信息
 */
export async function getQuestionPackFromDB(questionPackId) {
  return await getDoc("question_pack", questionPackId);
}

/**
 * 从数据库获取答案条目列表
 */
export async function getAnswerItemsFromDB(studentAnswerId) {
  return await allDocs({
    c: "student_answer_item",
    match: {
      studentAnswerId
    },
    sort: {
      questionId: 1
    }
  });
}

/**
 * 从数据库获取多个题目信息
 */
export async function getQuestionsFromDB(questionIds) {
  const _ = command();
  return await allDocs({
    c: "exam_question",
    match: {
      _id: _.in(questionIds)
    }
  });
}

/**
 * 从数据库获取多个错误归因信息
 */
export async function getMistakePointsFromDB(mistakePointIds) {
  const _ = command();
  return await allDocs({
    c: "mistake_point",
    match: {
      _id: _.in(mistakePointIds)
    }
  });
}

/**
 * 从数据库获取学科的所有错误归因
 */
export async function getSubjectMistakePointsFromDB(subject) {
  return await allDocs({
    c: "mistake_point",
    match: {
      subject: subject
    },
    sort: {
      name: 1
    }
  });
}

/**
 * 更新答题条目
 */
export async function updateAnswerItemInDB(itemId, updateData) {
  return await updateDoc("student_answer_item", itemId, updateData);
}

/**
 * 更新学生答卷
 */
export async function updateStudentAnswerInDB(studentAnswerId, updateData) {
  return await updateDoc("student_answer", studentAnswerId, updateData);
}
