"use server";

import { getAllAIConfig } from "../../backend/ai-config/actions.js";
import { callAIAgent } from "../../../../../lib/utils/aiAgent.js";
import { addInteractionToDB, deleteInteractionFromDB, getQuestionByParamsFromDB, getQuestionInteractionsFromDB } from "./datas.js";
/**
 * 根据试卷ID、页码、题目号获取题目信息
 */
export async function getQuestionByParams(examId, pageNumber, questionNumber) {
  try {
    const question = await getQuestionByParamsFromDB(examId, pageNumber, questionNumber);
    if (!question) {
      return {
        success: false,
        message: "未找到指定的题目"
      };
    }
    return {
      success: true,
      data: question
    };
  } catch (error) {
    console.error("获取题目信息失败:", error);
    return {
      success: false,
      message: `获取失败: ${error.message}`
    };
  }
}

/**
 * 获取题目的互动问题列表
 */
export async function getQuestionInteractions(examId, pageNumber, questionNumber) {
  try {
    // 先获取题目信息
    const question = await getQuestionByParamsFromDB(examId, pageNumber, questionNumber);
    if (!question) {
      return {
        success: false,
        message: "未找到指定的题目"
      };
    }

    // 获取互动问题列表
    const questionData = question;
    const interactions = await getQuestionInteractionsFromDB(questionData._id);
    return {
      success: true,
      data: interactions
    };
  } catch (error) {
    console.error("获取互动问题失败:", error);
    return {
      success: false,
      message: `获取失败: ${error.message}`
    };
  }
}

/**
 * 删除互动问题
 */
export async function deleteInteraction(interactionId) {
  try {
    const success = await deleteInteractionFromDB(interactionId);
    if (success) {
      return {
        success: true,
        message: "删除成功"
      };
    } else {
      return {
        success: false,
        message: "删除失败"
      };
    }
  } catch (error) {
    console.error("删除互动问题失败:", error);
    return {
      success: false,
      message: `删除失败: ${error.message}`
    };
  }
}

/**
 * 添加互动问题
 */
export async function addInteraction(questionId, questionText, answer) {
  try {
    await addInteractionToDB(questionId, questionText, answer);
    return {
      success: true,
      message: "添加成功"
    };
  } catch (error) {
    console.error("添加互动问题失败:", error);
    return {
      success: false,
      message: `添加失败: ${error.message}`
    };
  }
}

/**
 * 解析AI返回的问答格式
 */
function parseAIResponse(aiResponse) {
  const results = [];

  // 按行分割
  const lines = aiResponse.split("\n").map(line => line.trim()).filter(line => line);
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    // 匹配问题格式: "问题1：" 或 "问题1:"
    const questionMatch = line.match(/^问题\d+[：:]\s*(.+)$/);
    if (questionMatch && i + 1 < lines.length) {
      const questionText = questionMatch[1];
      const nextLine = lines[i + 1];

      // 匹配答案格式: "答案1：" 或 "答案1:"
      const answerMatch = nextLine.match(/^答案\d+[：:]\s*(.+)$/);
      if (answerMatch) {
        const answerText = answerMatch[1];
        results.push({
          question: questionText,
          answer: answerText
        });
        i += 2; // 跳过问题和答案行
        continue;
      }
    }
    i++;
  }
  return results;
}

/**
 * 使用AI生成互动问题
 */
export async function generateInteractionQuestions(question) {
  try {
    // 获取AI配置
    const configResult = await getAllAIConfig();
    if (!configResult.success || !configResult.data?.questionInteractionAgentBotId) {
      return {
        success: false,
        message: "未配置题目互动问答生成Bot ID"
      };
    }
    const botId = configResult.data.questionInteractionAgentBotId;

    // 构建发送给AI的内容
    const promptContent = `请为以下题目生成相关的考察问题和答案：

题目文本：${question.questionText || "无"}

答案：${question.answer?.join("；") || "无"}

解析：${question.parse?.join("；") || "无"}

知识点：${question.knowledgePoints?.join("、") || "无"}

易错原因：${question.easyToMistakeDetail?.join("；") || "无"}`;

    // 准备files数组，包含题目图片
    const files = [];

    // 如果题目有图片，添加到files数组中
    // 优先使用imageFileID（云存储文件ID），如果没有则使用imageUrl
    if (question.imageFileID) {
      files.push(question.imageFileID);
    } else if (question.imageUrl) {
      files.push(question.imageUrl);
    }

    // 调用AI接口
    const aiResponse = await callAIAgent({
      botId,
      msg: promptContent,
      files
    });
    if (!aiResponse || typeof aiResponse !== "string") {
      return {
        success: false,
        message: "AI调用失败"
      };
    }

    // 解析AI返回的内容
    const parsedQuestions = parseAIResponse(aiResponse);
    if (parsedQuestions.length === 0) {
      return {
        success: false,
        message: "AI返回的格式无法解析，请重试"
      };
    }
    return {
      success: true,
      data: parsedQuestions
    };
  } catch (error) {
    console.error("AI生成互动问题失败:", error);
    return {
      success: false,
      message: `生成失败: ${error.message}`
    };
  }
}
