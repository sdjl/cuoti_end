"use server";

import { getSchoolHonorRecordsFromDB } from "./datas.js";

/**
 * 获取全校荣誉记录
 */
export async function getSchoolHonorRecordsAction(schoolId) {
  try {
    if (!schoolId) {
      return {
        success: false,
        data: [],
        error: "校园ID不能为空"
      };
    }
    const data = await getSchoolHonorRecordsFromDB(schoolId);
    return {
      success: true,
      data
    };
  } catch (error) {
    console.error("获取全校荣誉记录失败:", error);
    return {
      success: false,
      data: [],
      error: error instanceof Error ? error.message : "获取全校荣誉记录失败"
    };
  }
}
