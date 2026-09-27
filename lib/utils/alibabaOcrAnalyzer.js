"use server";


function parseAlibabaData(result) {
  const resultObj = result;
  if (!resultObj.Data) {
    throw new Error("阿里OCR结果缺少Data字段");
  }

  // 如果Data是字符串，需要再次解析
  if (typeof resultObj.Data === "string") {
    try {
      return JSON.parse(resultObj.Data);
    } catch (parseError) {
      throw new Error(`阿里OCR结果Data字段解析失败: ${parseError}`);
    }
  } else {
    return resultObj.Data;
  }
}


export async function validateOCRResult(resultJson) {
  try {
    // 解析JSON
    const result = JSON.parse(resultJson);

    // 解析阿里数据格式（处理Data字段可能是字符串的情况）
    const dataObj = parseAlibabaData(result);

    // 检查page_list结构
    if (!dataObj.page_list || !Array.isArray(dataObj.page_list)) {
      console.error("阿里OCR结果缺少page_list字段", resultJson);
      return false;
    }

    // 检查是否有页面信息
    if (dataObj.page_list.length === 0) {
      console.error("阿里OCR结果没有识别到页面", resultJson);
      return false;
    }
    const pageInfo = dataObj.page_list[0];

    // 检查宽高信息（优先检查orgWidth/orgHeight）
    const width = pageInfo.orgWidth || pageInfo.width;
    const height = pageInfo.orgHeight || pageInfo.height;
    if (!width || !height || width <= 0 || height <= 0) {
      console.error("阿里OCR结果缺少有效的宽高信息", resultJson);
      return false;
    }

    // 检查题目数量，通过检查subject_list数组
    if (!pageInfo.subject_list || !Array.isArray(pageInfo.subject_list) || pageInfo.subject_list.length === 0) {
      console.error("阿里OCR结果没有识别到有效题目数量", resultJson);
      return false;
    }
    return true;
  } catch (error) {
    console.error("验证阿里OCR结果失败:", error);
    return false;
  }
}


export async function processQuestionResult(examId, pageNumber, resultJson) {
  try {
    // 解析JSON
    const result = JSON.parse(resultJson);

    // 解析阿里数据格式（处理Data字段可能是字符串的情况）
    const dataObj = parseAlibabaData(result);

    // 检查结果格式
    if (!dataObj.page_list || dataObj.page_list.length === 0) {
      throw new Error("阿里切题识别结果格式不正确：缺少page_list或页面为空");
    }
    const pageInfo = dataObj.page_list[0];
    // 优先使用orgWidth/orgHeight，如果没有则使用width/height
    const width = pageInfo.orgWidth || pageInfo.width || 0;
    const height = pageInfo.orgHeight || pageInfo.height || 0;
    const questions = [];

    // 处理题目信息
    if (pageInfo.subject_list && Array.isArray(pageInfo.subject_list)) {
      pageInfo.subject_list.forEach((subject, index) => {
        // 获取题目的坐标信息
        const boundingBox = extractBoundingBox(subject);

        // 如果没有有效坐标，跳过此题
        if (!boundingBox) return;

        // 提取题目文本
        const questionText = extractQuestionText(subject);

        // 判断题目类型
        const questionType = determineQuestionType(questionText);

        // 创建题目对象
        const question = {
          questionNumber: index + 1,
          // 题目序号从1开始
          leftTop: boundingBox.leftTop,
          rightBottom: boundingBox.rightBottom,
          questionText,
          questionType,
          answer: [],
          // 阿里数据中没有答案，返回空数组
          parse: [],
          // 阿里数据中没有解析，返回空数组
          difficulty: "未知",
          easyToMistakeDetail: []
        };
        questions.push(question);
      });
    }
    return {
      pdfWidth: width,
      pdfHeight: height,
      questions
    };
  } catch (error) {
    console.error(`处理阿里切题识别结果失败: examId=${examId}, pageNumber=${pageNumber}`, error);
    throw error;
  }
}


function extractBoundingBox(subject) {
  try {
    const subjectObj = subject;
    // 从content_list_info中获取坐标
    if (!subjectObj.content_list_info || !Array.isArray(subjectObj.content_list_info) || subjectObj.content_list_info.length === 0) {
      return null;
    }
    const contentInfo = subjectObj.content_list_info[0];
    if (!contentInfo.pos || !Array.isArray(contentInfo.pos) || contentInfo.pos.length < 4) {
      return null;
    }

    // 阿里返回的是4个点的坐标数组，需要计算最小包围矩形
    const xCoords = contentInfo.pos.map(point => point.x);
    const yCoords = contentInfo.pos.map(point => point.y);
    const minX = Math.min(...xCoords);
    const maxX = Math.max(...xCoords);
    const minY = Math.min(...yCoords);
    const maxY = Math.max(...yCoords);
    return {
      leftTop: {
        x: minX,
        y: minY
      },
      rightBottom: {
        x: maxX,
        y: maxY
      }
    };
  } catch (error) {
    console.error("提取边界框失败:", error);
    return null;
  }
}


function extractQuestionText(subject) {
  try {
    const subjectObj = subject;
    // 优先使用text字段（这个字段包含了题目和选项，且题目和选项之间使用空格而不是换行符）
    if (subjectObj.text && typeof subjectObj.text === "string") {
      return subjectObj.text.trim();
    }

    // 如果没有text字段，从prism_wordsInfo中拼接
    if (subjectObj.prism_wordsInfo && Array.isArray(subjectObj.prism_wordsInfo)) {
      const textParts = subjectObj.prism_wordsInfo.map(wordInfo => wordInfo.word).filter(word => word?.trim()).map(word => word.trim());
      return textParts.join("\n");
    }
    return "";
  } catch (error) {
    console.error("提取题目文本失败:", error);
    return "";
  }
}


function determineQuestionType(questionText) {
  if (!questionText) return "未知";
  const text = questionText.toLowerCase();

  // 判断选择题：包含选项A、B、C、D等
  if (text.includes("a.") || text.includes("b.") || text.includes("c.") || text.includes("d.")) {
    return "选择题";
  }

  // 判断填空题：包含填空标记
  if (text.includes("____") || text.includes("（  ）") || text.includes("(  )")) {
    return "填空题";
  }

  // 判断算术题：包含计算相关关键词
  if (text.includes("计算") || text.includes("求") || text.includes("等于") || /\d+\s*[+\-*/]\s*\d+/.test(text)) {
    return "算术题";
  }

  // 默认为解答题
  return "解答题";
}
