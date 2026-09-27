"use server";

import { allDocs, command, getDoc } from "../../../../../lib/common/database.js";

// 数据库集合名称常量
const COLLECTION_NAMES = {
  EXAM_PAPER: "exam_paper",
  CLASSROOM: "classroom",
  STUDENT: "student",
  EXAM_QUESTION: "exam_question",
  COURSE: "course",
  MISTAKE_POINT: "mistake_point",
  QUESTION_PACK: "question_pack",
  SCHOOL: "school",
  USER: "user",
  WX_USER: "wx_user",
  CLASS_COURSE: "class_course",
  STUDENT_CLASS: "student_class"
};

/**
 * 从数据库获取试卷文档
 */
export async function getExamPaperDocFromDB(id) {
  return await getDoc(COLLECTION_NAMES.EXAM_PAPER, id);
}

/**
 * 从数据库获取班级文档
 */
export async function getClassroomDocFromDB(id) {
  return await getDoc(COLLECTION_NAMES.CLASSROOM, id);
}

/**
 * 从数据库获取校园文档
 */
export async function getSchoolDocFromDB(id) {
  return await getDoc(COLLECTION_NAMES.SCHOOL, id);
}

/**
 * 从数据库获取班级课程关系
 */
export async function getClassCoursesFromDB(classId) {
  return await allDocs({
    c: COLLECTION_NAMES.CLASS_COURSE,
    match: {
      classId
    }
  });
}

/**
 * 从数据库获取课程文档
 */
export async function getCourseDocFromDB(id) {
  return await getDoc(COLLECTION_NAMES.COURSE, id);
}

/**
 * 从数据库获取学生文档
 */
export async function getStudentDocFromDB(id) {
  return await getDoc(COLLECTION_NAMES.STUDENT, id);
}

/**
 * 从数据库获取学生班级关系
 */
export async function getStudentClassesFromDB(studentId) {
  return await allDocs({
    c: COLLECTION_NAMES.STUDENT_CLASS,
    match: {
      studentId
    }
  });
}

/**
 * 从数据库获取题目文档
 */
export async function getQuestionDocFromDB(id) {
  return await getDoc(COLLECTION_NAMES.EXAM_QUESTION, id);
}

/**
 * 从数据库获取使用该课程的班级课程关系
 */
export async function getClassCoursesByCourseIdFromDB(courseId) {
  return await allDocs({
    c: COLLECTION_NAMES.CLASS_COURSE,
    match: {
      courseId
    }
  });
}

/**
 * 从数据库获取错误归因文档
 */
export async function getMistakePointDocFromDB(id) {
  return await getDoc(COLLECTION_NAMES.MISTAKE_POINT, id);
}

/**
 * 从数据库获取题集文档
 */
export async function getQuestionPackDocFromDB(id) {
  return await getDoc(COLLECTION_NAMES.QUESTION_PACK, id);
}

/**
 * 从数据库获取题集中的题目文档
 */
export async function getQuestionsFromDB(questionIds) {
  const questions = [];
  for (const questionId of questionIds) {
    const question = await getDoc(COLLECTION_NAMES.EXAM_QUESTION, questionId);
    if (question) {
      questions.push(question);
    }
  }
  return questions;
}

/**
 * 从数据库获取校园的班级列表
 */
export async function getClassroomsBySchoolIdFromDB(schoolId) {
  return await allDocs({
    c: COLLECTION_NAMES.CLASSROOM,
    match: {
      schoolId
    }
  });
}

/**
 * 从数据库获取校长的微信用户信息
 */
export async function getAdminWxUsersFromDB(adminOpenids) {
  if (adminOpenids.length === 0) {
    return [];
  }
  const _ = command();
  return await allDocs({
    c: COLLECTION_NAMES.WX_USER,
    match: {
      openid: _.in(adminOpenids)
    }
  });
}

/**
 * 从数据库获取用户文档
 */
export async function getUserDocFromDB(id) {
  return await getDoc(COLLECTION_NAMES.USER, id);
}

/**
 * 从数据库获取微信用户文档
 */
export async function getWxUserDocFromDB(id) {
  return await getDoc(COLLECTION_NAMES.WX_USER, id);
}
