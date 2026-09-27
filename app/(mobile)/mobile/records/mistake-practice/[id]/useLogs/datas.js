"use server";

import { allDocs, command, getDoc, updateDoc } from "../../../../../../../lib/common/database.js";
import { getSetting } from "../../../../../../../lib/utils/setting.js";
import { validateStudentPassword } from "../../../../../../../lib/utils/student.js";
/**
 * 获取错题AI聊天记录页面所需的所有数据
 */
export async function getUseLogsData(studentAnswerItemId) {
  try {
    // 获取学生答题记录
    const answerItems = await allDocs({
      c: "student_answer_item",
      match: {
        _id: studentAnswerItemId
      }
    });
    if (answerItems.length === 0) {
      return {
        studentAnswerItem: null,
        chatMessages: [],
        teacherStudentMessages: [],
        aiChatSession: null
      };
    }
    const answerItem = answerItems[0];

    // 获取题目信息
    const questions = await allDocs({
      c: "exam_question",
      match: {
        _id: answerItem.questionId
      }
    });
    const questionData = questions.length > 0 ? questions[0] : undefined;
    const studentAnswerItem = {
      ...answerItem,
      questionData
    };

    // 获取聊天记录
    let chatMessages = [];
    let teacherStudentMessages = [];
    let aiChatSession = null;
    if (answerItem.aiChatSessionId) {
      const messages = await allDocs({
        c: "student_question_ai_chat_message",
        match: {
          sessionId: answerItem.aiChatSessionId
        },
        sort: {
          created: 1
        }
      });
      chatMessages = messages;

      // 获取AI会话信息，包含学生老师对话记录和重做图片
      const sessions = await allDocs({
        c: "student_question_ai_chat_session",
        match: {
          _id: answerItem.aiChatSessionId
        }
      });
      if (sessions.length > 0) {
        aiChatSession = sessions[0];
        if (aiChatSession.teacherStudentMessages) {
          teacherStudentMessages = aiChatSession.teacherStudentMessages.sort((a, b) => a.created - b.created);
        }
      }
    }
    return {
      studentAnswerItem,
      chatMessages,
      teacherStudentMessages,
      aiChatSession
    };
  } catch (error) {
    console.error("获取错题AI聊天记录数据失败:", error);
    throw new Error("获取数据失败");
  }
}

/**
 * 验证学生操作密码
 */
export async function validateOperationPassword(studentAnswerId, password) {
  try {
    // 通过学生答题记录获取学生ID
    const answerItem = await getDoc("student_answer", studentAnswerId);
    if (!answerItem) {
      return false;
    }

    // 验证学生密码
    return await validateStudentPassword(answerItem.studentId, password);
  } catch (error) {
    console.error("验证操作密码失败:", error);
    return false;
  }
}

/**
 * 发送学生消息给老师（数据库操作）
 */
export async function sendStudentMessageToDB(data) {
  try {
    // 获取学生答题记录，找到对应的AI会话
    const answerItems = await allDocs({
      c: "student_answer_item",
      match: {
        _id: data.studentAnswerItemId
      }
    });
    if (answerItems.length === 0) {
      return {
        success: false,
        message: "未找到相关记录"
      };
    }
    const answerItem = answerItems[0];

    // 校验操作密码：通过 student_answerId -> student -> operationPassword
    if (!answerItem.studentAnswerId) {
      return {
        success: false,
        message: "数据异常：缺少学生答题记录ID"
      };
    }
    const studentAnswerDoc = await getDoc("student_answer", answerItem.studentAnswerId);
    if (!studentAnswerDoc) {
      return {
        success: false,
        message: "未找到学生答题记录"
      };
    }
    const student = await getDoc("student", studentAnswerDoc.studentId);
    if (!student) {
      return {
        success: false,
        message: "未找到学生信息"
      };
    }
    if (student.operationPassword !== data.password) {
      return {
        success: false,
        message: "操作密码错误"
      };
    }
    if (!answerItem.aiChatSessionId) {
      return {
        success: false,
        message: "未找到AI会话记录"
      };
    }

    // 验证AI会话记录是否存在
    const session = await getDoc("student_question_ai_chat_session", answerItem.aiChatSessionId);
    if (!session) {
      return {
        success: false,
        message: "未找到AI会话"
      };
    }

    // 添加新的学生消息到对话记录
    const newMessage = {
      created: Date.now(),
      role: "student",
      content: data.message
    };
    const _ = command();

    // 更新AI会话记录，使用push添加消息并设置需要老师回复
    const updateResult = await updateDoc("student_question_ai_chat_session", answerItem.aiChatSessionId, {
      teacherStudentMessages: _.push(newMessage),
      isNeedTeacherReply: true
    });
    if (updateResult) {
      return {
        success: true,
        message: "消息发送成功"
      };
    } else {
      return {
        success: false,
        message: "消息发送失败"
      };
    }
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
    if (typeof url === "string" && url.trim()) {
      return url.trim();
    }
    return "";
  } catch (error) {
    console.error("读取联系老师二维码失败:", error);
    return "";
  }
}
