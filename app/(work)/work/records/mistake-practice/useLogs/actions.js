"use server";

import { deleteFile } from "../../../../../../lib/common/file.js";
import { DISPLAY_TEXT } from "../../../../../../lib/config/constants.js";
import { getCurrentSchoolId } from "../../../../../../lib/work/teacher/mySchool.js";
import { deleteAIChatMessagesFromDB, deleteAIChatSessionFromDB, getAIChatMessagesFromDB, getAIChatSessionFromDB, getMistakePracticeLogs, getMistakePracticeLogsCount, getStudentAnswerItemFromDB, updateStudentAnswerItemRemoveFieldsFromDB } from "./datas.js";
export async function getMistakePracticeLogsAction(params) {
  const schoolId = await getCurrentSchoolId();
  if (!schoolId) {
    throw new Error("未找到当前学校信息");
  }
  return await getMistakePracticeLogs(schoolId, params);
}
export async function getMistakePracticeLogsCountAction(params) {
  const schoolId = await getCurrentSchoolId();
  if (!schoolId) {
    throw new Error("未找到当前学校信息");
  }
  return await getMistakePracticeLogsCount(schoolId, params);
}
export async function deleteMistakePracticeLogAction(studentAnswerItemId) {
  try {
    const schoolId = await getCurrentSchoolId();
    if (!schoolId) {
      throw new Error("未找到当前学校信息");
    }

    // 1. 获取StudentAnswerItemDoc信息
    const studentAnswerItems = await getStudentAnswerItemFromDB(studentAnswerItemId);
    if (studentAnswerItems.length === 0) {
      return {
        success: false,
        message: "未找到对应的错题记录"
      };
    }
    const studentAnswerItem = studentAnswerItems[0];

    // 2. 删除相关的AI聊天会话和消息
    if (studentAnswerItem.aiChatSessionId) {
      // 获取AI聊天会话，用于获取重做图片文件ID
      const aiChatSessions = await getAIChatSessionFromDB(studentAnswerItem.aiChatSessionId);

      // 获取AI聊天消息，特别是包含图片的消息
      const chatMessages = await getAIChatMessagesFromDB(studentAnswerItem.aiChatSessionId);

      // 收集需要删除的文件ID
      const fileIdsToDelete = [];

      // 添加聊天消息中的图片文件ID
      for (const message of chatMessages) {
        const msg = message;
        if (msg.image?.fileId) {
          fileIdsToDelete.push(msg.image.fileId);
        }
      }

      // 添加重做图片文件ID（如果存在）
      if (aiChatSessions.length > 0) {
        const aiChatSession = aiChatSessions[0];
        if (aiChatSession.redoImageFileID) {
          fileIdsToDelete.push(aiChatSession.redoImageFileID);
        }
      }

      // 删除图片文件
      if (fileIdsToDelete.length > 0) {
        try {
          await deleteFile(fileIdsToDelete);
        } catch (error) {
          console.error(`删除${DISPLAY_TEXT.COURSE_MISTAKE}聊天消息和重做图片失败:`, error);
          // 继续执行，不因为文件删除失败而中断整个流程
        }
      }

      // 删除聊天消息
      await deleteAIChatMessagesFromDB(studentAnswerItem.aiChatSessionId);

      // 删除聊天会话
      await deleteAIChatSessionFromDB(studentAnswerItem.aiChatSessionId);
    }

    // 3. 更新StudentAnswerItemDoc，删除相关字段
    await updateStudentAnswerItemRemoveFieldsFromDB(studentAnswerItemId);
    return {
      success: true,
      message: `删除成功，小程序端将要求学生重新进行${DISPLAY_TEXT.COURSE_MISTAKE}`
    };
  } catch (error) {
    console.error(`删除${DISPLAY_TEXT.COURSE_MISTAKE}记录失败:`, error);
    return {
      success: false,
      message: "删除失败，请重试"
    };
  }
}
