"use server";

import { COMMON_AGENT_BOT_ID, DISPLAY_TEXT } from "../../../../../../../../lib/config/constants.js";
import { callAIAgent } from "../../../../../../../../lib/utils/aiAgent.js";
import { getSetting } from "../../../../../../../../lib/utils/setting.js";
import { getCurrentSchoolFromJWT } from "../../../../../../../../lib/work/principal/mySchool.js";
import { getAIQuestionDetails, updateProblemSessionTeacherComment } from "./datas.js";
export async function getAIQuestionDetailsAction(sessionId) {
  try {
    const school = await getCurrentSchoolFromJWT();
    if (!school) {
      throw new Error("未授权访问");
    }
    const details = await getAIQuestionDetails(school._id, sessionId);
    return {
      success: true,
      data: details
    };
  } catch (error) {
    console.error(`获取${DISPLAY_TEXT.SELF_UPLOAD_MISTAKE}详情失败:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "获取详情失败"
    };
  }
}

/**
 * 更新自主上传错题会话的老师评语
 */
export async function updateProblemSessionTeacherCommentAction(sessionId, teacherComment) {
  try {
    const school = await getCurrentSchoolFromJWT();
    if (!school) {
      throw new Error("未授权访问");
    }
    await updateProblemSessionTeacherComment(sessionId, teacherComment);
    return {
      success: true,
      message: "更新成功"
    };
  } catch (error) {
    console.error("更新老师评语失败:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "更新失败"
    };
  }
}

/**
 * AI分析生成自主上传错题老师评语
 */
export async function analyzeProblemSessionWithAIAction(sessionId) {
  try {
    const school = await getCurrentSchoolFromJWT();
    if (!school) {
      throw new Error("未授权访问");
    }

    // 获取自主上传错题详情
    const details = await getAIQuestionDetails(school._id, sessionId);
    if (!details) {
      return {
        success: false,
        message: "未找到相关错题记录"
      };
    }

    // 获取自主上传错题提示词模板
    const promptTemplate = await getSetting(["personal_mistake_prompt_template"]);
    const template = promptTemplate.personal_mistake_prompt_template;
    if (!template || !template.trim()) {
      throw new Error(`${DISPLAY_TEXT.SELF_UPLOAD_MISTAKE}AI分析提示词模板未配置，请先在管理后台配置AI提示词模板`);
    }

    // 验证模板中是否包含必要的变量
    const requiredVariables = ["questionInfo", "studentAnswer"];
    for (const variable of requiredVariables) {
      if (!template.includes(`\${${variable}}`)) {
        throw new Error(`提示词模板缺少必要变量 \${${variable}}，请在管理后台修正模板配置`);
      }
    }

    // 组装题目信息
    const questionInfo = [details.problemQuestion.knowledgePoints && details.problemQuestion.knowledgePoints.length > 0 ? `知识点：${details.problemQuestion.knowledgePoints.join("、")}` : ""].filter(Boolean).join("\n");

    // 组装学生答案信息（包含所有对话内容，不包含图片）
    const allMessages = details.sessionMessages.map(msg => {
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
      teacherComment: aiResponse.trim()
    };
  } catch (error) {
    console.error(`AI分析${DISPLAY_TEXT.SELF_UPLOAD_MISTAKE}失败:`, error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "AI分析失败"
    };
  }
}
