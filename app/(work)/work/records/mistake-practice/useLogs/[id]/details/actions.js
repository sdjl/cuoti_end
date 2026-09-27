"use server";

import { COMMON_AGENT_BOT_ID, DISPLAY_TEXT } from "../../../../../../../../lib/config/constants.js";
import { callAIAgent } from "../../../../../../../../lib/utils/aiAgent.js";
import { getSetting } from "../../../../../../../../lib/utils/setting.js";
import { getCurrentSchoolFromJWT } from "../../../../../../../../lib/work/principal/mySchool.js";
import { getMistakePracticeDetails, updateStudentQuestionAIChatSessionTeacherComment } from "./datas.js";
export async function getMistakePracticeDetailsAction(studentAnswerItemId) {
  try {
    const school = await getCurrentSchoolFromJWT();
    if (!school) {
      throw new Error("未授权访问");
    }
    const details = await getMistakePracticeDetails(school._id, studentAnswerItemId);
    return {
      success: true,
      data: details
    };
  } catch (error) {
    console.error(`获取${DISPLAY_TEXT.COURSE_MISTAKE}详情失败:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "获取详情失败"
    };
  }
}

/**
 * 更新课程错题AI聊天会话的老师评语
 */
export async function updateMistakePracticeTeacherCommentAction(sessionId, teacherComment) {
  try {
    const school = await getCurrentSchoolFromJWT();
    if (!school) {
      throw new Error("未授权访问");
    }
    await updateStudentQuestionAIChatSessionTeacherComment(sessionId, teacherComment);
    return {
      success: true,
      message: "更新成功"
    };
  } catch (error) {
    console.error(`更新${DISPLAY_TEXT.COURSE_MISTAKE}老师评语失败:`, error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "更新失败"
    };
  }
}

/**
 * AI分析生成课程错题老师评语
 */
export async function analyzeMistakePracticeWithAIAction(studentAnswerItemId) {
  try {
    const school = await getCurrentSchoolFromJWT();
    if (!school) {
      throw new Error("未授权访问");
    }

    // 获取课程错题详情
    const details = await getMistakePracticeDetails(school._id, studentAnswerItemId);
    if (!details) {
      return {
        success: false,
        message: "未找到相关错题记录"
      };
    }

    // 查找最新的会话（按创建时间倒序，取第一个）
    const latestSession = details.aiChatSessions.length > 0 ? details.aiChatSessions[0] : null;
    if (!latestSession) {
      return {
        success: false,
        message: "未找到AI对话会话，请先与AI进行互动"
      };
    }

    // 获取课程错题提示词模板
    const promptTemplate = await getSetting(["mistake_practice_prompt_template"]);
    const template = promptTemplate.mistake_practice_prompt_template;
    if (!template || !template.trim()) {
      throw new Error(`${DISPLAY_TEXT.COURSE_MISTAKE}AI分析提示词模板未配置，请先在管理后台配置AI提示词模板`);
    }

    // 验证模板中是否包含必要的变量
    const requiredVariables = ["questionInfo", "studentAnswer"];
    for (const variable of requiredVariables) {
      if (!template.includes(`\${${variable}}`)) {
        throw new Error(`提示词模板缺少必要变量 \${${variable}}，请在管理后台修正模板配置`);
      }
    }

    // 组装题目信息
    const questionInfoParts = [`题目类型：${details.studentAnswerItem.questionType}`, details.examQuestion?.questionText ? `题目内容：${details.examQuestion.questionText}` : "", "这是一道学生的错题"];
    const questionInfo = questionInfoParts.filter(Boolean).join("\n");

    // 组装学生答案信息（包含所有对话内容，不包含图片）
    const sessionMessages = details.aiChatMessages.filter(msg => msg.sessionId === latestSession._id);
    const allMessages = sessionMessages.map(msg => {
      const roleText = msg.role === "user" ? "学生" : msg.role === "assistant" ? "AI助手" : "系统";
      return `${roleText}：${msg.content}`;
    }).filter(content => content?.trim()).join("\n");
    if (!allMessages.trim()) {
      return {
        success: false,
        message: "该AI对话会话中暂无有效的对话内容，请等待学生与AI互动后再生成评语"
      };
    }
    const templateVars = {
      questionInfo,
      studentAnswer: allMessages
    };

    // 替换模板变量
    let prompt = template;
    Object.entries(templateVars).forEach(([key, value]) => {
      const placeholder = `\${${key}}`;
      prompt = prompt.replace(new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"), value);
    });

    // 调用AI
    const aiResponse = await callAIAgent({
      botId: COMMON_AGENT_BOT_ID,
      msg: prompt,
      files: []
    });
    return {
      success: true,
      message: "AI分析完成",
      teacherComment: aiResponse.trim(),
      activeSessionId: latestSession._id
    };
  } catch (error) {
    console.error(`AI分析${DISPLAY_TEXT.COURSE_MISTAKE}失败:`, error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "AI分析失败"
    };
  }
}
