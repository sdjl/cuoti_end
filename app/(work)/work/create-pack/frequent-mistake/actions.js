"use server";

import { getCurrentSchoolId } from "../../../../../lib/work/teacher/mySchool.js";
import { createFrequentMistake, filterStudentAnswerIdsBySubject, getClassIdsBySchoolId, getExistingFrequentMistakeQuestionIds, getMistakePointsBySubject, getMistakeStatsByMistakePoint, getMistakeStatsByQuestionId, getQuestionsByIds, getStudentAnswerIds } from "./datas.js";

export async function getFrequentMistakeQuestions(subject, startTime, endTime, excludeExisting = true, knowledgePoint) {
  // 1. 获取当前校园ID
  const schoolId = await getCurrentSchoolId();

  // 2. 根据校园ID获取所有班级ID
  const classIds = await getClassIdsBySchoolId(schoolId);
  if (classIds.length === 0) {
    return [];
  }

  // 3. 根据班级ID和时间区间获取所有StudentAnswerDoc的ID
  let studentAnswerIds = await getStudentAnswerIds(classIds, startTime, endTime);
  if (studentAnswerIds.length === 0) {
    return [];
  }

  // 4. 根据科目过滤答卷ID
  studentAnswerIds = await filterStudentAnswerIdsBySubject(studentAnswerIds, subject);
  if (studentAnswerIds.length === 0) {
    return [];
  }

  // 5. 如果需要排除已存在的题目，获取已存在的题目ID
  let excludeQuestionIds;
  if (excludeExisting) {
    excludeQuestionIds = await getExistingFrequentMistakeQuestionIds(schoolId);
  }

  // 6. 使用聚合查询统计每个题目的错误次数（在数据库层面限制数量）
  const mistakeStats = await getMistakeStatsByQuestionId(studentAnswerIds, excludeQuestionIds, knowledgePoint);
  if (mistakeStats.length === 0) {
    return [];
  }

  // 7. 获取题目详情
  const questionIds = mistakeStats.map(stat => stat.questionId);
  const questions = await getQuestionsByIds(questionIds);

  // 8. 组装数据
  const questionMap = new Map(questions.map(q => [q._id, q]));
  const result = [];
  for (const stat of mistakeStats) {
    const question = questionMap.get(stat.questionId);
    if (!question) {
      continue;
    }
    result.push({
      questionId: stat.questionId,
      mistakeCount: stat.mistakeCount,
      question: {
        _id: question._id,
        questionType: question.questionType,
        knowledgePoints: question.knowledgePoints,
        difficulty: question.difficulty,
        imageUrl: question.imageUrl,
        imageHeight: question.imageHeight,
        imageWidth: question.imageWidth,
        easyToMistakeDetail: question.easyToMistakeDetail
      },
      selected: false
    });
  }
  return result;
}


export async function getMistakePoints(subject) {
  return await getMistakePointsBySubject(subject);
}


export async function getFrequentMistakeQuestionsByMistakePoint(_subject, mistakePointId, _mistakePointName, startTime, endTime, excludeExisting = true) {
  // 1. 获取当前校园ID
  const schoolId = await getCurrentSchoolId();

  // 2. 根据校园ID获取所有班级ID
  const classIds = await getClassIdsBySchoolId(schoolId);
  if (classIds.length === 0) {
    return [];
  }

  // 3. 如果需要排除已存在的题目，获取已存在的题目ID
  let excludeQuestionIds;
  if (excludeExisting) {
    excludeQuestionIds = await getExistingFrequentMistakeQuestionIds(schoolId);
  }

  // 4. 根据错误归因统计每个题目的错误次数
  const mistakeStats = await getMistakeStatsByMistakePoint(classIds, mistakePointId, startTime, endTime, excludeQuestionIds);
  if (mistakeStats.length === 0) {
    return [];
  }

  // 5. 获取题目详情
  const questionIds = mistakeStats.map(stat => stat.questionId);
  const questions = await getQuestionsByIds(questionIds);

  // 6. 组装数据
  const questionMap = new Map(questions.map(q => [q._id, q]));
  const result = [];
  for (const stat of mistakeStats) {
    const question = questionMap.get(stat.questionId);
    if (!question) {
      continue;
    }
    result.push({
      questionId: stat.questionId,
      mistakeCount: stat.mistakeCount,
      question: {
        _id: question._id,
        questionType: question.questionType,
        knowledgePoints: question.knowledgePoints,
        difficulty: question.difficulty,
        imageUrl: question.imageUrl,
        imageHeight: question.imageHeight,
        imageWidth: question.imageWidth,
        easyToMistakeDetail: question.easyToMistakeDetail
      },
      selected: false
    });
  }
  return result;
}


export async function createFrequentMistakePack(params) {
  try {
    // 1. 获取当前校园ID
    const schoolId = await getCurrentSchoolId();

    // 2. 确定生成方式
    const generationType = params.knowledgePoint ? "知识点" : "错误归因";

    // 3. 创建高频错题集文档
    const frequentMistakeId = await createFrequentMistake({
      schoolId,
      subject: params.subject,
      name: params.name,
      description: params.description,
      questionIds: params.questionIds,
      timeRange: params.timeRangeText,
      knowledgePoints: params.knowledgePoint ? [params.knowledgePoint] : [],
      mistakePoints: params.mistakePointName ? [params.mistakePointName] : [],
      generationType
    });
    return {
      success: true,
      frequentMistakeId
    };
  } catch (error) {
    console.error("创建高频错题集失败:", error);
    return {
      success: false,
      error: error.message || "创建失败"
    };
  }
}
