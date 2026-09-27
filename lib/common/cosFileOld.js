"use server";

/**
 * 腾讯云托管的COS相关函数（注意不是云开发中的云托管，也不是云开发的文件存储）
 * 参考文档: https://developers.weixin.qq.com/miniprogram/dev/wxcloudservice/wxcloudrun/src/development/storage/service/cos-sdk.html
 *
 * 封装了 COS 的常用操作方法，包括：
 *  - 初始化 COS SDK（获取临时密钥）
 *  - 获取文件上传链接
 *  - 上传文件（通过 multipart/form-data 上传到 COS）
 *  - 下载文件（使用 COS SDK 下载）
 *  - 删除文件（通过开放接口服务删除文件）
 *  - 获取文件下载链接（批量下载接口，此处只处理单个文件）
 *
 * 注意：
 *  1. 本示例中使用开放接口服务，不需要传入 access_token。
 *  2. 需要运行 vscode weixin-cloudbase 插件，此时会在本机docker中启动容器，发给 api.weixin.qq.com 域名的请求会走插件代理
 *  3. 云托管中需要有一个 wxcloud-localdebug-proxy 服务且可访问。
 *  4. 需要安装 cos-nodejs-sdk-v5 以及 form-data：
 *       npm install cos-nodejs-sdk-v5 form-data
 */
import fs from "node:fs";
import COS from "cos-nodejs-sdk-v5";
import { addDoc, getOne, removeDoc } from "./database.js";
import { randomString } from "./random.js";
import { timestampSeconds } from "./time.js";

/**
 * 全局的 COS SDK 实例及其过期时间
 */
let GLOBAL_COS = null;
let COS_EXPIRED_TIME = 0;

/**
 * 全局配置常量
 */
const DEFAULT_MAX_AGE = 86400; // 默认24小时
const BUFFER_TIME = 30; // 提前30秒重新初始化
const DOWNLOAD_TIMEOUT = 60000; // 下载文件超时时间

/**
 * API请求前缀，注意不要使用 https 协议
 */
const API_PREFIX = "http://api.weixin.qq.com";

/**
 * 获取云环境ID
 */
function getEnv() {
  const env = process.env.TENCENT_CLOUD_ENV_2;
  if (!env) {
    throw new Error("未配置环境变量 TENCENT_CLOUD_ENV_2");
  }
  return env;
}

/**
 * 初始化 COS-SDK 实例
 *
 * 此方法会调用开放接口获取临时密钥，并初始化全局 COS 实例。
 * 获取临时密钥的接口地址请根据实际情况修改。
 */
async function initCos() {
  GLOBAL_COS = new COS({
    getAuthorization: async (_options, callback) => {
      const res = await fetch(`${API_PREFIX}/_/cos/getauth`);
      if (!res.ok) {
        throw new Error(`获取临时密钥失败: ${res.statusText}`);
      }
      const info = await res.json();

      // 记录过期时间
      COS_EXPIRED_TIME = info.ExpiredTime;
      const auth = {
        TmpSecretId: info.TmpSecretId,
        TmpSecretKey: info.TmpSecretKey,
        SecurityToken: info.Token,
        StartTime: timestampSeconds(),
        // 当前时间戳（秒）
        ExpiredTime: info.ExpiredTime
      };
      callback(auth);
    }
  });
}

/**
 * 获取 COS 实例，如果实例不存在或者临近过期（30秒内），则重新初始化
 */
async function getCos() {
  const currentTime = timestampSeconds(); // 当前时间戳（秒）

  // 如果实例不存在或者临近过期，则重新初始化
  if (!GLOBAL_COS || currentTime >= COS_EXPIRED_TIME - BUFFER_TIME) {
    await initCos();
    if (!GLOBAL_COS) {
      throw new Error("COS实例初始化失败");
    }
  }
  return GLOBAL_COS;
}


export async function getTempUploadFile() {
  // 生成32位随机字符串
  const randomStr = randomString(32);

  // 构造临时文件路径：tmp/year/month/day/random_string
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const path = `tmp/${year}/${month}/${day}/${randomStr}`;

  // 获取上传链接
  const uploadResponse = await getUploadLink(path);

  // 准备要写入数据库的数据
  const cosFileData = {
    fileType: "tmp",
    fileId: uploadResponse.file_id,
    path: path,
    signature: uploadResponse.authorization,
    token: uploadResponse.token,
    cosFileId: uploadResponse.cos_file_id,
    uploadUrl: uploadResponse.url,
    created: timestampSeconds()
  };

  // 写入数据库
  const docId = await addDoc("cos_file", cosFileData);

  // 返回完整的数据（包含生成的 _id）
  return {
    _id: docId,
    ...cosFileData
  };
}


export async function deleteTempUploadFile(fileId) {
  try {
    // 1. 通过fileId查找数据库中的记录
    const cosFileDoc = await getOne("cos_file", {
      fileId
    });
    if (!cosFileDoc) {
      console.warn(`未找到fileId为 ${fileId} 的数据库记录`);
      // 即使数据库记录不存在，也尝试删除云存储文件
      const deleteSuccess = await deleteOneFile(fileId);
      return deleteSuccess;
    }

    // 2. 先删除云存储中的文件
    const deleteSuccess = await deleteOneFile(fileId);
    if (!deleteSuccess) {
      console.warn(`云存储文件 ${fileId} 删除失败，可能文件不存在于对象存储中，但继续删除数据库记录`);
    }

    // 3. 删除数据库记录（无论云存储文件是否删除成功）
    await removeDoc("cos_file", cosFileDoc._id);
    return true;
  } catch (error) {
    console.error(`删除临时文件失败 ${fileId}:`, error);
    throw new Error(`删除临时文件失败: ${error instanceof Error ? error.message : String(error)}`);
  }
}


export async function getUploadLink(path) {
  const env = getEnv();
  const url = `${API_PREFIX}/tcb/uploadfile`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      env,
      path
    })
  });
  if (!res.ok) {
    throw new Error(`获取上传链接失败: ${res.statusText}`);
  }
  const data = await res.json();
  if (data.errcode !== 0) {
    console.error(`获取上传链接错误: `, data);
    throw new Error(`获取上传链接错误: ${data.errmsg}`);
  }
  return data;
}


export async function downloadFile(path, localDestination) {
  const cos = await getCos();
  const cosConfig = {
    Bucket: process.env.TENCENT_COS_BUCKET_2,
    Region: process.env.TENCENT_COS_REGION_2
  };

  // 创建文件写入流
  const writeStream = fs.createWriteStream(localDestination);
  const result = await cos.getObject({
    Bucket: cosConfig.Bucket,
    Region: cosConfig.Region,
    Key: path,
    Output: writeStream
  });
  if (result.statusCode === 200) {
    return localDestination;
  } else {
    throw new Error(`文件下载失败: ${JSON.stringify(result)}`);
  }
}


export async function downloadFileBuffer(fileId) {
  try {
    // 先获取下载链接
    const downloadUrl = await getOneDownloadLink(fileId);

    // 通过URL下载文件内容
    const response = await fetch(downloadUrl, {
      signal: AbortSignal.timeout(DOWNLOAD_TIMEOUT) // 下载文件超时时间
    });
    if (!response.ok) {
      throw new Error(`下载文件失败: ${response.statusText}`);
    }

    // 将响应转换为Buffer
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error) {
    console.error("下载文件Buffer失败:", error);
    throw new Error(`下载文件失败: ${error instanceof Error ? error.message : String(error)}`);
  }
}


export async function deleteFiles(fileIds) {
  const env = getEnv();
  const url = `${API_PREFIX}/tcb/batchdeletefile`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      env,
      fileid_list: fileIds
    })
  });
  if (!res.ok) {
    throw new Error(`删除文件请求失败: ${res.statusText}`);
  }
  const data = await res.json();
  if (data.errcode !== 0) {
    throw new Error(`删除文件错误: ${data.errmsg}`);
  }
  return data;
}


export async function deleteOneFile(fileId) {
  const data = await deleteFiles([fileId]);
  const fileInfo = data.delete_list?.[0];
  return fileInfo?.status === 0;
}


export async function getDownloadLinks(fileIds) {
  const env = getEnv();
  const url = `${API_PREFIX}/tcb/batchdownloadfile`;

  // 将文件ID列表转换为接口需要的格式，统一使用默认过期时间
  const file_list = fileIds.map(fileId => ({
    fileid: fileId,
    max_age: DEFAULT_MAX_AGE
  }));
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      env,
      file_list
    })
  });
  if (!res.ok) {
    throw new Error(`获取下载链接请求失败: ${res.statusText}`);
  }
  const data = await res.json();
  if (data.errcode !== 0) {
    throw new Error(`获取下载链接错误: ${data.errmsg}`);
  }
  return data;
}


export async function getOneDownloadLink(fileId) {
  const data = await getDownloadLinks([fileId]);
  const fileInfo = data.file_list?.[0];
  if (!fileInfo || fileInfo.status !== 0) {
    throw new Error(`获取文件下载链接失败: ${fileInfo?.errmsg || "未知错误"}`);
  }
  return fileInfo.download_url;
}

/**
 * 导出 getCos 函数供外部使用（如果需要直接使用 COS SDK）
 */
export { getCos };
