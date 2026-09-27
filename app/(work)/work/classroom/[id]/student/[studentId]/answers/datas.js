"use server";

import { allDocs, command } from "../../../../../../../../lib/common/database.js";
const STUDENT_ANSWER_COLLECTION = "student_answer";
const STUDENT_ANSWER_ITEM_COLLECTION = "student_answer_item";
const COURSE_COLLECTION = "course";
const QUESTION_PACK_COLLECTION = "question_pack";
const CLASSROOM_COLLECTION = "classroom";

/**
 * 获取学生答卷列表
 */
export async function getStudentAnswersFromDB(whereCondition) {
  return await allDocs({
    c: STUDENT_ANSWER_COLLECTION,
    match: whereCondition,
    sort: {
      created: -1
    }
  });
}

/**
 * 获取答卷对应的错题数量
 */
export async function getAnswerItemsByAnswerIdsFromDB(answerIds) {
  if (answerIds.length === 0) {
    return [];
  }
  const _ = command();
  return await allDocs({
    c: STUDENT_ANSWER_ITEM_COLLECTION,
    match: {
      studentAnswerId: _.in(answerIds)
    },
    project: {
      studentAnswerId: 1
    }
  });
}

/**
 * 批量获取课程信息
 */
export async function getCoursesByIdsFromDB(courseIds) {
  if (courseIds.length === 0) {
    return [];
  }
  const _ = command();
  return await allDocs({
    c: COURSE_COLLECTION,
    match: {
      _id: _.in(courseIds)
    },
    project: {
      _id: 1,
      name: 1
    }
  });
}

/**
 * 批量获取题集信息
 */
export async function getQuestionPacksByIdsFromDB(questionPackIds) {
  if (questionPackIds.length === 0) {
    return [];
  }
  const _ = command();
  return await allDocs({
    c: QUESTION_PACK_COLLECTION,
    match: {
      _id: _.in(questionPackIds)
    },
    project: {
      _id: 1,
      name: 1
    }
  });
}

/**
 * 批量获取班级信息
 */
export async function getClassesByIdsFromDB(classIds) {
  if (classIds.length === 0) {
    return [];
  }
  const _ = command();
  return await allDocs({
    c: CLASSROOM_COLLECTION,
    match: {
      _id: _.in(classIds)
    },
    project: {
      _id: 1,
      name: 1
    }
  });
}
