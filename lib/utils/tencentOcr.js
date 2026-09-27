"use server";

/** 注意事项
 * 切题最好开启 EnableImageCrop=true，开启后返回的json中会有ImageBase64字段，此为腾讯修改后的图片
 * 后面的切图需要使用这个图片，否则切出来的图片会有一定的偏差(但是可能会有一定的倾斜？有bug？)
 * 但是在记录题目坐标的时候，可以使用原始PDF，允许一定的误差
 */
import crypto from "node:crypto";

// 腾讯云API相关配置
const SECRET_ID = process.env.TENCENT_SECRET_ID || "";
const SECRET_KEY = process.env.TENCENT_SECRET_KEY || "";
const HOST = "ocr.tencentcloudapi.com";
const SERVICE = "ocr";
const REGION = "ap-guangzhou";
const ACTION = "QuestionSplitOCR";
const VERSION = "2018-11-19";


export async function callQuestionSplitOCR(pdfUrl) {
  try {
    // 请求参数 - 注意：布尔值和数字需要作为原始类型传递，不转为字符串
    const params = {
      ImageUrl: pdfUrl,
      IsPdf: true,
      PdfPageNumber: 1,
      // 固定为1，因为我们每次只处理一页
      EnableImageCrop: true // 开启切边增强和弯曲矫正
    };

    // 生成签名
    const timestamp = Math.floor(Date.now() / 1000);
    const authorization = generateSignature(params, timestamp);

    // 发送请求
    const response = await fetch(`https://${HOST}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        Host: HOST,
        Authorization: authorization,
        "X-TC-Action": ACTION,
        "X-TC-Timestamp": timestamp.toString(),
        "X-TC-Version": VERSION,
        "X-TC-Region": REGION
      },
      body: JSON.stringify(params)
    });
    if (!response.ok) {
      throw new Error(`API请求失败：${response.status} ${response.statusText}`);
    }
    const result = await response.json();

    // 检查是否有错误返回
    if (result.Response?.Error) {
      const error = result.Response.Error;
      throw new Error(`API返回错误：${error.Code} - ${error.Message}`);
    }
    const resultJson = JSON.stringify(result);
    return resultJson;
  } catch (error) {
    console.error("调用腾讯云试卷切题API失败:", error);
    throw error;
  }
}


function generateSignature(params, timestamp) {
  // 1. 拼接签名原文字符串
  const date = new Date(timestamp * 1000).toISOString().split("T")[0];
  const credentialScope = `${date}/${SERVICE}/tc3_request`;
  const canonicalRequest = ["POST", "/", "", "content-type:application/json; charset=utf-8", `host:${HOST}`, "", "content-type;host", crypto.createHash("sha256").update(JSON.stringify(params)).digest("hex")].join("\n");

  // 2. 计算签名
  const stringToSign = ["TC3-HMAC-SHA256", timestamp, credentialScope, crypto.createHash("sha256").update(canonicalRequest).digest("hex")].join("\n");

  // 3. 计算签名
  const secretDate = crypto.createHmac("sha256", `TC3${SECRET_KEY}`).update(date).digest();
  const secretService = crypto.createHmac("sha256", secretDate).update(SERVICE).digest();
  const secretSigning = crypto.createHmac("sha256", secretService).update("tc3_request").digest();
  const signature = crypto.createHmac("sha256", secretSigning).update(stringToSign).digest("hex");

  // 4. 拼接Authorization
  return `TC3-HMAC-SHA256 Credential=${SECRET_ID}/${credentialScope}, SignedHeaders=content-type;host, Signature=${signature}`;
}
