"use server";

import { SCORE_TYPES } from "./constants.js";
import { countMistakeStats, getAllStudentGroups, getStudentAnswerIds, getStudentsScoreGrowthRecords } from "./datas.js";

/**
 * 获取学生分组对比统计数据
 */
export async function getGroupComparisonStatisticsAction(filter) {
  try {
    // 1. 获取所有学生分组
    const groups = await getAllStudentGroups();

    // 如果没有分组，返回空统计
    if (groups.length === 0) {
      return {
        success: true,
        data: {
          totalStats: {
            groupCount: 0,
            totalStudents: 0,
            totalMistakes: 0,
            totalCorrected: 0,
            totalUncorrected: 0,
            averageCorrectionRate: 0,
            totalScoreIncrease: 0,
            averageScorePerStudent: 0
          },
          groupStats: []
        }
      };
    }

    // 2. 收集所有学生ID和学生-班级对应关系
    const allStudentIds = [];
    const studentClassPairs = [];
    for (const group of groups) {
      if (group.students && group.students.length > 0) {
        for (const student of group.students) {
          allStudentIds.push(student.studentId);
          studentClassPairs.push({
            studentId: student.studentId,
            classId: student.classId
          });
        }
      }
    }

    // 3. 批量查询数据
    const [answerIdsMap, growthRecords] = await Promise.all([
    // 批量获取所有学生的答卷ID
    getStudentAnswerIds(studentClassPairs),
    // 批量获取所有学生的积分增长记录
    getStudentsScoreGrowthRecords(allStudentIds, SCORE_TYPES, filter)]);

    // 4. 按学生ID分组积分记录
    const scoreByStudent = {};
    for (const record of growthRecords) {
      const scoreChange = record.score.score;
      // 只统计正数（积分增加）
      if (scoreChange > 0) {
        if (!scoreByStudent[record.studentId]) {
          scoreByStudent[record.studentId] = 0;
        }
        scoreByStudent[record.studentId] += scoreChange;
      }
    }

    // 5. 为每个分组计算统计数据
    const groupStats = await Promise.all(groups.map(async group => {
      // 如果分组没有学生，返回空统计
      if (!group.students || group.students.length === 0) {
        return {
          groupId: group._id,
          groupName: group.name,
          teacherName: group.teacherName,
          studentCount: 0,
          totalMistakes: 0,
          correctedCount: 0,
          uncorrectedCount: 0,
          correctionRate: 0,
          totalScoreIncrease: 0,
          averageScorePerStudent: 0
        };
      }

      // 收集该分组所有学生的答卷ID
      const groupAnswerIds = [];
      for (const student of group.students) {
        const studentAnswerIds = answerIdsMap[student.studentId] || [];
        groupAnswerIds.push(...studentAnswerIds);
      }

      // 统计该分组的错题数据
      const mistakeStats = await countMistakeStats(groupAnswerIds, filter);

      // 计算该分组的积分总增量
      let totalScoreIncrease = 0;
      for (const student of group.students) {
        totalScoreIncrease += scoreByStudent[student.studentId] || 0;
      }

      // 计算通过率
      const correctionRate = mistakeStats.totalMistakes > 0 ? mistakeStats.correctedCount / mistakeStats.totalMistakes * 100 : 0;

      // 计算平均每人积分增量
      const averageScorePerStudent = group.students.length > 0 ? totalScoreIncrease / group.students.length : 0;
      return {
        groupId: group._id,
        groupName: group.name,
        teacherName: group.teacherName,
        studentCount: group.students.length,
        totalMistakes: mistakeStats.totalMistakes,
        correctedCount: mistakeStats.correctedCount,
        uncorrectedCount: mistakeStats.uncorrectedCount,
        correctionRate,
        totalScoreIncrease,
        averageScorePerStudent
      };
    }));

    // 6. 计算总统计
    const totalStudents = groupStats.reduce((sum, group) => sum + group.studentCount, 0);
    const totalMistakes = groupStats.reduce((sum, group) => sum + group.totalMistakes, 0);
    const totalCorrected = groupStats.reduce((sum, group) => sum + group.correctedCount, 0);
    const totalUncorrected = groupStats.reduce((sum, group) => sum + group.uncorrectedCount, 0);
    const totalScoreIncrease = groupStats.reduce((sum, group) => sum + group.totalScoreIncrease, 0);

    // 计算平均通过率（基于所有分组的通过率平均值）
    const validGroupsWithMistakes = groupStats.filter(g => g.totalMistakes > 0);
    const averageCorrectionRate = validGroupsWithMistakes.length > 0 ? validGroupsWithMistakes.reduce((sum, group) => sum + group.correctionRate, 0) / validGroupsWithMistakes.length : 0;

    // 计算平均每人积分增量
    const averageScorePerStudent = totalStudents > 0 ? totalScoreIncrease / totalStudents : 0;
    return {
      success: true,
      data: {
        totalStats: {
          groupCount: groups.length,
          totalStudents,
          totalMistakes,
          totalCorrected,
          totalUncorrected,
          averageCorrectionRate,
          totalScoreIncrease,
          averageScorePerStudent
        },
        groupStats
      }
    };
  } catch (error) {
    console.error("获取学生分组对比统计失败:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "获取统计数据失败"
    };
  }
}
