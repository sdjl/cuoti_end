"use server";

import { getExamPaperById } from "../../../../../../lib/collection/examPaper.js";


export async function getExamPaperForView(examPaperId) {
  try {
    const examPaper = await getExamPaperById(examPaperId);
    if (!examPaper) {
      console.error("找不到试卷:", examPaperId);
      return null;
    }
    return examPaper;
  } catch (error) {
    console.error("获取试卷数据失败:", error);
    return null;
  }
}
