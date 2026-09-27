"use server";

import { getExamPaperById, updateExamPaper } from "../../../../../../lib/collection/examPaper.js";
import { deleteCosFile, downloadCosFile, generateCosUploadInfo } from "../../../../../../lib/common/cosFile.js";
import { getFileURL, uploadFile } from "../../../../../../lib/common/file.js";


export async function generateUploadUrl(fileName) {
  try {
    const uploadInfo = await generateCosUploadInfo(fileName);
    return {
      success: true,
      data: uploadInfo
    };
  } catch (error) {
    console.error("生成上传URL失败:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "生成上传URL失败"
    };
  }
}


export async function uploadAnalysisPdfWithCosFile(data) {
  try {
    const {
      examId,
      cosKey,
      pdfText
    } = data;

    // 验证必要字段
    if (!examId || !cosKey) {
      return {
        success: false,
        message: "缺少必要字段"
      };
    }

    // 获取试卷信息
    const examDoc = await getExamPaperById(examId);
    if (!examDoc) {
      return {
        success: false,
        message: "试卷不存在"
      };
    }

    // 从COS下载文件
    const fileBuffer = await downloadCosFile(cosKey);

    // 上传文件到CloudBase云存储
    const pdfPath = `cuoti/exam/${examId}/pdf/exam_paper_with_parse.pdf`;
    const uploadResult = await uploadFile(pdfPath, fileBuffer);
    const pdfFileID = uploadResult.fileID;

    // 删除COS临时文件
    await deleteCosFile(cosKey);

    // 获取文件访问链接
    const pdfUrl = await getFileURL(pdfFileID, true);

    // 更新试卷解析报告信息
    await updateExamPaper(examId, {
      analysisReport: {
        hasUploadedPdfWithParse: true,
        isDone: false,
        pdfWithParsePath: pdfPath,
        pdfWithParseUrl: pdfUrl,
        pdfWithParseFileID: pdfFileID,
        pdfWithParseText: pdfText || "",
        // 保存提取的PDF文本内容
        missingAnswerCount: null,
        missingParseCount: null,
        missingKnowledgePointCount: null,
        missingCoordinateCount: null
      },
      updated: Date.now()
    });
    return {
      success: true,
      message: "解析PDF上传成功"
    };
  } catch (error) {
    console.error("上传解析PDF失败:", error);
    return {
      success: false,
      message: `上传解析PDF失败: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}
