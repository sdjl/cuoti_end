"use server";

import { allDocs, command, updateDoc } from "../../../../../../../lib/common/database.js";

// 数据库集合名称常量
const EXAM_QUESTION_COLLECTION = "exam_question";

/**
 * 搜索题目
 */
export async function searchQuestions(params) {
  try {
    const _ = command();

    // 构建所有查询条件
    const conditions = [];

    // 基础条件：只搜索选择题
    conditions.push({
      questionType: "选择题"
    });

    // 题目文本搜索 - 支持AND关系，按空格分割多个词语
    if (params.questionText.trim()) {
      const searchTerms = params.questionText.trim().split(/\s+/).filter(term => term.length > 0);

      // 每个搜索词都作为一个条件添加
      searchTerms.forEach(term => {
        conditions.push({
          questionText: new RegExp(term, "i")
        });
      });
    }

    // 知识点搜索 - 使用OR关系，使用微信云数据库的_.in()语法
    if (params.knowledgePoints.length > 0) {
      conditions.push({
        knowledgePoints: _.in(params.knowledgePoints)
      });
    }

    // 难度搜索
    if (params.difficulty) {
      conditions.push({
        difficulty: params.difficulty
      });
    }

    // 使用_.and组合所有条件
    const match = conditions.length > 1 ? _.and(...conditions) : conditions[0];
    const questions = await allDocs({
      c: EXAM_QUESTION_COLLECTION,
      match,
      sort: {
        _id: -1
      },
      limit: 100 // 限制返回数量
    });
    return questions || [];
  } catch (error) {
    console.error("搜索题目失败:", error);
    return [];
  }
}

/**
 * 批量获取题目详情
 */
export async function getQuestionsByIds(questionIds) {
  try {
    if (questionIds.length === 0) {
      return [];
    }
    const _ = command();
    const questions = await allDocs({
      c: EXAM_QUESTION_COLLECTION,
      match: {
        _id: _.in(questionIds)
      }
    });
    return questions || [];
  } catch (error) {
    console.error("获取题目详情失败:", error);
    return [];
  }
}

/**
 * 更新题目的parse字段
 */
export async function updateQuestionParse(questionId, parse) {
  try {
    const result = await updateDoc(EXAM_QUESTION_COLLECTION, questionId, {
      parse
    });
    return result !== null;
  } catch (error) {
    console.error("更新题目解析失败:", error);
    return false;
  }
}
