"use server";

import crypto from "node:crypto";
import COS from "cos-nodejs-sdk-v5";
import STS from "qcloud-cos-sts";

/**
 * CloudBase中云开发中云托管的云存储相关函数
 *
 * 注意：
 *  1. 需要安装 npm i qcloud-cos-sts --save
 *  2. 需要安装 crypto (Node.js内置)
 */

/**
 * 腾讯云COS临时密钥信息接口
 */

/**
 * 文件上传信息接口
 */


export async function generateCosTemporaryCredentials(durationSeconds = 1800, allowActions = ["name/cos:PutObject", "name/cos:GetObject", "name/cos:DeleteObject", "name/cos:PostObject", "name/cos:InitiateMultipartUpload", "name/cos:ListMultipartUploads", "name/cos:ListParts", "name/cos:UploadPart", "name/cos:CompleteMultipartUpload", "name/cos:AbortMultipartUpload"], allowBuckets = ["*"]) {
  // 检查环境变量
  const secretId = process.env.TENCENT_SECRET_ID;
  const secretKey = process.env.TENCENT_SECRET_KEY;
  if (!secretId) {
    throw new Error("环境变量 TENCENT_SECRET_ID 未设置或为空");
  }
  if (!secretKey) {
    throw new Error("环境变量 TENCENT_SECRET_KEY 未设置或为空");
  }

  // 构建权限策略
  const policy = {
    version: "2.0",
    statement: [{
      action: allowActions,
      effect: "allow",
      resource: allowBuckets.map(bucket => bucket === "*" ? "*" : `qcs::cos:*:uid
function generateRandomFileName(originalFileName) {
  const ext = originalFileName.substring(originalFileName.lastIndexOf("."));
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const timestamp = Date.now();
  const randomStr = crypto.randomBytes(8).toString("hex");
  return `tmp/${year}/${month}/${day}/${timestamp}_${randomStr}${ext}`;
}


function calculateCosAuthorization(method, pathname, secretId, secretKey, expirationTime) {
  const now = Math.floor(Date.now() / 1000);
  const keyTime = `${now};${expirationTime}`;

  // 步骤1：生成 KeyTime
  const signKey = crypto.createHmac("sha1", secretKey).update(keyTime).digest("hex");

  // 步骤2：生成 HttpString
  const httpMethod = method.toLowerCase();
  const httpUri = pathname;
  const httpParameters = "";
  const httpHeaders = "";
  const httpString = `${httpMethod}\n${httpUri}\n${httpParameters}\n${httpHeaders}\n`;

  // 步骤3：生成 StringToSign
  const algorithm = "sha1";
  const sha1HttpString = crypto.createHash("sha1").update(httpString).digest("hex");
  const stringToSign = `${algorithm}\n${keyTime}\n${sha1HttpString}\n`;

  // 步骤4：生成 Signature
  const signature = crypto.createHmac("sha1", signKey).update(stringToSign).digest("hex");

  // 步骤5：生成 Authorization
  return `q-sign-algorithm=${algorithm}&q-ak=${secretId}&q-sign-time=${keyTime}&q-key-time=${keyTime}&q-header-list=&q-url-param-list=&q-signature=${signature}`;
}


export async function generateCosUploadInfo(fileName, expirationMinutes = 30) {
  // 检查环境变量
  const secretId = process.env.TENCENT_SECRET_ID;
  const secretKey = process.env.TENCENT_SECRET_KEY;
  const bucket = process.env.TENCENT_COS_BUCKET;
  const region = process.env.TENCENT_COS_REGION;
  if (!secretId) {
    throw new Error("环境变量 TENCENT_SECRET_ID 未设置或为空");
  }
  if (!secretKey) {
    throw new Error("环境变量 TENCENT_SECRET_KEY 未设置或为空");
  }
  if (!bucket) {
    throw new Error("环境变量 TENCENT_COS_BUCKET 未设置或为空");
  }
  if (!region) {
    throw new Error("环境变量 TENCENT_COS_REGION 未设置或为空");
  }
  try {
    // 生成随机文件名
    const cosKey = generateRandomFileName(fileName);

    // 计算过期时间
    const expirationTime = Math.floor(Date.now() / 1000) + expirationMinutes * 60;

    // 生成签名
    const authorization = calculateCosAuthorization("PUT", `/${cosKey}`, secretId, secretKey, expirationTime);

    // 构建COS主机地址
    const cosHost = `${bucket}.cos.${region}.myqcloud.com`;

    // 构建上传URL
    const uploadUrl = `https://${cosHost}/${cosKey}`;
    return {
      uploadUrl,
      cosKey,
      cosHost,
      authorization,
      bucket,
      region
    };
  } catch (error) {
    console.error("生成COS上传信息失败:", error);
    throw new Error(`生成上传信息失败: ${error instanceof Error ? error.message : "未知错误"}`);
  }
}


function getCOSInstance() {
  const secretId = process.env.TENCENT_SECRET_ID;
  const secretKey = process.env.TENCENT_SECRET_KEY;
  if (!secretId || !secretKey) {
    throw new Error("COS配置错误：缺少必要的环境变量");
  }
  return new COS({
    SecretId: secretId,
    SecretKey: secretKey
  });
}


export async function downloadCosFile(cosKey) {
  const bucket = process.env.TENCENT_COS_BUCKET;
  const region = process.env.TENCENT_COS_REGION;
  if (!bucket || !region) {
    throw new Error("COS配置错误：缺少存储桶或区域信息");
  }
  const cos = getCOSInstance();
  try {
    const result = await cos.getObject({
      Bucket: bucket,
      Region: region,
      Key: cosKey
    });

    // 检查result.Body的类型并转换为Buffer
    if (Buffer.isBuffer(result.Body)) {
      return result.Body;
    } else if (typeof result.Body === "string") {
      return Buffer.from(result.Body);
    } else if (result.Body && typeof result.Body === "object" && "buffer" in result.Body) {
      return Buffer.from(result.Body);
    } else {
      throw new Error("不支持的文件数据类型");
    }
  } catch (error) {
    console.error("下载COS文件失败:", error);
    throw new Error(`下载文件失败: ${error instanceof Error ? error.message : "未知错误"}`);
  }
}


export async function deleteCosFile(cosKey) {
  const bucket = process.env.TENCENT_COS_BUCKET;
  const region = process.env.TENCENT_COS_REGION;
  if (!bucket || !region) {
    throw new Error("COS配置错误：缺少存储桶或区域信息");
  }
  const cos = getCOSInstance();
  try {
    await cos.deleteObject({
      Bucket: bucket,
      Region: region,
      Key: cosKey
    });
    console.log("COS文件删除成功:", cosKey);
    return true;
  } catch (error) {
    console.error("删除COS文件失败:", error);
    throw new Error(`删除文件失败: ${error instanceof Error ? error.message : "未知错误"}`);
  }
}
