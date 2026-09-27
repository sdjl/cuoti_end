"use server";

import { getExamPaperById, updateExamPaper } from "../../../../../lib/collection/examPaper.js";
import { cropAndUploadQuestionImages, cutPageQuestion, splitPdfFile } from "../../../../../lib/utils/examCutting.js";
import { getSetting } from "../../../../../lib/utils/setting.js";


export async function startAsyncCutting(examId) {
  try {
    // 获取试卷信息
    const examPaper = await getExamPaperById(examId);
    if (!examPaper) {
      throw new Error("试卷不存在");
    }

    // 更新试卷状态为正在处理
    await updateExamPaper(examId, {
      cuttingStatus: "pdf_splitting",
      cuttingError: "",
      updated: Date.now()
    });

    // 启动异步任务
    runCuttingTask(examId).catch(async error => {
      console.error("异步切题任务失败:", error);

      // 如果异步任务失败，更新试卷状态
      await updateExamPaper(examId, {
        cuttingStatus: "failed",
        cuttingError: error instanceof Error ? error.message : String(error),
        updated: Date.now()
      });
    });
    return true;
  } catch (error) {
    console.error("启动异步切题任务失败:", error);
    return false;
  }
}

/**
 * 异步运行切题任务的函数（不会直接返回结果给客户端）
 */
async function runCuttingTask(examId) {
  // 第一步：拆分PDF
  const splitSuccess = await splitPdfFile(examId);
  if (!splitSuccess) {
    throw new Error("拆分PDF失败");
  }

  // 第二步：切题识别
  const cutSuccess = await cutPageQuestion(examId);
  if (!cutSuccess) {
    throw new Error("切题识别失败");
  }

  // 第三步：裁剪和上传问题图片
  const cropSuccess = await cropAndUploadQuestionImages(examId);
  if (!cropSuccess) {
    throw new Error("裁剪和上传问题图片失败");
  }
}


export async function checkCuttingStatus(examId) {
  try {
    // 获取试卷信息
    const examPaper = await getExamPaperById(examId);
    if (!examPaper) {
      return {
        status: "error",
        error: "试卷不存在",
        isCompleted: true
      };
    }
    const status = examPaper.cuttingStatus || "waiting";
    const error = examPaper.cuttingError || undefined;

    // 判断是否完成（无论成功还是失败）
    const isCompleted = status === "done" || status === "failed";
    return {
      status,
      error,
      isCompleted
    };
  } catch (error) {
    console.error("检查切题状态失败:", error);
    return {
      status: "error",
      error: error instanceof Error ? error.message : String(error),
      isCompleted: true
    };
  }
}


export async function getCuttingServiceInfo() {
  try {
    const settings = await getSetting("cutting_service_config");
    const provider = settings.cutting_service_config?.provider || "tencent";
    const name = provider === "tencent" ? "腾讯云切题服务" : "阿里云切题服务";
    return {
      provider,
      name
    };
  } catch (error) {
    console.error("获取切题服务信息失败:", error);
    // 返回默认值
    return {
      provider: "tencent",
      name: "腾讯云切题服务"
    };
  }
}


export async function step1SplitPdf(examId) {
  try {
    // 调用拆分函数
    const success = await splitPdfFile(examId);

    // 如果拆分成功，自动开始切题识别
    if (success) {
      return await step2SplitQuestion(examId);
    }
    return success;
  } catch (error) {
    console.error("拆分PDF失败:", error);
    return false;
  }
}


export async function step2SplitQuestion(examId) {
  try {
    // 调用切题识别函数
    const success = await cutPageQuestion(examId);

    // 如果切题识别成功，自动开始裁剪和上传问题图片
    if (success) {
      return await step3CropAndUploadQuestionImages(examId);
    }
    return success;
  } catch (error) {
    console.error("试卷切题识别失败:", error);
    return false;
  }
}


export async function step3CropAndUploadQuestionImages(examId) {
  try {
    // 调用裁剪和上传问题图片函数
    const success = await cropAndUploadQuestionImages(examId);
    return success;
  } catch (error) {
    console.error("裁剪和上传问题图片失败:", error);
    return false;
  }
}
