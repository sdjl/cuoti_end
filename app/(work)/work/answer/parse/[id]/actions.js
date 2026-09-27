"use server";

import { generateTestReportText } from "../../../../../(mobile)/mobile/answer/[id]/report/actions.js";
import { getStudentMistakePoints, updateMistakePointQuestions } from "../../../../../../lib/collection/mistake.js";
import { command } from "../../../../../../lib/common/database.js";
import { COMMON_AGENT_BOT_ID, DISPLAY_TEXT } from "../../../../../../lib/config/constants.js";
import { callAIAgent } from "../../../../../../lib/utils/aiAgent.js";
import { getSetting } from "../../../../../../lib/utils/setting.js";
import { getAnswerItemsFromDB, getClassRoomFromDB, getCourseFromDB, getMistakePointsFromDB, getQuestionPackFromDB, getQuestionsFromDB, getStudentAnswerFromDB, getStudentFromDB, getSubjectMistakePointsFromDB, updateAnswerItemInDB, updateStudentAnswerInDB } from "./datas.js";

// ==================== AI分析配置 ====================

// 系统提示词
const SYSTEM_PROMPT = `
你是一个专业的错题分析专家，擅长分析学生的答题错误原因，请你仔细观察学生提交的答题图片。

你的任务有且只有3个，分别是：
1. 识别出图片中学生填写的答案（若有多个答案的，请每个答案一行，用\\n分割）
2. 分析学生的错误原因，包括知识点理解错误、计算错误、概念混淆等
3. 根据用户给你的错误归因列表，结合当前学生的错误原因，从错误归因列表中选择一个学生可能犯的错误。你可以返回0-3个错误归因。可以不返回，若你认为没有匹配上合适的错误归因数据，请在返回错误归因数据的这里留空。

你不需要返回任何其他内容，包括这个题的正确答案和解题思路等，只需要返回识别出的答案和分析的错误原因。

请严格按照指定的格式返回结果，不要添加任何其他内容。
`;

// AI返回格式要求
const AI_RESPONSE_FORMAT = `answer: abc\\ndef
parse: abc\\ndef
mistakePoints: 错误归因1名称
错误归因2名称
错误归因3名称`;

// AI分析单题超时时间（秒）
const AI_ANALYSIS_TIMEOUT = 120;

// 图片URL后缀名验证
const VALID_IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp"];


function validateImageExtension(imageUrl) {
  try {
    const url = new URL(imageUrl);
    const pathname = url.pathname.toLowerCase();
    return VALID_IMAGE_EXTENSIONS.some(ext => pathname.endsWith(ext));
  } catch {
    // 如果URL格式无效，尝试直接检查字符串后缀
    const lowerUrl = imageUrl.toLowerCase();
    return VALID_IMAGE_EXTENSIONS.some(ext => lowerUrl.endsWith(ext));
  }
}

export async function getStudentAnswerParseData(studentAnswerId) {
  try {
    // 1. 获取学生答卷记录
    const studentAnswer = await getStudentAnswerFromDB(studentAnswerId);
    if (!studentAnswer) {
      return {
        success: false,
        error: "未找到该学生的答卷记录"
      };
    }

    // 2. 并行获取基础数据
    const [student, classRoom, course, questionPack] = await Promise.all([getStudentFromDB(studentAnswer.studentId), getClassRoomFromDB(studentAnswer.classId), studentAnswer.courseId ? getCourseFromDB(studentAnswer.courseId) : Promise.resolve(null), getQuestionPackFromDB(studentAnswer.questionPackId)]);

    // 检查必需数据
    if (!student) {
      return {
        success: false,
        error: "学生信息不存在"
      };
    }
    if (!classRoom) {
      return {
        success: false,
        error: "班级信息不存在"
      };
    }
    if (!questionPack) {
      return {
        success: false,
        error: "题集信息不存在"
      };
    }

    // 课程可能为null（错题集等情况）
    const mockCourse = {
      _id: "",
      schoolId: classRoom.schoolId,
      subject: questionPack.subject,
      name: "无关联课程",
      description: "",
      questionPackIds: [],
      created: Date.now(),
      status: "使用中"
    };

    // 3. 获取答案条目
    const answerItems = await getAnswerItemsFromDB(studentAnswer._id);

    // 4. 获取所有题目ID
    const allQuestionIds = new Set();
    answerItems.forEach(item => {
      allQuestionIds.add(item.questionId);
    });

    // 5. 并行获取错误归因数据和题目数据
    const [mistakePointsData, questions] = await Promise.all([
    // 获取学生的错误归因数据
    getStudentMistakePoints({
      studentId: studentAnswer.studentId,
      classId: studentAnswer.classId,
      courseId: studentAnswer.courseId,
      questionPackId: studentAnswer.questionPackId
    }),
    // 获取题目数据
    allQuestionIds.size > 0 ? getQuestionsFromDB(Array.from(allQuestionIds)) : Promise.resolve([])]);

    // 获取错误归因详情映射
    const questionMistakePoints = mistakePointsData.success ? mistakePointsData.data || {} : {};

    // 获取所有涉及的错误归因ID
    const allMistakePointIds = new Set();
    Object.values(questionMistakePoints).forEach(mistakePointIds => {
      mistakePointIds.forEach(id => allMistakePointIds.add(id));
    });

    // 获取错误归因详情
    const mistakePoints = allMistakePointIds.size > 0 ? getMistakePointsFromDB(Array.from(allMistakePointIds)) : Promise.resolve([]);

    // 6. 构建数据映射
    const mistakePointsMap = new Map();
    (await mistakePoints).forEach(point => {
      mistakePointsMap.set(point._id, point);
    });
    const questionsMap = new Map();
    questions.forEach(question => {
      questionsMap.set(question._id, question);
    });

    // 7. 组装答案条目数据，包含错误归因信息和题目信息
    const answerItemsWithDetails = answerItems.map(item => {
      const question = questionsMap.get(item.questionId);
      if (!question) {
        console.warn(`题目 ${item.questionId} 不存在`);
        return null;
      }

      // 获取该题目的错误归因ID列表
      const itemMistakePointIds = questionMistakePoints[item.questionId] || [];
      return {
        ...item,
        mistakePointIds: itemMistakePointIds,
        // 添加这个字段用于兼容
        mistakePoints: itemMistakePointIds.map(id => mistakePointsMap.get(id)).filter(point => point !== undefined),
        question
      };
    }).filter(item => item !== null);
    return {
      success: true,
      data: {
        student,
        classRoom,
        course: course || mockCourse,
        questionPack,
        studentAnswer,
        answerItems: answerItemsWithDetails
      }
    };
  } catch (error) {
    console.error("获取学生答卷分析数据失败:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "获取数据失败"
    };
  }
}


export async function getSubjectMistakePoints(subject) {
  try {
    const mistakePoints = await getSubjectMistakePointsFromDB(subject);
    return {
      success: true,
      data: mistakePoints
    };
  } catch (error) {
    console.error(`获取学科${DISPLAY_TEXT.ERROR_ATTRIBUTION}数据失败:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : `获取${DISPLAY_TEXT.ERROR_ATTRIBUTION}数据失败`
    };
  }
}

/**
 * 获取错题分析腾讯Agent Bot ID配置
 */
export async function getMistakeAnalysisAgentBotId() {
  try {
    const botId = COMMON_AGENT_BOT_ID;
    if (!botId) {
      return {
        success: false,
        error: "未配置错题分析腾讯Agent Bot ID"
      };
    }
    return {
      success: true,
      botId
    };
  } catch (error) {
    console.error("获取错题分析Agent Bot ID配置失败:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "获取配置失败"
    };
  }
}


export async function analyzeMistakeWithAI(studentImageUrl, subject) {
  try {
    // 验证图片URL后缀名
    if (!validateImageExtension(studentImageUrl)) {
      return {
        success: false,
        error: "图片URL格式无效，必须是有效的图片文件（.jpg、.jpeg、.png等）"
      };
    }

    // 获取Agent Bot ID配置
    const botResult = await getMistakeAnalysisAgentBotId();
    if (!botResult.success || !botResult.botId) {
      return {
        success: false,
        error: botResult.error || "未配置错题分析Agent Bot ID"
      };
    }

    // 获取学科的所有错误归因数据
    const mistakePointsResult = await getSubjectMistakePoints(subject);
    if (!mistakePointsResult.success || !mistakePointsResult.data) {
      return {
        success: false,
        error: mistakePointsResult.error || `获取学科${DISPLAY_TEXT.ERROR_ATTRIBUTION}数据失败`
      };
    }
    const allMistakePoints = mistakePointsResult.data;

    // 构建错误归因名称列表给AI参考
    const mistakePointNames = allMistakePoints.map(point => point.name).join("\n");

    // 构建发送给AI的消息内容
    const userMessage = `${SYSTEM_PROMPT}
    
请根据以下要求的格式返回分析结果：
${AI_RESPONSE_FORMAT}

以下是可选的错误归因名称列表，请根据学生的错误情况选择0-3个最匹配的错误归因名称：
${mistakePointNames}

注意：
1. mistakePoints 请每行返回一个错误归因名称，每行只包含错误归因名称，不要其他任何字符
2. 如果没有匹配的错误归因，mistakePoints 部分请留空
3. 最多返回3个错误归因名称`;

    // 创建超时Promise
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`AI分析超时，超过 ${AI_ANALYSIS_TIMEOUT} 秒`));
      }, AI_ANALYSIS_TIMEOUT * 1000);
    });

    // 调用腾讯Agent API，传递图片文件
    const agentPromise = callAIAgent({
      botId: botResult.botId,
      msg: userMessage,
      files: [studentImageUrl] // 传递图片URL到files参数
    });

    // 使用Promise.race来实现超时控制
    const aiContent = await Promise.race([agentPromise, timeoutPromise]);
    if (!aiContent) {
      return {
        success: false,
        error: "AI未返回有效响应"
      };
    }

    // 解析AI返回的内容
    const parseResult = parseAIResponse(aiContent, allMistakePoints);
    if (!parseResult.success) {
      return {
        success: false,
        error: parseResult.error
      };
    }
    return {
      success: true,
      answer: parseResult.answer,
      parse: parseResult.parse,
      aiRecommendedMistakePointIds: parseResult.aiRecommendedMistakePointIds
    };
  } catch (error) {
    console.error("AI分析错题失败:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "AI分析失败"
    };
  }
}

/**
 * 解析AI返回的内容
 */
function parseAIResponse(content, allMistakePoints) {
  try {
    // 查找answer、parse和mistakePoints部分
    const answerMatch = content.match(/answer:\s*(.*?)(?=\nparse:|$)/s);
    const parseMatch = content.match(/parse:\s*(.*?)(?=\nmistakePoints:|$)/s);
    const mistakePointsMatch = content.match(/mistakePoints:\s*(.*?)$/s);
    if (!answerMatch || !parseMatch) {
      return {
        success: false,
        error: `AI返回格式不符合要求。期望格式：\n${AI_RESPONSE_FORMAT}\n\n实际返回：\n${content}`
      };
    }
    const answerText = answerMatch[1].trim();
    const parseText = parseMatch[1].trim();
    const mistakePointsText = mistakePointsMatch ? mistakePointsMatch[1].trim() : "";

    // 将答案按行分割
    const answer = answerText.split("\n").map(line => line.trim()).filter(line => line.length > 0);

    // 将解析按行分割
    const parse = parseText.split("\n");

    // 解析错误归因名称并转换为ID
    let aiRecommendedMistakePointIds = [];
    if (mistakePointsText) {
      const potentialNames = mistakePointsText.split("\n").map(name => name.trim()).filter(name => name.length > 0);

      // 根据名称查找对应的ID
      const nameToIdMap = new Map(allMistakePoints.map(point => [point.name, point._id]));
      aiRecommendedMistakePointIds = potentialNames.map(name => nameToIdMap.get(name)).filter(id => id !== undefined);

      // 最多只取前3个
      if (aiRecommendedMistakePointIds.length > 3) {
        aiRecommendedMistakePointIds = aiRecommendedMistakePointIds.slice(0, 3);
      }
    }
    return {
      success: true,
      answer,
      parse,
      aiRecommendedMistakePointIds
    };
  } catch (error) {
    return {
      success: false,
      error: `解析AI响应失败: ${error instanceof Error ? error.message : "未知错误"}`
    };
  }
}


export async function saveAnswerItem(itemId, answer, parse, mistakePointIds, studentAnswerInfo) {
  try {
    const updateData = {
      answerValue: answer,
      parse: parse
    };

    // 尝试更新答案和解析
    // 注意：如果数据没有变化，updateDoc 会返回 false，但这不应该被视为错误
    await updateAnswerItemInDB(itemId, updateData);

    // 如果提供了错误归因ID和学生答卷信息，更新错误归因数据
    if (mistakePointIds !== undefined && studentAnswerInfo) {
      const mistakeResult = await updateMistakePointQuestions({
        mistakePointIds,
        questionId: studentAnswerInfo.questionId,
        studentId: studentAnswerInfo.studentId,
        classId: studentAnswerInfo.classId,
        courseId: studentAnswerInfo.courseId,
        questionPackId: studentAnswerInfo.questionPackId,
        type: studentAnswerInfo.type
      });
      if (!mistakeResult.success) {
        console.error(`更新${DISPLAY_TEXT.ERROR_ATTRIBUTION}数据失败:`, mistakeResult.error);
        // 这里不返回错误，因为我们仍然认为保存操作是成功的
        // 用户可能只是想更新错误归因而不修改答案和解析
      }
    }
    return {
      success: true
    };
  } catch (error) {
    console.error("保存答题条目失败:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "保存失败"
    };
  }
}


export async function saveAllAnswerItems(answerItems, studentAnswerInfo) {
  const results = {
    success: true,
    successCount: 0,
    totalCount: answerItems.length,
    errors: []
  };
  for (const item of answerItems) {
    try {
      const itemStudentAnswerInfo = studentAnswerInfo ? {
        ...studentAnswerInfo,
        questionId: item.questionId
      } : undefined;
      const result = await saveAnswerItem(item._id, item.answerValue, item.parse, item.mistakePointIds, itemStudentAnswerInfo);
      if (result.success) {
        results.successCount++;
      } else {
        results.success = false;
        results.errors.push(`题目 ${item._id}: ${result.error}`);
      }
    } catch (error) {
      results.success = false;
      results.errors.push(`题目 ${item._id}: ${error instanceof Error ? error.message : "未知错误"}`);
    }
  }
  return results;
}


export async function updateAnalysisStatus(studentAnswerId, isCompleted) {
  try {
    const success = await updateStudentAnswerInDB(studentAnswerId, {
      isAnalysisCompleted: isCompleted,
      analysisCompletedTime: isCompleted ? Date.now() : undefined
    });
    if (success) {
      return {
        success: true
      };
    } else {
      return {
        success: false,
        error: "更新状态失败"
      };
    }
  } catch (error) {
    console.error("更新分析状态失败:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "更新失败"
    };
  }
}

/**
 * 生成AI诊断结果
 */
export async function generateAIDiagnosis(studentAnswerId) {
  try {
    // 获取配置的Bot ID
    const settings = await getSetting("test_diagnosis_agent_bot_id");
    const botId = settings.test_diagnosis_agent_bot_id;
    if (!botId) {
      return {
        success: false,
        error: "未配置单次测验诊断Bot ID，请联系管理员"
      };
    }

    // 生成测试报告文本
    const reportText = await generateTestReportText(studentAnswerId);
    if (!reportText) {
      return {
        success: false,
        error: "生成报告文本失败"
      };
    }

    // 调用AI获取诊断结果
    const aiResponse = await callAIAgent({
      botId: botId,
      msg: reportText
    });
    if (!aiResponse) {
      return {
        success: false,
        error: "AI诊断失败"
      };
    }
    const lines = aiResponse.split("\n").filter(line => line.trim());
    let overallPerformance = "";
    let strength = "";
    let improvement = "";
    for (const line of lines) {
      if (line.includes("总体表现：")) {
        overallPerformance = line.replace("总体表现：", "").trim();
      } else if (line.includes("优势保持：")) {
        strength = line.replace("优势保持：", "").trim();
      } else if (line.includes("重点提升：")) {
        improvement = line.replace("重点提升：", "").trim();
      }
    }
    const diagnosis = {
      overallPerformance,
      strength,
      improvement
    };

    // 更新数据库
    const success = await updateStudentAnswerInDB(studentAnswerId, {
      aiDiagnosis: diagnosis
    });
    if (!success) {
      return {
        success: false,
        error: "数据库更新失败"
      };
    }
    return {
      success: true,
      data: diagnosis
    };
  } catch (error) {
    console.error("生成AI诊断失败:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "生成AI诊断失败"
    };
  }
}

/**
 * 更新AI诊断结果
 */
export async function updateAIDiagnosis(studentAnswerId, diagnosis) {
  try {
    // 更新数据库
    const success = await updateStudentAnswerInDB(studentAnswerId, {
      aiDiagnosis: diagnosis
    });
    if (!success) {
      return {
        success: false,
        error: "数据库更新失败"
      };
    }
    return {
      success: true
    };
  } catch (error) {
    console.error("更新AI诊断失败:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "更新AI诊断失败"
    };
  }
}

/**
 * 删除AI诊断结果
 */
export async function deleteAIDiagnosis(studentAnswerId) {
  try {
    const _ = command();
    const success = await updateStudentAnswerInDB(studentAnswerId, {
      aiDiagnosis: _.remove()
    });
    if (success) {
      return {
        success: true
      };
    } else {
      return {
        success: false,
        error: "删除AI诊断结果失败"
      };
    }
  } catch (error) {
    console.error("删除AI诊断失败:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "删除失败"
    };
  }
}
