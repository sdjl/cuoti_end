"use server";

import { downloadFile, uploadFile } from "../../../../../../lib/common/file.js";
import { createEmptyExamPaper, createPageInfos, getExamPageInfos, getExamPaperData, updateExamPaperData } from "./datas.js";


export async function getExamPaperInfo(examId) {
  return await getExamPaperData(examId);
}


export async function copyExamPaper(sourceExamId) {
  // 1. 获取源试卷数据
  const sourceExam = await getExamPaperData(sourceExamId);
  if (!sourceExam) {
    throw new Error("源试卷不存在");
  }
  if (!sourceExam.isLocked) {
    throw new Error("只能复制已锁定的试卷");
  }

  // 2. 创建一个空的试卷记录，获取数据库生成的ID
  const newExamId = await createEmptyExamPaper();

  // 3. 创建新的试卷数据（基础字段）
  const newExamData = await createNewExamData(sourceExam, newExamId);

  // 4. 更新试卷记录为完整数据
  await updateExamPaperData(newExamId, newExamData);

  // 5. 复制页面信息数据（切题缓存数据）
  await copyPageInfoData(sourceExamId, newExamId);

  // 6. 复制所有文件（PDF和图片）
  await copyExamFiles(sourceExam, newExamId);
  return newExamId;
}


async function createNewExamData(sourceExam, newExamId) {
  // 复制页面数据，替换文件路径中的试卷ID
  const newPages = sourceExam.pages.map(page => ({
    ...page,
    pdfPath: replaceExamIdInPath(page.pdfPath, sourceExam._id, newExamId),
    pdfUrl: replaceExamIdInPath(page.pdfUrl, sourceExam._id, newExamId),
    pdfFileID: replaceExamIdInPath(page.pdfFileID, sourceExam._id, newExamId),
    imagePath: page.imagePath ? replaceExamIdInPath(page.imagePath, sourceExam._id, newExamId) : undefined,
    imageUrl: page.imageUrl ? replaceExamIdInPath(page.imageUrl, sourceExam._id, newExamId) : undefined,
    imageFileID: page.imageFileID ? replaceExamIdInPath(page.imageFileID, sourceExam._id, newExamId) : undefined,
    questions: page.questions.map(question => ({
      ...question,
      imagePath: question.imagePath ? replaceExamIdInPath(question.imagePath, sourceExam._id, newExamId) : undefined,
      imageUrl: question.imageUrl ? replaceExamIdInPath(question.imageUrl, sourceExam._id, newExamId) : undefined,
      imageFileID: question.imageFileID ? replaceExamIdInPath(question.imageFileID, sourceExam._id, newExamId) : undefined
    }))
  }));

  // 复制解析报告路径（如果存在）
  let newAnalysisReport;
  if (sourceExam.analysisReport) {
    newAnalysisReport = {
      ...sourceExam.analysisReport,
      pdfWithParsePath: replaceExamIdInPath(sourceExam.analysisReport.pdfWithParsePath, sourceExam._id, newExamId),
      pdfWithParseUrl: replaceExamIdInPath(sourceExam.analysisReport.pdfWithParseUrl, sourceExam._id, newExamId),
      pdfWithParseFileID: replaceExamIdInPath(sourceExam.analysisReport.pdfWithParseFileID, sourceExam._id, newExamId)
    };
  }
  return {
    _id: newExamId,
    isLocked: false,
    // 新试卷未锁定
    cuttingStatus: "done",
    // 设置为已完成状态
    title: `${sourceExam.title}（副本）`,
    // 添加副本后缀
    subject: sourceExam.subject,
    description: sourceExam.description,
    questionCount: sourceExam.questionCount,
    pdfPageCount: sourceExam.pdfPageCount,
    pdfPath: replaceExamIdInPath(sourceExam.pdfPath, sourceExam._id, newExamId),
    pdfUrl: replaceExamIdInPath(sourceExam.pdfUrl, sourceExam._id, newExamId),
    pdfFileID: replaceExamIdInPath(sourceExam.pdfFileID, sourceExam._id, newExamId),
    pages: newPages,
    analysisReport: newAnalysisReport
    // 不复制以下字段：questionPackId, cuttingError
  };
}


async function copyPageInfoData(sourceExamId, newExamId) {
  const sourcePageInfos = await getExamPageInfos(sourceExamId);
  if (sourcePageInfos.length === 0) return;
  const newPageInfos = sourcePageInfos.map(pageInfo => ({
    examPaperId: newExamId,
    pageNumber: pageInfo.pageNumber,
    result: pageInfo.result,
    cuttingServiceProvider: pageInfo.cuttingServiceProvider
  }));
  await createPageInfos(newPageInfos);
}


async function copyExamFiles(sourceExam, newExamId) {
  const fileCopyTasks = [];

  // 1. 复制主PDF文件
  if (sourceExam.pdfFileID) {
    fileCopyTasks.push(copyFileToNewPath(sourceExam.pdfFileID, replaceExamIdInPath(sourceExam.pdfPath, sourceExam._id, newExamId)));
  }

  // 2. 复制解析PDF文件
  if (sourceExam.analysisReport?.pdfWithParseFileID) {
    fileCopyTasks.push(copyFileToNewPath(sourceExam.analysisReport.pdfWithParseFileID, replaceExamIdInPath(sourceExam.analysisReport.pdfWithParsePath, sourceExam._id, newExamId)));
  }

  // 3. 复制页面文件
  for (const page of sourceExam.pages) {
    // 复制页面PDF
    if (page.pdfFileID) {
      fileCopyTasks.push(copyFileToNewPath(page.pdfFileID, replaceExamIdInPath(page.pdfPath, sourceExam._id, newExamId)));
    }

    // 复制页面图片
    if (page.imageFileID && page.imagePath) {
      fileCopyTasks.push(copyFileToNewPath(page.imageFileID, replaceExamIdInPath(page.imagePath, sourceExam._id, newExamId)));
    }

    // 4. 复制题目图片
    for (const question of page.questions) {
      if (question.imageFileID && question.imagePath) {
        fileCopyTasks.push(copyFileToNewPath(question.imageFileID, replaceExamIdInPath(question.imagePath, sourceExam._id, newExamId)));
      }
    }
  }

  // 并行执行所有文件复制任务
  await Promise.all(fileCopyTasks);
}


async function copyFileToNewPath(sourceFileID, newPath) {
  try {
    // 下载源文件
    const downloadResult = await downloadFile(sourceFileID);
    if (!downloadResult.fileContent) {
      console.warn(`下载文件失败: ${sourceFileID}`);
      return;
    }

    // 上传到新路径
    await uploadFile(newPath, downloadResult.fileContent);
  } catch (error) {
    console.error(`复制文件失败 ${sourceFileID} -> ${newPath}:`, error);
    // 不抛出错误，继续复制其他文件
  }
}


function replaceExamIdInPath(originalPath, sourceExamId, newExamId) {
  return originalPath.replace(new RegExp(`/exam/${sourceExamId}/`, "g"), `/exam/${newExamId}/`);
}
