"use server";

import { addDoc, allDocs, getDoc } from "../../../../../../lib/common/database.js";
import { timestamp } from "../../../../../../lib/common/time.js";

// 集合名称常量
const EXAM_PAPER_COLL = "exam_paper";
const EXAM_PAGE_INFO_COLL = "exam_page_info";


export async function getExamPaperData(examId) {
  return await getDoc(EXAM_PAPER_COLL, examId);
}


export async function createEmptyExamPaper() {
  const emptyPaperData = {
    isLocked: false,
    title: "临时试卷",
    subject: "未知",
    pdfPath: "",
    pdfUrl: "",
    pdfFileID: "",
    cuttingStatus: "waiting",
    pages: [],
    created: timestamp(),
    updated: timestamp()
  };
  return await addDoc(EXAM_PAPER_COLL, emptyPaperData);
}


export async function updateExamPaperData(examId, paperData) {
  const updateData = {
    ...paperData,
    updated: timestamp()
  };
  const {
    updateDoc
  } = await import("../../../../../../lib/common/database");
  return await updateDoc(EXAM_PAPER_COLL, examId, updateData);
}


export async function getExamPageInfos(examId) {
  const result = await allDocs({
    c: EXAM_PAGE_INFO_COLL,
    match: {
      examPaperId: examId
    },
    sort: {
      pageNumber: 1
    }
  });
  return result;
}


export async function createPageInfos(pageInfos) {
  if (pageInfos.length === 0) return;
  const {
    addDocList
  } = await import("../../../../../../lib/common/database");
  await addDocList(EXAM_PAGE_INFO_COLL, pageInfos);
}
