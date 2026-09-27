import fs from "node:fs";
import path from "node:path";
import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, StandardFonts } from "pdf-lib";
import sharp from "sharp";
import { allDocs, command, getDoc } from "../../../../../../lib/common/database.js";
import { deleteFile, getFileURL, uploadFile } from "../../../../../../lib/common/file.js";

// 全局配置变量

/** PDF中图片的最大尺寸（px），超过此尺寸的图片将被压缩 */
const MAX_IMAGE_SIZE = 1000;

/** 非首页是否显示页眉信息，true表示所有页面都有页眉，false表示只有第一页有页眉 */
const SHOW_HEADER_ON_NON_FIRST_PAGE = false;

/** 典型错题的左侧缩进（px） */
const TYPICAL_ERROR_INDENT = 30;

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
export async function generateQuestionsPdf(frequentMistakeId) {
  try {
    // 获取高频错题集信息
    const frequentMistake = await getDoc("frequent_mistake", frequentMistakeId);
    if (!frequentMistake) {
      return {
        success: false,
        error: "高频错题集不存在"
      };
    }

    // 获取学校信息
    const school = await getDoc("school", frequentMistake.schoolId);

    // 获取题目数据
    const _ = command();
    const questions = await allDocs({
      c: "exam_question",
      match: {
        _id: _.in(frequentMistake.questionIds)
      }
    });

    // 获取所有典型错题数据
    const typicalErrors = await allDocs({
      c: "frequent_mistake_typical_error",
      match: {
        frequentMistakeId
      },
      sort: {
        questionId: 1,
        sortOrder: 1
      }
    });

    // 获取典型错题关联的StudentAnswerItemDoc数据
    const studentAnswerItemIds = typicalErrors.map(te => te.studentAnswerItemId);
    const studentAnswerItems = studentAnswerItemIds.length > 0 ? await allDocs({
      c: "student_answer_item",
      match: {
        _id: _.in(studentAnswerItemIds)
      }
    }) : [];

    // 构建questionId到典型错题的映射
    const studentAnswerItemMap = new Map(studentAnswerItems.map(item => [item._id, item]));
    const typicalErrorsByQuestion = new Map();
    for (const typicalError of typicalErrors) {
      const studentAnswerItem = studentAnswerItemMap.get(typicalError.studentAnswerItemId);
      if (studentAnswerItem) {
        if (!typicalErrorsByQuestion.has(typicalError.questionId)) {
          typicalErrorsByQuestion.set(typicalError.questionId, []);
        }
        typicalErrorsByQuestion.get(typicalError.questionId).push({
          typicalError,
          studentAnswerItem
        });
      }
    }

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
      targetPage.drawText(`高频错题集-${frequentMistake.name}`, {
        x: leftContentX,
        y: qrY + qrSize - 15,
        size: 16,
        font: chineseFont
      });

      // 添加页码和学校
      targetPage.drawText(`第${pageNum}页、学校：${school?.name || ""}`, {
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
      targetPage.drawText(`${generatedTime}`, {
        x: rightX - chineseFont.widthOfTextAtSize(`${generatedTime}`, 11),
        y: qrY + qrSize - 25,
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

      // 检查是否需要新页面
      if (currentY < 150) {
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

      // 如果有题目图片，添加图片
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

            // 检查是否需要新页面
            if (currentY - height < margin) {
              page = pdfDoc.addPage([pageWidth, pageHeight]);
              pageNumber++;
              if (SHOW_HEADER_ON_NON_FIRST_PAGE) {
                currentY = drawHeader(page, pageNumber);
              } else {
                currentY = pageHeight - margin;
              }
            }
            page.drawImage(image, {
              x: margin,
              y: currentY - height,
              width,
              height
            });
            currentY -= height + 15;
          }
        } catch (error) {
          console.error(`加载题目图片失败 (题目 ${i + 1}):`, error);
        }
      }

      // 渲染该题目的典型错题
      const questionTypicalErrors = typicalErrorsByQuestion.get(question._id) || [];
      if (questionTypicalErrors.length > 0) {
        currentY -= 15;
        for (let j = 0; j < questionTypicalErrors.length; j++) {
          const {
            studentAnswerItem
          } = questionTypicalErrors[j];

          // 检查是否需要新页面
          if (currentY < 150) {
            page = pdfDoc.addPage([pageWidth, pageHeight]);
            pageNumber++;
            if (SHOW_HEADER_ON_NON_FIRST_PAGE) {
              currentY = drawHeader(page, pageNumber);
            } else {
              currentY = pageHeight - margin;
            }
          }

          // 典型错题标题
          const typicalErrorTitle = `#${i + 1} 的典型错题-${j + 1}`;
          page.drawText(typicalErrorTitle, {
            x: margin + TYPICAL_ERROR_INDENT,
            y: currentY,
            size: 11,
            font: chineseFont
          });
          currentY -= 20;

          // 渲染典型错题图片
          if (studentAnswerItem.imageUrl) {
            try {
              const imageResponse = await fetch(studentAnswerItem.imageUrl);
              if (imageResponse.ok) {
                const imageArrayBuffer = await imageResponse.arrayBuffer();
                const imageBytes = new Uint8Array(imageArrayBuffer);
                let image;
                const imageUrl = studentAnswerItem.imageUrl.toLowerCase();
                if (imageUrl.includes(".png")) {
                  image = await pdfDoc.embedPng(imageBytes);
                } else {
                  image = await pdfDoc.embedJpg(imageBytes);
                }
                const imageDims = image.scale(1);

                // 计算图片宽度（减去缩进）
                const availableWidth = contentWidth - TYPICAL_ERROR_INDENT;
                let width = imageDims.width;
                let height = imageDims.height;

                // 根据可用宽度等比例缩放
                if (width > availableWidth) {
                  const scale = availableWidth / width;
                  width = availableWidth;
                  height = height * scale;
                }

                // 检查是否需要新页面
                if (currentY - height < margin) {
                  page = pdfDoc.addPage([pageWidth, pageHeight]);
                  pageNumber++;
                  if (SHOW_HEADER_ON_NON_FIRST_PAGE) {
                    currentY = drawHeader(page, pageNumber);
                  } else {
                    currentY = pageHeight - margin;
                  }
                }
                page.drawImage(image, {
                  x: margin + TYPICAL_ERROR_INDENT,
                  y: currentY - height,
                  width,
                  height
                });
                currentY -= height + 10;
              }
            } catch (error) {
              console.error(`加载典型错题图片失败 (题目 ${i + 1}, 典型错题 ${j + 1}):`, error);
            }
          }

          // 渲染学生答案
          if (studentAnswerItem.answerValue && studentAnswerItem.answerValue.length > 0) {
            const answerText = `学生答案：${studentAnswerItem.answerValue.join("；")}`;
            const answerLines = wrapTextByCharCount(answerText, Math.floor((contentWidth - TYPICAL_ERROR_INDENT) / 10));
            for (const line of answerLines) {
              // 检查是否需要新页面
              if (currentY < margin + 20) {
                page = pdfDoc.addPage([pageWidth, pageHeight]);
                pageNumber++;
                if (SHOW_HEADER_ON_NON_FIRST_PAGE) {
                  currentY = drawHeader(page, pageNumber);
                } else {
                  currentY = pageHeight - margin;
                }
              }
              page.drawText(line, {
                x: margin + TYPICAL_ERROR_INDENT,
                y: currentY,
                size: 10,
                font: chineseFont
              });
              currentY -= 15;
            }
          }

          // 渲染错误解析
          if (studentAnswerItem.parse && studentAnswerItem.parse.length > 0) {
            const parseText = `错误解析：${studentAnswerItem.parse.join("；")}`;
            const parseLines = wrapTextByCharCount(parseText, Math.floor((contentWidth - TYPICAL_ERROR_INDENT) / 10));
            for (const line of parseLines) {
              // 检查是否需要新页面
              if (currentY < margin + 20) {
                page = pdfDoc.addPage([pageWidth, pageHeight]);
                pageNumber++;
                if (SHOW_HEADER_ON_NON_FIRST_PAGE) {
                  currentY = drawHeader(page, pageNumber);
                } else {
                  currentY = pageHeight - margin;
                }
              }
              page.drawText(line, {
                x: margin + TYPICAL_ERROR_INDENT,
                y: currentY,
                size: 10,
                font: chineseFont
              });
              currentY -= 15;
            }
          }
          currentY -= 10; // 典型错题之间的间距
        }
      }
      currentY -= 10;
    }

    // 保存PDF
    const pdfBytes = await pdfDoc.save();

    // 生成文件路径
    const timestamp = Date.now();
    const filePath = `cuoti/frequent_mistake/${frequentMistakeId}/pdf/questions-${timestamp}.pdf`;

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
  } catch (error) {
    console.error("生成题目PDF失败:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "生成PDF失败"
    };
  }
}

/**
 * 生成答案PDF
 */
export async function generateAnswersPdf(frequentMistakeId) {
  try {
    // 获取高频错题集信息
    const frequentMistake = await getDoc("frequent_mistake", frequentMistakeId);
    if (!frequentMistake) {
      return {
        success: false,
        error: "高频错题集不存在"
      };
    }

    // 获取学校信息
    const school = await getDoc("school", frequentMistake.schoolId);

    // 获取题目数据（包含答案和解析的图片字段）
    const _ = command();
    const questions = await allDocs({
      c: "exam_question",
      match: {
        _id: _.in(frequentMistake.questionIds)
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
    const pageWidth = 595;
    const pageHeight = 842;
    const margin = 50;
    let page = pdfDoc.addPage([pageWidth, pageHeight]);
    let currentY = pageHeight - margin;
    let pageNumber = 1;

    // 页眉绘制函数
    const drawHeader = (targetPage, pageNum) => {
      const qrSize = 60;
      const qrMargin = margin;
      const qrY = pageHeight - margin - qrSize;
      if (qrcodeImage) {
        targetPage.drawImage(qrcodeImage, {
          x: qrMargin,
          y: qrY,
          width: qrSize,
          height: qrSize
        });
      }
      const leftContentX = qrMargin + qrSize + 15;
      targetPage.drawText(`高频错题集答案-${frequentMistake.name}`, {
        x: leftContentX,
        y: qrY + qrSize - 15,
        size: 16,
        font: chineseFont
      });
      targetPage.drawText(`第${pageNum}页、学校：${school?.name || ""}`, {
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
      targetPage.drawText(`${generatedTime}`, {
        x: rightX - chineseFont.widthOfTextAtSize(`${generatedTime}`, 11),
        y: qrY + qrSize - 25,
        size: 11,
        font: chineseFont
      });
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
      return qrY - 25;
    };
    currentY = drawHeader(page, pageNumber);

    // 遍历题目
    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];

      // 检查是否需要新页面
      if (currentY < 200) {
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
        page.drawText("答案：", {
          x: margin,
          y: currentY,
          size: 11,
          font: chineseFont
        });
        currentY -= 15;
        for (const ans of question.answer) {
          if (ans.trim()) {
            const lines = wrapTextByCharCount(ans, 60);
            for (const line of lines) {
              if (currentY < margin + 20) {
                page = pdfDoc.addPage([pageWidth, pageHeight]);
                pageNumber++;
                if (SHOW_HEADER_ON_NON_FIRST_PAGE) {
                  currentY = drawHeader(page, pageNumber);
                } else {
                  currentY = pageHeight - margin;
                }
              }
              page.drawText(line, {
                x: margin + 10,
                y: currentY,
                size: 10,
                font: chineseFont
              });
              currentY -= 15;
            }
          }
        }
        currentY -= 5;
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
        page.drawText("解析：", {
          x: margin,
          y: currentY,
          size: 11,
          font: chineseFont
        });
        currentY -= 15;
        for (const parseText of question.parse) {
          if (parseText.trim()) {
            const lines = wrapTextByCharCount(parseText, 60);
            for (const line of lines) {
              if (currentY < margin + 20) {
                page = pdfDoc.addPage([pageWidth, pageHeight]);
                pageNumber++;
                if (SHOW_HEADER_ON_NON_FIRST_PAGE) {
                  currentY = drawHeader(page, pageNumber);
                } else {
                  currentY = pageHeight - margin;
                }
              }
              page.drawText(line, {
                x: margin + 10,
                y: currentY,
                size: 10,
                font: chineseFont
              });
              currentY -= 15;
            }
          }
        }
        currentY -= 5;
      }
      currentY -= 15;
    }

    // 保存PDF
    const pdfBytes = await pdfDoc.save();

    // 生成文件路径
    const timestamp = Date.now();
    const filePath = `cuoti/frequent_mistake/${frequentMistakeId}/pdf/answers-${timestamp}.pdf`;

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
  } catch (error) {
    console.error("生成答案PDF失败:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "生成PDF失败"
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
  } catch (error) {
    console.error("删除PDF文件失败:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "删除文件失败"
    };
  }
}
