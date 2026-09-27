import fs from "node:fs";
import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, StandardFonts } from "pdf-lib";
import sharp from "sharp";
import { generateQRCodeBuffer } from "../../../lib/common/qrcode.js";

/**
 * 页面底部安全距离（单位：pt，1pt ≈ 0.35mm）
 *
 * 这个值用于控制内容距离页面底部的最小距离，主要考虑两个因素：
 * 1. 打印机无法打印的边缘区域（通常需要5-10mm，约15-30pt）
 * 2. 额外的安全缓冲，防止内容被截断
 *
 * 如果发现生成的PDF中图片仍然被截断，可以适当增大此值。
 * 建议范围：30-60pt（约10-20mm）
 *
 * 默认值50pt约等于17.5mm，对于大多数打印机应该足够安全。
 */
const PAGE_BOTTOM_SAFETY_MARGIN = 50;

/**
 * PDF生成配置参数
 */


async function compressImageForPdf(imageBuffer, maxWidth, jpegQuality) {
  try {
    // 使用sharp进行压缩
    // 1. 调整尺寸到最大宽度
    // 2. 转换为JPEG格式（体积更小，适合打印）
    // 3. 使用可配置的质量参数来控制文件体积
    const compressedBuffer = await sharp(imageBuffer).resize({
      width: maxWidth,
      height: undefined,
      // 高度自动按比例缩放
      fit: "inside",
      withoutEnlargement: true
    }).jpeg({
      quality: jpegQuality,
      progressive: true,
      mozjpeg: true // 使用mozjpeg优化算法
    }).toBuffer();
    return compressedBuffer;
  } catch (error) {
    console.error("图片压缩失败:", error);
    // 如果压缩失败，返回原始图片
    return imageBuffer;
  }
}

/**
 * PDF生成所需的题目字段
 */

/**
 * 学生PDF数据
 */

/**
 * PDF生成结果
 */

/**
 * 文本换行处理函数
 */
function wrapTextByCharCount({
  text,
  maxChars
}) {
  const lines = [];
  let currentLine = "";
  for (let i = 0; i < text.length; i++) {
    currentLine += text[i];
    if (currentLine.length >= maxChars) {
      lines.push(currentLine);
      currentLine = "";
    }
  }
  if (currentLine.length > 0) {
    lines.push(currentLine);
  }
  return lines;
}

/**
 * 生成错题PDF字节数组
 */
export async function createMistakePdfBytes({
  studentData,
  config,
  onProgress
}) {
  // 创建PDF文档
  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);

  // 加载中文字体
  let chineseFont;
  try {
    const fontBytes = fs.readFileSync(config.fontPath);
    chineseFont = await pdfDoc.embedFont(fontBytes);
  } catch {
    // 中文字体加载失败，使用默认字体
    chineseFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  }

  // 加载二维码图片
  let qrcodeImage;
  try {
    const qrcodeBytes = fs.readFileSync(config.qrcodePath);
    qrcodeImage = await pdfDoc.embedJpg(qrcodeBytes);
  } catch {
    // 二维码加载失败，继续执行
  }

  // 页面配置
  const pageWidth = 595; // A4宽度
  const pageHeight = 842; // A4高度
  const margin = 50;
  const contentWidth = pageWidth - 2 * margin;

  // 计算安全的底部边界（考虑打印机安全边距）
  const safeBottomY = margin + PAGE_BOTTOM_SAFETY_MARGIN;
  let page = pdfDoc.addPage([pageWidth, pageHeight]);
  let currentY = pageHeight - margin;
  let pageNumber = 1;

  // 追踪当前页是否已有题目内容
  let isFirstQuestionOnPage = true;

  // 生成右侧二维码
  let rightQrCodeImage;
  try {
    const rightQrCodeUrl = `${config.studentPdfQrCodeBaseUrl}/${studentData.studentPdfId}`;
    const rightQrCodeBuffer = await generateQRCodeBuffer(rightQrCodeUrl, config.headerQrCodeSize);
    rightQrCodeImage = await pdfDoc.embedPng(rightQrCodeBuffer);
  } catch {
    // 右侧二维码生成失败，继续执行
  }

  // 页眉绘制函数
  const drawHeader = (targetPage, pageNum) => {
    const qrSize = config.headerQrCodeSize;
    const qrMargin = margin;
    const qrY = pageHeight - margin - qrSize;

    // 添加左侧二维码
    if (qrcodeImage) {
      targetPage.drawImage(qrcodeImage, {
        x: qrMargin,
        y: qrY,
        width: qrSize,
        height: qrSize
      });
    }
    const leftContentX = qrMargin + qrSize + 15;
    const generatedTime = new Date().toLocaleString("zh-CN");

    // 添加标题
    targetPage.drawText(`${studentData.taskName}-${studentData.studentName}`, {
      x: leftContentX,
      y: qrY + qrSize - 15,
      size: 16,
      font: chineseFont
    });

    // 添加页码和班级
    targetPage.drawText(`第${pageNum}页、班级：${studentData.className}`, {
      x: leftContentX,
      y: qrY + qrSize - 35,
      size: 12,
      font: chineseFont
    });

    // 添加题目数量和生成时间（移到中间部分，第三行）
    targetPage.drawText(`共${studentData.questions.length}题、生成时间：${generatedTime}`, {
      x: leftContentX,
      y: qrY + qrSize - 50,
      size: 10,
      font: chineseFont
    });

    // 添加右侧二维码
    if (rightQrCodeImage) {
      const rightQrX = pageWidth - margin - qrSize;
      targetPage.drawImage(rightQrCodeImage, {
        x: rightQrX,
        y: qrY,
        width: qrSize,
        height: qrSize
      });
    }

    // 分隔线
    targetPage.drawLine({
      start: {
        x: margin,
        y: qrY - 10
      },
      end: {
        x: pageWidth - margin,
        y: qrY - 10
      },
      thickness: 0.5
    });
    return qrY - 25; // 返回页眉下方的Y坐标
  };

  // 绘制第一页的页眉
  currentY = drawHeader(page, pageNumber);
  isFirstQuestionOnPage = true;

  // 遍历题目
  for (let i = 0; i < studentData.questions.length; i++) {
    // 调用进度回调（如果提供）
    if (onProgress) {
      onProgress();
    }
    const question = studentData.questions[i];

    // 预先计算题目所需空间（包括序号、图片、间距）
    let requiredSpace = 20 + 30; // 题目序号(20) + 题目间距(30)
    let calculatedImageHeight = 0;
    let embeddedImage = null;
    let calculatedImageWidth = 0;

    // 如果有题目图片，预先计算图片高度并嵌入图片
    if (question.imageUrl) {
      try {
        const imageResponse = await fetch(question.imageUrl);
        if (imageResponse.ok) {
          const imageArrayBuffer = await imageResponse.arrayBuffer();
          const originalBuffer = Buffer.from(imageArrayBuffer);

          // 压缩图片以减小PDF体积
          const compressedBuffer = await compressImageForPdf(originalBuffer, config.maxImageSize, config.jpegQuality);
          const imageBytes = new Uint8Array(compressedBuffer);

          // 统一使用JPEG格式
          embeddedImage = await pdfDoc.embedJpg(imageBytes);
          const imageDims = embeddedImage.scale(1);

          // 计算图片显示尺寸
          let width = imageDims.width;
          let height = imageDims.height;

          // 首先确保图片宽度不超过内容区域宽度
          if (width > contentWidth) {
            const scale = contentWidth / width;
            width = contentWidth;
            height = height * scale;
          }

          // 如果图片宽度超过maxImageSize，按比例缩放
          if (width > config.maxImageSize) {
            const scale = config.maxImageSize / width;
            width = config.maxImageSize;
            height = height * scale;
          }
          calculatedImageHeight = height;
          calculatedImageWidth = width;
          requiredSpace += height + 10; // 图片高度 + 图片下方间距
        }
      } catch {
        // 图片加载失败，继续处理（requiredSpace只包含序号空间）
        embeddedImage = null;
      }
    }

    // 检查当前页是否有足够空间放置整个题目
    // 条件：当前Y位置减去所需空间后，是否仍在安全底部边界之上
    const hasEnoughSpace = currentY - requiredSpace >= safeBottomY;

    // 判断是否需要换页：
    // 1. 如果空间不足，且这不是当前页的第一题，则换页
    // 2. 如果是当前页的第一题，即使空间不足也要放在这一页（特殊情况）
    if (!hasEnoughSpace && !isFirstQuestionOnPage) {
      // 空间不足，换到新页面
      page = pdfDoc.addPage([pageWidth, pageHeight]);
      pageNumber++;
      // 根据配置决定是否在非首页显示页眉
      if (config.showHeaderOnNonFirstPage) {
        currentY = drawHeader(page, pageNumber);
      } else {
        currentY = pageHeight - margin;
      }
      isFirstQuestionOnPage = true;
    }

    // 添加题目序号
    page.drawText(`# ${i + 1}`, {
      x: margin,
      y: currentY,
      size: 12,
      font: chineseFont
    });
    currentY -= 5;

    // 如果有成功嵌入的图片，添加到页面
    if (embeddedImage) {
      // 添加图片
      page.drawImage(embeddedImage, {
        x: margin,
        y: currentY - calculatedImageHeight,
        width: calculatedImageWidth,
        height: calculatedImageHeight
      });
      currentY -= calculatedImageHeight + 10;
    }
    currentY -= 30; // 题目间距

    // 标记当前页已有题目
    isFirstQuestionOnPage = false;
  }

  // 生成PDF Buffer
  const pdfBytes = await pdfDoc.save();
  return {
    pdfBytes,
    fileSize: pdfBytes.length
  };
}

/**
 * 生成答案PDF字节数组
 */
export async function createAnswerPdfBytes({
  studentData,
  config,
  onProgress
}) {
  // 创建PDF文档
  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);

  // 加载中文字体
  let chineseFont;
  try {
    const fontBytes = fs.readFileSync(config.fontPath);
    chineseFont = await pdfDoc.embedFont(fontBytes);
  } catch {
    // 中文字体加载失败，使用默认字体
    chineseFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  }

  // 加载二维码图片
  let qrcodeImage;
  try {
    const qrcodeBytes = fs.readFileSync(config.qrcodePath);
    qrcodeImage = await pdfDoc.embedJpg(qrcodeBytes);
  } catch {
    // 二维码加载失败，继续执行
  }

  // 页面配置
  const pageWidth = 595; // A4宽度
  const pageHeight = 842; // A4高度
  const margin = 50;

  // 计算安全的底部边界（考虑打印机安全边距）
  const safeBottomY = margin + PAGE_BOTTOM_SAFETY_MARGIN;
  let page = pdfDoc.addPage([pageWidth, pageHeight]);
  let currentY = pageHeight - margin;
  let pageNumber = 1;

  // 追踪当前页是否已有题目内容
  let isFirstQuestionOnPage = true;

  // 生成右侧二维码
  let rightQrCodeImage;
  try {
    const rightQrCodeUrl = `${config.studentPdfQrCodeBaseUrl}/${studentData.studentPdfId}`;
    const rightQrCodeBuffer = await generateQRCodeBuffer(rightQrCodeUrl, config.headerQrCodeSize);
    rightQrCodeImage = await pdfDoc.embedPng(rightQrCodeBuffer);
  } catch {
    // 右侧二维码生成失败，继续执行
  }

  // 页眉绘制函数
  const drawHeader = (targetPage, pageNum) => {
    const qrSize = config.headerQrCodeSize;
    const qrMargin = margin;
    const qrY = pageHeight - margin - qrSize;

    // 添加左侧二维码
    if (qrcodeImage) {
      targetPage.drawImage(qrcodeImage, {
        x: qrMargin,
        y: qrY,
        width: qrSize,
        height: qrSize
      });
    }
    const leftContentX = qrMargin + qrSize + 15;
    const generatedTime = new Date().toLocaleString("zh-CN");

    // 添加标题（答案版本）
    targetPage.drawText(`${studentData.taskName}-${studentData.studentName}-答案`, {
      x: leftContentX,
      y: qrY + qrSize - 15,
      size: 16,
      font: chineseFont
    });

    // 添加页码和班级
    targetPage.drawText(`第${pageNum}页、班级：${studentData.className}`, {
      x: leftContentX,
      y: qrY + qrSize - 35,
      size: 12,
      font: chineseFont
    });

    // 添加题目数量和生成时间（移到中间部分，第三行）
    targetPage.drawText(`共${studentData.questions.length}题、生成时间：${generatedTime}`, {
      x: leftContentX,
      y: qrY + qrSize - 50,
      size: 10,
      font: chineseFont
    });

    // 添加右侧二维码
    if (rightQrCodeImage) {
      const rightQrX = pageWidth - margin - qrSize;
      targetPage.drawImage(rightQrCodeImage, {
        x: rightQrX,
        y: qrY,
        width: qrSize,
        height: qrSize
      });
    }

    // 分隔线
    targetPage.drawLine({
      start: {
        x: margin,
        y: qrY - 10
      },
      end: {
        x: pageWidth - margin,
        y: qrY - 10
      },
      thickness: 0.5
    });
    return qrY - 25; // 返回页眉下方的Y坐标
  };

  // 绘制第一页的页眉
  currentY = drawHeader(page, pageNumber);
  isFirstQuestionOnPage = true;

  // 遍历题目答案
  for (let i = 0; i < studentData.questions.length; i++) {
    // 调用进度回调（如果提供）
    if (onProgress) {
      onProgress();
    }
    const question = studentData.questions[i];

    // 预先计算整个题目所需的总空间
    let totalRequiredSpace = 20; // 题目序号高度

    // 预先处理答案图片
    let answerImage = null;
    let answerImageWidth = 0;
    let answerImageHeight = 0;
    if (question.answerImage?.imageUrl) {
      try {
        const response = await fetch(question.answerImage.imageUrl);
        const arrayBuffer = await response.arrayBuffer();
        const imageBuffer = Buffer.from(arrayBuffer);
        const compressedBuffer = await compressImageForPdf(imageBuffer, 700, config.jpegQuality);
        answerImage = await pdfDoc.embedJpg(compressedBuffer);
        const imageDims = answerImage.scale(1);
        const maxWidth = pageWidth - 2 * margin;
        const scale = Math.min(1, maxWidth / imageDims.width);
        answerImageWidth = imageDims.width * scale;
        answerImageHeight = imageDims.height * scale;
        totalRequiredSpace += 15 + answerImageHeight + 10; // 标签 + 图片 + 间距
      } catch (error) {
        console.error("答案图片加载失败:", error);
        answerImage = null;
        totalRequiredSpace += 12; // 错误提示高度
      }
    } else if (question.answer && question.answer.length > 0) {
      // 计算文本答案所需高度
      question.answer.forEach((answer, answerIndex) => {
        const answerText = `答案：${answerIndex + 1}. ${answer}`;
        const lines = wrapTextByCharCount({
          text: answerText,
          maxChars: 40
        });
        totalRequiredSpace += lines.length * 12;
      });
    }

    // 预先处理解析图片
    let parseImage = null;
    let parseImageWidth = 0;
    let parseImageHeight = 0;
    if (question.parseImage?.imageUrl) {
      try {
        const response = await fetch(question.parseImage.imageUrl);
        const arrayBuffer = await response.arrayBuffer();
        const imageBuffer = Buffer.from(arrayBuffer);
        const compressedBuffer = await compressImageForPdf(imageBuffer, 700, config.jpegQuality);
        parseImage = await pdfDoc.embedJpg(compressedBuffer);
        const imageDims = parseImage.scale(1);
        const maxWidth = pageWidth - 2 * margin;
        const scale = Math.min(1, maxWidth / imageDims.width);
        parseImageWidth = imageDims.width * scale;
        parseImageHeight = imageDims.height * scale;
        totalRequiredSpace += 15 + parseImageHeight + 10; // 标签 + 图片 + 间距
      } catch (error) {
        console.error("解析图片加载失败:", error);
        parseImage = null;
        totalRequiredSpace += 12; // 错误提示高度
      }
    } else if (question.parse && question.parse.length > 0) {
      // 计算文本解析所需高度
      question.parse.forEach((parseItem, parseIndex) => {
        const parseText = `解析：${parseIndex + 1}. ${parseItem}`;
        const lines = wrapTextByCharCount({
          text: parseText,
          maxChars: 40
        });
        totalRequiredSpace += lines.length * 12;
      });
    }
    totalRequiredSpace += 10; // 题目间距

    // 检查是否需要换页（在开始绘制题目之前）
    const hasEnoughSpace = currentY - totalRequiredSpace >= safeBottomY;
    if (!hasEnoughSpace && !isFirstQuestionOnPage) {
      page = pdfDoc.addPage([pageWidth, pageHeight]);
      pageNumber++;
      if (config.showHeaderOnNonFirstPage) {
        currentY = drawHeader(page, pageNumber);
      } else {
        currentY = pageHeight - margin;
      }
      isFirstQuestionOnPage = true;
    }

    // 题目序号
    page.drawText(`# ${i + 1}`, {
      x: margin,
      y: currentY,
      size: 12,
      font: chineseFont
    });
    currentY -= 20;

    // 答案部分 - 优先使用图片
    if (answerImage) {
      // 添加"答案："标签
      page.drawText("答案：", {
        x: margin + 20,
        y: currentY,
        size: 10,
        font: chineseFont
      });
      currentY -= 15;

      // 添加图片
      page.drawImage(answerImage, {
        x: margin,
        y: currentY - answerImageHeight,
        width: answerImageWidth,
        height: answerImageHeight
      });
      currentY -= answerImageHeight + 10;
    } else if (question.answerImage?.imageUrl) {
      // 图片加载失败的情况
      page.drawText("答案：图片加载失败", {
        x: margin + 20,
        y: currentY,
        size: 10,
        font: chineseFont
      });
      currentY -= 12;
    } else if (question.answer && question.answer.length > 0) {
      question.answer.forEach((answer, answerIndex) => {
        const answerText = `答案：${answerIndex + 1}. ${answer}`;
        const lines = wrapTextByCharCount({
          text: answerText,
          maxChars: 40
        });
        lines.forEach(line => {
          page.drawText(line, {
            x: margin + 20,
            y: currentY,
            size: 10,
            font: chineseFont
          });
          currentY -= 12;
        });
      });
    }

    // 解析部分 - 优先使用图片
    if (parseImage) {
      // 添加"解析："标签
      page.drawText("解析：", {
        x: margin + 20,
        y: currentY,
        size: 10,
        font: chineseFont
      });
      currentY -= 15;

      // 添加图片
      page.drawImage(parseImage, {
        x: margin,
        y: currentY - parseImageHeight,
        width: parseImageWidth,
        height: parseImageHeight
      });
      currentY -= parseImageHeight + 10;
    } else if (question.parseImage?.imageUrl) {
      // 图片加载失败的情况
      page.drawText("解析：图片加载失败", {
        x: margin + 20,
        y: currentY,
        size: 10,
        font: chineseFont
      });
      currentY -= 12;
    } else if (question.parse && question.parse.length > 0) {
      question.parse.forEach((parseItem, parseIndex) => {
        const parseText = `解析：${parseIndex + 1}. ${parseItem}`;
        const lines = wrapTextByCharCount({
          text: parseText,
          maxChars: 40
        });
        lines.forEach(line => {
          page.drawText(line, {
            x: margin + 20,
            y: currentY,
            size: 10,
            font: chineseFont
          });
          currentY -= 12;
        });
      });
    }
    currentY -= 10; // 题目间距

    // 标记当前页已有题目
    isFirstQuestionOnPage = false;
  }

  // 生成PDF Buffer
  const pdfBytes = await pdfDoc.save();
  return {
    pdfBytes,
    fileSize: pdfBytes.length
  };
}
