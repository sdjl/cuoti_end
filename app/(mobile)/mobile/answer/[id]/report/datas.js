"use server";

/**
 * 答卷报告页面的数据库操作文件
 * 专注于数据库的读写操作
 */
import { getMistakePointsBySubject, getStudentMistakePoints } from "../../../../../../lib/collection/mistake.js";
import { addDocList, allDocs, command, getDoc, removeMatch, updateDoc } from "../../../../../../lib/common/database.js";
import { getKnowledgeStatsConfig } from "../../../../../../lib/config/knowledgeTree.js";

// 数据库集合名称常量
const COLLECTION_NAMES = {
  STUDENT_ANSWER: "student_answer",
  STUDENT_ANSWER_ITEM: "student_answer_item",
  QUESTION_PACK: "question_pack",
  EXAM_QUESTION: "exam_question",
  MISTAKE_POINT: "mistake_point",
  MISTAKE_POINT_QUESTION: "mistake_point_question",
  STUDENT: "student",
  CLASSROOM: "classroom",
  SCHOOL: "school",
  MISTAKE_BATCH_STUDENT_PDF: "mistake_batch_student_pdf",
  MISTAKE_BATCH_TASK: "mistake_batch_task",
  STUDENT_QUESTION_AI_CHAT_SESSION: "student_question_ai_chat_session"
};


export async function getStudentAnswerFromDB(studentAnswerId) {
  return await getDoc(COLLECTION_NAMES.STUDENT_ANSWER, studentAnswerId);
}


export async function getStudentFromDB(studentId) {
  return await getDoc(COLLECTION_NAMES.STUDENT, studentId);
}


export async function getClassroomFromDB(classroomId) {
  return await getDoc(COLLECTION_NAMES.CLASSROOM, classroomId);
}


export async function getSchoolFromDB(schoolId) {
  return await getDoc(COLLECTION_NAMES.SCHOOL, schoolId);
}


export async function getQuestionPackFromDB(questionPackId) {
  return await getDoc(COLLECTION_NAMES.QUESTION_PACK, questionPackId);
}


export async function getKnowledgeStatsConfigFromDB() {
  return await getKnowledgeStatsConfig();
}


export async function getWrongAnswerItemsFromDB(studentAnswerId) {
  return await allDocs({
    c: COLLECTION_NAMES.STUDENT_ANSWER_ITEM,
    match: {
      studentAnswerId
    }
  });
}


export async function getQuestionsFromDB(questionIds) {
  const _ = command();
  return await allDocs({
    c: COLLECTION_NAMES.EXAM_QUESTION,
    match: {
      _id: _.in(questionIds)
    }
  });
}


export async function getClassStudentAnswersFromDB(classId, questionPackId, courseId) {
  const baseCondition = {
    classId,
    questionPackId
  };
  if (courseId === null) {
    baseCondition.courseId = null;
  } else {
    baseCondition.courseId = courseId;
  }
  return await allDocs({
    c: COLLECTION_NAMES.STUDENT_ANSWER,
    match: baseCondition
  });
}


export async function getClassErrorItemsFromDB(studentAnswerIds) {
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


export async function getStudentMistakePointsFromDB(params) {
  return await getStudentMistakePoints(params);
}


export async function getMistakePointDocsFromDB(mistakePointIds) {
  if (mistakePointIds.length === 0) {
    return [];
  }
  const _ = command();
  return await allDocs({
    c: COLLECTION_NAMES.MISTAKE_POINT,
    match: {
      _id: _.in(mistakePointIds)
    }
  });
}


export async function getAIChatSessionsFromDB(chatSessionIds) {
  if (chatSessionIds.length === 0) {
    return [];
  }
  const _ = command();
  return await allDocs({
    c: COLLECTION_NAMES.STUDENT_QUESTION_AI_CHAT_SESSION,
    match: {
      _id: _.in(chatSessionIds)
    }
  });
}


export async function updateStudentAnswerInDB(studentAnswerId, updateData) {
  try {
    await updateDoc(COLLECTION_NAMES.STUDENT_ANSWER, studentAnswerId, updateData);
    return true;
  } catch (error) {
    console.error("更新学生答卷失败:", error);
    return false;
  }
}


export async function getLatestMistakeBatchPdfFromDB(studentId) {
  const mistakeBatchPdfs = await allDocs({
    c: COLLECTION_NAMES.MISTAKE_BATCH_STUDENT_PDF,
    match: {
      studentId
    },
    sort: {
      created: -1 // 按创建时间倒序
    },
    limit: 1 // 只取最近的一条
  });
  return mistakeBatchPdfs[0] || null;
}


export async function getMistakeBatchTaskFromDB(taskId) {
  return await getDoc(COLLECTION_NAMES.MISTAKE_BATCH_TASK, taskId);
}


export async function getMistakePointsBySubjectFromDB(subject) {
  return await getMistakePointsBySubject(subject);
}


export async function getBatchQuestionMistakePointsFromDB(questionIds, studentId, classId, courseId) {
  if (questionIds.length === 0) {
    return [];
  }
  const _ = command();
  return await allDocs({
    c: COLLECTION_NAMES.MISTAKE_POINT_QUESTION,
    match: {
      questionId: _.in(questionIds),
      studentId,
      classId,
      courseId
    }
  });
}


export async function removeMistakePointsInDB(questionId, studentId, classId, courseId) {
  try {
    await removeMatch(COLLECTION_NAMES.MISTAKE_POINT_QUESTION, {
      questionId,
      studentId,
      classId,
      courseId
    });
    return true;
  } catch (error) {
    console.error("删除错误归因失败:", error);
    return false;
  }
}


export async function addMistakePointsInDB(records) {
  try {
    if (records.length === 0) {
      return true;
    }
    await addDocList(COLLECTION_NAMES.MISTAKE_POINT_QUESTION, records);
    return true;
  } catch (error) {
    console.error("添加错误归因失败:", error);
    return false;
  }
}
