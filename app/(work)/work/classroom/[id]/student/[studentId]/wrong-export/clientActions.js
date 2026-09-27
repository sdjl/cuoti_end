"use client";

/** 前端手动下载错题集PDF文件 */
import jsPDF from "jspdf";

// 全局配置变量

/** PDF中图片的最大尺寸（px），超过此尺寸的图片将被压缩 */
export const MAX_IMAGE_SIZE = 1000;

/** 非首页是否显示页眉信息，true表示所有页面都有页眉，false表示只有第一页有页眉 */
export const SHOW_HEADER_ON_NON_FIRST_PAGE = false;

// 错题PDF生成相关的客户端函数

// 动态加载字体文件并转换为Base64
async function loadFontToBase64(fontPath) {
  const response = await fetch(fontPath);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      // 移除data URL的前缀，只保留base64部分
      const base64 = reader.result?.toString().split(",")[1];
      resolve(base64 || "");
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// 手动分割文本，适配中文
function splitTextIntoLines(text, maxWidth, pdf, fontSize) {
  const lines = [];

  // 设置字体大小以正确计算宽度
  pdf.setFontSize(fontSize);

  // 如果文本为空，返回空数组
  if (!text) return lines;

  // 按换行符分割
  const paragraphs = text.split("\n");
  for (const paragraph of paragraphs) {
    if (!paragraph) {
      lines.push("");
      continue;
    }
    let currentLine = "";
    const chars = paragraph.split("");
    for (const char of chars) {
      const testLine = currentLine + char;
      const textWidth = pdf.getTextWidth(testLine);
      if (textWidth > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = char;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) {
      lines.push(currentLine);
    }
  }
  return lines;
}

// 优化的图片加载函数，包含重试机制和内存优化
async function loadImageWithCORS(imageUrl, retryCount = 3) {
  for (let attempt = 0; attempt < retryCount; attempt++) {
    try {
      // 添加时间戳避免缓存问题
      const urlWithTimestamp = imageUrl.includes("?") ? `${imageUrl}&t=${Date.now()}` : `${imageUrl}?t=${Date.now()}`;

      // 方法1：先尝试使用fetch加载（更可靠）
      try {
        const response = await fetch(urlWithTimestamp, {
          mode: "cors",
          credentials: "omit",
          cache: "no-cache",
          headers: {
            "Cache-Control": "no-cache"
          }
        });
        if (response.ok) {
          const blob = await response.blob();
          const base64 = await blobToBase64WithCompression(blob);
          return {
            ...base64,
            originalUrl: imageUrl
          };
        }
      } catch {
        // Fetch方法失败，尝试Image方法
      }

      // 方法2：使用Image对象加载
      const result = await loadImageWithImageElement(urlWithTimestamp);
      return {
        ...result,
        originalUrl: imageUrl
      };
    } catch {
      if (attempt < retryCount - 1) {
        // 等待一段时间后重试，逐渐增加等待时间
        const delay = 1000 * (attempt + 1);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        return null;
      }
    }
  }
  return null;
}

// 使用Image元素加载图片
async function loadImageWithImageElement(imageUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image();

    // 设置超时
    const timeout = setTimeout(() => {
      reject(new Error("图片加载超时"));
    }, 15000); // 15秒超时

    img.onload = () => {
      clearTimeout(timeout);
      try {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d", {
          // 添加性能优化选项
          willReadFrequently: true,
          desynchronized: true
        });
        if (!ctx) {
          reject(new Error("无法创建canvas上下文"));
          return;
        }

        // 根据MAX_IMAGE_SIZE限制图片尺寸
        let width = img.width;
        let height = img.height;
        if (width > MAX_IMAGE_SIZE || height > MAX_IMAGE_SIZE) {
          const ratio = Math.min(MAX_IMAGE_SIZE / width, MAX_IMAGE_SIZE / height);
          width = Math.floor(width * ratio);
          height = Math.floor(height * ratio);
        }
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        // 使用JPEG格式并压缩质量
        let quality = 0.9;
        let base64 = canvas.toDataURL("image/jpeg", quality);

        // 如果base64太大，继续压缩
        while (base64.length > 500000 && quality > 0.3) {
          quality -= 0.1;
          base64 = canvas.toDataURL("image/jpeg", quality);
        }

        // 立即清理canvas内存
        canvas.width = 0;
        canvas.height = 0;
        resolve({
          base64,
          format: "JPEG",
          width: width,
          height: height
        });
      } catch (error) {
        reject(error);
      }
    };
    img.onerror = () => {
      clearTimeout(timeout);
      reject(new Error("图片加载失败"));
    };

    // 不设置crossOrigin，因为页面能显示说明不需要
    img.src = imageUrl;
  });
}

// 将Blob转换为Base64并压缩
async function blobToBase64WithCompression(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d", {
            willReadFrequently: true,
            desynchronized: true
          });
          if (!ctx) {
            reject(new Error("无法创建canvas上下文"));
            return;
          }

          // 根据MAX_IMAGE_SIZE限制图片尺寸
          let width = img.width;
          let height = img.height;
          if (width > MAX_IMAGE_SIZE || height > MAX_IMAGE_SIZE) {
            const ratio = Math.min(MAX_IMAGE_SIZE / width, MAX_IMAGE_SIZE / height);
            width = Math.floor(width * ratio);
            height = Math.floor(height * ratio);
          }
          canvas.width = width;
          canvas.height = height;
          ctx.drawImage(img, 0, 0, width, height);
          const base64 = canvas.toDataURL("image/jpeg", 0.9);

          // 清理内存
          canvas.width = 0;
          canvas.height = 0;
          resolve({
            base64,
            format: "JPEG",
            width: width,
            height: height
          });
        } catch (error) {
          reject(error);
        }
      };
      img.onerror = () => reject(new Error("无法解析图片"));
      img.src = reader.result;
    };
    reader.onerror = () => reject(new Error("读取Blob失败"));
    reader.readAsDataURL(blob);
  });
}

// 批量预加载所有图片
async function preloadAllImages(wrongQuestions) {
  const imageMap = new Map();

  // 收集所有唯一的图片URL
  const uniqueImageUrls = Array.from(new Set(wrongQuestions.filter(q => q.question.imageUrl).map(q => q.question.imageUrl)));

  // 限制并发数量，避免同时请求过多
  const concurrencyLimit = 2; // 降低并发数，更稳定

  for (let i = 0; i < uniqueImageUrls.length; i += concurrencyLimit) {
    const batch = uniqueImageUrls.slice(i, i + concurrencyLimit);

    // 并发加载当前批次
    const batchPromises = batch.map(async url => {
      const result = await loadImageWithCORS(url, 3);
      return {
        url,
        result
      };
    });
    const batchResults = await Promise.allSettled(batchPromises);

    // 处理结果
    for (const result of batchResults) {
      if (result.status === "fulfilled") {
        const {
          url,
          result: imageData
        } = result.value;
        if (imageData) {
          imageMap.set(url, imageData);
        } else {
          imageMap.set(url, null);
        }
      }
    }

    // 添加延迟，避免请求过快
    if (i + concurrencyLimit < uniqueImageUrls.length) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  return imageMap;
}

// 生成错题PDF（包含图片）
export async function generateQuestionsPDF(wrongQuestions, studentInfo, fileName) {
  try {
    // 第一步：预加载所有图片
    const imageCache = await preloadAllImages(wrongQuestions);

    // 预加载二维码图片
    const qrcodeImage = await loadImageWithCORS("/images/user/index/qrcode.jpg", 3);

    // 第二步：加载字体
    const fontBase64 = await loadFontToBase64("/font/SourceHanSerifCN-Regular.ttf");

    // 第三步：创建PDF
    const pdf = new jsPDF();

    // 添加字体到PDF
    pdf.addFileToVFS("SourceHanSerifCN-Regular.ttf", fontBase64);
    pdf.addFont("SourceHanSerifCN-Regular.ttf", "SourceHanSerifCN", "normal");

    // 设置默认字体为中文字体
    pdf.setFont("SourceHanSerifCN", "normal");
    const pageHeight = pdf.internal.pageSize.height;
    const pageWidth = pdf.internal.pageSize.width;
    const margin = 20;
    const lineHeight = 7;
    const contentWidth = pageWidth - 2 * margin;
    let currentPage = 1;
    let yPosition = margin;

    // 添加页眉的函数（错题PDF）
    const addPageHeader = () => {
      const qrSize = 25; // 二维码尺寸
      const qrMargin = margin;
      const qrY = 12; // 减少顶部空白

      // 添加二维码
      if (qrcodeImage) {
        pdf.addImage(qrcodeImage.base64, qrcodeImage.format, qrMargin, qrY, qrSize, qrSize);
      }

      // 左侧内容起始位置（二维码右侧）
      const leftContentX = qrMargin + qrSize + 8;

      // 添加标题
      pdf.setFontSize(16);
      pdf.setFont("SourceHanSerifCN", "normal");
      pdf.text(`澎湃理综错题本-${studentInfo.studentName}`, leftContentX, qrY + 8);

      // 添加第几页、学校和班级
      pdf.setFontSize(12);
      pdf.text(`第${currentPage}页、学校：${studentInfo.schoolName}、班级：${studentInfo.className}`, leftContentX, qrY + 18);

      // 右侧信息（右对齐）
      pdf.setFontSize(11);
      const rightX = pageWidth - margin;
      pdf.text(`${wrongQuestions.length}题`, rightX, qrY + 6, {
        align: "right"
      });
      pdf.text(`${studentInfo.studentCode}`, rightX, qrY + 14, {
        align: "right"
      });
      pdf.text(`${studentInfo.generatedTime}`, rightX, qrY + 22, {
        align: "right"
      });

      // 分隔线
      pdf.setLineWidth(0.5);
      pdf.line(margin, qrY + qrSize + 5, pageWidth - margin, qrY + qrSize + 5);

      // 更新 yPosition 到页眉下方
      yPosition = qrY + qrSize + 12;
    };

    // 检查是否需要新页（错题PDF）
    const checkPageBreak = (nextLineHeight = lineHeight) => {
      if (yPosition + nextLineHeight > pageHeight - margin) {
        pdf.addPage();
        pdf.setFont("SourceHanSerifCN", "normal");
        currentPage++;
        // 根据配置决定是否添加页眉
        if (SHOW_HEADER_ON_NON_FIRST_PAGE) {
          addPageHeader();
        } else {
          yPosition = margin;
        }
      }
    };

    // 添加文本，支持自动换行
    const addText = (text, fontSize = 12) => {
      pdf.setFontSize(fontSize);
      pdf.setFont("SourceHanSerifCN", "normal");
      const maxWidth = pageWidth - 2 * margin;
      const lines = splitTextIntoLines(text, maxWidth, pdf, fontSize);
      for (const line of lines) {
        checkPageBreak();
        pdf.text(line, margin, yPosition);
        yPosition += lineHeight;
      }
    };

    // 添加第一页的页眉
    addPageHeader();

    // 遍历错题
    for (let i = 0; i < wrongQuestions.length; i++) {
      const item = wrongQuestions[i];
      let totalSpaceNeeded = 25;
      let displayHeight = 0;
      let cachedImage = null;

      // 从缓存获取图片
      if (item.question.imageUrl) {
        cachedImage = imageCache.get(item.question.imageUrl);
        if (cachedImage) {
          const scale = contentWidth / cachedImage.width;
          displayHeight = cachedImage.height * scale;
          totalSpaceNeeded += displayHeight + 15;
        } else {
          totalSpaceNeeded += 25; // 错误提示文本的空间
        }
      } else {
        totalSpaceNeeded += 25; // "暂无题目图片"文本的空间
      }

      // 检查是否需要换页
      if (yPosition + totalSpaceNeeded > pageHeight - margin) {
        pdf.addPage();
        pdf.setFont("SourceHanSerifCN", "normal");
        currentPage++;
        // 根据配置决定是否添加页眉
        if (SHOW_HEADER_ON_NON_FIRST_PAGE) {
          addPageHeader();
        } else {
          yPosition = margin;
        }
      }

      // 添加错题序号
      pdf.setFontSize(14);
      pdf.text(`# ${i + 1}`, margin, yPosition);
      yPosition += 5;

      // 添加图片或提示信息
      if (item.question.imageUrl) {
        if (cachedImage) {
          try {
            const displayWidth = contentWidth;
            pdf.addImage(cachedImage.base64, cachedImage.format, margin, yPosition, displayWidth, displayHeight);
            yPosition += displayHeight + 15;
          } catch {
            addText("图片添加到PDF失败", 12);
            yPosition += 15;
          }
        } else {
          addText("图片加载失败", 12);
          yPosition += 15;
        }
      } else {
        addText("暂无题目图片", 12);
        yPosition += 15;
      }

      // 题目间距
      yPosition += 10;
    }

    // 保存PDF
    const fullFileName = fileName.endsWith(".pdf") ? fileName : `${fileName}.pdf`;
    pdf.save(fullFileName);
  } catch (error) {
    throw new Error(`生成错题PDF失败: ${error.message}`);
  }
}

// 批量预加载答案和解析图片
async function preloadAnswerAndParseImages(wrongQuestions) {
  const imageMap = new Map();

  // 收集所有唯一的答案图片和解析图片URL
  const uniqueImageUrls = Array.from(new Set(wrongQuestions.flatMap(q => [q.question.answerImage?.imageUrl, q.question.parseImage?.imageUrl]).filter(url => !!url)));

  // 限制并发数量
  const concurrencyLimit = 2;
  for (let i = 0; i < uniqueImageUrls.length; i += concurrencyLimit) {
    const batch = uniqueImageUrls.slice(i, i + concurrencyLimit);
    const batchPromises = batch.map(async url => {
      const result = await loadImageWithCORS(url, 3);
      return {
        url,
        result
      };
    });
    const batchResults = await Promise.allSettled(batchPromises);
    for (const result of batchResults) {
      if (result.status === "fulfilled") {
        const {
          url,
          result: imageData
        } = result.value;
        if (imageData) {
          imageMap.set(url, imageData);
        } else {
          imageMap.set(url, null);
        }
      }
    }
    if (i + concurrencyLimit < uniqueImageUrls.length) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  return imageMap;
}

// 生成答案PDF（只有答案和解析）
export async function generateAnswersPDF(wrongQuestions, studentInfo, fileName) {
  try {
    // 预加载答案和解析图片
    const imageCache = await preloadAnswerAndParseImages(wrongQuestions);

    // 预加载二维码图片
    const qrcodeImage = await loadImageWithCORS("/images/user/index/qrcode.jpg", 3);

    // 加载字体
    const fontBase64 = await loadFontToBase64("/font/SourceHanSerifCN-Regular.ttf");
    const pdf = new jsPDF();

    // 添加字体到PDF
    pdf.addFileToVFS("SourceHanSerifCN-Regular.ttf", fontBase64);
    pdf.addFont("SourceHanSerifCN-Regular.ttf", "SourceHanSerifCN", "normal");

    // 设置默认字体为中文字体
    pdf.setFont("SourceHanSerifCN", "normal");
    const pageHeight = pdf.internal.pageSize.height;
    const pageWidth = pdf.internal.pageSize.width;
    const margin = 20;
    const lineHeight = 7;
    const contentWidth = pageWidth - 2 * margin;
    let currentPage = 1;
    let yPosition = margin;

    // 添加页眉的函数（答案PDF）
    const addPageHeader = () => {
      const qrSize = 25; // 二维码尺寸
      const qrMargin = margin;
      const qrY = 12; // 减少顶部空白

      // 添加二维码
      if (qrcodeImage) {
        pdf.addImage(qrcodeImage.base64, qrcodeImage.format, qrMargin, qrY, qrSize, qrSize);
      }

      // 左侧内容起始位置（二维码右侧）
      const leftContentX = qrMargin + qrSize + 8;

      // 添加标题（答案版本）
      pdf.setFontSize(16);
      pdf.setFont("SourceHanSerifCN", "normal");
      pdf.text(`澎湃理综错题本答案-${studentInfo.studentName}`, leftContentX, qrY + 8);

      // 添加第几页、学校和班级
      pdf.setFontSize(12);
      pdf.text(`第${currentPage}页、${studentInfo.schoolName}、${studentInfo.className}`, leftContentX, qrY + 18);

      // 右侧信息（右对齐）
      pdf.setFontSize(11);
      const rightX = pageWidth - margin;
      pdf.text(`${wrongQuestions.length}题`, rightX, qrY + 6, {
        align: "right"
      });
      pdf.text(`${studentInfo.studentCode}`, rightX, qrY + 14, {
        align: "right"
      });
      pdf.text(`${studentInfo.generatedTime}`, rightX, qrY + 22, {
        align: "right"
      });

      // 分隔线
      pdf.setLineWidth(0.5);
      pdf.line(margin, qrY + qrSize + 5, pageWidth - margin, qrY + qrSize + 5);

      // 更新 yPosition 到页眉下方
      yPosition = qrY + qrSize + 12;
    };

    // 检查是否需要新页（答案PDF）
    const checkPageBreak = (nextLineHeight = lineHeight) => {
      if (yPosition + nextLineHeight > pageHeight - margin) {
        pdf.addPage();
        pdf.setFont("SourceHanSerifCN", "normal");
        currentPage++;
        // 根据配置决定是否添加页眉
        if (SHOW_HEADER_ON_NON_FIRST_PAGE) {
          addPageHeader();
        } else {
          yPosition = margin;
        }
      }
    };

    // 添加文本，支持自动换行
    const addText = (text, fontSize = 12) => {
      pdf.setFontSize(fontSize);
      pdf.setFont("SourceHanSerifCN", "normal");
      const maxWidth = pageWidth - 2 * margin;
      const lines = splitTextIntoLines(text, maxWidth, pdf, fontSize);
      for (const line of lines) {
        checkPageBreak();
        pdf.text(line, margin, yPosition);
        yPosition += lineHeight;
      }
    };

    // 添加第一页的页眉
    addPageHeader();

    // 遍历错题
    for (let i = 0; i < wrongQuestions.length; i++) {
      const item = wrongQuestions[i];
      const minSpaceNeeded = 50;
      if (yPosition + minSpaceNeeded > pageHeight - margin) {
        pdf.addPage();
        pdf.setFont("SourceHanSerifCN", "normal");
        currentPage++;
        // 根据配置决定是否添加页眉
        if (SHOW_HEADER_ON_NON_FIRST_PAGE) {
          addPageHeader();
        } else {
          yPosition = margin;
        }
      }

      // 错题序号
      pdf.setFontSize(14);
      pdf.text(`# ${i + 1}`, margin, yPosition);
      yPosition += 10;

      // 答案部分 - 优先使用图片
      if (item.question.answerImage?.imageUrl) {
        const cachedAnswerImage = imageCache.get(item.question.answerImage.imageUrl);
        if (cachedAnswerImage) {
          try {
            const displayWidth = contentWidth;
            const scale = displayWidth / cachedAnswerImage.width;
            const displayHeight = cachedAnswerImage.height * scale;

            // 计算所需空间：标签行(lineHeight) + 图片高度 + 间距(5)
            const requiredSpace = lineHeight + displayHeight + 5;

            // 检查是否需要换页
            if (yPosition + requiredSpace > pageHeight - margin) {
              pdf.addPage();
              pdf.setFont("SourceHanSerifCN", "normal");
              currentPage++;
              if (SHOW_HEADER_ON_NON_FIRST_PAGE) {
                addPageHeader();
              } else {
                yPosition = margin;
              }
            }
            addText("答案：", 12);
            pdf.addImage(cachedAnswerImage.base64, cachedAnswerImage.format, margin, yPosition, displayWidth, displayHeight);
            yPosition += displayHeight + 5;
          } catch {
            addText("答案：图片加载失败", 12);
          }
        } else {
          addText("答案：图片加载失败", 12);
        }
      } else if (item.question.answer && item.question.answer.length > 0) {
        item.question.answer.forEach((answer, answerIndex) => {
          const answerText = `答案：${answerIndex + 1}. ${answer}`;
          addText(answerText, 12);
        });
      } else {
        addText("答案：暂无答案", 12);
      }

      // 解析部分 - 优先使用图片
      if (item.question.parseImage?.imageUrl) {
        const cachedParseImage = imageCache.get(item.question.parseImage.imageUrl);
        if (cachedParseImage) {
          try {
            const displayWidth = contentWidth;
            const scale = displayWidth / cachedParseImage.width;
            const displayHeight = cachedParseImage.height * scale;

            // 计算所需空间：标签行(lineHeight) + 图片高度 + 间距(5)
            const requiredSpace = lineHeight + displayHeight + 5;

            // 检查是否需要换页
            if (yPosition + requiredSpace > pageHeight - margin) {
              pdf.addPage();
              pdf.setFont("SourceHanSerifCN", "normal");
              currentPage++;
              if (SHOW_HEADER_ON_NON_FIRST_PAGE) {
                addPageHeader();
              } else {
                yPosition = margin;
              }
            }
            addText("解析：", 12);
            pdf.addImage(cachedParseImage.base64, cachedParseImage.format, margin, yPosition, displayWidth, displayHeight);
            yPosition += displayHeight + 5;
          } catch {
            addText("解析：图片加载失败", 12);
          }
        } else {
          addText("解析：图片加载失败", 12);
        }
      } else if (item.question.parse && item.question.parse.length > 0) {
        item.question.parse.forEach(parseText => {
          const parseFullText = `解析：${parseText}`;
          addText(parseFullText, 12);
        });
      } else {
        addText("解析：暂无解析", 12);
      }

      // 题目间距
      yPosition += lineHeight;
    }

    // 保存PDF
    const fullFileName = fileName.endsWith(".pdf") ? fileName : `${fileName}.pdf`;
    pdf.save(fullFileName);
  } catch (error) {
    throw new Error(`生成答案PDF失败: ${error.message}`);
  }
}

// 从服务器获取数据并生成错题PDF
export async function downloadQuestionsPDFFromClient(classId, studentId, answerIds, fileName = "错题本.pdf") {
  // 调用Server Action获取数据
  const {
    getStudentInfoForExportAction,
    getWrongQuestionsForExportAction
  } = await import("./actions");
  const [studentInfo, wrongQuestions] = await Promise.all([getStudentInfoForExportAction(classId, studentId), getWrongQuestionsForExportAction(classId, answerIds)]);

  // 在前端生成PDF
  await generateQuestionsPDF(wrongQuestions, studentInfo, fileName);
}

// 从服务器获取数据并生成答案PDF
export async function downloadAnswersPDFFromClient(classId, studentId, answerIds, fileName = "错题本答案.pdf") {
  // 调用Server Action获取数据
  const {
    getStudentInfoForExportAction,
    getWrongQuestionsForExportAction
  } = await import("./actions");
  const [studentInfo, wrongQuestions] = await Promise.all([getStudentInfoForExportAction(classId, studentId), getWrongQuestionsForExportAction(classId, answerIds)]);

  // 在前端生成PDF
  await generateAnswersPDF(wrongQuestions, studentInfo, fileName);
}

// 生成文件名的函数
export function generateFileName(type, studentName) {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const dateStr = `${year}-${month}-${day}`;
  const prefix = type === "questions" ? "错题本" : "错题本答案";
  return `${prefix}-${studentName}-${dateStr}.pdf`;
}

// 保持向后兼容的函数名
export const downloadQuestionsPDFFromServer = downloadQuestionsPDFFromClient;
export const downloadAnswersPDFFromServer = downloadAnswersPDFFromClient;
