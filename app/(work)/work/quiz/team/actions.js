"use server";

import { getCurrentSchoolFromJWT } from "../../../../../lib/work/teacher/mySchool.js";
import { getQuizTeams, getQuizTeamsCount, getQuizzesForFilter, getTeamsStats } from "./datas.js";

/**
 * 获取队伍列表
 */
export async function getTeamsAction({
  pageNum = 0,
  pageSize = 20,
  keyword = "",
  quizId = "all"
} = {}) {
  try {
    const school = await getCurrentSchoolFromJWT();
    if (!school) {
      return [];
    }
    return await getQuizTeams({
      pageNum,
      pageSize,
      keyword,
      quizId,
      schoolId: school._id
    });
  } catch (error) {
    console.error("获取队伍列表失败:", error);
    return [];
  }
}

/**
 * 获取队伍总数
 */
export async function getTeamsCountAction({
  keyword = "",
  quizId = "all"
} = {}) {
  try {
    const school = await getCurrentSchoolFromJWT();
    if (!school) {
      return 0;
    }
    return await getQuizTeamsCount({
      keyword,
      quizId,
      schoolId: school._id
    });
  } catch (error) {
    console.error("获取队伍总数失败:", error);
    return 0;
  }
}

/**
 * 获取口述核心知识点列表（用于筛选）
 */
export async function getQuizzesForFilterAction() {
  try {
    const school = await getCurrentSchoolFromJWT();
    if (!school) {
      return [];
    }
    return await getQuizzesForFilter({
      schoolId: school._id
    });
  } catch (error) {
    console.error("获取口述核心知识点列表失败:", error);
    return [];
  }
}

/**
 * 获取队伍成员统计信息
 */
export async function getTeamsStatsAction(teamIds) {
  try {
    const school = await getCurrentSchoolFromJWT();
    if (!school) {
      return {};
    }
    return await getTeamsStats({
      teamIds,
      schoolId: school._id
    });
  } catch (error) {
    console.error("获取队伍统计信息失败:", error);
    return {};
  }
}
