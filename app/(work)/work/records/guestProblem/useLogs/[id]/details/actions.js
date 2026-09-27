"use server";

import { DISPLAY_TEXT } from "../../../../../../../../lib/config/constants.js";
import { getGuestAIQuestionDetails } from "./datas.js";
export async function getGuestAIQuestionDetailsAction(guestProblemQuestionId) {
  try {
    const details = await getGuestAIQuestionDetails(guestProblemQuestionId);
    return {
      success: true,
      data: details
    };
  } catch (error) {
    console.error(`获取非登录用户${DISPLAY_TEXT.SELF_UPLOAD_MISTAKE}详情失败:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "获取详情失败"
    };
  }
}
