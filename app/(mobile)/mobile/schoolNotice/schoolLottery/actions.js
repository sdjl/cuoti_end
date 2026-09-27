"use server";

import { getSchoolLotteryRecordsFromDB } from "./datas.js";

/**
 * 获取全校中奖记录
 */
export async function getSchoolLotteryRecordsAction(schoolId) {
  try {
    if (!schoolId) {
      return {
        success: false,
        data: [],
        error: "校园ID不能为空"
      };
    }
    const data = await getSchoolLotteryRecordsFromDB(schoolId);
    return {
      success: true,
      data
    };
  } catch (error) {
    console.error("获取全校中奖记录失败:", error);
    return {
      success: false,
      data: [],
      error: error instanceof Error ? error.message : "获取全校中奖记录失败"
    };
  }
}
