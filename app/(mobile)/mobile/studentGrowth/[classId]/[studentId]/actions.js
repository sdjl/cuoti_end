"use server";

import { getStudentGrowthRecordsData, getStudentInfoData } from "./datas.js";

/**
 * 获取学生信息
 */
export async function getStudentInfo(studentId, classId) {
  try {
    return await getStudentInfoData(studentId, classId);
  } catch (error) {
    console.error("获取学生信息失败:", error);
    return null;
  }
}

/**
 * 获取学生成长记录（分页）
 */
export async function getStudentGrowthRecords(studentId, classId, page = 1, limit = 50, startDate, endDate) {
  try {
    return await getStudentGrowthRecordsData(studentId, classId, page, limit, startDate, endDate);
  } catch (error) {
    console.error("获取学生成长记录失败:", error);
    return {
      records: [],
      hasMore: false,
      totalCount: 0,
      totalScore: 0
    };
  }
}
