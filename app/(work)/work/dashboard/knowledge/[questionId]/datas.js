"use server";

import { allDocs, command } from "../../../../../../lib/common/database.js";
const _ = command();

/**
 * 错题记录最大显示数量
 * 防止一次性查询过多数据导致性能问题
 */
const MAX_MISTAKE_RECORDS = 100;


export async function getSchoolClassroomIds(schoolId) {
  const classrooms = await allDocs({
    c: "classroom",
    match: {
      schoolId: schoolId
    },
    only: "_id"
  });
  return classrooms.map(c => c._id);
}


export async function getStudentAnswersByClassIds(classIds) {
  if (classIds.length === 0) {
    return [];
  }
  const answers = await allDocs({
    c: "student_answer",
    match: {
      classId: _.in(classIds)
    },
    only: "_id,studentId,classId,courseId,questionPackId,created"
  });
  return answers;
}


export async function getMistakeItemsByQuestion({
  studentAnswerIds,
  questionId,
  correctionStatus
}) {
  if (studentAnswerIds.length === 0) {
    return [];
  }
  const match = {
    studentAnswerId: _.in(studentAnswerIds),
    questionId: questionId
  };

  // 添加过关状态过滤
  if (correctionStatus === "corrected") {
    // 已过关：isCorrectedByMistakeAgain 明确为 true
    match.isCorrectedByMistakeAgain = true;
  } else if (correctionStatus === "pending") {
    // 待过关：isCorrectedByMistakeAgain 为 false 或不存在（undefined）
    // 使用 _.neq(true) 来匹配 false 和 undefined
    match.isCorrectedByMistakeAgain = _.neq(true);
  } else if (correctionStatus === "stubborn") {
    // 顽固错题：isCorrectedByMistakeAgain 不为 true 且 hasResubmittedAnswer 为 true
    match.isCorrectedByMistakeAgain = _.neq(true);
    match.hasResubmittedAnswer = true;
  }
  const items = await allDocs({
    c: "student_answer_item",
    match,
    sort: {
      _id: -1
    },
    // 按ID逆序排序
    limit: MAX_MISTAKE_RECORDS,
    // 限制最多返回的记录数
    only: "_id,studentAnswerId,questionId,questionType,answerValue,parse,imageUrl,isCorrectedByMistakeAgain,hasResubmittedAnswer,isTypicalMistake"
  });
  return items;
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
    only: "studentAnswerItemId,redoImageUrl,redoImagePath,redoImageFileID"
  });
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


export async function getStudentsFromDB(studentIds) {
  if (studentIds.length === 0) {
    return {};
  }
  const students = await allDocs({
    c: "student",
    match: {
      _id: _.in(studentIds)
    },
    only: "_id,name"
  });
  const result = {};
  for (const student of students) {
    result[student._id] = student;
  }
  return result;
}


export async function getClassroomsFromDB(classIds) {
  if (classIds.length === 0) {
    return {};
  }
  const classrooms = await allDocs({
    c: "classroom",
    match: {
      _id: _.in(classIds)
    },
    only: "_id,name"
  });
  const result = {};
  for (const classroom of classrooms) {
    result[classroom._id] = classroom;
  }
  return result;
}


export async function getBatchMistakePointsFromDB(configs) {
  if (configs.length === 0) {
    return {};
  }

  // 构建查询条件数组
  const orConditions = configs.map(config => {
    const condition = {
      studentId: config.studentId,
      classId: config.classId,
      questionPackId: config.questionPackId
    };

    // 处理courseId为null的情况
    if (config.courseId === null) {
      condition.courseId = _.eq(null);
    } else {
      condition.courseId = config.courseId;
    }
    return condition;
  });

  // 一次性查询所有 mistake_point_question 记录
  const allMistakePointQuestions = await allDocs({
    c: "mistake_point_question",
    match: {
      _or: orConditions
    },
    only: "studentId,classId,courseId,questionPackId,questionId,mistakePointId"
  });

  // 收集所有唯一的 mistakePointId
  const allMistakePointIds = [...new Set(allMistakePointQuestions.map(mpq => mpq.mistakePointId).filter(Boolean))];

  // 一次性查询所有 mistake_point 详情
  const allMistakePoints = await getMistakePointsFromDB(allMistakePointIds);

  // 创建 mistakePointId 到详情的映射
  const mistakePointMap = new Map();
  allMistakePoints.forEach(mp => {
    mistakePointMap.set(mp._id, mp);
  });

  // 组装结果
  const result = {};

  // 为每个配置初始化结果对象
  configs.forEach(config => {
    const configKey = `${config.studentId}_${config.classId}_${config.courseId || "null"}_${config.questionPackId}`;
    result[configKey] = {};
  });

  // 遍历所有 mistake_point_question 记录，按配置和题目分组
  allMistakePointQuestions.forEach(mpq => {
    const configKey = `${mpq.studentId}_${mpq.classId}_${mpq.courseId || "null"}_${mpq.questionPackId}`;
    if (!result[configKey]) {
      result[configKey] = {};
    }
    if (!result[configKey][mpq.questionId]) {
      result[configKey][mpq.questionId] = [];
    }
    const mistakePoint = mistakePointMap.get(mpq.mistakePointId);
    if (mistakePoint) {
      result[configKey][mpq.questionId].push(mistakePoint);
    }
  });
  return result;
}


export async function getMistakePointsFromDB(mistakePointIds) {
  if (mistakePointIds.length === 0) {
    return [];
  }
  const mistakePoints = await allDocs({
    c: "mistake_point",
    match: {
      _id: _.in(mistakePointIds)
    },
    only: "_id,name"
  });
  return mistakePoints;
}


export async function getQuestionDetailsFromDB(questionId) {
  const questions = await allDocs({
    c: "exam_question",
    match: {
      _id: questionId
    },
    only: "knowledgePoints,difficulty,questionType",
    limit: 1
  });
  if (questions.length === 0) {
    return {};
  }
  const question = questions[0];
  return {
    knowledgePoints: question.knowledgePoints || [],
    difficulty: question.difficulty,
    questionType: question.questionType
  };
}

/**
 * 获取题目信息
 */
export async function getQuestionInfoFromDB(questionId) {
  const questions = await allDocs({
    c: "exam_question",
    match: {
      _id: questionId
    },
    limit: 1
  });
  if (questions.length === 0) {
    return null;
  }
  return questions[0];
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
    only: "subject",
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
  } = await import("../../../../../../lib/common/database");
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
  } = await import("../../../../../../lib/common/database");
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
    only: "type",
    limit: 1
  });
  return questionPacks.length > 0 ? questionPacks[0].type : "自建";
}
