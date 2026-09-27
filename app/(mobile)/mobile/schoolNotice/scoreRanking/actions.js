"use server";

import { getBothScoreRankingsFromDB } from "./datas.js";

export async function getBothScoreRankingsAction(schoolId, grade, studentId) {
  try {
    const result = await getBothScoreRankingsFromDB(schoolId, grade, studentId, 50);
    return {
      success: true,
      data: result
    };
  } catch (error) {
    console.error("Error getting both score rankings:", error);
    return {
      success: false,
      error: "获取排行榜数据失败"
    };
  }
}
