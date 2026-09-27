"use server";

import { getExamPaperById, updateExamPaper, updateExamPaperStatistics } from "../../../../../../lib/collection/examPaper.js";
import { getSubjectKnowledgePoints } from "../../../../../../lib/config/knowledgeTree.js";
import { createAIAgentStream } from "../../../../../../lib/utils/aiAgent.js";
import { getSetting } from "../../../../../../lib/utils/setting.js";


export async function getExamPaperForAnalysis(examId) {
  try {
    const examPaper = await getExamPaperById(examId);
    if (!examPaper) {
      console.error("找不到试卷:", examId);
      return null;
    }
    return examPaper;
  } catch (error) {
    console.error("获取试卷数据失败:", error);
    return null;
  }
}


export async function getAIAnalysisBotId() {
  try {
    const settings = await getSetting("ai_analysis_agent_bot_id");
    return settings.ai_analysis_agent_bot_id || "bot-24433b83";
  } catch (error) {
    console.error("获取AI Bot ID失败:", error);
    return "bot-24433b83"; // 返回默认值
  }
}


export async function startAIAnalysis(examId) {
  try {
    // 获取AI Bot ID配置
    const settings = await getSetting("ai_analysis_agent_bot_id");
    const botId = settings.ai_analysis_agent_bot_id || "bot-24433b83"; // 如果没有配置则使用默认值

    // 生成分析文本
    const analysisText = await generateAnalysisTextForAI(examId);
    if (!analysisText) {
      return {
        success: false,
        error: "生成分析文本失败",
        chunks: []
      };
    }

    // 创建AI Agent流式对话
    const stream = await createAIAgentStream({
      botId: botId,
      msg: analysisText
    });

    // 收集所有流式响应数据
    const chunks = [];
    let finalTextContent = "";

    // 流式读取响应
    for await (const chunk of stream) {
      //console.log("收到AI响应片段:", chunk);

      chunks.push({
        type: chunk.type,
        content: chunk.content,
        reasoning_content: chunk.reasoning_content,
        finish_reason: chunk.finish_reason,
        created: chunk.created,
        record_id: chunk.record_id,
        model: chunk.model,
        usage: chunk.usage
      });

      // 累积最终文本内容
      if (chunk.type === "text" && chunk.content) {
        finalTextContent += chunk.content;
      }

      // 检查是否结束
      if (chunk.finish_reason === "stop") {
        break;
      }
    }
    return {
      success: true,
      chunks,
      finalText: finalTextContent
    };
  } catch (error) {
    console.error("AI分析失败:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "AI分析失败",
      chunks: []
    };
  }
}


export async function generateAnalysisTextForAI(examId) {
  try {
    // 获取试卷数据
    const examPaper = await getExamPaperById(examId);
    if (!examPaper) {
      console.error("找不到试卷:", examId);
      return null;
    }

    // 获取PDF文本内容
    const pdfText = examPaper.analysisReport?.pdfWithParseText || "";

    // 获取知识点数据（includeNonLeaves为false）
    const knowledgePoints = await getSubjectKnowledgePoints(examPaper.subject, false);

    // 收集所有题目
    const allQuestions = [];
    let globalQuestionNumber = 1;

    // 遍历所有页面和题目
    for (const page of examPaper.pages) {
      for (const question of page.questions) {
        if (question.questionText) {
          // 删除questionText中的换行符
          const cleanedText = question.questionText.replace(/\n/g, " ");
          allQuestions.push({
            questionText: cleanedText,
            pageNumber: page.pageNumber,
            questionNumber: globalQuestionNumber
          });
          globalQuestionNumber++;
        }
      }
    }

    // 生成分析文本
    let analysisText = "=== 第一部分：试卷题目与解答内容 ===\n\n";
    analysisText += `${pdfText}\n\n`;
    analysisText += "=== 第二部分：参考知识点 ===\n\n";
    for (const point of knowledgePoints) {
      analysisText += `${point}\n`;
    }
    analysisText += "\n";
    analysisText += "=== 第三部分：需要返回的题目 ===\n\n";
    for (const question of allQuestions) {
      analysisText += `${question.questionNumber}: ${question.questionText}；\n`;
    }
    return analysisText;
  } catch (error) {
    console.error("生成分析文本失败:", error);
    return null;
  }
}


export async function generatePageAnalysisTextForAI(examId, pageNumber) {
  try {
    // 获取试卷数据
    const examPaper = await getExamPaperById(examId);
    if (!examPaper) {
      console.error("找不到试卷:", examId);
      return null;
    }

    // 获取PDF文本内容
    const pdfText = examPaper.analysisReport?.pdfWithParseText || "";

    // 获取知识点数据（includeNonLeaves为false）
    const knowledgePoints = await getSubjectKnowledgePoints(examPaper.subject, false);

    // 收集指定页面的题目
    const pageQuestions = [];
    let globalQuestionNumber = 1;

    // 遍历所有页面和题目，计算全局题目序号
    for (const page of examPaper.pages) {
      for (const question of page.questions) {
        if (question.questionText) {
          if (page.pageNumber === pageNumber) {
            // 删除questionText中的换行符
            const cleanedText = question.questionText.replace(/\n/g, " ");
            pageQuestions.push({
              questionText: cleanedText,
              pageNumber: page.pageNumber,
              questionNumber: globalQuestionNumber
            });
          }
          globalQuestionNumber++;
        }
      }
    }

    // 生成分析文本
    let analysisText = "=== 第一部分：试卷题目与解答内容 ===\n\n";
    analysisText += `${pdfText}\n\n`;
    analysisText += "=== 第二部分：参考知识点 ===\n\n";
    for (const point of knowledgePoints) {
      analysisText += `${point}\n`;
    }
    analysisText += "\n";
    analysisText += "=== 第三部分：需要返回的题目 ===\n\n";
    for (const question of pageQuestions) {
      analysisText += `${question.questionNumber}: ${question.questionText}；\n`;
    }
    return analysisText;
  } catch (error) {
    console.error("生成单页分析文本失败:", error);
    return null;
  }
}


export async function startPageAIAnalysis(examId, pageNumber) {
  try {
    // 获取AI Bot ID配置
    const settings = await getSetting("ai_analysis_agent_bot_id");
    const botId = settings.ai_analysis_agent_bot_id || "bot-24433b83"; // 如果没有配置则使用默认值

    // 生成分析文本
    const analysisText = await generatePageAnalysisTextForAI(examId, pageNumber);
    if (!analysisText) {
      return {
        success: false,
        error: "生成分析文本失败",
        chunks: []
      };
    }

    // 创建AI Agent流式对话
    const stream = await createAIAgentStream({
      botId: botId,
      msg: analysisText
    });

    // 收集所有流式响应数据
    const chunks = [];
    let finalTextContent = "";

    // 流式读取响应
    for await (const chunk of stream) {
      //console.log("收到AI响应片段:", chunk);

      chunks.push({
        type: chunk.type,
        content: chunk.content,
        reasoning_content: chunk.reasoning_content,
        finish_reason: chunk.finish_reason,
        created: chunk.created,
        record_id: chunk.record_id,
        model: chunk.model,
        usage: chunk.usage
      });

      // 累积最终文本内容
      if (chunk.type === "text" && chunk.content) {
        finalTextContent += chunk.content;
      }

      // 检查是否结束
      if (chunk.finish_reason === "stop") {
        break;
      }
    }

    // 验证返回的内容是否有效
    if (!finalTextContent || finalTextContent.trim().length === 0) {
      throw new Error(`第${pageNumber}页AI分析返回内容为空，可能分析失败`);
    }

    // 简单验证返回内容是否包含预期的分析格式
    const hasExpectedFormat = /\d+-(答案|解析|知识点)[:：]/.test(finalTextContent);
    if (!hasExpectedFormat) {
      throw new Error(`第${pageNumber}页AI分析返回内容格式异常，可能分析失败`);
    }
    return {
      success: true,
      chunks,
      finalText: finalTextContent
    };
  } catch (error) {
    console.error("AI单页分析失败:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "AI单页分析失败",
      chunks: []
    };
  }
}


export async function saveAnalysisResults(examId, analysisResults) {
  try {
    // 获取试卷数据
    const examPaper = await getExamPaperById(examId);
    if (!examPaper) {
      throw new Error("试卷不存在");
    }

    // 1. 统计试卷中的题目总数
    let totalQuestionsInExam = 0;
    const examQuestions = [];
    let globalIndex = 1;
    for (const page of examPaper.pages) {
      for (const question of page.questions) {
        if (question.questionText) {
          totalQuestionsInExam++;
          examQuestions.push({
            pageNumber: page.pageNumber,
            questionNumber: question.questionNumber,
            globalIndex: globalIndex
          });
          globalIndex++;
        }
      }
    }

    // 2. 检查题目数量是否一致
    if (analysisResults.length !== totalQuestionsInExam) {
      throw new Error(`题目数量不匹配：试卷中有 ${totalQuestionsInExam} 道题目，但AI解析结果有 ${analysisResults.length} 道题目`);
    }

    // 3. 获取有效的知识点列表
    const validKnowledgePoints = await getSubjectKnowledgePoints(examPaper.subject, false);

    // 4. 检查所有知识点是否有效
    const allKnowledgePointsInResults = new Set();
    for (const result of analysisResults) {
      for (const point of result.knowledgePoints) {
        allKnowledgePointsInResults.add(point);
      }
    }
    const invalidKnowledgePoints = Array.from(allKnowledgePointsInResults).filter(point => !validKnowledgePoints.includes(point));
    if (invalidKnowledgePoints.length > 0) {
      throw new Error(`发现无效的知识点：${invalidKnowledgePoints.join(", ")}。请确保所有知识点都在系统的知识点列表中。`);
    }

    // 5. 构建更新数据对象，按照全局题目编号映射到具体的页面和题目
    const updateData = {};

    // 遍历解析结果，按照全局编号映射到具体的页面和题目
    for (let i = 0; i < analysisResults.length; i++) {
      const result = analysisResults[i];
      const examQuestion = examQuestions[i]; // 按照全局编号顺序对应

      if (!examQuestion) {
        console.warn(`无法找到第 ${i + 1} 道题目的对应关系`);
        continue;
      }

      // 查找页面索引
      const pageIndex = examPaper.pages.findIndex(page => page.pageNumber === examQuestion.pageNumber);
      if (pageIndex === -1) {
        console.warn(`页面 ${examQuestion.pageNumber} 不存在`);
        continue;
      }

      // 查找题目索引
      const questionIndex = examPaper.pages[pageIndex].questions.findIndex(q => q.questionNumber === examQuestion.questionNumber);
      if (questionIndex === -1) {
        console.warn(`页面 ${examQuestion.pageNumber} 中的题目 ${examQuestion.questionNumber} 不存在`);
        continue;
      }

      // 构建更新路径
      const basePath = `pages.${pageIndex}.questions.${questionIndex}`;
      updateData[`${basePath}.answer`] = result.answer;
      updateData[`${basePath}.parse`] = result.parse;
      updateData[`${basePath}.knowledgePoints`] = result.knowledgePoints;
      updateData[`${basePath}.difficulty`] = result.difficulty;
      updateData[`${basePath}.easyToMistakeDetail`] = result.easyToMistakeDetail;
    }

    // 6. 添加分析完成标记
    updateData["analysisReport.isDone"] = true;

    // 执行更新
    await updateExamPaper(examId, updateData);

    // 7. 更新试卷统计数据
    const statisticsResult = await updateExamPaperStatistics(examId);
    return {
      success: true,
      updatedCount: analysisResults.length,
      statistics: statisticsResult.statistics || {
        missingAnswerCount: 0,
        missingParseCount: 0,
        missingKnowledgePointCount: 0,
        missingCoordinateCount: 0
      }
    };
  } catch (error) {
    console.error("保存解析结果失败:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "保存失败"
    };
  }
}


export async function getExternalAnalysisData(examId) {
  try {
    // 获取AI响应格式要求配置
    const formatSettings = await getSetting("ai_response_format_requirement");
    const formatRequirement = formatSettings.ai_response_format_requirement || "";

    // 生成分析文本
    const analysisText = await generateAnalysisTextForAI(examId);
    return {
      success: true,
      aiResponseFormat: formatRequirement,
      analysisText: analysisText || ""
    };
  } catch (error) {
    console.error("获取站外分析数据失败:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "获取数据失败",
      aiResponseFormat: "",
      analysisText: ""
    };
  }
}
