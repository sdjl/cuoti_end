"use server";

import { getStudentMistakePoints } from "../../../../../../../../lib/collection/mistake.js";
import { allDocs, command } from "../../../../../../../../lib/common/database.js";
const _ = command();

/**
 * 错题记录最大显示数量
 * 防止一次性查询过多数据导致性能问题
 */
const MAX_MISTAKE_RECORDS = 100;


function buildMistakeRecordWhereCondition({
  studentAnswerIds,
  correctionStatus
}) {
  const where = {
    studentAnswerId: _.in(studentAnswerIds)
  };
  if (correctionStatus === "corrected") {
    // 已过关
    where.isCorrectedByMistakeAgain = true;
  } else if (correctionStatus === "pending") {
    // 待过关
    where.isCorrectedByMistakeAgain = false;
  } else if (correctionStatus === "stubborn") {
    // 顽固错题：isCorrectedByMistakeAgain=false 且 hasResubmittedAnswer=true
    where.isCorrectedByMistakeAgain = false;
    where.hasResubmittedAnswer = true;
  }
  return where;
}


export async function getQuestionIdsByKnowledgePoint({
  knowledgePoint,
  searchText,
  questionType,
  difficulty
}) {
  const match = {
    knowledgePoints: knowledgePoint
  };

  // 搜索题目文本
  if (searchText?.trim()) {
    match.questionText = new RegExp(searchText.trim(), "i");
  }

  // 筛选题目类型
  if (questionType && questionType !== "all") {
    match.questionType = questionType;
  }

  // 筛选题目难度
  if (difficulty && difficulty !== "all") {
    match.difficulty = difficulty;
  }
  const questions = await allDocs({
    c: "exam_question",
    match,
    project: {
      _id: 1
    }
  });
  return questions.map(q => q._id);
}


export async function getStudentAnswerIdsByStudentAndQuestions(studentId, questionIds) {
  if (questionIds.length === 0) {
    return [];
  }

  // 先获取包含这些题目的所有答卷项
  const answerItems = await allDocs({
    c: "student_answer_item",
    match: {
      questionId: _.in(questionIds)
    },
    project: {
      studentAnswerId: 1
    }
  });

  // 获取所有答卷ID
  const answerIds = [...new Set(answerItems.map(item => item.studentAnswerId))];
  if (answerIds.length === 0) {
    return [];
  }

  // 查询这些答卷中属于该学生的答卷
  const studentAnswers = await allDocs({
    c: "student_answer",
    match: {
      _id: _.in(answerIds),
      studentId: studentId
    },
    project: {
      _id: 1
    }
  });
  return studentAnswers.map(sa => sa._id);
}


export async function getMistakeRecordsFromDB({
  studentAnswerIds,
  correctionStatus,
  questionIds
}) {
  if (studentAnswerIds.length === 0) {
    return [];
  }
  const where = buildMistakeRecordWhereCondition({
    studentAnswerIds,
    correctionStatus
  });

  // 如果提供了题目ID列表，则只查询这些题目的错题记录
  if (questionIds && questionIds.length > 0) {
    where.questionId = _.in(questionIds);
  }
  const records = await allDocs({
    c: "student_answer_item",
    match: where,
    sort: {
      _id: -1
    },
    // 按ID逆序排序
    limit: MAX_MISTAKE_RECORDS // 限制最多返回的记录数
  });

  // 获取所有题目ID用于查询题目信息
  const recordQuestionIds = records.map(r => r.questionId);
  if (recordQuestionIds.length === 0) {
    return records;
  }

  // 获取题目信息（包含难度和题目类型）
  const questions = await allDocs({
    c: "exam_question",
    match: {
      _id: _.in(recordQuestionIds)
    },
    project: {
      _id: 1,
      difficulty: 1,
      questionType: 1
    }
  });

  // 创建题目ID到题目信息的映射
  const questionInfoMap = new Map();
  for (const question of questions) {
    questionInfoMap.set(question._id, {
      difficulty: question.difficulty || "未知",
      questionType: question.questionType || ""
    });
  }

  // 将题目信息合并到记录中
  const recordsWithDifficulty = records.map(record => {
    const questionInfo = questionInfoMap.get(record.questionId);
    return {
      ...record,
      difficulty: questionInfo?.difficulty || "未知",
      questionType: questionInfo?.questionType || record.questionType
    };
  });
  return recordsWithDifficulty;
}


export async function getRedoImagesFromDB(studentAnswerItemIds) {
  if (studentAnswerItemIds.length === 0) {
    return {};
  }
  const sessions = await allDocs({
    c: "student_question_ai_chat_session",
    match: {
      studentAnswerItemId: _.in(studentAnswerItemIds)
    },
    project: {
      studentAnswerItemId: 1,
      redoImageUrl: 1,
      redoImagePath: 1,
      redoImageFileID: 1
    }
  });

  // 将数组转换为以 studentAnswerItemId 为键的对象
  const result = {};
  for (const session of sessions) {
    const itemId = session.studentAnswerItemId;
    if (!result[itemId] && session.redoImageUrl) {
      result[itemId] = {
        redoImageUrl: session.redoImageUrl,
        redoImagePath: session.redoImagePath,
        redoImageFileID: session.redoImageFileID
      };
    }
  }
  return result;
}


export async function getMistakePointIdsFromDB({
  studentId,
  classId,
  courseId,
  questionPackId
}) {
  const result = await getStudentMistakePoints({
    studentId,
    classId,
    courseId,
    questionPackId
  });
  return result.success && result.data ? result.data : {};
}


export async function getMistakePointsFromDB(mistakePointIds) {
  if (mistakePointIds.length === 0) {
    return [];
  }
  const mistakePoints = await allDocs({
    c: "mistake_point",
    match: {
      _id: _.in(mistakePointIds)
    }
  });
  return mistakePoints;
}


export async function getQuestionKnowledgePointsFromDB(questionIds) {
  if (questionIds.length === 0) {
    return {};
  }
  const questions = await allDocs({
    c: "exam_question",
    match: {
      _id: _.in(questionIds)
    },
    project: {
      _id: 1,
      knowledgePoints: 1
    }
  });
  const result = {};
  for (const question of questions) {
    result[question._id] = question.knowledgePoints || [];
  }
  return result;
}


export async function getStudentFromDB(studentId) {
  const students = await allDocs({
    c: "student",
    match: {
      _id: studentId
    },
    limit: 1
  });
  return students.length > 0 ? students[0] : null;
}

/**
 * 获取学生答卷信息
 */
export async function getStudentAnswersFromDB(studentAnswerIds) {
  if (studentAnswerIds.length === 0) {
    return [];
  }
  const studentAnswers = await allDocs({
    c: "student_answer",
    match: {
      _id: _.in(studentAnswerIds)
    }
  });
  return studentAnswers;
}

/**
 * 获取课程科目信息
 */
export async function getCourseSubjectFromDB(courseId) {
  const courses = await allDocs({
    c: "course",
    match: {
      _id: courseId
    },
    project: {
      subject: 1
    },
    limit: 1
  });
  if (courses.length === 0) {
    return null;
  }
  return courses[0].subject || null;
}

/**
 * 更新错题记录的典型错题标记
 */
export async function updateTypicalMistakeInDB(itemId, isTypicalMistake) {
  const {
    updateDoc
  } = await import("../../../../../../../../lib/common/database");
  await updateDoc("student_answer_item", itemId, {
    isTypicalMistake
  });
}

/**
 * 更新错题记录信息
 */
export async function updateMistakeRecordInDB(itemId, answerValue, parse) {
  const {
    updateDoc
  } = await import("../../../../../../../../lib/common/database");
  await updateDoc("student_answer_item", itemId, {
    answerValue,
    parse
  });
}

/**
 * 获取题目集合类型
 */
export async function getQuestionPackTypeFromDB(questionPackId) {
  const questionPacks = await allDocs({
    c: "question_pack",
    match: {
      _id: questionPackId
    },
    project: {
      type: 1
    },
    limit: 1
  });
  return questionPacks.length > 0 ? questionPacks[0].type : "自建";
}
