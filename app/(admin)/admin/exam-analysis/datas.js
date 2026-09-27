"use server";

import { command, count, docs } from "../../../../lib/common/database.js";

/**
 * 试卷集合名
 */
const EXAM_PAPER_COLL = "exam_paper";

/**
 * 构建试卷解析查询条件
 */
function buildExamPapersAnalysisCondition({
  keyword = "",
  hasUploadedPdfWithParse = null,
  isDone = null,
  isLocked = null
}) {
  const _ = command();

  // 构建基础查询条件
  const baseWhere = {};

  // 添加锁定状态筛选条件
  if (isLocked !== null) {
    baseWhere.isLocked = isLocked;
  }

  // 添加解析报告相关筛选条件
  if (hasUploadedPdfWithParse !== null) {
    if (hasUploadedPdfWithParse === false) {
      // 查询 hasUploadedPdfWithParse 为 false 或 analysisReport 不存在的情况
      baseWhere.$or = [{
        "analysisReport.hasUploadedPdfWithParse": false
      }, {
        analysisReport: {
          $exists: false
        }
      }];
    } else {
      // 查询 hasUploadedPdfWithParse 为 true 的情况
      baseWhere["analysisReport.hasUploadedPdfWithParse"] = true;
    }
  }
  if (isDone !== null) {
    if (isDone === false) {
      // 查询 isDone 为 false 或 analysisReport 不存在的情况
      baseWhere.$or = [{
        "analysisReport.isDone": false
      }, {
        analysisReport: {
          $exists: false
        }
      }];
    } else {
      // 查询 isDone 为 true 的情况
      baseWhere["analysisReport.isDone"] = true;
    }
  }

  // 如果同时筛选 hasUploadedPdfWithParse 和 isDone，需要特殊处理
  if (hasUploadedPdfWithParse === false && isDone === false) {
    baseWhere.$or = [{
      $and: [{
        "analysisReport.hasUploadedPdfWithParse": false
      }, {
        "analysisReport.isDone": false
      }]
    }, {
      analysisReport: {
        $exists: false
      }
    }];
  }

  // 处理查询条件
  let queryCondition;

  // 如果有关键词，添加模糊查询
  if (keyword) {
    // 拆分关键词，支持多个关键词AND查询
    const keywords = keyword.trim().split(/\s+/);
    if (keywords.length === 1) {
      // 单个关键词 - 直接在 baseWhere 中添加
      baseWhere.title = new RegExp(`.*${keywords[0]}.*`, "i");
      queryCondition = baseWhere;
    } else {
      // 多个关键词 - 使用 command 的 and 操作符
      const titleConditions = keywords.map(key => ({
        title: new RegExp(`.*${key}.*`, "i")
      }));

      // 如果有基础条件，则添加到查询条件中
      if (Object.keys(baseWhere).length > 0) {
        queryCondition = _.and([baseWhere, ...titleConditions]);
      } else {
        // 只有标题关键词条件
        queryCondition = _.and(titleConditions);
      }
    }
  } else {
    // 没有关键词，使用基础条件
    queryCondition = baseWhere;
  }
  return queryCondition;
}

/**
 * 从数据库获取试卷解析列表（分页）
 */
export async function getExamPapersAnalysisFromDB({
  pageNum = 0,
  pageSize = 20,
  keyword = "",
  hasUploadedPdfWithParse = null,
  isDone = null,
  isLocked = null
}) {
  const queryCondition = buildExamPapersAnalysisCondition({
    keyword,
    hasUploadedPdfWithParse,
    isDone,
    isLocked
  });

  // 限制最大分页大小为1000
  const actualPageSize = Math.min(pageSize, 1000);

  // 查询数据
  return await docs({
    c: EXAM_PAPER_COLL,
    w: queryCondition,
    pageNum,
    pageSize: actualPageSize,
    orderBy: {
      created: -1
    } // 默认按创建时间降序排序
  });
}

/**
 * 从数据库获取试卷解析总数
 */
export async function getExamPapersAnalysisCountFromDB({
  keyword = "",
  hasUploadedPdfWithParse = null,
  isDone = null,
  isLocked = null
}) {
  const queryCondition = buildExamPapersAnalysisCondition({
    keyword,
    hasUploadedPdfWithParse,
    isDone,
    isLocked
  });
  return await count(EXAM_PAPER_COLL, queryCondition);
}
