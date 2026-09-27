"use server";

import { getStudentGroupStatistics } from "./datas.js";

/**
 * 获取学生分组统计数据
 */
export async function getStudentGroupStatisticsAction(studentGroupId, filter) {
  try {
    if (!studentGroupId.trim()) {
      return {
        success: false,
        error: "学生分组ID不能为空"
      };
    }
    const data = await getStudentGroupStatistics(studentGroupId, filter);
    return {
      success: true,
      data
    };
  } catch (error) {
    console.error("获取学生分组统计失败:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "获取统计数据失败"
    };
  }
}
