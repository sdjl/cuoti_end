"use server";

import { getInvitationUsageRecords, getInvitationUsageRecordsCount } from "./datas.js";

/**
 * 获取邀请使用记录列表
 */
export async function getInvitationUsageRecordsAction({
  schoolId,
  pageNum = 0,
  pageSize = 20,
  searchText = "",
  type = "all"
}) {
  try {
    // 获取使用记录列表
    const records = await getInvitationUsageRecords({
      schoolId,
      pageNum,
      pageSize,
      searchText,
      type
    });

    // 获取总数
    const totalCount = await getInvitationUsageRecordsCount({
      schoolId,
      searchText,
      type
    });
    return {
      success: true,
      data: records,
      totalCount
    };
  } catch (error) {
    console.error("获取邀请使用记录列表失败:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "获取邀请使用记录列表失败",
      data: [],
      totalCount: 0
    };
  }
}
