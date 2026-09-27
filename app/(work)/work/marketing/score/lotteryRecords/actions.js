"use server";

import { getLotteryRecordById, getLotteryRecords, getLotteryRecordsCount, processLotteryRecord, updateLotteryRecordRemark } from "./datas.js";

/**
 * 获取积分抽奖记录列表
 */
export async function getLotteryRecordsAction({
  schoolId,
  pageNum = 0,
  pageSize = 20,
  searchText = "",
  redeemStatus = "all",
  isPublicFilter = "all",
  targetStudentId = null
}) {
  try {
    // 不允许schoolId为空
    if (!schoolId) {
      throw new Error("schoolId 不能为空");
    }

    // 获取积分抽奖记录列表
    const records = await getLotteryRecords({
      schoolId,
      pageNum,
      pageSize,
      searchText,
      redeemStatus,
      isPublicFilter,
      targetStudentId
    });

    // 获取总数
    const totalCount = await getLotteryRecordsCount({
      schoolId,
      searchText,
      redeemStatus,
      isPublicFilter,
      targetStudentId
    });
    return {
      success: true,
      data: records,
      totalCount
    };
  } catch (error) {
    console.error("获取积分抽奖记录列表失败:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "获取积分抽奖记录列表失败",
      data: [],
      totalCount: 0
    };
  }
}

/**
 * 获取单个积分抽奖记录详情
 */
export async function getLotteryRecordByIdAction(lotteryId) {
  try {
    const lotteryRecord = await getLotteryRecordById(lotteryId);
    if (!lotteryRecord) {
      return {
        success: false,
        error: "抽奖记录不存在",
        lotteryRecord: null
      };
    }
    return {
      success: true,
      lotteryRecord
    };
  } catch (error) {
    console.error("获取积分抽奖记录详情失败:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "获取积分抽奖记录详情失败",
      lotteryRecord: null
    };
  }
}

/**
 * 处理积分抽奖记录
 */
export async function processLotteryRecordAction({
  lotteryId,
  newStatus,
  teacherRemark,
  isPublic
}) {
  try {
    const result = await processLotteryRecord({
      lotteryId,
      newStatus,
      teacherRemark,
      isPublic
    });
    return result;
  } catch (error) {
    console.error("处理积分抽奖记录失败:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "处理积分抽奖记录失败"
    };
  }
}

/**
 * 更新抽奖记录老师备注和公示状态
 */
export async function updateLotteryRecordRemarkAction({
  lotteryId,
  teacherRemark,
  isPublic
}) {
  try {
    const result = await updateLotteryRecordRemark({
      lotteryId,
      teacherRemark,
      isPublic
    });
    return result;
  } catch (error) {
    console.error("更新抽奖记录老师备注失败:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "更新老师备注失败"
    };
  }
}
