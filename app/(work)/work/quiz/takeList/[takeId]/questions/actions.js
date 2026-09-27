"use server";

import { COMMON_AGENT_BOT_ID } from "../../../../../../../lib/config/constants.js";
import { callAIAgent } from "../../../../../../../lib/utils/aiAgent.js";
import { getSetting } from "../../../../../../../lib/utils/setting.js";
import { getCurrentSchoolFromDB } from "../../../../../../../lib/work/teacher/mySchool.js";
import { getQuizTakeAllComments, getQuizTakeQuestions, updateQuizTakeOverallComment } from "./datas.js";

/**
 * 获取口述核心知识点参与记录的详细题目信息
 */
export async function getQuizTakeQuestionsAction(takeId) {
  try {
    return await getQuizTakeQuestions(takeId);
  } catch (error) {
    console.error("获取口述核心知识点题目详情失败:", error);
    throw error;
  }
}

/**
 * 更新口述核心知识点参与记录的整体评语
 */
export async function updateQuizTakeOverallCommentAction(takeId, teacherOverallComment) {
  try {
    const currentSchool = await getCurrentSchoolFromDB();
    if (!currentSchool) {
      throw new Error("未找到当前学校信息");
    }
    await updateQuizTakeOverallComment(takeId, teacherOverallComment, currentSchool._id);
    return {
      success: true,
      message: "更新成功"
    };
  } catch (error) {
    console.error("更新整体评语失败:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "更新失败"
    };
  }
}

/**
 * AI分析整体评语
 */
export async function analyzeOverallCommentWithAIAction(takeId) {
  try {
    const currentSchool = await getCurrentSchoolFromDB();
    if (!currentSchool) {
      throw new Error("未找到当前学校信息");
    }

    // 获取所有题目评语
    const data = await getQuizTakeAllComments(takeId, currentSchool._id);
    if (data.questionComments.length === 0) {
      return {
        success: false,
        message: "请先完成每一题的老师评语，再使用AI分析功能"
      };
    }

    // 获取提示词模板
    const promptTemplate = await getSetting(["overall_comment_prompt_template"]);
    const template = promptTemplate.overall_comment_prompt_template;
    if (!template || !template.trim()) {
      throw new Error("整体评语AI分析提示词模板未配置，请先在管理后台配置AI提示词模板");
    }

    // 验证模板中是否包含必要的变量
    const requiredVariables = ["teacherComments"];
    for (const variable of requiredVariables) {
      if (!template.includes(`\${${variable}}`)) {
        throw new Error(`提示词模板缺少必要变量 \${${variable}}，请在管理后台修正模板配置`);
      }
    }

    // 准备模板变量
    const teacherComments = data.questionComments.map(comment => `第${comment.questionNumber}题评语：${comment.teacherComment}`).join("\n");
    const templateVars = {
      teacherComments
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
      overallComment: aiResponse.trim()
    };
  } catch (error) {
    console.error("AI分析整体评语失败:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "AI分析失败"
    };
  }
}
