"use server";

import { allDocs, command, getOne, updateDoc } from "../../../../../../../lib/common/database.js";
import { DISPLAY_TEXT } from "../../../../../../../lib/config/constants.js";
import { getSetting } from "../../../../../../../lib/utils/setting.js";
/**
 * 读取 非登录用户自主上传错题 使用记录页面所需数据
 */
export async function getUseLogsData(guestProblemQuestionId) {
  try {
    // 读取非登录用户自定义题目
    const questionDoc = await getOne("guest_problem_question", {
      _id: guestProblemQuestionId
    });
    if (!questionDoc) {
      return {
        problemQuestion: null,
        chatMessages: [],
        teacherStudentMessages: []
      };
    }
    const problemQuestion = questionDoc;

    // 查找学习会话：系统保证 guest_problem_session 仅有一个
    const targetSession = await getOne("guest_problem_session", {
      guestProblemQuestionId
    });
    let chatMessages = [];
    if (targetSession) {
      const messages = await allDocs({
        c: "guest_problem_session_message",
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
      teacherStudentMessages
    };
  } catch (error) {
    console.error(`获取非登录用户${DISPLAY_TEXT.SELF_UPLOAD_MISTAKE}使用记录数据失败:`, error);
    throw new Error("获取数据失败");
  }
}


export async function validateOperationPassword(guestProblemQuestionId, password) {
  try {
    // 暂时不使用 password 参数，待实现具体验证逻辑
    void password;

    // 获取题目信息
    const questionDoc = await getOne("guest_problem_question", {
      _id: guestProblemQuestionId
    });
    if (!questionDoc) {
      return false;
    }

    // TODO: 这里可以根据业务需求实现具体的密码验证逻辑
    // 目前暂时返回 true，表示验证通过
    return true;
  } catch (error) {
    console.error("验证操作密码失败:", error);
    return false;
  }
}

/**
 * 非登录用户学生发送消息给老师（写入题目下的师生对话）
 */
export async function sendStudentMessageToDB(data) {
  try {
    const questionDoc = await getOne("guest_problem_question", {
      _id: data.guestProblemQuestionId
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
    const updated = await updateDoc("guest_problem_question", data.guestProblemQuestionId, {
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
    console.error("发送非登录用户学生消息失败:", error);
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
