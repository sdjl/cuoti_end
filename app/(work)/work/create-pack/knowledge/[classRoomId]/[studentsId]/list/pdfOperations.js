import fs from "node:fs";
import path from "node:path";
import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, StandardFonts } from "pdf-lib";
import sharp from "sharp";
import { getClassRoomById } from "../../../../../../../../lib/collection/classroom.js";
import { getStudentById } from "../../../../../../../../lib/collection/student.js";
import { allDocs, command, getDoc } from "../../../../../../../../lib/common/database.js";
import { deleteFile, getFileURL, uploadFile } from "../../../../../../../../lib/common/file.js";

// 全局配置变量

/** PDF中图片的最大尺寸（px），超过此尺寸的图片将被压缩 */
const MAX_IMAGE_SIZE = 1000;

/** 非首页是否显示页眉信息，true表示所有页面都有页眉，false表示只有第一页有页眉 */
const SHOW_HEADER_ON_NON_FIRST_PAGE = false;

/**
 * 压缩图片用于PDF嵌入
 */
async function compressImageForPdf(imageBuffer, maxWidth, quality) {
  try {
    const image = sharp(imageBuffer);
    const metadata = await image.metadata();

    // 如果图片宽度超过最大宽度，进行压缩
    if (metadata.width && metadata.width > maxWidth) {
      return await image.resize(maxWidth, undefined, {
        fit: "inside",
        withoutEnlargement: true
      }).jpeg({
        quality
      }).toBuffer();
    }

    // 否则只进行格式转换和质量压缩
    return await image.jpeg({
      quality
    }).toBuffer();
  } catch (error) {
    console.error("图片压缩失败:", error);
    // 压缩失败，返回原始buffer
    return imageBuffer;
  }
}

/**
 * 文本换行处理函数
 */
function wrapTextByCharCount(text, maxChars) {
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
 * 生成题目PDF
 */
export async function generateQuestionsPdf(studentId, classRoomId, questionPackId) {
  try {
    // 获取题集信息
    const questionPack = await getDoc("question_pack", questionPackId);
    if (!questionPack) {
      return {
        success: false,
        error: "题集不存在"
      };
    }

    // 获取学生和班级信息
    const [student, classroom] = await Promise.all([getStudentById(studentId), getClassRoomById(classRoomId)]);
    if (!student || !classroom) {
      return {
        success: false,
        error: "学生或班级信息不存在"
      };
    }

    // 获取学校信息
    const school = await getDoc("school", classroom.schoolId);

    // 获取题目数据
    const _ = command();
    const questions = await allDocs({
      c: "exam_question",
      match: {
        _id: _.in(questionPack.questionIds)
      }
    });

    // 创建PDF文档
    const pdfDoc = await PDFDocument.create();
    pdfDoc.registerFontkit(fontkit);

    // 加载中文字体
    let chineseFont;
    try {
      const fontPath = path.join(process.cwd(), "public/font/SourceHanSerifSC-Regular.otf");
      const fontBytes = fs.readFileSync(fontPath);
      chineseFont = await pdfDoc.embedFont(fontBytes);
    } catch {
      // 中文字体加载失败，使用默认字体
      chineseFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    }

    // 加载二维码图片
    let qrcodeImage;
    try {
      const qrcodePath = path.join(process.cwd(), "public/images/user/index/qrcode.jpg");
      const qrcodeBytes = fs.readFileSync(qrcodePath);
      qrcodeImage = await pdfDoc.embedJpg(qrcodeBytes);
    } catch {
      // 二维码加载失败，继续执行
    }

    // 页面配置
    const pageWidth = 595; // A4宽度
    const pageHeight = 842; // A4高度
    const margin = 50;
    const contentWidth = pageWidth - 2 * margin;
    let page = pdfDoc.addPage([pageWidth, pageHeight]);
    let currentY = pageHeight - margin;
    let pageNumber = 1;

    // 页眉绘制函数
    const drawHeader = (targetPage, pageNum) => {
      const qrSize = 60;
      const qrMargin = margin;
      const qrY = pageHeight - margin - qrSize;

      // 添加二维码
      if (qrcodeImage) {
        targetPage.drawImage(qrcodeImage, {
          x: qrMargin,
          y: qrY,
          width: qrSize,
          height: qrSize
        });
      }
      const leftContentX = qrMargin + qrSize + 15;

      // 添加标题
      targetPage.drawText(`澎湃理综定制化试卷-${student.name}`, {
        x: leftContentX,
        y: qrY + qrSize - 15,
        size: 16,
        font: chineseFont
      });

      // 添加页码、学校和班级
      targetPage.drawText(`第${pageNum}页、学校：${school?.name || ""}、班级：${classroom.name}`, {
        x: leftContentX,
        y: qrY + qrSize - 35,
        size: 12,
        font: chineseFont
      });
      const rightX = pageWidth - margin;
      const generatedTime = new Date().toLocaleString("zh-CN");
      targetPage.drawText(`${questions.length}题`, {
        x: rightX - chineseFont.widthOfTextAtSize(`${questions.length}题`, 11),
        y: qrY + qrSize - 10,
        size: 11,
        font: chineseFont
      });
      targetPage.drawText(`${student.studentCode}`, {
        x: rightX - chineseFont.widthOfTextAtSize(`${student.studentCode}`, 11),
        y: qrY + qrSize - 25,
        size: 11,
        font: chineseFont
      });
      targetPage.drawText(`${generatedTime}`, {
        x: rightX - chineseFont.widthOfTextAtSize(`${generatedTime}`, 11),
        y: qrY + qrSize - 40,
        size: 11,
        font: chineseFont
      });

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

    // 遍历题目
    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];

      // 预先计算题目所需空间（包括序号、图片、间距）
      let requiredSpace = 20 + 30; // 题目序号(15) + 间距(5) + 题目间距(30)
      let calculatedImageHeight = 0;

      // 如果有题目图片，预先下载并计算图片高度
      if (question.imageUrl) {
        try {
          const imageResponse = await fetch(question.imageUrl);
          if (imageResponse.ok) {
            const imageArrayBuffer = await imageResponse.arrayBuffer();
            const imageBytes = new Uint8Array(imageArrayBuffer);
            let image;
            const imageUrl = question.imageUrl.toLowerCase();
            if (imageUrl.includes(".png")) {
              image = await pdfDoc.embedPng(imageBytes);
            } else {
              image = await pdfDoc.embedJpg(imageBytes);
            }
            const imageDims = image.scale(1);

            // 根据MAX_IMAGE_SIZE限制图片尺寸
            let width = imageDims.width;
            let height = imageDims.height;

            // 如果图片宽度或高度超过最大尺寸，进行等比例缩放
            if (width > MAX_IMAGE_SIZE || height > MAX_IMAGE_SIZE) {
              const scale = Math.min(MAX_IMAGE_SIZE / width, MAX_IMAGE_SIZE / height);
              width = width * scale;
              height = height * scale;
            }

            // 确保图片宽度不超过内容区域宽度
            if (width > contentWidth) {
              const scale = contentWidth / width;
              width = contentWidth;
              height = height * scale;
            }

            // 限制图片高度，避免单个图片占用过多空间
            const maxHeight = 400;
            if (height > maxHeight) {
              const scale = maxHeight / height;
              height = maxHeight;
              width = width * scale;
            }
            calculatedImageHeight = height;
            requiredSpace += height + 10; // 加上图片高度和间距

            // 检查当前页是否有足够空间放置整个题目（考虑打印需求，预留底部margin空间）
            if (currentY - requiredSpace < margin) {
              // 空间不足，换到新页面
              page = pdfDoc.addPage([pageWidth, pageHeight]);
              pageNumber++;
              // 根据配置决定是否在非首页显示页眉
              if (SHOW_HEADER_ON_NON_FIRST_PAGE) {
                currentY = drawHeader(page, pageNumber);
              } else {
                currentY = pageHeight - margin;
              }
            }

            // 添加题目序号
            page.drawText(`# ${i + 1}`, {
              x: margin,
              y: currentY,
              size: 12,
              font: chineseFont
            });
            currentY -= 5;

            // 添加图片
            page.drawImage(image, {
              x: margin,
              y: currentY - calculatedImageHeight,
              width,
              height: calculatedImageHeight
            });
            currentY -= calculatedImageHeight + 10;
          }
        } catch {
          // 图片添加失败，仍然添加题目序号
          // 检查是否需要新页面（只需要序号空间）
          if (currentY < margin + 50) {
            page = pdfDoc.addPage([pageWidth, pageHeight]);
            pageNumber++;
            if (SHOW_HEADER_ON_NON_FIRST_PAGE) {
              currentY = drawHeader(page, pageNumber);
            } else {
              currentY = pageHeight - margin;
            }
          }
          page.drawText(`# ${i + 1}`, {
            x: margin,
            y: currentY,
            size: 12,
            font: chineseFont
          });
          currentY -= 5;
        }
      } else {
        // 没有图片，只需要检查序号空间
        if (currentY < margin + 50) {
          page = pdfDoc.addPage([pageWidth, pageHeight]);
          pageNumber++;
          if (SHOW_HEADER_ON_NON_FIRST_PAGE) {
            currentY = drawHeader(page, pageNumber);
          } else {
            currentY = pageHeight - margin;
          }
        }

        // 添加题目序号
        page.drawText(`# ${i + 1}`, {
          x: margin,
          y: currentY,
          size: 12,
          font: chineseFont
        });
        currentY -= 5;
      }
      currentY -= 30; // 题目间距（增加2个空行）
    }

    // 生成PDF Buffer
    const pdfBytes = await pdfDoc.save();

    // 生成文件路径
    const timestamp = Date.now();
    const filePath = `cuoti/exercise/questions/${questionPackId}-${timestamp}.pdf`;

    // 上传到云存储
    const uploadResult = await uploadFile(filePath, Buffer.from(pdfBytes));
    const fileUrl = await getFileURL(uploadResult.fileID);
    return {
      success: true,
      data: {
        fileId: uploadResult.fileID,
        fileUrl,
        filePath
      }
    };
  } catch {
    return {
      success: false,
      error: "生成PDF失败"
    };
  }
}

/**
 * 生成答案PDF
 */
export async function generateAnswersPdf(studentId, classRoomId, questionPackId) {
  try {
    // 获取题集信息
    const questionPack = await getDoc("question_pack", questionPackId);
    if (!questionPack) {
      return {
        success: false,
        error: "题集不存在"
      };
    }

    // 获取学生和班级信息
    const [student, classroom] = await Promise.all([getStudentById(studentId), getClassRoomById(classRoomId)]);
    if (!student || !classroom) {
      return {
        success: false,
        error: "学生或班级信息不存在"
      };
    }

    // 获取学校信息
    const school = await getDoc("school", classroom.schoolId);

    // 获取题目数据（包含答案和解析图片）
    const _ = command();
    const questions = await allDocs({
      c: "exam_question",
      match: {
        _id: _.in(questionPack.questionIds)
      },
      only: "_id,answer,parse,answerImage,parseImage"
    });

    // 创建PDF文档
    const pdfDoc = await PDFDocument.create();
    pdfDoc.registerFontkit(fontkit);

    // 加载中文字体
    let chineseFont;
    try {
      const fontPath = path.join(process.cwd(), "public/font/SourceHanSerifSC-Regular.otf");
      const fontBytes = fs.readFileSync(fontPath);
      chineseFont = await pdfDoc.embedFont(fontBytes);
    } catch {
      // 中文字体加载失败，使用默认字体
      chineseFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    }

    // 加载二维码图片
    let qrcodeImage;
    try {
      const qrcodePath = path.join(process.cwd(), "public/images/user/index/qrcode.jpg");
      const qrcodeBytes = fs.readFileSync(qrcodePath);
      qrcodeImage = await pdfDoc.embedJpg(qrcodeBytes);
    } catch {
      // 二维码加载失败，继续执行
    }

    // 页面配置
    const pageWidth = 595; // A4宽度
    const pageHeight = 842; // A4高度
    const margin = 50;
    let page = pdfDoc.addPage([pageWidth, pageHeight]);
    let currentY = pageHeight - margin;
    let pageNumber = 1;

    // 页眉绘制函数
    const drawHeader = (targetPage, pageNum) => {
      const qrSize = 60;
      const qrMargin = margin;
      const qrY = pageHeight - margin - qrSize;

      // 添加二维码
      if (qrcodeImage) {
        targetPage.drawImage(qrcodeImage, {
          x: qrMargin,
          y: qrY,
          width: qrSize,
          height: qrSize
        });
      }
      const leftContentX = qrMargin + qrSize + 15;

      // 添加标题（答案版本）
      targetPage.drawText(`澎湃理综定制化试卷答案-${student.name}`, {
        x: leftContentX,
        y: qrY + qrSize - 15,
        size: 16,
        font: chineseFont
      });

      // 添加页码、学校和班级
      targetPage.drawText(`第${pageNum}页、${school?.name || ""}、${classroom.name}`, {
        x: leftContentX,
        y: qrY + qrSize - 35,
        size: 12,
        font: chineseFont
      });
      const rightX = pageWidth - margin;
      const generatedTime = new Date().toLocaleString("zh-CN");
      targetPage.drawText(`${questions.length}题`, {
        x: rightX - chineseFont.widthOfTextAtSize(`${questions.length}题`, 11),
        y: qrY + qrSize - 10,
        size: 11,
        font: chineseFont
      });
      targetPage.drawText(`${student.studentCode}`, {
        x: rightX - chineseFont.widthOfTextAtSize(`${student.studentCode}`, 11),
        y: qrY + qrSize - 25,
        size: 11,
        font: chineseFont
      });
      targetPage.drawText(`${generatedTime}`, {
        x: rightX - chineseFont.widthOfTextAtSize(`${generatedTime}`, 11),
        y: qrY + qrSize - 40,
        size: 11,
        font: chineseFont
      });

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

    // 遍历题目答案
    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];

      // 检查是否需要新页面
      if (currentY < 100) {
        page = pdfDoc.addPage([pageWidth, pageHeight]);
        pageNumber++;
        // 根据配置决定是否在非首页显示页眉
        if (SHOW_HEADER_ON_NON_FIRST_PAGE) {
          currentY = drawHeader(page, pageNumber);
        } else {
          currentY = pageHeight - margin;
        }
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
      if (question.answerImage?.imageUrl) {
        try {
          // 使用fetch下载图片
          const response = await fetch(question.answerImage.imageUrl);
          const arrayBuffer = await response.arrayBuffer();
          const imageBuffer = Buffer.from(arrayBuffer);

          // 压缩图片到700px宽度
          const compressedBuffer = await compressImageForPdf(imageBuffer, 700, 85);

          // 嵌入图片到PDF
          const image = await pdfDoc.embedJpg(compressedBuffer);
          const imageDims = image.scale(1);

          // 计算显示尺寸
          const maxWidth = pageWidth - 2 * margin;
          const scale = Math.min(1, maxWidth / imageDims.width);
          const width = imageDims.width * scale;
          const height = imageDims.height * scale;

          // 计算所需空间：标签(15) + 图片高度 + 间距(10)
          const requiredSpace = 15 + height + 10;

          // 检查是否需要新页面
          if (currentY - requiredSpace < margin) {
            page = pdfDoc.addPage([pageWidth, pageHeight]);
            pageNumber++;
            if (SHOW_HEADER_ON_NON_FIRST_PAGE) {
              currentY = drawHeader(page, pageNumber);
            } else {
              currentY = pageHeight - margin;
            }
          }

          // 添加"答案："标签
          page.drawText("答案：", {
            x: margin + 20,
            y: currentY,
            size: 10,
            font: chineseFont
          });
          currentY -= 15;

          // 添加图片
          page.drawImage(image, {
            x: margin,
            y: currentY - height,
            width,
            height
          });
          currentY -= height + 10;
        } catch (error) {
          console.error("答案图片加载失败:", error);
          // 图片加载失败，显示错误提示
          page.drawText("答案：图片加载失败", {
            x: margin + 20,
            y: currentY,
            size: 10,
            font: chineseFont
          });
          currentY -= 12;
        }
      } else if (question.answer && question.answer.length > 0) {
        question.answer.forEach((answer, answerIndex) => {
          const answerText = `答案：${answerIndex + 1}. ${answer}`;
          const lines = wrapTextByCharCount(answerText, 40);
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
      if (question.parseImage?.imageUrl) {
        try {
          // 使用fetch下载图片
          const response = await fetch(question.parseImage.imageUrl);
          const arrayBuffer = await response.arrayBuffer();
          const imageBuffer = Buffer.from(arrayBuffer);

          // 压缩图片到700px宽度
          const compressedBuffer = await compressImageForPdf(imageBuffer, 700, 85);

          // 嵌入图片到PDF
          const image = await pdfDoc.embedJpg(compressedBuffer);
          const imageDims = image.scale(1);

          // 计算显示尺寸
          const maxWidth = pageWidth - 2 * margin;
          const scale = Math.min(1, maxWidth / imageDims.width);
          const width = imageDims.width * scale;
          const height = imageDims.height * scale;

          // 计算所需空间：标签(15) + 图片高度 + 间距(10)
          const requiredSpace = 15 + height + 10;

          // 检查是否需要新页面
          if (currentY - requiredSpace < margin) {
            page = pdfDoc.addPage([pageWidth, pageHeight]);
            pageNumber++;
            if (SHOW_HEADER_ON_NON_FIRST_PAGE) {
              currentY = drawHeader(page, pageNumber);
            } else {
              currentY = pageHeight - margin;
            }
          }

          // 添加"解析："标签
          page.drawText("解析：", {
            x: margin + 20,
            y: currentY,
            size: 10,
            font: chineseFont
          });
          currentY -= 15;

          // 添加图片
          page.drawImage(image, {
            x: margin,
            y: currentY - height,
            width,
            height
          });
          currentY -= height + 10;
        } catch (error) {
          console.error("解析图片加载失败:", error);
          // 图片加载失败，显示错误提示
          page.drawText("解析：图片加载失败", {
            x: margin + 20,
            y: currentY,
            size: 10,
            font: chineseFont
          });
          currentY -= 12;
        }
      } else if (question.parse && question.parse.length > 0) {
        question.parse.forEach((parseItem, parseIndex) => {
          const parseText = `解析：${parseIndex + 1}. ${parseItem}`;
          const lines = wrapTextByCharCount(parseText, 40);
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
    }

    // 生成PDF Buffer
    const pdfBytes = await pdfDoc.save();

    // 生成文件路径
    const timestamp = Date.now();
    const filePath = `cuoti/exercise/answers/${questionPackId}-${timestamp}.pdf`;

    // 上传到云存储
    const uploadResult = await uploadFile(filePath, Buffer.from(pdfBytes));
    const fileUrl = await getFileURL(uploadResult.fileID);
    return {
      success: true,
      data: {
        fileId: uploadResult.fileID,
        fileUrl,
        filePath
      }
    };
  } catch {
    return {
      success: false,
      error: "生成PDF失败"
    };
  }
}

/**
 * 删除PDF文件
 */
export async function deletePdfFile(fileId) {
  try {
    await deleteFile([fileId]);
    return {
      success: true
    };
  } catch {
    return {
      success: false,
      error: "删除文件失败"
    };
  }
}
