"use server";

import { lockExamPaper } from "../../../../lib/collection/examPaper.js";
import { getExamPapersAnalysisCountFromDB, getExamPapersAnalysisFromDB } from "./datas.js";

/**
 * 获取试卷解析列表
 */
export async function getExamPapersAnalysis({
  pageNum = 0,
  pageSize = 20,
  keyword = "",
  hasUploadedPdfWithParse = null,
  // null表示不筛选
  isDone = null,
  // null表示不筛选
  isLocked = null // null表示不筛选
} = {}) {
  const result = await getExamPapersAnalysisFromDB({
    pageNum,
    pageSize,
    keyword,
    hasUploadedPdfWithParse,
    isDone,
    isLocked
  });
  return result;
}

/**
 * 获取试卷解析总数
 */
export async function getExamPapersAnalysisCount({
  keyword = "",
  hasUploadedPdfWithParse = null,
  // null表示不筛选
  isDone = null,
  // null表示不筛选
  isLocked = null // null表示不筛选
} = {}) {
  return await getExamPapersAnalysisCountFromDB({
    keyword,
    hasUploadedPdfWithParse,
    isDone,
    isLocked
  });
}


export async function lockExamPaperAction(examPaperId) {
  return await lockExamPaper(examPaperId);
}
