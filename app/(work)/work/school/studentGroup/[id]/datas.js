"use server";

import { allDocs, command, count, getOne } from "../../../../../../lib/common/database.js";
import { getCurrentSchoolId } from "../../../../../../lib/work/teacher/mySchool.js";
/**
 * 获取单个学生在指定班级的错题统计数据
 */
async function getStudentMistakeStats(studentId, classId, filter) {
  const _ = command();

  // 查询该学生在指定班级的所有答卷（不使用时间过滤）
  const studentAnswers = await allDocs({
    c: "student_answer",
    match: {
      studentId: studentId,
      classId: classId
    }
  });
  if (studentAnswers.length === 0) {
    return {
      totalMistakes: 0,
      correctedCount: 0,
      uncorrectedCount: 0,
      correctionRate: 0
    };
  }

  // 获取所有答卷ID
  const studentAnswerIds = studentAnswers.map(sa => {
    const answer = sa;
    return answer._id;
  });

  // 构建基础查询条件
  let baseQuery = {
    studentAnswerId: _.in(studentAnswerIds)
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
        studentAnswerId: _.in(studentAnswerIds)
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

  // 计算通过率
  const correctionRate = totalMistakes > 0 ? correctedCount / totalMistakes * 100 : 0;
  return {
    totalMistakes,
    correctedCount,
    uncorrectedCount,
    correctionRate
  };
}

/**
 * 获取学生分组统计数据
 */
export async function getStudentGroupStatistics(studentGroupId, filter) {
  const currentSchoolId = await getCurrentSchoolId();

  // 获取学生分组信息
  const studentGroup = await getOne("student_group", {
    _id: studentGroupId,
    schoolId: currentSchoolId
  });
  if (!studentGroup) {
    throw new Error("学生分组不存在或无权限查看");
  }
  const group = studentGroup;

  // 如果分组中没有学生，直接返回空统计
  if (!group.students || group.students.length === 0) {
    return {
      studentGroup: group,
      teamStats: {
        totalMistakes: 0,
        totalCorrected: 0,
        totalUncorrected: 0,
        correctionRate: 0
      },
      studentStats: []
    };
  }

  // 为每个学生单独查询其在指定班级的统计数据
  const studentStats = await Promise.all(group.students.map(async student => {
    const stats = await getStudentMistakeStats(student.studentId, student.classId, filter);
    return {
      studentId: student.studentId,
      studentName: student.name,
      className: student.className,
      totalMistakes: stats.totalMistakes,
      correctedCount: stats.correctedCount,
      uncorrectedCount: stats.uncorrectedCount,
      correctionRate: stats.correctionRate
    };
  }));

  // 计算团队总统计
  const teamStats = studentStats.reduce((total, student) => ({
    totalMistakes: total.totalMistakes + student.totalMistakes,
    totalCorrected: total.totalCorrected + student.correctedCount,
    totalUncorrected: total.totalUncorrected + student.uncorrectedCount,
    correctionRate: 0 // 先设为0，后面计算
  }), {
    totalMistakes: 0,
    totalCorrected: 0,
    totalUncorrected: 0,
    correctionRate: 0
  });

  // 计算团队通过率
  teamStats.correctionRate = teamStats.totalMistakes > 0 ? teamStats.totalCorrected / teamStats.totalMistakes * 100 : 0;
  return {
    studentGroup: group,
    teamStats,
    studentStats
  };
}
