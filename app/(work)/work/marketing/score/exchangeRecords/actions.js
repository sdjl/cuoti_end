"use server";

import { getExchangeRecordById, getExchangeRecords, getExchangeRecordsCount, processExchangeRecord, updateExchangeRecordRemark } from "./datas.js";

/**
 * 获取积分兑换记录列表
 */
export async function getExchangeRecordsAction({
  schoolId,
  pageNum = 0,
  pageSize = 20,
  searchText = "",
  status = "all",
  targetStudentId = null
}) {
  try {
    // 不允许schoolId为空
    if (!schoolId) {
      throw new Error("schoolId 不能为空");
    }

    // 获取积分兑换记录列表
    const records = await getExchangeRecords({
      schoolId,
      pageNum,
      pageSize,
      searchText,
      status,
      targetStudentId
    });

    // 获取总数
    const totalCount = await getExchangeRecordsCount({
      schoolId,
      searchText,
      status,
      targetStudentId
    });
    return {
      success: true,
      data: records,
      totalCount
    };
  } catch (error) {
    console.error("获取积分兑换记录列表失败:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "获取积分兑换记录列表失败",
      data: [],
      totalCount: 0
    };
  }
}

/**
 * 获取单个积分兑换记录详情
 */
export async function getExchangeRecordByIdAction(exchangeId) {
  try {
    const exchangeRecord = await getExchangeRecordById(exchangeId);
    if (!exchangeRecord) {
      return {
        success: false,
        error: "兑换记录不存在",
        exchangeRecord: null
      };
    }
    return {
      success: true,
      exchangeRecord
    };
  } catch (error) {
    console.error("获取积分兑换记录详情失败:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "获取积分兑换记录详情失败",
      exchangeRecord: null
    };
  }
}

/**
 * 处理积分兑换记录
 */
export async function processExchangeRecordAction({
  exchangeId,
  newStatus,
  teacherRemark
}) {
  try {
    const result = await processExchangeRecord({
      exchangeId,
      newStatus,
      teacherRemark
    });
    return result;
  } catch (error) {
    console.error("处理积分兑换记录失败:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "处理积分兑换记录失败"
    };
  }
}

/**
 * 更新兑换记录老师备注
 */
export async function updateExchangeRecordRemarkAction({
  exchangeId,
  teacherRemark
}) {
  try {
    const result = await updateExchangeRecordRemark({
      exchangeId,
      teacherRemark
    });
    return result;
  } catch (error) {
    console.error("更新兑换记录老师备注失败:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "更新老师备注失败"
    };
  }
}
