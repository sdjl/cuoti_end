"use server";

import { DISPLAY_TEXT } from "../../../../../../lib/config/constants.js";
import { getGuestAIQuestionStatistics, getGuestStudentAIQuestionStatistics } from "./datas.js";
export async function getGuestAIQuestionStatisticsAction(filter) {
  try {
    const result = await getGuestAIQuestionStatistics(filter);
    return {
      success: true,
      data: result
    };
  } catch (error) {
    console.error(`获取非登录用户${DISPLAY_TEXT.SELF_UPLOAD_MISTAKE}统计失败:`, error);
    return {
      success: false,
      error: "获取统计数据失败"
    };
  }
}

/**
 * 获取非登录用户学生自主上传错题统计数据Action
 */
export async function getGuestStudentAIQuestionStatisticsAction(filter) {
  try {
    const statistics = await getGuestStudentAIQuestionStatistics(filter);
    return {
      success: true,
      data: statistics
    };
  } catch (error) {
    console.error(`获取非登录用户学生${DISPLAY_TEXT.SELF_UPLOAD_MISTAKE}统计数据失败:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : `获取非登录用户学生${DISPLAY_TEXT.SELF_UPLOAD_MISTAKE}统计数据失败`
    };
  }
}
