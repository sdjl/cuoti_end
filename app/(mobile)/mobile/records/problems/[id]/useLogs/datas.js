"use server";

import { allDocs, command, getOne, updateDoc } from "../../../../../../../lib/common/database.js";
import { DISPLAY_TEXT } from "../../../../../../../lib/config/constants.js";
import { getSetting } from "../../../../../../../lib/utils/setting.js";
import { validateStudentPassword } from "../../../../../../../lib/utils/student.js";
/**
 * 读取 自主上传错题 使用记录页面所需数据
 */
export async function getUseLogsData(problemQuestionId) {
  try {
    // 读取自定义题目
    const questionDoc = await getOne("problem_question", {
      _id: problemQuestionId
    });
    if (!questionDoc) {
      return {
        problemQuestion: null,
        chatMessages: [],
        teacherStudentMessages: [],
        problemSession: null
      };
    }
    const problemQuestion = questionDoc;

    // 查找学习会话：系统保证 problem_session 仅有一个，直接按 problemQuestionId 获取
    const targetSession = await getOne("problem_session", {
      problemQuestionId
    });
    let chatMessages = [];
    if (targetSession) {
      const messages = await allDocs({
        c: "problem_session_message",
        match: {
          sessionId: targetSession._id
        },
        sort: {
          created: 1
        }
      });
      chatMessages = messages;
    }
    const teacherStudentMessages = (problemQuestion.teacherStudentMessages || []).slice().sort((a, b) => {
      return a.created - b.created;
    });
    return {
      problemQuestion,
      chatMessages,
      teacherStudentMessages,
      problemSession: targetSession
    };
  } catch (error) {
    console.error(`获取${DISPLAY_TEXT.SELF_UPLOAD_MISTAKE}使用记录数据失败:`, error);
    throw new Error("获取数据失败");
  }
}

/**
 * 验证学生操作密码
 */
export async function validateOperationPassword(studentId, password) {
  return await validateStudentPassword(studentId, password);
}

/**
 * 学生发送消息给老师（写入题目下的师生对话）
 */
export async function sendStudentMessageToDB(data) {
  try {
    const questionDoc = await getOne("problem_question", {
      _id: data.problemQuestionId
    });
    if (!questionDoc) {
      return {
        success: false,
        message: `未找到相关${DISPLAY_TEXT.SELF_UPLOAD_MISTAKE}题目`
      };
    }
    const newMessage = {
      created: Date.now(),
      role: "student",
      content: data.message.trim()
    };
    const _ = command();
    const updated = await updateDoc("problem_question", data.problemQuestionId, {
      teacherStudentMessages: _.push(newMessage),
      isNeedTeacherReply: true
    });
    if (updated) {
      return {
        success: true,
        message: "消息发送成功"
      };
    }
    return {
      success: false,
      message: "消息发送失败"
    };
  } catch (error) {
    console.error("发送学生消息失败:", error);
    return {
      success: false,
      message: "发送失败，请稍后重试"
    };
  }
}

/**
 * 从系统设置读取联系老师二维码 URL
 */
export async function getContactsQrcodeUrlFromSetting() {
  try {
    const res = await getSetting("default_miniprogram");
    const url = res?.default_miniprogram?.contacts?.qrcodeUrl;
    if (typeof url === "string" && url.trim()) return url.trim();
    return "";
  } catch (error) {
    console.error("读取联系老师二维码失败:", error);
    return "";
  }
}
