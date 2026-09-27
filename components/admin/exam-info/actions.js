"use server";

import { updateExamPaper } from "../../../lib/collection/examPaper.js";
import { getDoc } from "../../../lib/common/database.js";


export async function getExamPaper(examPaperId) {
  try {
    // 获取试卷数据
    const examPaperDoc = await getDoc("exam_paper", examPaperId);
    if (!examPaperDoc) {
      console.error("找不到试卷:", examPaperId);
      return null;
    }
    return examPaperDoc;
  } catch (error) {
    console.error("获取试卷信息失败:", error);
    return null;
  }
}


export async function updateQuestionType(examPaperId, pageNumber, questionNumber, questionType) {
  try {
    // 获取试卷数据
    const examPaperDoc = await getDoc("exam_paper", examPaperId);
    if (!examPaperDoc) {
      console.error("找不到试卷:", examPaperId);
      return false;
    }

    // 先转换为unknown，再转换为ExamPaperDoc类型
    const examPaper = examPaperDoc;

    // 深拷贝试卷数据中的pages以避免直接修改原始数据
    const updatedPages = JSON.parse(JSON.stringify(examPaper.pages));

    // 查找对应的页面
    const pageIndex = updatedPages.findIndex(page => page.pageNumber === pageNumber);
    if (pageIndex === -1) {
      console.error("找不到页面:", pageNumber);
      return false;
    }

    // 查找对应的题目
    const questionIndex = updatedPages[pageIndex].questions.findIndex(q => q.questionNumber === questionNumber);
    if (questionIndex === -1) {
      console.error("找不到题目:", questionNumber);
      return false;
    }

    // 更新题目类型
    updatedPages[pageIndex].questions[questionIndex].questionType = questionType;

    // 使用updateExamPaper函数更新数据库
    return await updateExamPaper(examPaperId, {
      pages: updatedPages
    });
  } catch (error) {
    console.error("更新题目类型失败:", error);
    return false;
  }
}


export async function insertEmptyQuestion(examPaperId, pageNumber, questionNumber, isAfter = false) {
  try {
    // 获取试卷数据
    const examPaperDoc = await getDoc("exam_paper", examPaperId);
    if (!examPaperDoc) {
      console.error("找不到试卷:", examPaperId);
      return false;
    }

    // 先转换为unknown，再转换为ExamPaperDoc类型
    const examPaper = examPaperDoc;

    // 深拷贝试卷数据中的pages以避免直接修改原始数据
    const updatedPages = JSON.parse(JSON.stringify(examPaper.pages));

    // 查找对应的页面
    const pageIndex = updatedPages.findIndex(page => page.pageNumber === pageNumber);
    if (pageIndex === -1) {
      console.error("找不到页面:", pageNumber);
      return false;
    }

    // 查找对应的题目
    const questionIndex = updatedPages[pageIndex].questions.findIndex(q => q.questionNumber === questionNumber);
    if (questionIndex === -1) {
      console.error("找不到题目:", questionNumber);
      return false;
    }

    // 计算插入位置
    const insertIndex = isAfter ? questionIndex + 1 : questionIndex;

    // 创建空白题目
    // 如果有参考题目，复制其坐标，否则使用默认值
    const referenceQuestion = updatedPages[pageIndex].questions[questionIndex];
    const newQuestion = {
      questionNumber: -1,
      // 临时值，稍后更新
      leftTop: {
        ...referenceQuestion.leftTop
      },
      rightBottom: {
        ...referenceQuestion.rightBottom
      },
      questionType: "选择题",
      // 默认为选择题
      questionText: "",
      answer: [],
      parse: [],
      difficulty: "未知",
      easyToMistakeDetail: []
    };

    // 插入新题目
    updatedPages[pageIndex].questions.splice(insertIndex, 0, newQuestion);

    // 更新所有题目的序号
    updatedPages[pageIndex].questions.forEach((q, index) => {
      q.questionNumber = index + 1;
    });

    // 使用updateExamPaper函数更新数据库
    return await updateExamPaper(examPaperId, {
      pages: updatedPages
    });
  } catch (error) {
    console.error("插入空白题目失败:", error);
    return false;
  }
}


export async function deleteQuestion(examPaperId, pageNumber, questionNumber) {
  try {
    // 获取试卷数据
    const examPaperDoc = await getDoc("exam_paper", examPaperId);
    if (!examPaperDoc) {
      console.error("找不到试卷:", examPaperId);
      return false;
    }

    // 先转换为unknown，再转换为ExamPaperDoc类型
    const examPaper = examPaperDoc;

    // 深拷贝试卷数据中的pages以避免直接修改原始数据
    const updatedPages = JSON.parse(JSON.stringify(examPaper.pages));

    // 查找对应的页面
    const pageIndex = updatedPages.findIndex(page => page.pageNumber === pageNumber);
    if (pageIndex === -1) {
      console.error("找不到页面:", pageNumber);
      return false;
    }

    // 查找对应的题目
    const questionIndex = updatedPages[pageIndex].questions.findIndex(q => q.questionNumber === questionNumber);
    if (questionIndex === -1) {
      console.error("找不到题目:", questionNumber);
      return false;
    }

    // 删除题目
    updatedPages[pageIndex].questions.splice(questionIndex, 1);

    // 如果删除后没有题目了，返回成功
    if (updatedPages[pageIndex].questions.length === 0) {
      return await updateExamPaper(examPaperId, {
        pages: updatedPages
      });
    }

    // 更新所有题目的序号
    updatedPages[pageIndex].questions.forEach((q, index) => {
      q.questionNumber = index + 1;
    });

    // 使用updateExamPaper函数更新数据库
    return await updateExamPaper(examPaperId, {
      pages: updatedPages
    });
  } catch (error) {
    console.error("删除题目失败:", error);
    return false;
  }
}
