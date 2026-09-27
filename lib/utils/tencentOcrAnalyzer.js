"use server";


export async function validateOCRResult(resultJson) {
  try {
    // 解析JSON
    const result = JSON.parse(resultJson);

    // 检查基本结构
    if (!result.Response || !result.Response.QuestionInfo || !Array.isArray(result.Response.QuestionInfo)) {
      console.error("OCR结果缺少必要字段", resultJson);
      return false;
    }

    // 检查是否有题目信息
    if (result.Response.QuestionInfo.length === 0) {
      console.error("OCR结果没有识别到题目", resultJson);
      return false;
    }
    const questionInfo = result.Response.QuestionInfo[0];

    // 检查宽高信息
    if (!questionInfo.Width || !questionInfo.Height || questionInfo.Width <= 0 || questionInfo.Height <= 0) {
      console.error("OCR结果缺少有效的宽高信息", resultJson);
      return false;
    }

    // 检查题目数量，通过检查ResultList数组
    if (!questionInfo.ResultList || !Array.isArray(questionInfo.ResultList) || questionInfo.ResultList.length === 0) {
      console.error("OCR结果没有识别到有效题目数量", resultJson);
      return false;
    }
    return true;
  } catch (error) {
    console.error("验证OCR结果失败:", error);
    return false;
  }
}


export async function processQuestionResult(examId, pageNumber, resultJson) {
  try {
    // 解析JSON
    const result = JSON.parse(resultJson);

    // 检查结果格式
    if (!result.Response || !result.Response.QuestionInfo || result.Response.QuestionInfo.length === 0) {
      throw new Error("切题识别结果格式不正确");
    }
    const questionInfo = result.Response.QuestionInfo[0];
    const width = questionInfo.Width || 0;
    const height = questionInfo.Height || 0;
    const questions = [];

    // 处理题目信息
    if (questionInfo.ResultList && Array.isArray(questionInfo.ResultList)) {
      questionInfo.ResultList.forEach((item, index) => {
        // 收集所有坐标信息
        const allCoords = [];
        collectCoordinates(item, allCoords);

        // 如果没有收集到任何坐标，跳过此题
        if (allCoords.length === 0) return;

        // 计算题目的最大包围矩形
        const boundingBox = calculateBoundingBox(allCoords);

        // 递归收集题目文本（不包含答案和解析）
        const questionText = collectQuestionText(item);

        // 递归提取答案文本
        const answer = collectAnswerText(item);

        // 递归提取解析文本
        const parse = collectParseText(item);

        // 判断题目类型
        const questionType = determineQuestionType(item);

        // 创建题目对象
        const question = {
          questionNumber: index + 1,
          // 题目序号从1开始
          leftTop: boundingBox.leftTop,
          rightBottom: boundingBox.rightBottom,
          questionText,
          questionType,
          answer,
          parse,
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
    console.error(`处理切题识别结果失败: examId=${examId}, pageNumber=${pageNumber}`, error);
    throw error;
  }
}


function collectQuestionText(item) {
  const textParts = [];

  // 递归辅助函数
  function collectTextRecursive(obj) {
    if (!obj) return;

    // 处理Question部分
    if (obj.Question && Array.isArray(obj.Question)) {
      obj.Question.forEach(q => {
        if (q.Text && typeof q.Text === "string" && q.Text.trim()) {
          textParts.push(q.Text.trim());
        }
        // 递归处理嵌套的ResultList
        if (q.ResultList && Array.isArray(q.ResultList)) {
          q.ResultList.forEach(collectTextRecursive);
        }
      });
    }

    // 处理Option部分
    if (obj.Option && Array.isArray(obj.Option)) {
      obj.Option.forEach(o => {
        if (o.Text && typeof o.Text === "string" && o.Text.trim()) {
          textParts.push(o.Text.trim());
        }
        // 递归处理嵌套的ResultList
        if (o.ResultList && Array.isArray(o.ResultList)) {
          o.ResultList.forEach(collectTextRecursive);
        }
      });
    }

    // 处理Figure部分的文本（如果有的话）
    if (obj.Figure && Array.isArray(obj.Figure)) {
      obj.Figure.forEach(f => {
        if (f.Text && typeof f.Text === "string" && f.Text.trim()) {
          textParts.push(f.Text.trim());
        }
        // 递归处理嵌套的ResultList
        if (f.ResultList && Array.isArray(f.ResultList)) {
          f.ResultList.forEach(collectTextRecursive);
        }
      });
    }

    // 处理Table部分的文本（如果有的话）
    if (obj.Table && Array.isArray(obj.Table)) {
      obj.Table.forEach(t => {
        if (t.Text && typeof t.Text === "string" && t.Text.trim()) {
          textParts.push(t.Text.trim());
        }
        // 递归处理嵌套的ResultList
        if (t.ResultList && Array.isArray(t.ResultList)) {
          t.ResultList.forEach(collectTextRecursive);
        }
      });
    }

    // 处理顶层的Text字段（如果存在）
    if (obj.Text && typeof obj.Text === "string" && obj.Text.trim()) {
      // 避免重复添加
      if (!textParts.includes(obj.Text.trim())) {
        textParts.push(obj.Text.trim());
      }
    }

    // 递归处理ResultList
    if (obj.ResultList && Array.isArray(obj.ResultList)) {
      obj.ResultList.forEach(collectTextRecursive);
    }
  }

  // 开始递归收集
  collectTextRecursive(item);
  return textParts.join("\n");
}


function collectAnswerText(item) {
  const answers = [];

  // 递归辅助函数
  function collectAnswerRecursive(obj) {
    if (!obj) return;

    // 处理Answer部分
    if (obj.Answer && Array.isArray(obj.Answer)) {
      obj.Answer.forEach(a => {
        if (a.Text && typeof a.Text === "string" && a.Text.trim()) {
          answers.push(a.Text.trim());
        }
        // 递归处理嵌套的ResultList
        if (a.ResultList && Array.isArray(a.ResultList)) {
          a.ResultList.forEach(collectAnswerRecursive);
        }
      });
    }

    // 递归处理所有可能包含Answer的子结构
    ["Question", "Option", "Figure", "Table"].forEach(key => {
      if (obj[key] && Array.isArray(obj[key])) {
        obj[key].forEach(collectAnswerRecursive);
      }
    });

    // 递归处理ResultList
    if (obj.ResultList && Array.isArray(obj.ResultList)) {
      obj.ResultList.forEach(collectAnswerRecursive);
    }
  }

  // 开始递归收集
  collectAnswerRecursive(item);
  return answers;
}


function collectParseText(item) {
  const parses = [];

  // 递归辅助函数
  function collectParseRecursive(obj) {
    if (!obj) return;

    // 处理Parse部分
    if (obj.Parse && Array.isArray(obj.Parse)) {
      obj.Parse.forEach(p => {
        if (p.Text && typeof p.Text === "string" && p.Text.trim()) {
          parses.push(p.Text.trim());
        }
        // 递归处理嵌套的ResultList
        if (p.ResultList && Array.isArray(p.ResultList)) {
          p.ResultList.forEach(collectParseRecursive);
        }
      });
    }

    // 递归处理所有可能包含Parse的子结构
    ["Question", "Option", "Figure", "Table"].forEach(key => {
      if (obj[key] && Array.isArray(obj[key])) {
        obj[key].forEach(collectParseRecursive);
      }
    });

    // 递归处理ResultList
    if (obj.ResultList && Array.isArray(obj.ResultList)) {
      obj.ResultList.forEach(collectParseRecursive);
    }
  }

  // 开始递归收集
  collectParseRecursive(item);
  return parses;
}


function collectCoordinates(
item, allCoords) {
  if (!item) return;

  // 处理直接包含Coord的情况（列表形式）
  if (item.Coord && Array.isArray(item.Coord)) {
    for (const coord of item.Coord) {
      if (coord.LeftTop && coord.RightBottom) {
        allCoords.push({
          LeftTop: coord.LeftTop,
          RightBottom: coord.RightBottom
        });
      }
    }
  }

  // 处理直接包含Coord的情况（对象形式）
  if (item.Coord && typeof item.Coord === "object" && !Array.isArray(item.Coord)) {
    if (item.Coord.LeftTop && item.Coord.RightBottom) {
      allCoords.push({
        LeftTop: item.Coord.LeftTop,
        RightBottom: item.Coord.RightBottom
      });
    }
  }

  // 处理各个子模块：Question, Option, Figure, Table, Answer, Parse
  for (const key of ["Question", "Option", "Figure", "Table", "Answer", "Parse"]) {
    if (item[key] && Array.isArray(item[key])) {
      for (const subitem of item[key]) {
        collectCoordinates(subitem, allCoords);
      }
    }
  }

  // 递归处理ResultList
  if (item.ResultList && Array.isArray(item.ResultList)) {
    for (const resultItem of item.ResultList) {
      collectCoordinates(resultItem, allCoords);
    }
  }
}


function calculateBoundingBox(coords) {
  if (!coords || coords.length === 0) {
    return {
      leftTop: {
        x: 0,
        y: 0
      },
      rightBottom: {
        x: 0,
        y: 0
      }
    };
  }

  // 使用Infinity和-Infinity确保能正确比较负值或较大值
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const coord of coords) {
    // 更新最小 x 和最小 y：取当前点左上角
    minX = Math.min(minX, coord.LeftTop.X);
    minY = Math.min(minY, coord.LeftTop.Y);

    // 更新最大 x 和最大 y：取当前点右下角
    maxX = Math.max(maxX, coord.RightBottom.X);
    maxY = Math.max(maxY, coord.RightBottom.Y);
  }
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
}


function determineQuestionType(item) {
  // 递归辅助函数，查找第一个有效的GroupType
  function findGroupTypeRecursive(obj) {
    if (!obj) return undefined;

    // 检查当前对象的GroupType
    if (obj.GroupType) {
      return obj.GroupType;
    }

    // 检查所有可能包含GroupType的子结构
    for (const key of ["Question", "Option", "Figure", "Table", "Answer", "Parse"]) {
      if (obj[key] && Array.isArray(obj[key])) {
        for (const subItem of obj[key]) {
          const groupType = findGroupTypeRecursive(subItem);
          if (groupType) return groupType;
        }
      }
    }

    // 递归检查ResultList
    if (obj.ResultList && Array.isArray(obj.ResultList)) {
      for (const resultItem of obj.ResultList) {
        const groupType = findGroupTypeRecursive(resultItem);
        if (groupType) return groupType;
      }
    }
    return undefined;
  }
  const groupType = findGroupTypeRecursive(item);

  // 根据 GroupType 映射到对应的中文题型
  switch (groupType) {
    case "multiple-choice":
      return "选择题";
    case "fill-in-the-blank":
      return "填空题";
    case "problem-solving":
      return "解答题";
    case "arithmetic":
      return "算术题";
    default:
      return "";
  }
}
