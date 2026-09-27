"use server";

import { allDocs, command, getDoc, getFieldCounts, updateDoc } from "../../../../../../../lib/common/database.js";

export async function getFrequentMistakePackById(frequentMistakeId) {
  const doc = await getDoc("frequent_mistake", frequentMistakeId);
  if (!doc) {
    return null;
  }
  return {
    _id: doc._id,
    schoolId: doc.schoolId,
    subject: doc.subject,
    name: doc.name,
    description: doc.description,
    questionIds: doc.questionIds,
    timeRange: doc.timeRange,
    knowledgePoints: doc.knowledgePoints,
    mistakePoints: doc.mistakePoints,
    generationType: doc.generationType,
    created: doc.created,
    updated: doc.updated
  };
}


export async function getQuestionDetailsByIds(questionIds) {
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

  // 将查询结果转换为QuestionDetail对象并创建映射
  const questionMap = new Map(questions.map(q => [q._id, {
    _id: q._id,
    questionType: q.questionType,
    knowledgePoints: q.knowledgePoints,
    difficulty: q.difficulty,
    imageUrl: q.imageUrl,
    imageHeight: q.imageHeight,
    imageWidth: q.imageWidth,
    easyToMistakeDetail: q.easyToMistakeDetail
  }]));

  // 按照questionIds的顺序返回题目数组
  const orderedQuestions = [];
  for (const id of questionIds) {
    const question = questionMap.get(id);
    if (question) {
      orderedQuestions.push(question);
    }
  }
  return orderedQuestions;
}


export async function getTypicalErrorCounts(frequentMistakeId) {
  const counts = await getFieldCounts({
    c: "frequent_mistake_typical_error",
    field: "questionId",
    w: {
      frequentMistakeId
    }
  });
  return counts;
}


export async function updateQuestionOrder(frequentMistakeId, questionIds) {
  const now = Date.now();
  await updateDoc("frequent_mistake", frequentMistakeId, {
    questionIds,
    updated: now
  });
}
