"use server";

import { DISPLAY_TEXT } from "../../../../../../lib/config/constants.js";
import { getCurrentSchoolId } from "../../../../../../lib/work/teacher/mySchool.js";
import { deleteProblemSessionFromDB, deleteProblemSessionMessagesFromDB, getAIQuestionLogs, getAIQuestionLogsCount, getProblemSessionFromDB } from "./datas.js";
export async function getAIQuestionLogsAction(params) {
  const schoolId = await getCurrentSchoolId();
  if (!schoolId) {
    throw new Error("未找到当前学校信息");
  }
  return await getAIQuestionLogs(schoolId, params);
}
export async function getAIQuestionLogsCountAction(params) {
  const schoolId = await getCurrentSchoolId();
  if (!schoolId) {
    throw new Error("未找到当前学校信息");
  }
  return await getAIQuestionLogsCount(schoolId, params);
}
export async function deleteAIQuestionLogAction(sessionId) {
  try {
    const schoolId = await getCurrentSchoolId();
    if (!schoolId) {
      throw new Error("未找到当前学校信息");
    }

    // 1. 获取ProblemSessionDoc信息
    const problemSessions = await getProblemSessionFromDB(sessionId);
    if (problemSessions.length === 0) {
      return {
        success: false,
        message: `未找到对应的${DISPLAY_TEXT.SELF_UPLOAD_MISTAKE}会话`
      };
    }

    // 2. 删除相关的AI对话消息
    await deleteProblemSessionMessagesFromDB(sessionId);

    // 3. 删除自主上传错题会话
    await deleteProblemSessionFromDB(sessionId);
    return {
      success: true,
      message: `删除成功，${DISPLAY_TEXT.SELF_UPLOAD_MISTAKE}会话及相关消息已删除`
    };
  } catch (error) {
    console.error(`删除${DISPLAY_TEXT.SELF_UPLOAD_MISTAKE}记录失败:`, error);
    return {
      success: false,
      message: "删除失败，请重试"
    };
  }
}
