"use server";

/**
 * 学生学期综合报告页面的数据库操作文件
 * 专注于数据库的读写操作
 */
import { allDocs, command, getDoc } from "../../../../../../../../lib/common/database.js";
import { getKnowledgeStatsConfig, getKnowledgeTreeConfig } from "../../../../../../../../lib/config/knowledgeTree.js";

// 数据库集合名称常量
const COLLECTION_NAMES = {
  STUDENT_ANSWER: "student_answer",
  STUDENT_ANSWER_ITEM: "student_answer_item",
  QUESTION_PACK: "question_pack",
  EXAM_QUESTION: "exam_question",
  PROBLEM_QUESTION: "problem_question",
  STUDENT: "student",
  CLASSROOM: "classroom",
  SCHOOL: "school",
  COURSE: "course",
  CLASS_COURSE: "class_course",
  MISTAKE_POINT: "mistake_point",
  MISTAKE_POINT_QUESTION: "mistake_point_question"
};


export async function getStudentFromDB(studentId) {
  return await getDoc(COLLECTION_NAMES.STUDENT, studentId);
}


export async function getClassroomFromDB(classroomId) {
  return await getDoc(COLLECTION_NAMES.CLASSROOM, classroomId);
}


export async function getSchoolFromDB(schoolId) {
  return await getDoc(COLLECTION_NAMES.SCHOOL, schoolId);
}


export async function getStudentAnswersFromDB(studentId, classroomId) {
  return await allDocs({
    c: COLLECTION_NAMES.STUDENT_ANSWER,
    match: {
      studentId: studentId,
      classId: classroomId
    }
  });
}


export async function getClassCoursesFromDB(classroomId) {
  return await allDocs({
    c: COLLECTION_NAMES.CLASS_COURSE,
    match: {
      classId: classroomId
    }
  });
}


export async function getCoursesBySubjectFromDB(courseIds, subject) {
  if (courseIds.length === 0) {
    return [];
  }
  const _ = command();
  return await allDocs({
    c: COLLECTION_NAMES.COURSE,
    match: {
      _id: _.in(courseIds),
      subject: subject
    }
  });
}


export async function getQuestionPacksBySubjectFromDB(questionPackIds, subject) {
  if (questionPackIds.length === 0) {
    return [];
  }
  const _ = command();
  return await allDocs({
    c: COLLECTION_NAMES.QUESTION_PACK,
    match: {
      _id: _.in(questionPackIds),
      subject: subject
    }
  });
}


export async function getWrongItemsFromDB(studentAnswerIds) {
  if (studentAnswerIds.length === 0) {
    return [];
  }
  const _ = command();
  return await allDocs({
    c: COLLECTION_NAMES.STUDENT_ANSWER_ITEM,
    match: {
      studentAnswerId: _.in(studentAnswerIds)
    }
  });
}


export async function getQuestionsFromDB(questionIds) {
  if (questionIds.length === 0) {
    return [];
  }
  const _ = command();
  return await allDocs({
    c: COLLECTION_NAMES.EXAM_QUESTION,
    match: {
      _id: _.in(questionIds)
    }
  });
}


export async function getProblemQuestionsFromDB(studentId, classroomId, subject) {
  return await allDocs({
    c: COLLECTION_NAMES.PROBLEM_QUESTION,
    match: {
      studentId: studentId,
      classId: classroomId,
      subject: subject
    }
  });
}


export async function getKnowledgeStatsConfigFromDB() {
  return await getKnowledgeStatsConfig();
}


export async function getKnowledgeTreeConfigFromDB(subject) {
  return await getKnowledgeTreeConfig(subject);
}


export async function getMistakePointQuestionsFromDB(studentId, classroomId) {
  return await allDocs({
    c: COLLECTION_NAMES.MISTAKE_POINT_QUESTION,
    match: {
      studentId,
      classId: classroomId
    }
  });
}


export async function getMistakePointsBySubjectFromDB(mistakePointIds, subject) {
  if (mistakePointIds.length === 0) {
    return [];
  }
  const _ = command();
  return await allDocs({
    c: COLLECTION_NAMES.MISTAKE_POINT,
    match: {
      _id: _.in(mistakePointIds),
      subject: subject
    }
  });
}


export async function getStudentAnswerIdsFromDB(studentId, classroomId) {
  return await allDocs({
    c: COLLECTION_NAMES.STUDENT_ANSWER,
    match: {
      studentId,
      classId: classroomId
    },
    only: "_id"
  });
}


export async function getUncorrectedWrongItemsFromDB(studentAnswerIds) {
  if (studentAnswerIds.length === 0) {
    return [];
  }
  const _ = command();
  return await allDocs({
    c: COLLECTION_NAMES.STUDENT_ANSWER_ITEM,
    match: {
      studentAnswerId: _.in(studentAnswerIds),
      isCorrectedByMistakeAgain: false
    },
    only: "questionId"
  });
}


export async function getQuestionKnowledgePointsFromDB(questionIds) {
  if (questionIds.length === 0) {
    return [];
  }
  const _ = command();
  return await allDocs({
    c: COLLECTION_NAMES.EXAM_QUESTION,
    match: {
      _id: _.in(questionIds)
    },
    only: "_id,knowledgePoints"
  });
}
