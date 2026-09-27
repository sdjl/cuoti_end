"use server";

import { addDoc, agg, aggregate, allDocs, command } from "../../../../../lib/common/database.js";
/** 页面中最多显示这么多题目 */
const MAX_QUESTIONS_TO_DISPLAY = 100;


export async function getClassIdsBySchoolId(schoolId) {
  const classrooms = await allDocs({
    c: "classroom",
    match: {
      schoolId
    },
    only: "_id"
  });
  return classrooms.map(classroom => classroom._id);
}


export async function getStudentAnswerIds(classIds, startTime, endTime) {
  const _ = command();
  const match = {
    classId: _.in(classIds)
  };

  // 添加时间区间过滤
  if (startTime !== undefined && endTime !== undefined) {
    match.created = _.gte(startTime).and(_.lte(endTime));
  }
  const studentAnswers = await allDocs({
    c: "student_answer",
    match,
    only: "_id"
  });
  return studentAnswers.map(answer => answer._id);
}


export async function filterStudentAnswerIdsBySubject(studentAnswerIds, subject) {
  if (studentAnswerIds.length === 0) {
    return [];
  }
  const _ = command();

  // 1. 查询所有答卷，获取题集ID
  const studentAnswers = await allDocs({
    c: "student_answer",
    match: {
      _id: _.in(studentAnswerIds)
    },
    only: "_id,questionPackId"
  });
  if (studentAnswers.length === 0) {
    return [];
  }

  // 2. 获取所有题集ID
  const questionPackIds = [...new Set(studentAnswers.map(answer => answer.questionPackId))];

  // 3. 查询题集，过滤出指定科目的题集
  const questionPacks = await allDocs({
    c: "question_pack",
    match: {
      _id: _.in(questionPackIds),
      subject // 过滤科目
    },
    only: "_id"
  });
  const validQuestionPackIds = new Set(questionPacks.map(pack => pack._id));

  // 4. 过滤出属于有效题集的答卷ID
  const filteredAnswerIds = studentAnswers.filter(answer => validQuestionPackIds.has(answer.questionPackId)).map(answer => answer._id);
  return filteredAnswerIds;
}


export async function getMistakeStatsByQuestionId(studentAnswerIds, excludeQuestionIds, knowledgePoint) {
  if (studentAnswerIds.length === 0) {
    return [];
  }
  const _ = command();
  const $ = aggregate();

  // 构建 match 条件
  const matchCondition = {
    studentAnswerId: _.in(studentAnswerIds)
  };

  // 如果有知识点过滤，先查询包含该知识点的题目ID
  if (knowledgePoint) {
    const questionsWithKP = await allDocs({
      c: "exam_question",
      match: {
        knowledgePoints: knowledgePoint
      },
      only: "_id"
    });
    if (questionsWithKP.length === 0) {
      return [];
    }
    const validQuestionIds = questionsWithKP.map(q => q._id);

    // 如果需要排除的题目ID，从validQuestionIds中移除
    const finalQuestionIds = excludeQuestionIds ? validQuestionIds.filter(id => !excludeQuestionIds.includes(id)) : validQuestionIds;
    if (finalQuestionIds.length === 0) {
      return [];
    }

    // 在matchCondition中使用_.in限制题目ID
    matchCondition.questionId = _.in(finalQuestionIds);
  } else {
    // 如果没有知识点过滤，但有需要排除的题目ID
    if (excludeQuestionIds && excludeQuestionIds.length > 0) {
      matchCondition.questionId = _.nin(excludeQuestionIds);
    }
  }
  const result = await agg("student_answer_item").match(matchCondition).group({
    _id: "$questionId",
    mistakeCount: $.sum(1)
  }).sort({
    mistakeCount: -1
  }).limit(MAX_QUESTIONS_TO_DISPLAY).end();
  const questionStats = result.data.map(item => ({
    questionId: item._id,
    mistakeCount: item.mistakeCount
  }));
  return questionStats;
}


export async function getExistingFrequentMistakeQuestionIds(schoolId) {
  const frequentMistakeDocs = await allDocs({
    c: "frequent_mistake",
    match: {
      schoolId
    },
    only: "questionIds"
  });

  // 收集所有题目ID并去重
  const questionIdSet = new Set();
  for (const doc of frequentMistakeDocs) {
    const questionIds = doc.questionIds;
    if (questionIds && Array.isArray(questionIds)) {
      for (const id of questionIds) {
        questionIdSet.add(id);
      }
    }
  }
  return Array.from(questionIdSet);
}


export async function getQuestionsByIds(questionIds) {
  if (questionIds.length === 0) {
    return [];
  }
  const _ = command();
  const questions = await allDocs({
    c: "exam_question",
    match: {
      _id: _.in(questionIds)
    },
    only: "_id,questionType,knowledgePoints,difficulty,imageUrl,imageHeight,imageWidth,easyToMistakeDetail"
  });
  return questions;
}


export async function getMistakePointsBySubject(subject) {
  const mistakePoints = await allDocs({
    c: "mistake_point",
    match: {
      subject
    },
    only: "_id,name,description",
    sort: {
      created: -1
    }
  });
  return mistakePoints;
}


export async function getMistakeStatsByMistakePoint(classIds, mistakePointId, startTime, endTime, excludeQuestionIds) {
  if (classIds.length === 0) {
    return [];
  }
  const _ = command();
  const $ = aggregate();

  // 构建match条件
  const matchCondition = {
    mistakePointId,
    classId: _.in(classIds)
  };

  // 添加时间区间过滤
  if (startTime !== undefined && endTime !== undefined) {
    matchCondition.created = _.gte(startTime).and(_.lte(endTime));
  }

  // 如果有需要排除的题目ID，添加条件
  if (excludeQuestionIds && excludeQuestionIds.length > 0) {
    matchCondition.questionId = _.nin(excludeQuestionIds);
  }

  // 使用聚合查询统计每个题目的错误次数
  const result = await agg("mistake_point_question").match(matchCondition).group({
    _id: "$questionId",
    mistakeCount: $.sum(1)
  }).sort({
    mistakeCount: -1
  }).limit(MAX_QUESTIONS_TO_DISPLAY).end();
  const questionStats = result.data.map(item => ({
    questionId: item._id,
    mistakeCount: item.mistakeCount
  }));
  return questionStats;
}


export async function createFrequentMistake(data) {
  const now = Date.now();
  const docId = await addDoc("frequent_mistake", {
    schoolId: data.schoolId,
    subject: data.subject,
    name: data.name,
    description: data.description,
    questionIds: data.questionIds,
    timeRange: data.timeRange,
    knowledgePoints: data.knowledgePoints,
    mistakePoints: data.mistakePoints,
    generationType: data.generationType,
    created: now,
    updated: now
  });
  return docId;
}
