"use server";

import { getExamPaperById, updateExamPaper, updateExamPaperStatistics } from "../../../../../../../../../lib/collection/examPaper.js";
import { updateExamQuestion } from "../../../../../../../../../lib/collection/examQuestion.js";
import { command } from "../../../../../../../../../lib/common/database.js";

/**
 * 获取试卷中特定题目的数据
 */
export async function getQuestionData(examId, questionNumber, pageNumber) {
  const examPaper = await getExamPaperById(examId);
  if (!examPaper) {
    throw new Error("试卷不存在");
  }

  // 如果提供了页码，先尝试在指定页面查找题目
  if (pageNumber) {
    const page = examPaper.pages.find(p => p.pageNumber === pageNumber);
    if (page) {
      const question = page.questions.find(q => q.questionNumber === questionNumber);
      if (question) {
        return {
          examPaper,
          pageNumber: page.pageNumber,
          question,
          subject: examPaper.subject
        };
      }
    }
  }

  // 如果没有找到或未提供页码，查找所有页中的指定题目
  for (const page of examPaper.pages) {
    const question = page.questions.find(q => q.questionNumber === questionNumber);
    if (question) {
      return {
        examPaper,
        pageNumber: page.pageNumber,
        question,
        subject: examPaper.subject
      };
    }
  }
  throw new Error("题目不存在");
}

/**
 * 更新题目内容
 */
export async function updateQuestionContent(examId, pageNumber, questionNumber, data) {
  try {
    // 获取试卷数据
    const examPaper = await getExamPaperById(examId);
    if (!examPaper) {
      throw new Error("试卷不存在");
    }

    // 查找页面索引
    const pageIndex = examPaper.pages.findIndex(page => page.pageNumber === pageNumber);
    if (pageIndex === -1) {
      throw new Error("页面不存在");
    }

    // 查找题目索引
    const questionIndex = examPaper.pages[pageIndex].questions.findIndex(q => q.questionNumber === questionNumber);
    if (questionIndex === -1) {
      throw new Error("题目不存在");
    }

    // 创建要更新的数据对象
    const updateData = {
      [`pages.${pageIndex}.questions.${questionIndex}.questionType`]: data.questionType,
      [`pages.${pageIndex}.questions.${questionIndex}.questionText`]: data.questionText,
      [`pages.${pageIndex}.questions.${questionIndex}.answer`]: data.answer,
      [`pages.${pageIndex}.questions.${questionIndex}.parse`]: data.parse,
      [`pages.${pageIndex}.questions.${questionIndex}.knowledgePoints`]: data.knowledgePoints,
      [`pages.${pageIndex}.questions.${questionIndex}.difficulty`]: data.difficulty,
      [`pages.${pageIndex}.questions.${questionIndex}.easyToMistakeDetail`]: data.easyToMistakeDetail,
      [`pages.${pageIndex}.questions.${questionIndex}.videoId`]: data.videoId
    };

    // 处理答案图片：如果传入了 answerImage（包括 null 表示删除），则更新
    if (data.answerImage !== undefined) {
      if (data.answerImage === null) {
        // 删除答案图片
        updateData[`pages.${pageIndex}.questions.${questionIndex}.answerImage`] = command().remove();
      } else {
        // 更新答案图片
        updateData[`pages.${pageIndex}.questions.${questionIndex}.answerImage`] = data.answerImage;
      }
    }

    // 处理解析图片：如果传入了 parseImage（包括 null 表示删除），则更新
    if (data.parseImage !== undefined) {
      if (data.parseImage === null) {
        // 删除解析图片
        updateData[`pages.${pageIndex}.questions.${questionIndex}.parseImage`] = command().remove();
      } else {
        // 更新解析图片
        updateData[`pages.${pageIndex}.questions.${questionIndex}.parseImage`] = data.parseImage;
      }
    }

    // 更新试卷数据
    const result = await updateExamPaper(examId, updateData);

    // 更新试卷统计数据
    if (result) {
      await updateExamPaperStatistics(examId);

      // 同步更新exam_question集合中的数据
      // 构建更新数据，处理图片字段的删除情况
      const examQuestionUpdateData = {
        questionType: data.questionType,
        questionText: data.questionText,
        answer: data.answer,
        parse: data.parse,
        knowledgePoints: data.knowledgePoints,
        difficulty: data.difficulty,
        easyToMistakeDetail: data.easyToMistakeDetail,
        videoId: data.videoId
      };

      // 处理答案图片
      if (data.answerImage !== undefined) {
        if (data.answerImage === null) {
          examQuestionUpdateData.answerImage = command().remove();
        } else {
          examQuestionUpdateData.answerImage = data.answerImage;
        }
      }

      // 处理解析图片
      if (data.parseImage !== undefined) {
        if (data.parseImage === null) {
          examQuestionUpdateData.parseImage = command().remove();
        } else {
          examQuestionUpdateData.parseImage = data.parseImage;
        }
      }
      await updateExamQuestion(examQuestionUpdateData, {
        examPaperId: examId,
        pageNumber: pageNumber,
        questionNumber: questionNumber
      });
    }
    return result;
  } catch (error) {
    console.error("更新题目内容失败:", error);
    throw error;
  }
}
