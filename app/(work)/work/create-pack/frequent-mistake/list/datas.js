"use server";

import { allDocs, command, count, docs, getDoc, updateDoc } from "../../../../../../lib/common/database.js";
import { deletePdfFile, generateAnswersPdf, generateQuestionsPdf } from "./pdfOperations.js";

/**
 * 构建查询条件的公共函数
 *
 * 注意：此函数不导出，仅在本文件内部使用
 */
function buildWhereConditions(params) {
  const _ = command();
  const orList = [];
  const andList = [];

  // 搜索条件（名称或描述）- OR 条件
  if (params.searchTerm?.trim()) {
    const searchRegex = new RegExp(params.searchTerm.trim(), "i");
    orList.push({
      name: searchRegex
    }, {
      description: searchRegex
    });
  }

  // 校园ID筛选 - AND 条件（必须）
  andList.push({
    schoolId: params.schoolId
  });

  // 科目筛选 - AND 条件
  if (params.subject && params.subject !== "all") {
    andList.push({
      subject: params.subject
    });
  }

  // 生成方式筛选 - AND 条件
  if (params.generationType && params.generationType !== "all") {
    andList.push({
      generationType: params.generationType
    });
  }

  // 构建最终的查询条件
  let whereConditions = {};
  if (orList.length > 0 && andList.length > 0) {
    whereConditions = _.and(_.or(...orList), ...andList);
  } else if (orList.length > 0) {
    whereConditions = _.or(...orList);
  } else if (andList.length > 0) {
    whereConditions = _.and(...andList);
  }
  return whereConditions;
}

/**
 * 获取高频错题集分页数据
 */
export async function getFrequentMistakesFromDB(params) {
  // 调用内部函数构建查询条件
  const whereConditions = buildWhereConditions({
    schoolId: params.schoolId,
    searchTerm: params.searchTerm,
    subject: params.subject,
    generationType: params.generationType
  });
  const result = await docs({
    c: "frequent_mistake",
    w: whereConditions,
    orderBy: {
      created: -1
    },
    // 按创建时间逆序排序（最新在前）
    pageNum: params.pageNum,
    pageSize: params.pageSize
  });
  return result;
}

/**
 * 获取高频错题集总数
 */
export async function getFrequentMistakesCountFromDB(params) {
  // 调用内部函数构建查询条件
  const whereConditions = buildWhereConditions({
    schoolId: params.schoolId,
    searchTerm: params.searchTerm,
    subject: params.subject,
    generationType: params.generationType
  });
  return await count("frequent_mistake", whereConditions);
}

/**
 * 根据题目ID列表获取题目详情
 */
export async function getQuestionsByIdsFromDB(questionIds) {
  if (questionIds.length === 0) {
    return [];
  }
  const _ = command();
  const questions = await allDocs({
    c: "exam_question",
    match: {
      _id: _.in(questionIds)
    },
    only: "_id,questionType,knowledgePoints,difficulty,imageUrl,imageHeight,imageWidth,easyToMistakeDetail"
  });
  return questions;
}

/**
 * 生成题目PDF并保存到云存储
 */
export async function generateQuestionsPdfData(frequentMistakeId) {
  try {
    // 调用PDF操作函数生成PDF
    const pdfResult = await generateQuestionsPdf(frequentMistakeId);
    if (!pdfResult.success || !pdfResult.data) {
      return {
        success: false,
        error: pdfResult.error || "生成PDF失败"
      };
    }

    // 更新高频错题集记录
    const pdfInfo = {
      fileId: pdfResult.data.fileId,
      fileUrl: pdfResult.data.fileUrl,
      filePath: pdfResult.data.filePath,
      createdAt: Date.now()
    };
    await updateDoc("frequent_mistake", frequentMistakeId, {
      questionsPdf: pdfInfo
    });
    return {
      success: true,
      data: pdfResult.data
    };
  } catch (error) {
    console.error("生成题目PDF失败:", error);
    return {
      success: false,
      error: "生成PDF失败"
    };
  }
}

/**
 * 生成答案PDF并保存到云存储
 */
export async function generateAnswersPdfData(frequentMistakeId) {
  try {
    // 调用PDF操作函数生成PDF
    const pdfResult = await generateAnswersPdf(frequentMistakeId);
    if (!pdfResult.success || !pdfResult.data) {
      return {
        success: false,
        error: pdfResult.error || "生成PDF失败"
      };
    }

    // 更新高频错题集记录
    const pdfInfo = {
      fileId: pdfResult.data.fileId,
      fileUrl: pdfResult.data.fileUrl,
      filePath: pdfResult.data.filePath,
      createdAt: Date.now()
    };
    await updateDoc("frequent_mistake", frequentMistakeId, {
      answersPdf: pdfInfo
    });
    return {
      success: true,
      data: pdfResult.data
    };
  } catch (error) {
    console.error("生成答案PDF失败:", error);
    return {
      success: false,
      error: "生成PDF失败"
    };
  }
}

/**
 * 删除题目PDF
 */
export async function deleteQuestionsPdfData(frequentMistakeId) {
  try {
    const frequentMistake = await getDoc("frequent_mistake", frequentMistakeId);
    if (!frequentMistake || !frequentMistake.questionsPdf) {
      return {
        success: false,
        error: "PDF文件不存在"
      };
    }

    // 删除云存储文件
    const deleteResult = await deletePdfFile(frequentMistake.questionsPdf.fileId);
    if (!deleteResult.success) {
      console.error("删除云存储文件失败:", deleteResult.error);
    }

    // 更新高频错题集记录
    await updateDoc("frequent_mistake", frequentMistakeId, {
      questionsPdf: command().remove()
    });
    return {
      success: true
    };
  } catch (error) {
    console.error("删除题目PDF失败:", error);
    return {
      success: false,
      error: "删除PDF失败"
    };
  }
}

/**
 * 删除答案PDF
 */
export async function deleteAnswersPdfData(frequentMistakeId) {
  try {
    const frequentMistake = await getDoc("frequent_mistake", frequentMistakeId);
    if (!frequentMistake || !frequentMistake.answersPdf) {
      return {
        success: false,
        error: "PDF文件不存在"
      };
    }

    // 删除云存储文件
    const deleteResult = await deletePdfFile(frequentMistake.answersPdf.fileId);
    if (!deleteResult.success) {
      console.error("删除云存储文件失败:", deleteResult.error);
    }

    // 更新高频错题集记录
    await updateDoc("frequent_mistake", frequentMistakeId, {
      answersPdf: command().remove()
    });
    return {
      success: true
    };
  } catch (error) {
    console.error("删除答案PDF失败:", error);
    return {
      success: false,
      error: "删除PDF失败"
    };
  }
}
