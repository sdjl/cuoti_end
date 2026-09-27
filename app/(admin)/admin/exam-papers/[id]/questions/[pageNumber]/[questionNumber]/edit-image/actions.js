"use server";

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { getExamPaperById, updateExamPaper, updateExamPaperStatistics } from "../../../../../../../../../lib/collection/examPaper.js";
import { updateExamQuestion } from "../../../../../../../../../lib/collection/examQuestion.js";
import { convertPdfToJpg, cropImage } from "../../../../../../../../../lib/common/crop.js";
import { deleteFile, downloadFile, getFileURL, uploadFile } from "../../../../../../../../../lib/common/file.js";


function createTempDir(prefix) {
  const tempDir = path.join(os.tmpdir(), `${prefix}-${Math.random().toString(36).substring(2, 10)}`);
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, {
      recursive: true
    });
  }
  return tempDir;
}


export async function generatePageImage(examId, pageNumber) {
  try {
    // 获取试卷信息
    const examDoc = await getExamPaperById(examId);
    if (!examDoc) {
      throw new Error("试卷不存在");
    }

    // 检查页面是否存在
    if (!examDoc.pages || !examDoc.pages.length) {
      throw new Error("试卷没有页面数据");
    }

    // 查找对应页面
    const pageIndex = examDoc.pages.findIndex(p => p.pageNumber === pageNumber);
    if (pageIndex === -1) {
      throw new Error(`未找到页面: ${pageNumber}`);
    }
    const page = examDoc.pages[pageIndex];

    // 如果已经有图片URL，直接返回
    if (page.imageUrl) {
      return page.imageUrl;
    }

    // 创建临时目录
    const tempDir = createTempDir(`exam-${examId}-page-${pageNumber}`);
    const tempPdfPath = path.join(tempDir, `page-${pageNumber}.pdf`);
    const tempJpgPath = path.join(tempDir, `page-${pageNumber}.jpg`);
    try {
      // 下载PDF文件
      const downloadResult = await downloadFile(page.pdfFileID);
      if (!downloadResult.fileContent) {
        throw new Error("下载PDF文件失败");
      }

      // 保存PDF到临时文件
      fs.writeFileSync(tempPdfPath, downloadResult.fileContent);

      // 转换PDF为JPG
      // 使用页面自身的宽高
      await convertPdfToJpg(tempPdfPath, tempJpgPath, page.pdfWidth, page.pdfHeight);

      // 读取JPG文件
      const jpgBuffer = fs.readFileSync(tempJpgPath);

      // 构建云存储路径，初始版本为0
      const version = 0;
      const imagePath = `cuoti/exam/${examId}/page/${pageNumber}-${version}.jpg`;

      // 上传到云存储
      const uploadResult = await uploadFile(imagePath, jpgBuffer);
      const imageFileID = uploadResult.fileID;

      // 获取文件访问链接
      const imageUrl = await getFileURL(imageFileID, true);

      // 更新页面信息
      const updatedPages = [...examDoc.pages];
      updatedPages[pageIndex] = {
        ...page,
        imagePath,
        imageUrl,
        imageFileID,
        imageVersion: version // 添加版本字段
      };

      // 更新试卷信息
      await updateExamPaper(examId, {
        pages: updatedPages,
        updated: Date.now()
      });

      // 清理临时文件
      fs.rmSync(tempDir, {
        recursive: true,
        force: true
      });
      return imageUrl;
    } catch (error) {
      // 清理临时文件
      if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, {
          recursive: true,
          force: true
        });
      }
      throw error;
    }
  } catch (error) {
    console.error("生成页面图片失败:", error);
    return null;
  }
}


export async function saveCroppedImage(examId, questionNumber, pageNumber, coordinates) {
  try {
    // 获取试卷信息
    const examDoc = await getExamPaperById(examId);
    if (!examDoc) {
      throw new Error("试卷不存在");
    }

    // 找到题目所在页面
    const pageIndex = examDoc.pages.findIndex(p => p.pageNumber === pageNumber);
    if (pageIndex === -1) {
      throw new Error(`未找到页面: ${pageNumber}`);
    }
    const page = examDoc.pages[pageIndex];
    const questionIndex = page.questions.findIndex(q => q.questionNumber === questionNumber);
    if (questionIndex === -1) {
      throw new Error(`未找到题目: ${questionNumber}`);
    }
    const question = page.questions[questionIndex];

    // 确保页面有图片
    if (!page.imageUrl || !page.imageFileID) {
      throw new Error("页面图片尚未生成，请先生成页面图片");
    }

    // 创建临时目录
    const tempDir = createTempDir(`exam-${examId}-question-${questionNumber}`);
    const tempPageImagePath = path.join(tempDir, `page-${pageNumber}.jpg`);
    const tempCroppedImagePath = path.join(tempDir, `question-${questionNumber}.jpg`);
    try {
      // 下载页面图片
      const downloadResult = await downloadFile(page.imageFileID);
      if (!downloadResult.fileContent) {
        throw new Error("下载页面图片失败");
      }

      // 保存图片到临时文件
      fs.writeFileSync(tempPageImagePath, downloadResult.fileContent);

      // 裁剪图片
      await cropImage(tempPageImagePath, tempCroppedImagePath, [coordinates.leftTop.x, coordinates.leftTop.y], [coordinates.rightBottom.x, coordinates.rightBottom.y]);

      // 读取裁剪后的图片
      const croppedImageBuffer = fs.readFileSync(tempCroppedImagePath);

      // 计算版本号
      const currentVersion = question.imageVersion || 0;
      const newVersion = currentVersion + 1;

      // 构建云存储路径 - 使用新的版本号
      const imagePath = `cuoti/exam/${examId}/question/${pageNumber}/${questionNumber}-${newVersion}.jpg`;

      // 如果存在旧文件，先删除
      if (question.imageFileID) {
        try {
          await deleteFile([question.imageFileID]);
        } catch (deleteError) {
          console.error("删除旧文件失败:", deleteError);
          // 继续执行，不因删除失败而中断整个流程
        }
      }

      // 上传到云存储
      const uploadResult = await uploadFile(imagePath, croppedImageBuffer);
      const imageFileID = uploadResult.fileID;

      // 获取文件访问链接
      const imageUrl = await getFileURL(imageFileID, true);

      // 计算新图片的宽高
      const imageWidth = coordinates.rightBottom.x - coordinates.leftTop.x;
      const imageHeight = coordinates.rightBottom.y - coordinates.leftTop.y;

      // 更新题目信息
      const updatedQuestion = {
        ...question,
        leftTop: coordinates.leftTop,
        rightBottom: coordinates.rightBottom,
        imagePath,
        imageUrl,
        imageFileID,
        imageWidth,
        imageHeight,
        imageVersion: newVersion // 更新版本号
      };

      // 更新试卷数据
      const updatedPages = [...examDoc.pages];
      updatedPages[pageIndex].questions[questionIndex] = updatedQuestion;

      // 保存到数据库
      await updateExamPaper(examId, {
        pages: updatedPages,
        updated: Date.now()
      });

      // 更新试卷统计数据
      await updateExamPaperStatistics(examId);

      // 同步更新exam_question集合中的数据
      await updateExamQuestion({
        leftTop: coordinates.leftTop,
        rightBottom: coordinates.rightBottom,
        imagePath,
        imageUrl,
        imageFileID,
        imageWidth,
        imageHeight,
        imageVersion: newVersion
      }, {
        examPaperId: examId,
        pageNumber: pageNumber,
        questionNumber: questionNumber
      });

      // 清理临时文件
      fs.rmSync(tempDir, {
        recursive: true,
        force: true
      });
      return {
        success: true,
        message: "裁剪图片保存成功",
        imageUrl
      };
    } catch (error) {
      // 清理临时文件
      if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, {
          recursive: true,
          force: true
        });
      }
      throw error;
    }
  } catch (error) {
    console.error("保存裁剪图片失败:", error);
    return {
      success: false,
      message: `保存失败: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}
