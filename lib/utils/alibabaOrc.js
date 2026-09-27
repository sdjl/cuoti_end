"use server";

/**
 * 阿里云OCR API 文档：https://help.aliyun.com/zh/ocr/developer-reference/api-ocr-api-2021-07-07-recognizeedupapercut?spm=a2c4g.11186623.help-menu-252763.d_3_2_4_6_3.6f652e2axYLarZ&accounttraceid=88bf5dc4e1db4351bd1231872311785eawdt
 */
import { request } from "./alibabaOpenApiV3.js";

/**
 * 阿里云试卷切题请求参数类型
 */

/**
 * 科目中英文转换映射表
 */
const SUBJECT_MAP = {
  默认: "default",
  数学: "Math",
  语文: "Chinese",
  英语: "English",
  物理: "Physics",
  化学: "Chemistry",
  生物: "Biology",
  历史: "History",
  地理: "Geography",
  政治: "Politics"
};


function convertSubjectToEnglish(chineseSubject) {
  const trimmedSubject = chineseSubject.trim();
  return SUBJECT_MAP[trimmedSubject] || "default";
}


export async function callQuestionSplitOCR(params) {
  const {
    Url,
    cutType = "question",
    imageType = "scan",
    subject,
    outputOricoord = false
  } = params;

  // 验证输入参数
  if (!Url || !Url.trim()) {
    throw new Error("图片URL不能为空");
  }
  if (!["question", "answer"].includes(cutType)) {
    throw new Error("CutType参数必须是 question 或 answer");
  }
  if (imageType && !["scan", "photo"].includes(imageType)) {
    throw new Error("ImageType参数必须是 scan 或 photo");
  }

  // 验证URL格式
  try {
    new URL(Url);
  } catch {
    throw new Error("图片URL格式不正确");
  }

  // 构建请求参数 - 根据官方文档使用正确的参数名
  const requestParams = {
    Url: Url,
    CutType: cutType,
    ImageType: imageType,
    OutputOricoord: outputOricoord
  };

  // 如果指定了学科，转换为英文后添加到请求参数中
  if (subject?.trim()) {
    const englishSubject = convertSubjectToEnglish(subject);
    requestParams.Subject = englishSubject;
  }
  try {
    // 调用阿里云API，固定使用杭州区域 - 使用query参数传递
    const apiRequest = {
      action: "RecognizeEduPaperCut",
      version: "2021-07-07",
      endpoint: "ocr-api.cn-hangzhou.aliyuncs.com",
      method: "POST",
      query: requestParams
    };
    const response = await request(apiRequest);

    // 检查是否有错误返回
    if (response.data && typeof response.data === "object") {
      const data = response.data;
      if (data.Message && typeof data.Message === "string" && data.Message.includes("Error")) {
        throw new Error(`API返回错误：${data.Message}`);
      }
    }
    const resultJson = JSON.stringify(response.data);
    return resultJson;
  } catch (error) {
    console.error("调用阿里云试卷切题API失败：", error);
    throw error;
  }
}
