import { count } from "../../../../lib/common/database.js";

/**
 * 获取待处理的积分兑换数量
 */
export async function getPendingPointsExchangeCount() {
  try {
    // 统计积分兑换中待处理的数量
    return await count("points_exchange", {
      status: "pending"
    });
  } catch (error) {
    console.error("获取待处理积分兑换数量失败:", error);
    return 0;
  }
}

/**
 * 获取待处理的抽奖中奖数量
 */
export async function getPendingLotteryWinCount() {
  try {
    // 统计抽奖记录中中奖但未兑现的数量
    return await count("lottery_record", {
      isWin: true,
      redeemStatus: "pending"
    });
  } catch (error) {
    console.error("获取待处理抽奖中奖数量失败:", error);
    return 0;
  }
}

/**
 * 获取待处理的荣誉申请数量
 */
export async function getPendingHonorApplicationCount() {
  try {
    // 统计荣誉申请中待处理的数量
    return await count("honor_application", {
      status: "pending"
    });
  } catch (error) {
    console.error("获取待处理荣誉申请数量失败:", error);
    return 0;
  }
}

/**
 * 获取需要老师联系的新生数量
 */
export async function getGuestStudentsNeedContactCount() {
  try {
    // 统计 guest_student_info 集合中尚未被老师联系的新生数量
    return await count("guest_student_info", {
      isContactedByTeacher: false
    });
  } catch (error) {
    console.error("获取需要联系的新生数量失败:", error);
    return 0;
  }
}
