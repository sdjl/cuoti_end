"use server";

import { COMMON_AGENT_BOT_ID } from "../../../../../../../../lib/config/constants.js";
import { callAIAgent } from "../../../../../../../../lib/utils/aiAgent.js";
import { getSetting } from "../../../../../../../../lib/utils/setting.js";
import { getCurrentSchoolFromDB } from "../../../../../../../../lib/work/teacher/mySchool.js";
import { deleteQuizQuestion, deleteQuizSessionMessage, getQuizQuestionDetail, updateQuizQuestionFields, updateQuizSessionMessageContent } from "./datas.js";

/**
 * 获取单个题目的详细信息和会话记录
 */
export async function getQuizQuestionDetailAction(quizQuestionId) {
  try {
    return await getQuizQuestionDetail(quizQuestionId);
  } catch (error) {
    console.error("获取题目详情失败:", error);
    throw error;
  }
}

/**
 * 删除单个题目记录及其关联数据
 */
export async function deleteQuizQuestionAction(quizQuestionId) {
  try {
    const currentSchool = await getCurrentSchoolFromDB();
    if (!currentSchool) {
      throw new Error("未找到当前学校信息");
    }
    await deleteQuizQuestion(quizQuestionId, currentSchool._id);
    return {
      success: true,
      message: "删除成功"
    };
  } catch (error) {
    console.error("删除题目记录失败:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "删除失败"
    };
  }
}

/**
 * 删除单个会话消息
 */
export async function deleteQuizSessionMessageAction(messageId) {
  try {
    const currentSchool = await getCurrentSchoolFromDB();
    if (!currentSchool) {
      throw new Error("未找到当前学校信息");
    }
    await deleteQuizSessionMessage(messageId, currentSchool._id);
    return {
      success: true,
      message: "删除成功"
    };
  } catch (error) {
    console.error("删除消息失败:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "删除失败"
    };
  }
}

/**
 * 更新会话消息的文字内容
 */
export async function updateQuizSessionMessageContentAction(messageId, content) {
  try {
    const currentSchool = await getCurrentSchoolFromDB();
    if (!currentSchool) {
      throw new Error("未找到当前学校信息");
    }
    await updateQuizSessionMessageContent(messageId, content, currentSchool._id);
    return {
      success: true,
      message: "更新成功"
    };
  } catch (error) {
    console.error("更新消息内容失败:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "更新失败"
    };
  }
}

/**
 * 更新题目的AI相关字段和老师评语
 */
export async function updateQuizQuestionFieldsAction(quizQuestionId, updates) {
  try {
    const currentSchool = await getCurrentSchoolFromDB();
    if (!currentSchool) {
      throw new Error("未找到当前学校信息");
    }
    await updateQuizQuestionFields(quizQuestionId, updates, currentSchool._id);
    return {
      success: true,
      message: "更新成功"
    };
  } catch (error) {
    console.error("更新题目字段失败:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "更新失败"
    };
  }
}

/**
 * AI分析题目解答
 */
export async function analyzeQuestionWithAIAction(quizQuestionId) {
  try {
    const currentSchool = await getCurrentSchoolFromDB();
    if (!currentSchool) {
      throw new Error("未找到当前学校信息");
    }

    // 获取完整的题目详情数据
    const data = await getQuizQuestionDetail(quizQuestionId);
    if (!data.quizQuestion || data.quizQuestion.schoolId !== currentSchool._id) {
      throw new Error("题目记录不存在或无权限访问");
    }

    // 收集图片URLs
    const files = [];

    // 添加题目图片
    if (data.examQuestion?.imageUrl) {
      files.push(data.examQuestion.imageUrl);
    }

    // 添加学生上传的图片
    data.imageMessages.forEach(msg => {
      if (msg.imageFile?.fileUrl) {
        files.push(msg.imageFile.fileUrl);
      }
    });

    // 收集语音内容
    const audioContents = data.audioMessages.filter(msg => msg.content?.trim()).map(msg => msg.content?.trim()).filter(Boolean);

    // 收集题目标准答案和解析
    const standardAnswers = data.examQuestion?.answer || [];
    const standardParse = data.examQuestion?.parse || [];

    // 获取提示词模板
    const promptTemplate = await getSetting(["question_analysis_prompt_template"]);
    const template = promptTemplate.question_analysis_prompt_template;
    if (!template || !template.trim()) {
      throw new Error("单题AI分析提示词模板未配置，请先在管理后台配置AI提示词模板");
    }

    // 验证模板中是否包含必要的变量
    const requiredVariables = ["standardAnswers", "standardParse", "studentAudioContents", "studentImageInfo"];
    for (const variable of requiredVariables) {
      if (!template.includes(`\${${variable}}`)) {
        throw new Error(`提示词模板缺少必要变量 \${${variable}}，请在管理后台修正模板配置`);
      }
    }

    // 准备模板变量
    const templateVars = {
      standardAnswers: standardAnswers.join("；"),
      standardParse: standardParse.join("；"),
      studentAudioContents: audioContents.length > 0 ? `学生语音解答内容：
${audioContents.map((content, index) => `${index + 1}. ${content}`).join("\n")}` : "学生未提供语音解答内容。",
      studentImageInfo: data.imageMessages.length > 0 ? `学生还上传了 ${data.imageMessages.length} 张图片，内容在[FILE]中，请结合图片内容进行分析。` : ""
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
      files
    });

    // 解析AI响应
    const lines = aiResponse.split("\n");
    let analysisContent = "";
    let commentContent = "";
    let currentSection = "";
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine.startsWith("解答思路点评：")) {
        currentSection = "analysis";
        analysisContent = trimmedLine.replace("解答思路点评：", "").trim();
      } else if (trimmedLine.startsWith("模仿老师评语：")) {
        currentSection = "comment";
        commentContent = trimmedLine.replace("模仿老师评语：", "").trim();
      } else if (trimmedLine && currentSection === "analysis") {
        analysisContent += (analysisContent ? "\n" : "") + trimmedLine;
      } else if (trimmedLine && currentSection === "comment") {
        commentContent += (commentContent ? "\n" : "") + trimmedLine;
      }
    }
    return {
      success: true,
      message: "AI分析完成",
      aiAnalysis: analysisContent || undefined,
      teacherComment: commentContent || undefined
    };
  } catch (error) {
    console.error("AI分析失败:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "AI分析失败"
    };
  }
}
