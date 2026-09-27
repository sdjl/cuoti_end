"use server";

import { allDocs, command } from "../../../../../lib/common/database.js";

/** 排行榜学生数据类型 */


async function getGradeStudentIds(schoolId, grade) {
  // 1. 获取该校园该年级的所有班级
  const classRooms = await allDocs({
    c: "classroom",
    match: {
      schoolId,
      grade,
      status: "正常"
    },
    project: {
      _id: 1
    }
  });
  if (classRooms.length === 0) {
    return [];
  }
  const classRoomIds = classRooms.map(c => c._id);
  const _ = command();

  // 2. 获取所有在读的学生
  const studentClassList = await allDocs({
    c: "student_class",
    match: {
      classRoomId: _.in(classRoomIds),
      status: "在读"
    },
    project: {
      studentId: 1
    }
  });
  if (studentClassList.length === 0) {
    return [];
  }
  return studentClassList.map(sc => sc.studentId);
}


export async function getBothScoreRankingsFromDB(schoolId, grade, studentId, limit = 50) {
  // 1. 获取年级的所有在读学生ID（只查询一次）
  const studentIds = await getGradeStudentIds(schoolId, grade);
  if (studentIds.length === 0) {
    return {
      totalRanking: [],
      monthlyRanking: [],
      totalStudentRank: null,
      monthlyStudentRank: null
    };
  }
  const _ = command();

  // 2. 获取学生信息和积分（只查询一次）
  const students = await allDocs({
    c: "student",
    match: {
      _id: _.in(studentIds)
    },
    project: {
      _id: 1,
      name: 1,
      growthData: 1
    }
  });

  // 3. 计算本月的时间范围
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startTimestamp = startOfMonth.getTime();

  // 4. 获取本月的积分增加记录（只查询一次）
  const growthRecords = await allDocs({
    c: "student_growth",
    match: {
      schoolId,
      studentId: _.in(studentIds),
      created: _.gte(startTimestamp)
    },
    project: {
      studentId: 1,
      score: 1
    }
  });

  // 5. 按学生ID汇总本月新增积分（只计算积分变化 > 0 的记录）
  const studentMonthlyScoreMap = new Map();
  growthRecords.forEach(record => {
    const growthDoc = record;
    const scoreChange = growthDoc.score?.score || 0;
    if (scoreChange > 0) {
      const currentScore = studentMonthlyScoreMap.get(growthDoc.studentId) || 0;
      studentMonthlyScoreMap.set(growthDoc.studentId, currentScore + scoreChange);
    }
  });

  // 6. 构建总积分排行榜数据（前N名）
  const totalRankingData = students.map(student => {
    const studentDoc = student;
    return {
      studentId: studentDoc._id,
      studentName: studentDoc.name,
      score: studentDoc.growthData?.score || 0,
      rank: 0
    };
  }).sort((a, b) => b.score - a.score).slice(0, limit);
  totalRankingData.forEach((item, index) => {
    item.rank = index + 1;
  });

  // 7. 构建本月新增积分排行榜数据（前N名）
  const monthlyRankingData = students.map(student => {
    const studentDoc = student;
    const monthlyScore = studentMonthlyScoreMap.get(studentDoc._id) || 0;
    return {
      studentId: studentDoc._id,
      studentName: studentDoc.name,
      score: monthlyScore,
      rank: 0
    };
  }).filter(item => item.score > 0) // 只保留有积分的学生
  .sort((a, b) => b.score - a.score).slice(0, limit);
  monthlyRankingData.forEach((item, index) => {
    item.rank = index + 1;
  });

  // 8. 查找当前学生在排行榜中的位置（如果学生ID存在）
  let totalStudentRank = null;
  let monthlyStudentRank = null;
  if (studentId) {
    // 在前N名中查找
    totalStudentRank = totalRankingData.find(s => s.studentId === studentId) || null;
    monthlyStudentRank = monthlyRankingData.find(s => s.studentId === studentId) || null;
  }
  return {
    totalRanking: totalRankingData,
    monthlyRanking: monthlyRankingData,
    totalStudentRank,
    monthlyStudentRank
  };
}
