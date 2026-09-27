"use server";

import { createExamPaper } from "../../../../../lib/collection/examPaper.js";
import { deleteCosFile, downloadCosFile, generateCosTemporaryCredentials, generateCosUploadInfo } from "../../../../../lib/common/cosFile.js";


export async function generateTempCredentials() {
  try {
    const credentials = await generateCosTemporaryCredentials();
    return {
      success: true,
      data: credentials
    };
  } catch (error) {
    console.error("生成临时密钥失败:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "生成临时密钥失败"
    };
  }
}


export async function generateUploadUrl(fileName) {
  try {
    console.log("生成上传URL，文件名:", fileName);
    const uploadInfo = await generateCosUploadInfo(fileName);
    console.log("生成的上传信息:", {
      uploadUrl: uploadInfo.uploadUrl,
      cosKey: uploadInfo.cosKey,
      hasSessionToken: !!uploadInfo.sessionToken,
      bucket: uploadInfo.bucket,
      region: uploadInfo.region
    });
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


export async function createExamPaperWithCosFile(data) {
  try {
    const {
      title,
      subject,
      description,
      notes,
      cosKey
    } = data;

    // 验证必要字段
    if (!title || !subject || !cosKey) {
      return {
        success: false,
        message: "缺少必要字段"
      };
    }
    console.log("开始创建试卷，COS文件路径:", cosKey);

    // 1. 从COS下载文件
    const fileBuffer = await downloadCosFile(cosKey);
    console.log("文件下载成功，大小:", fileBuffer.length);

    // 2. 创建试卷记录并上传到CloudBase
    // createExamPaper 函数会将文件上传到 exam/${examId}/pdf/exam_paper.pdf
    const examId = await createExamPaper({
      title,
      subject,
      description,
      notes,
      isLocked: false
    }, fileBuffer);
    console.log("试卷创建成功，试卷ID:", examId);

    // 3. 删除COS临时文件
    await deleteCosFile(cosKey);
    console.log("COS临时文件删除成功");
    return {
      success: true,
      message: "试卷创建成功",
      examId
    };
  } catch (error) {
    console.error("创建试卷失败:", error);
    return {
      success: false,
      message: `创建试卷失败: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}
