"use server";

import { getGuestStudentsNeedContactCount, getPendingHonorApplicationCount, getPendingLotteryWinCount, getPendingPointsExchangeCount } from "./datas.js";

/**
 * 获取待处理任务统计数据
 */
export async function getPendingTasksStats() {
  try {
    const [pointsExchangeCount, lotteryWinCount, honorApplicationCount, guestContactCount] = await Promise.all([getPendingPointsExchangeCount(), getPendingLotteryWinCount(), getPendingHonorApplicationCount(), getGuestStudentsNeedContactCount()]);
    return {
      pendingPointsExchangeCount: pointsExchangeCount,
      pendingLotteryWinCount: lotteryWinCount,
      pendingHonorApplicationCount: honorApplicationCount,
      guestStudentsNeedContactCount: guestContactCount
    };
  } catch (error) {
    console.error("获取待处理任务数量失败:", error);
    return {
      pendingPointsExchangeCount: 0,
      pendingLotteryWinCount: 0,
      pendingHonorApplicationCount: 0,
      guestStudentsNeedContactCount: 0
    };
  }
}
