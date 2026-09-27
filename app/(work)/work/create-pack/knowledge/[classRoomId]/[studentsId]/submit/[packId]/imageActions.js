"use server";

import { addDoc, getOne, updateDoc } from "../../../../../../../../../lib/common/database.js";
import { deleteFile, getFileURL, uploadFile } from "../../../../../../../../../lib/common/file.js";
import { compressImage, getCompressedFileExtension } from "../../../../../../../../../lib/common/imageCompress.js";
import { timestamp } from "../../../../../../../../../lib/common/time.js";


export async function uploadWrongQuestionImage(studentId, classId, courseId, questionPackId, questionId, imageData, mimeType) {
  try {
    // 将base64转换为Buffer
    const base64Data = imageData.replace(/^data:image\/[a-z]+;base64,/, "");
    const originalImageBuffer = Buffer.from(base64Data, "base64");

    // 压缩图片
    const compressedImageBuffer = await compressImage(originalImageBuffer, mimeType);
    const compressedFileExtension = getCompressedFileExtension(mimeType);

    // 首先查找或创建student_answer记录
    const studentAnswer = await getOne("student_answer", {
      studentId,
      classId,
      courseId,
      questionPackId
    });
    let studentAnswerId;
    if (!studentAnswer) {
      // 创建新的student_answer记录
      studentAnswerId = await addDoc("student_answer", {
        studentId,
        classId,
        courseId,
        questionPackId,
        type: "知识点",
        // 定制题集类型
        created: timestamp()
      });
    } else {
      studentAnswerId = studentAnswer._id;
    }

    // 查找或创建student_answer_item记录
    const studentAnswerItem = await getOne("student_answer_item", {
      studentAnswerId,
      questionId
    });
    let studentAnswerItemId;
    if (!studentAnswerItem) {
      // 创建新的student_answer_item记录
      studentAnswerItemId = await addDoc("student_answer_item", {
        studentAnswerId,
        questionId,
        questionType: "",
        // 这里需要从题目数据中获取
        answerValue: [],
        parse: []
      });
    } else {
      studentAnswerItemId = studentAnswerItem._id;
    }

    // 构建图片存储路径：cuoti/exercise/${studentAnswerId}/${questionId}-${timestamp}.{ext}
    // 添加timestamp避免浏览器缓存问题
    const currentTimestamp = Date.now();
    const imagePath = `cuoti/exercise/${studentAnswerId}/${questionId}-${currentTimestamp}.${compressedFileExtension}`;

    // 上传压缩后的文件到云存储
    const uploadResult = await uploadFile(imagePath, compressedImageBuffer);
    const imageFileID = uploadResult.fileID;

    // 获取文件访问URL
    const imageUrl = await getFileURL(imageFileID, true); // 移除查询参数

    // 更新student_answer_item文档，添加图片信息
    const updated = await updateDoc("student_answer_item", studentAnswerItemId, {
      imagePath,
      imageUrl,
      imageFileID
    });
    if (updated) {
      return {
        success: true,
        data: {
          imagePath,
          imageUrl,
          imageFileID,
          studentAnswerId,
          studentAnswerItemId
        }
      };
    } else {
      return {
        success: false,
        error: "更新数据库失败"
      };
    }
  } catch (error) {
    console.error("上传错题图片失败:", error);
    return {
      success: false,
      error: "上传图片失败"
    };
  }
}


export async function deleteWrongQuestionImage(imageFileID) {
  try {
    // 删除云存储中的文件
    await deleteFile([imageFileID]);

    // 通过imageFileID查找对应的student_answer_item记录
    const studentAnswerItem = await getOne("student_answer_item", {
      imageFileID
    });
    if (studentAnswerItem) {
      const studentAnswerItemId = studentAnswerItem._id;

      // 更新数据库，清除图片信息
      const updated = await updateDoc("student_answer_item", studentAnswerItemId, {
        imagePath: "",
        imageUrl: "",
        imageFileID: ""
      });
      if (updated) {
        return {
          success: true
        };
      } else {
        return {
          success: false,
          error: "更新数据库失败"
        };
      }
    } else {
      // 即使找不到数据库记录，云存储文件已经删除，也算成功
      return {
        success: true
      };
    }
  } catch (error) {
    console.error("删除错题图片失败:", error);
    return {
      success: false,
      error: "删除图片失败"
    };
  }
}
