"use server";

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { PDFDocument } from "pdf-lib";
import { getExamPaperById, updateExamPaper } from "../collection/examPaper.js";
import { convertPdfToJpg, cropImage } from "../common/crop.js";
import { addDoc, command, getOne } from "../common/database.js";
import { downloadFile, getFileURL, uploadFile } from "../common/file.js";
import { sleep } from "../common/time.js";
import { processQuestionResult as alibabaProcessQuestionResult, validateOCRResult as alibabaValidateOCRResult } from "./alibabaOcrAnalyzer.js";
import { callQuestionSplitOCR as alibabaCallQuestionSplitOCR } from "./alibabaOrc.js";
import { getSetting } from "./setting.js";
import { callQuestionSplitOCR as tencentCallQuestionSplitOCR } from "./tencentOcr.js";
import { processQuestionResult as tencentProcessQuestionResult, validateOCRResult as tencentValidateOCRResult } from "./tencentOcrAnalyzer.js";
const EXAM_PAGE_INFO_COLLECTION = "exam_page_info";


export async function splitPdfFile(examId) {
  try {
    // 获取试卷信息
    const examDoc = await getExamPaperById(examId);
    if (!examDoc) {
      throw new Error("试卷不存在");
    }
    const {
      pdfFileID,
      pdfPageCount
    } = examDoc;
    if (!pdfFileID) {
      throw new Error("试卷PDF文件不存在");
    }
    if (!pdfPageCount || pdfPageCount <= 0) {
      throw new Error("试卷PDF页数不正确");
    }

    // 检查是否已有拆分的页面数据
    let existingPages = [];
    let needFullSplit = true;
    if (examDoc.pages && examDoc.pages.length > 0) {
      // 检查已有的页面是否已经拆分上传了PDF，如果已经上传，则不需要再拆分
      const validPages = examDoc.pages.filter(page => page.pdfUrl && page.pdfFileID && page.pageNumber > 0);
      if (validPages.length === pdfPageCount) {
        return true; // 所有页面都已经拆分上传，直接返回true
      } else if (validPages.length > 0) {
        // 部分页面已拆分，只需处理未拆分的页面
        existingPages = validPages;
        needFullSplit = false;
      }
    }

    // 如果需要处理全部页面，我们需要完整下载和处理PDF
    let pdfDoc;
    const tempDir = getTempDir(`exam-${examId}`);

    // 清理临时目录的函数
    function cleanTempDir() {
      // 清理临时目录
      if (tempDir) {
        try {
          fs.rmSync(tempDir, {
            recursive: true,
            force: true
          });
        } catch (cleanError) {
          console.error(`清理临时目录失败: ${tempDir}`, cleanError);
        }
      }
    }
    if (needFullSplit) {
      // 下载PDF文件
      const downloadResult = await downloadFile(pdfFileID);
      if (!downloadResult.fileContent) {
        throw new Error("下载PDF文件失败");
      }

      // 加载PDF文档
      pdfDoc = await PDFDocument.load(downloadResult.fileContent);
    }

    // 使用现有页面或初始化一个新的数组
    const pages = [...existingPages];

    // 计算需要处理的页面
    const totalPages = pdfPageCount;
    const pagesToProcess = Array.from({
      length: totalPages
    }, (_, i) => i + 1)
    // 过滤掉已处理的页面
    .filter(pageNumber => !existingPages.some(page => page.pageNumber === pageNumber));

    // 逐页拆分PDF
    for (const pageNumber of pagesToProcess) {
      try {
        // 创建新的PDF文档
        const newPdfDoc = await PDFDocument.create();

        // 复制当前页到新文档
        const [copiedPage] = await newPdfDoc.copyPages(pdfDoc, [pageNumber - 1]); // 页码从0开始
        newPdfDoc.addPage(copiedPage);

        // 将新PDF保存为Buffer
        const pdfBytes = await newPdfDoc.save();

        // 构建云存储路径
        const pdfPath = `cuoti/exam/${examId}/page/${pageNumber}.pdf`;

        // 上传到云存储
        const uploadResult = await uploadFile(pdfPath, Buffer.from(pdfBytes));
        const pdfFileID = uploadResult.fileID;

        // 获取文件访问链接
        const pdfUrl = await getFileURL(pdfFileID, true);

        // 将页信息添加到pages数组
        pages.push({
          pageNumber,
          pdfPath,
          pdfUrl,
          pdfFileID,
          pdfHeight: 0,
          pdfWidth: 0,
          questions: []
        });
      } catch (error) {
        console.error(`拆分第${pageNumber}页时出错:`, error);
        cleanTempDir();
        throw error;
      }
    }
    cleanTempDir();

    // 确保页面按照页码排序
    pages.sort((a, b) => a.pageNumber - b.pageNumber);

    // 更新试卷信息
    await updateExamPaper(examId, {
      pages,
      updated: Date.now()
    });
    return true;
  } catch (error) {
    console.error("拆分PDF文件失败:", error);
    throw error;
  }
}


export async function cutPageQuestion(examId) {
  try {
    // 获取试卷信息
    const examDoc = await getExamPaperById(examId);
    if (!examDoc) {
      throw new Error("试卷不存在");
    }

    // 检查是否有pages数据
    if (!examDoc.pages || examDoc.pages.length === 0) {
      throw new Error("试卷未进行PDF拆分，请先拆分PDF");
    }

    // 获取当前配置的切题服务
    const settings = await getSetting("cutting_service_config");
    const cuttingServiceProvider = settings.cutting_service_config?.provider || "tencent";

    // 更新后的pages数组
    const updatedPages = [...examDoc.pages];

    // 创建临时目录（阿里服务需要）
    const tempDir = getTempDir(`exam-${examId}-cutting`);

    // 清理临时目录的函数
    function cleanTempDir() {
      if (tempDir) {
        try {
          fs.rmSync(tempDir, {
            recursive: true,
            force: true
          });
        } catch (cleanError) {
          console.error(`清理临时目录失败: ${tempDir}`, cleanError);
        }
      }
    }
    try {
      // 逐页进行切题识别
      for (let i = 0; i < updatedPages.length; i++) {
        const page = updatedPages[i];
        const pageNumber = page.pageNumber;
        try {
          // 检查数据库中是否已有识别结果（匹配当前切题服务）
          let recognitionResult = await getExistingAPIResult(examId, pageNumber, cuttingServiceProvider);

          // 如果没有识别结果，则调用API进行识别
          if (!recognitionResult) {
            if (cuttingServiceProvider === "tencent") {
              // 腾讯切题：直接使用PDF文件
              recognitionResult = await tencentCallQuestionSplitOCR(page.pdfUrl);
            } else {
              // 阿里切题：先转换PDF为图片，再上传，再调用API
              recognitionResult = await processAlibabaQuestionSplit(examId, page, tempDir, examDoc.subject);
            }

            // 验证识别结果是否有效，只有验证成功才保存到数据库
            let isValid = false;
            if (cuttingServiceProvider === "tencent") {
              isValid = await tencentValidateOCRResult(recognitionResult);
            } else {
              isValid = await alibabaValidateOCRResult(recognitionResult);
            }
            if (isValid) {
              // 保存识别结果
              await saveAPIResult(examId, pageNumber, recognitionResult, cuttingServiceProvider);
            } else {
              // 验证失败，抛出错误，包含API返回的原始数据用于调试
              throw new Error(`OCR结果验证失败。API返回数据: ${recognitionResult}`);
            }

            // 暂停0.5秒，防止API调用过频繁
            await sleep(500);
          }

          // 根据切题服务处理识别结果
          let pageData;
          if (cuttingServiceProvider === "tencent") {
            pageData = await tencentProcessQuestionResult(examId, pageNumber, recognitionResult);
          } else {
            pageData = await alibabaProcessQuestionResult(examId, pageNumber, recognitionResult);
          }
          const {
            pdfHeight,
            pdfWidth,
            questions
          } = pageData;

          // 更新pages数组中的页面信息
          updatedPages[i] = {
            ...page,
            pdfHeight,
            pdfWidth,
            questions
          };
        } catch (error) {
          console.error(`切题识别第${pageNumber}页时出错:`, error);
          throw error;
        }
      }

      // 更新试卷信息
      await updateExamPaper(examId, {
        pages: updatedPages,
        updated: Date.now()
      });
      return true;
    } finally {
      cleanTempDir();
    }
  } catch (error) {
    console.error("试卷切题识别失败:", error);
    throw error;
  }
}


async function processAlibabaQuestionSplit(examId, page, tempDir, subject) {
  const pageNumber = page.pageNumber;

  // 下载PDF文件
  const pdfPath = `${tempDir}/page-${pageNumber}.pdf`;
  const downloadResult = await downloadFile(page.pdfFileID);
  if (!downloadResult.fileContent) {
    throw new Error(`下载PDF文件失败: ${page.pdfFileID}`);
  }

  // 将文件内容写入本地文件
  fs.writeFileSync(pdfPath, downloadResult.fileContent);

  // 将PDF转换为JPG图片
  const jpgPath = `${tempDir}/page-${pageNumber}.jpg`;
  await convertPdfToJpg(pdfPath, jpgPath);

  // 上传图片到云存储
  const imageBuffer = fs.readFileSync(jpgPath);
  const imagePath = `cuoti/exam/${examId}/temp/${pageNumber}-${Date.now()}.jpg`;
  const uploadResult = await uploadFile(imagePath, imageBuffer);
  const imageFileID = uploadResult.fileID;

  // 获取图片访问链接
  const imageUrl = await getFileURL(imageFileID, true);

  // 调用阿里云切题API
  const recognitionResult = await alibabaCallQuestionSplitOCR({
    Url: imageUrl,
    cutType: "question",
    imageType: "scan",
    subject: subject,
    // 传递试卷科目信息
    outputOricoord: false
  });
  return recognitionResult;
}


export async function cropAndUploadQuestionImages(examId) {
  try {
    // 获取试卷信息
    const examDoc = await getExamPaperById(examId);
    if (!examDoc) {
      throw new Error("试卷不存在");
    }

    // 检查是否有pages数据
    if (!examDoc.pages || examDoc.pages.length === 0) {
      throw new Error("试卷未进行PDF拆分，请先拆分PDF");
    }

    // 检查是否有问题数据
    const hasQuestions = examDoc.pages.some(page => page.questions && page.questions.length > 0);
    if (!hasQuestions) {
      throw new Error("试卷未进行切题识别，请先进行切题识别");
    }

    // 更新试卷状态为裁剪中
    await updateExamPaper(examId, {
      cuttingStatus: "cropping",
      updated: Date.now()
    });

    // 更新后的pages数组
    const updatedPages = [...examDoc.pages];

    // 创建临时目录用于存储PDF和图片文件
    const tempDir = getTempDir(`exam-${examId}-images`);

    // 清理临时目录的函数
    function cleanTempDir() {
      // 清理临时目录
      if (tempDir) {
        try {
          fs.rmSync(tempDir, {
            recursive: true,
            force: true
          });
        } catch (cleanError) {
          console.error(`清理临时目录失败: ${tempDir}`, cleanError);
        }
      }
    }
    try {
      // 逐页处理问题图片
      for (let i = 0; i < updatedPages.length; i++) {
        const page = updatedPages[i];
        const pageNumber = page.pageNumber;

        // 跳过没有问题的页面
        if (!page.questions || page.questions.length === 0) {
          continue;
        }

        // 下载PDF文件
        const pdfPath = `${tempDir}/page-${pageNumber}.pdf`;
        const downloadResult = await downloadFile(page.pdfFileID);
        if (!downloadResult.fileContent) {
          throw new Error(`下载PDF文件失败: ${page.pdfFileID}`);
        }

        // 将文件内容写入本地文件
        fs.writeFileSync(pdfPath, downloadResult.fileContent);
        if (!fs.existsSync(pdfPath)) {
          throw new Error(`PDF文件不存在，保存失败！: ${pdfPath}`);
        }

        // 将PDF转换为JPG图片
        const jpgPath = `${tempDir}/page-${pageNumber}.jpg`;
        await convertPdfToJpg(pdfPath, jpgPath, page.pdfWidth, page.pdfHeight);

        // 处理页面中的所有问题
        const updatedQuestions = [...page.questions];
        let hasChanges = false;
        for (let j = 0; j < updatedQuestions.length; j++) {
          const question = updatedQuestions[j];
          const questionNumber = question.questionNumber;

          // 如果已经有图片ID，跳过这个问题
          if (question.imageFileID) {
            continue;
          }

          // 裁剪问题图片
          const cropPath = `${tempDir}/question-${pageNumber}-${questionNumber}.jpg`;
          await cropImage(jpgPath, cropPath, [question.leftTop.x, question.leftTop.y], [question.rightBottom.x, question.rightBottom.y]);

          // 获取图片数据
          const imageBuffer = fs.readFileSync(cropPath);

          // 上传到云存储
          const imagePath = `cuoti/exam/${examId}/question/${pageNumber}/${questionNumber}.jpg`;
          const uploadResult = await uploadFile(imagePath, imageBuffer);
          const imageFileID = uploadResult.fileID;

          // 获取文件访问链接
          const imageUrl = await getFileURL(imageFileID, true);

          // 更新问题图片信息
          updatedQuestions[j] = {
            ...question,
            imagePath,
            imageUrl,
            imageFileID,
            imageHeight: question.rightBottom.y - question.leftTop.y,
            imageWidth: question.rightBottom.x - question.leftTop.x
          };
          hasChanges = true;
        }
        if (hasChanges) {
          // 更新页面问题数据
          updatedPages[i] = {
            ...page,
            questions: updatedQuestions
          };

          // 每完成一页就更新一次数据库
          await updateExamPaper(examId, {
            pages: updatedPages,
            updated: Date.now()
          });
        }
      }
      cleanTempDir();

      // 更新试卷状态为处理完成
      await updateExamPaper(examId, {
        cuttingStatus: "done",
        updated: Date.now()
      });
      return true;
    } catch (error) {
      cleanTempDir();
      throw error;
    }
  } catch (error) {
    console.error("裁剪并上传问题图片失败:", error);

    // 更新试卷状态为失败
    try {
      await updateExamPaper(examId, {
        cuttingStatus: "failed",
        cuttingError: `裁剪并上传问题图片失败: ${error.message}`,
        updated: Date.now()
      });
    } catch (updateError) {
      console.error("更新试卷状态失败:", updateError);
    }
    throw error;
  }
}


function getTempDir(subPath) {
  const tempDir = path.join(os.tmpdir(), `${subPath}-${Date.now()}`);
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, {
      recursive: true
    });
  }
  return tempDir;
}


async function getExistingAPIResult(examId, pageNumber, cuttingServiceProvider) {
  try {
    const _ = command();
    let whereCondition;
    if (cuttingServiceProvider === "tencent") {
      // 腾讯：查询 cuttingServiceProvider 等于 "tencent" 或不存在的记录（老数据）
      whereCondition = _.and([{
        examPaperId: examId
      }, {
        pageNumber: pageNumber
      }, _.or([{
        cuttingServiceProvider: "tencent"
      }, {
        cuttingServiceProvider: _.exists(false)
      }])]);
    } else {
      // 阿里巴巴：只查询 cuttingServiceProvider 等于 "alibaba" 的记录
      whereCondition = {
        examPaperId: examId,
        pageNumber,
        cuttingServiceProvider: "alibaba"
      };
    }
    const doc = await getOne(EXAM_PAGE_INFO_COLLECTION, whereCondition);
    if (doc) {
      return doc.result;
    }
    return null;
  } catch (error) {
    console.error(`获取已有切题识别结果失败: examId=${examId}, pageNumber=${pageNumber}`, error);
    return null;
  }
}


async function saveAPIResult(examId, pageNumber, result, cuttingServiceProvider) {
  try {
    // 添加到 exam_page_info 集合（验证已在上层完成）
    const pageInfo = {
      examPaperId: examId,
      pageNumber,
      result,
      cuttingServiceProvider
    };
    const docId = await addDoc(EXAM_PAGE_INFO_COLLECTION, pageInfo);
    return docId;
  } catch (error) {
    console.error(`保存切题识别结果失败: examId=${examId}, pageNumber=${pageNumber}`, error);
    throw error;
  }
}
