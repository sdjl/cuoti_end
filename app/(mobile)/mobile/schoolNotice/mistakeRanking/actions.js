"use server";

import { DISPLAY_TEXT } from "../../../../../lib/config/constants.js";
import { getMistakeRankingData } from "./datas.js";

/**
 * 获取年级课程错题排行榜数据
 */
export async function getMistakeRankingAction(schoolId, grade, timeRange = "month") {
  try {
    if (!schoolId) {
      return {
        success: false,
        error: "校园ID不能为空"
      };
    }
    if (!grade) {
      return {
        success: false,
        error: "年级不能为空"
      };
    }
    const data = await getMistakeRankingData(schoolId, grade, timeRange);
    return {
      success: true,
      data
    };
  } catch (error) {
    console.error(`获取年级${DISPLAY_TEXT.COURSE_MISTAKE}排行榜失败:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "获取排行榜数据失败"
    };
  }
}

/**
 * 获取学生排名信息
 */
export async function getStudentRankAction(schoolId, grade, studentId, timeRange = "month") {
  try {
    if (!schoolId) {
      return {
        success: false,
        error: "校园ID不能为空"
      };
    }
    if (!grade) {
      return {
        success: false,
        error: "年级不能为空"
      };
    }
    if (!studentId) {
      return {
        success: false,
        error: "学生ID不能为空"
      };
    }

    // 注意：这个函数现在已经不推荐使用，建议使用 getMistakeRankingWithStudentAction
    const rankingData = await getMistakeRankingData(schoolId, grade, timeRange);
    const data = rankingData.find(item => item.studentId === studentId) || null;
    return {
      success: true,
      data
    };
  } catch (error) {
    console.error("获取学生排名信息失败:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "获取学生排名信息失败"
    };
  }
}

/**
 * 一次性获取排行榜数据和当前学生排名信息
 */
export async function getMistakeRankingWithStudentAction(schoolId, grade, studentId, timeRange = "month") {
  try {
    if (!schoolId) {
      return {
        success: false,
        error: "校园ID不能为空"
      };
    }
    if (!grade) {
      return {
        success: false,
        error: "年级不能为空"
      };
    }

    // 获取排行榜数据
    const rankingData = await getMistakeRankingData(schoolId, grade, timeRange);

    // 从排行榜数据中找到当前学生的排名
    let currentStudentRank = null;
    if (studentId) {
      currentStudentRank = rankingData.find(item => item.studentId === studentId) || null;
    }
    return {
      success: true,
      data: {
        rankingData,
        currentStudentRank
      }
    };
  } catch (error) {
    console.error("获取排行榜和学生排名失败:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "获取排行榜数据失败"
    };
  }
}
