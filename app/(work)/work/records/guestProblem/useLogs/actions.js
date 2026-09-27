"use server";

import { DISPLAY_TEXT } from "../../../../../../lib/config/constants.js";
import { deleteGuestProblemSessionFromDB, deleteGuestProblemSessionMessagesFromDB, getGuestAIQuestionLogs, getGuestAIQuestionLogsCount, getGuestProblemSessionFromDB } from "./datas.js";
export async function getGuestAIQuestionLogsAction(params) {
  return await getGuestAIQuestionLogs(params);
}
export async function getGuestAIQuestionLogsCountAction(params) {
  return await getGuestAIQuestionLogsCount(params);
}
export async function deleteGuestAIQuestionLogAction(sessionId) {
  try {
    // 1. 获取GuestProblemSessionDoc信息
    const guestProblemSessions = await getGuestProblemSessionFromDB(sessionId);
    if (guestProblemSessions.length === 0) {
      return {
        success: false,
        message: `未找到对应的${DISPLAY_TEXT.SELF_UPLOAD_MISTAKE}会话`
      };
    }

    // 2. 删除相关的AI对话消息
    await deleteGuestProblemSessionMessagesFromDB(sessionId);

    // 3. 删除自主上传错题会话
    await deleteGuestProblemSessionFromDB(sessionId);
    return {
      success: true,
      message: `删除成功，${DISPLAY_TEXT.SELF_UPLOAD_MISTAKE}会话及相关消息已删除`
    };
  } catch (error) {
    console.error(`删除非登录用户${DISPLAY_TEXT.SELF_UPLOAD_MISTAKE}记录失败:`, error);
    return {
      success: false,
      message: "删除失败，请重试"
    };
  }
}
