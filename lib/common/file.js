"use server";

/**
 * 腾讯云开发云存储相关函数（注意不是云托管的COS）
 * 参考文档: https://docs.cloudbase.net/api-reference/server/node-sdk/storage
 */
import { app } from "./cloud.js";


export async function uploadFile(cloudPath, fileContent) {
  const result = await app().uploadFile({
    cloudPath,
    fileContent
  });
  return {
    fileID: result.fileID || "",
    requestId: result.requestId || ""
  };
}


export async function getTempFileURL(fileList, timeout) {
  const opts = timeout ? {
    timeout
  } : {};
  const result = await app().getTempFileURL({
    fileList
  }, opts);
  return {
    fileList: result.fileList || [],
    requestId: result.requestId || ""
  };
}


export async function getFileURL(fileID, removeQuery = false, timeout) {
  const result = await getTempFileURL([fileID], timeout);
  let fileURL = result.fileList[0]?.tempFileURL || "";

  // 如果需要，移除URL中的查询字符串
  if (removeQuery && fileURL.includes("?")) {
    fileURL = fileURL.split("?")[0];
  }
  return fileURL;
}


export async function deleteFile(fileList, timeout) {
  const opts = timeout ? {
    timeout
  } : {};

  // 如果文件数量超过50个，分批删除
  const MAX_BATCH_SIZE = 50;
  const allDeletedFiles = [];
  let lastRequestId = "";
  if (fileList.length <= MAX_BATCH_SIZE) {
    // 如果文件数量不超过50个，直接删除
    const result = await app().deleteFile({
      fileList
    }, opts);
    return {
      fileList: result.fileList || [],
      requestId: result.requestId || ""
    };
  } else {
    // 分批删除
    for (let i = 0; i < fileList.length; i += MAX_BATCH_SIZE) {
      const batch = fileList.slice(i, i + MAX_BATCH_SIZE);
      try {
        const result = await app().deleteFile({
          fileList: batch
        }, opts);
        if (result.fileList) {
          allDeletedFiles.push(...result.fileList);
        }
        lastRequestId = result.requestId || "";
      } catch (error) {
        console.error(`删除文件批次 ${i / MAX_BATCH_SIZE + 1} 失败:`, error);
        // 继续处理下一批，不中断整个删除过程
      }
    }
    return {
      fileList: allDeletedFiles,
      requestId: lastRequestId
    };
  }
}


export async function downloadFile(fileID, timeout) {
  const opts = timeout ? {
    timeout
  } : {};
  const params = {
    fileID
  };
  const result = await app().downloadFile(params, opts);

  // 强制转换为我们期望的类型
  return {
    fileContent: result.fileContent,
    requestId: result.requestId || ""
  };
}


export async function copyFile(fileList) {
  const result = await app().copyFile({
    fileList
  });
  return {
    fileList: result.fileList || [],
    requestId: result.requestId || ""
  };
}
