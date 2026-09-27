"use server";

import { deleteFile, getFileURL, uploadFile } from "../../../../../../../../../lib/common/file.js";
import { compressImage, getCompressedFileExtension } from "../../../../../../../../../lib/common/imageCompress.js";


export async function uploadAnswerImage(examId, pageNumber, questionNumber, imageData, mimeType) {
  try {
    // 1. 将base64转换为Buffer
    const base64Data = imageData.replace(/^data:image\/[a-z]+;base64,/, "");
    const originalImageBuffer = Buffer.from(base64Data, "base64");

    // 2. 压缩图片
    const compressedImageBuffer = await compressImage(originalImageBuffer, mimeType);
    const compressedFileExtension = getCompressedFileExtension(mimeType);

    // 3. 构建图片存储路径
    // 路径格式：cuoti/exam/${examId}/question/${pageNumber}/${questionNumber}-answer-${timestamp}.jpg
    const timestamp = Date.now();
    const imagePath = `cuoti/exam/${examId}/question/${pageNumber}/${questionNumber}-answer-${timestamp}.${compressedFileExtension}`;

    // 4. 上传压缩后的文件到云存储
    const uploadResult = await uploadFile(imagePath, compressedImageBuffer);
    const imageFileID = uploadResult.fileID;

    // 5. 获取文件访问URL（移除查询参数）
    const imageUrl = await getFileURL(imageFileID, true);
    return {
      success: true,
      data: {
        imagePath,
        imageUrl,
        imageFileID
      }
    };
  } catch (error) {
    console.error("上传答案图片失败:", error);
    return {
      success: false,
      error: "上传答案图片失败"
    };
  }
}


export async function uploadParseImage(examId, pageNumber, questionNumber, imageData, mimeType) {
  try {
    // 1. 将base64转换为Buffer
    const base64Data = imageData.replace(/^data:image\/[a-z]+;base64,/, "");
    const originalImageBuffer = Buffer.from(base64Data, "base64");

    // 2. 压缩图片
    const compressedImageBuffer = await compressImage(originalImageBuffer, mimeType);
    const compressedFileExtension = getCompressedFileExtension(mimeType);

    // 3. 构建图片存储路径
    // 路径格式：cuoti/exam/${examId}/question/${pageNumber}/${questionNumber}-parse-${timestamp}.jpg
    const timestamp = Date.now();
    const imagePath = `cuoti/exam/${examId}/question/${pageNumber}/${questionNumber}-parse-${timestamp}.${compressedFileExtension}`;

    // 4. 上传压缩后的文件到云存储
    const uploadResult = await uploadFile(imagePath, compressedImageBuffer);
    const imageFileID = uploadResult.fileID;

    // 5. 获取文件访问URL（移除查询参数）
    const imageUrl = await getFileURL(imageFileID, true);
    return {
      success: true,
      data: {
        imagePath,
        imageUrl,
        imageFileID
      }
    };
  } catch (error) {
    console.error("上传解析图片失败:", error);
    return {
      success: false,
      error: "上传解析图片失败"
    };
  }
}


export async function deleteQuestionImage(imageFileID) {
  try {
    // 删除云存储中的文件
    await deleteFile([imageFileID]);
    return {
      success: true
    };
  } catch (error) {
    console.error("删除图片失败:", error);
    return {
      success: false,
      error: "删除图片失败"
    };
  }
}
