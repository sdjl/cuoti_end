"use server";

import { allDocs, command, count } from "../../../../../../lib/common/database.js";
import { getCurrentSchoolId } from "../../../../../../lib/work/teacher/mySchool.js";
/**
 * 批量获取多个学生的积分增长记录（原始数据）
 */
export async function getStudentsScoreGrowthRecords(studentIds, scoreTypes, filter) {
  const _ = command();

  // 如果没有学生ID，返回空数组
  if (studentIds.length === 0) {
    return [];
  }

  // 构建查询条件
  const match = {
    studentId: _.in(studentIds),
    type: _.in(scoreTypes)
  };

  // 添加时间过滤条件（基于created字段）
  if (filter && filter.timeRange !== "all") {
    if (filter.startDate && filter.endDate) {
      // 转换为时间戳（毫秒）
      const startTimestamp = filter.startDate.getTime();
      const endTimestamp = filter.endDate.getTime() + 24 * 60 * 60 * 1000 - 1; // 结束日期的23:59:59

      match.created = _.gte(startTimestamp).and(_.lte(endTimestamp));
    }
  }

  // 批量查询学生的积分增长记录
  const growthRecords = await allDocs({
    c: "student_growth",
    match: match
  });
  return growthRecords;
}

/**
 * 批量获取多个学生在指定班级的答卷ID
 */
export async function getStudentAnswerIds(studentClassPairs) {
  const _ = command();
  if (studentClassPairs.length === 0) {
    return {};
  }

  // 构建查询条件：学生ID和班级ID的组合
  const orConditions = studentClassPairs.map(pair => ({
    studentId: pair.studentId,
    classId: pair.classId
  }));

  // 查询所有答卷
  const studentAnswers = await allDocs({
    c: "student_answer",
    match: _.or(orConditions)
  });

  // 按学生ID分组答卷ID
  const result = {};
  for (const answer of studentAnswers) {
    const sa = answer;
    if (!result[sa.studentId]) {
      result[sa.studentId] = [];
    }
    result[sa.studentId].push(sa._id);
  }
  return result;
}

/**
 * 批量统计错题数据（基于答卷ID列表）
 */
export async function countMistakeStats(answerIds, filter) {
  const _ = command();
  if (answerIds.length === 0) {
    return {
      totalMistakes: 0,
      correctedCount: 0,
      uncorrectedCount: 0
    };
  }

  // 构建基础查询条件
  let baseQuery = {
    studentAnswerId: _.in(answerIds)
  };

  // 添加时间过滤条件（基于mistakeMasteredTime字段）
  if (filter && filter.timeRange !== "all") {
    if (filter.startDate && filter.endDate) {
      // 转换为时间戳（毫秒）
      const startTimestamp = filter.startDate.getTime();
      const endTimestamp = filter.endDate.getTime() + 24 * 60 * 60 * 1000 - 1; // 结束日期的23:59:59

      const timeCondition = {
        mistakeMasteredTime: _.gte(startTimestamp).and(_.lte(endTimestamp))
      };
      baseQuery = _.and([{
        studentAnswerId: _.in(answerIds)
      }, timeCondition]);
    }
  }

  // 查询错题总数
  const totalMistakes = await count("student_answer_item", baseQuery);

  // 查询通过的错题数量（isCorrectedByMistakeAgain=true）
  const correctedQuery = _.and([baseQuery, {
    isCorrectedByMistakeAgain: true
  }]);
  const correctedCount = await count("student_answer_item", correctedQuery);

  // 查询未通过的错题数量（isCorrectedByMistakeAgain!=true）
  const uncorrectedQuery = _.and([baseQuery, {
    isCorrectedByMistakeAgain: _.neq(true)
  }]);
  const uncorrectedCount = await count("student_answer_item", uncorrectedQuery);
  return {
    totalMistakes,
    correctedCount,
    uncorrectedCount
  };
}

/**
 * 获取当前学校的所有学生分组
 */
export async function getAllStudentGroups() {
  const currentSchoolId = await getCurrentSchoolId();

  // 获取当前学校的所有学生分组
  const groups = await allDocs({
    c: "student_group",
    match: {
      schoolId: currentSchoolId
    },
    sort: {
      created: -1
    }
  });
  return groups;
}
