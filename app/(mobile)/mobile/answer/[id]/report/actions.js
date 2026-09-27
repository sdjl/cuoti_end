"use server";

/**
 * 答卷报告页面的业务逻辑文件
 * 专注于业务逻辑和数据计算，数据库操作通过 datas.ts 完成
 */
import { timestamp } from "../../../../../../lib/common/time.js";
import { getDifficultyValue } from "../../../../../../lib/config/knowledgeTree.js";
import { addMistakePointsInDB, getAIChatSessionsFromDB, getBatchQuestionMistakePointsFromDB, getClassErrorItemsFromDB, getClassroomFromDB, getClassStudentAnswersFromDB, getKnowledgeStatsConfigFromDB, getLatestMistakeBatchPdfFromDB, getMistakeBatchTaskFromDB, getMistakePointDocsFromDB, getMistakePointsBySubjectFromDB, getQuestionPackFromDB, getQuestionsFromDB, getSchoolFromDB, getStudentAnswerFromDB, getStudentFromDB, getStudentMistakePointsFromDB, getWrongAnswerItemsFromDB, removeMistakePointsInDB, updateStudentAnswerInDB } from "./datas.js";

async function prepareAllData(studentAnswerId) {
  try {
    // 1. 获取学生答卷基础信息
    const studentAnswer = await getStudentAnswerFromDB(studentAnswerId);
    if (!studentAnswer) {
      console.error("未找到答卷:", studentAnswerId);
      return null;
    }

    // 2. 并行获取关联的基础数据
    const [student, classroom, questionPack] = await Promise.all([getStudentFromDB(studentAnswer.studentId), getClassroomFromDB(studentAnswer.classId), getQuestionPackFromDB(studentAnswer.questionPackId)]);
    if (!student || !classroom || !questionPack) {
      console.error("获取关联数据失败", {
        student: !!student,
        classroom: !!classroom,
        questionPack: !!questionPack
      });
      return null;
    }

    // 3. 获取学校信息
    const school = await getSchoolFromDB(classroom.schoolId);
    if (!school) {
      console.error("未找到学校信息:", classroom.schoolId);
      return null;
    }

    // 4. 获取知识点统计配置
    const knowledgeStatsConfig = await getKnowledgeStatsConfigFromDB();

    // 5. 并行获取题目相关数据
    const [wrongAnswerItems, allQuestions] = await Promise.all([getWrongAnswerItemsFromDB(studentAnswerId), getQuestionsFromDB(questionPack.questionIds)]);

    // 6. 获取班级答题数据（用于计算班级正确率）
    const classStudentAnswers = await getClassStudentAnswersFromDB(studentAnswer.classId, studentAnswer.questionPackId, studentAnswer.courseId);

    // 获取班级所有错题记录
    let classErrorItems = [];
    if (classStudentAnswers.length > 0) {
      const answerIds = classStudentAnswers.map(item => item._id);
      classErrorItems = await getClassErrorItemsFromDB(answerIds);
    }

    // 7. 获取错误归因详情
    const mistakePointsResult = await getStudentMistakePointsFromDB({
      studentId: studentAnswer.studentId,
      classId: studentAnswer.classId,
      courseId: studentAnswer.courseId,
      questionPackId: studentAnswer.questionPackId
    });
    const mistakePointsMap = new Map();
    if (mistakePointsResult.success && mistakePointsResult.data) {
      // 从返回的数据中提取所有错误归因ID
      const allMistakePointIds = new Set();
      Object.values(mistakePointsResult.data).forEach(mistakePointIds => {
        mistakePointIds.forEach(id => allMistakePointIds.add(id));
      });

      // 获取错误归因详情
      if (allMistakePointIds.size > 0) {
        const mistakePointDocs = await getMistakePointDocsFromDB(Array.from(allMistakePointIds));
        mistakePointDocs.forEach(doc => {
          mistakePointsMap.set(doc._id, doc);
        });
      }
    }

    // 8. 计算基础统计数据
    const wrongCount = wrongAnswerItems.length;
    const totalCount = questionPack.questionIds.length;
    const correctCount = totalCount - wrongCount;

    // 9. 格式化测试时间
    const testDate = new Date(studentAnswer.created);
    const formattedTestTime = testDate.toLocaleString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    }).replace(/\//g, "/");

    // 10. 收集所有知识点
    const allKnowledgePoints = new Set();
    allQuestions.forEach(question => {
      if (question.knowledgePoints) {
        question.knowledgePoints.forEach(kp => allKnowledgePoints.add(kp));
      }
    });

    // 11. 收集错题ID
    const wrongQuestionIds = new Set(wrongAnswerItems.map(item => item.questionId));

    // 12. 获取AI聊天会话数据（用于获取重做图片）
    const aiChatSessionsMap = new Map();

    // 收集所有有AI聊天会话ID的错题记录
    const chatSessionIds = wrongAnswerItems.filter(item => item.aiChatSessionId).map(item => item.aiChatSessionId);
    if (chatSessionIds.length > 0) {
      try {
        const aiChatSessions = await getAIChatSessionsFromDB(chatSessionIds);

        // 为每个错题记录映射其对应的AI聊天会话
        wrongAnswerItems.forEach(item => {
          if (item.aiChatSessionId) {
            const session = aiChatSessions.find(s => s._id === item.aiChatSessionId);
            if (session) {
              aiChatSessionsMap.set(item._id, session);
            }
          }
        });
      } catch (error) {
        console.warn("获取AI聊天会话数据失败:", error);
      }
    }
    return {
      studentAnswer,
      student,
      classroom,
      school,
      questionPack,
      allQuestions,
      wrongAnswerItems,
      knowledgeStatsConfig,
      classStudentAnswers,
      classErrorItems,
      mistakePointsMap,
      formattedTestTime,
      correctCount,
      wrongCount,
      totalCount,
      allKnowledgePoints,
      wrongQuestionIds,
      aiChatSessionsMap
    };
  } catch (error) {
    console.error("准备数据失败:", error);
    return null;
  }
}


async function calculateKnowledgePointMastery(knowledgePoint, data) {
  // 筛选包含该知识点的所有题目
  const relatedQuestions = data.allQuestions.filter(q => q.knowledgePoints?.includes(knowledgePoint));
  let correctDifficultySum = 0; // 做对题目的难度总和
  let totalDifficultySum = 0; // 所有题目的难度总和
  let correctCount = 0; // 做对的题目数

  // 遍历相关题目，计算掌握程度
  for (const question of relatedQuestions) {
    const difficultyValue = await getDifficultyValue(question.difficulty);
    totalDifficultySum += difficultyValue;

    // 如果题目不在错题记录中，说明做对了
    if (!data.wrongQuestionIds.has(question._id)) {
      correctDifficultySum += difficultyValue;
      correctCount++;
    }
  }

  // 计算掌握率：基于难度加权的正确率
  const masteryRate = totalDifficultySum > 0 ? Math.round(correctDifficultySum / totalDifficultySum * 100) : 0;
  return {
    name: knowledgePoint,
    masteryRate,
    correctCount,
    totalCount: relatedQuestions.length,
    correctDifficultySum,
    totalDifficultySum
  };
}


function calculateOverallMasteryRate(knowledgePointMasteries) {
  if (knowledgePointMasteries.length === 0) {
    return 0;
  }

  // 计算所有知识点掌握率的平均值
  const totalMasteryRate = knowledgePointMasteries.reduce((sum, kp) => sum + kp.masteryRate, 0);
  return Math.round(totalMasteryRate / knowledgePointMasteries.length);
}


function getQuestionCorrectRates(data, questionIds) {
  const correctRates = {};

  // 如果没有提交记录，直接返回
  if (data.classStudentAnswers.length === 0) {
    for (const questionId of questionIds) {
      correctRates[questionId] = 0;
    }
    return correctRates;
  }

  // 总提交人数
  const totalSubmissions = data.classStudentAnswers.length;

  // 统计每个题目的错误人数
  const errorCountMap = new Map();
  for (const questionId of questionIds) {
    errorCountMap.set(questionId, 0);
  }

  // 只统计我们关心的题目的错误人数
  data.classErrorItems.forEach(errorItem => {
    if (questionIds.includes(errorItem.questionId)) {
      const currentCount = errorCountMap.get(errorItem.questionId) || 0;
      errorCountMap.set(errorItem.questionId, currentCount + 1);
    }
  });

  // 计算每个题目的正确率
  for (const questionId of questionIds) {
    const errorCount = errorCountMap.get(questionId) || 0;
    const correctRate = (totalSubmissions - errorCount) / totalSubmissions * 100;
    correctRates[questionId] = Math.round(correctRate);
  }
  return correctRates;
}


async function getMistakePointsData(data) {
  if (data.wrongAnswerItems.length === 0) {
    return [];
  }

  // 获取学生的错误归因数据
  const mistakePointsResult = await getStudentMistakePointsFromDB({
    studentId: data.studentAnswer.studentId,
    classId: data.studentAnswer.classId,
    courseId: data.studentAnswer.courseId,
    questionPackId: data.studentAnswer.questionPackId
  });
  if (!mistakePointsResult.success || !mistakePointsResult.data) {
    return [];
  }
  const questionMistakePoints = mistakePointsResult.data;

  // 统计每个错误归因涉及的题目数
  const mistakePointStats = new Map();
  data.wrongAnswerItems.forEach(item => {
    const mistakePointIds = questionMistakePoints[item.questionId] || [];
    mistakePointIds.forEach(mistakePointId => {
      mistakePointStats.set(mistakePointId, (mistakePointStats.get(mistakePointId) || 0) + 1);
    });
  });

  // 如果没有错误归因数据，返回空数组
  if (mistakePointStats.size === 0) {
    return [];
  }

  // 组装错误归因数据
  const mistakePointsData = [];
  mistakePointStats.forEach((count, mistakePointId) => {
    const mistakePoint = data.mistakePointsMap.get(mistakePointId);
    if (mistakePoint) {
      mistakePointsData.push({
        _id: mistakePoint._id,
        name: mistakePoint.name,
        description: mistakePoint.description,
        wrongQuestionCount: count
      });
    }
  });

  // 按涉及错题数量降序排列
  mistakePointsData.sort((a, b) => b.wrongQuestionCount - a.wrongQuestionCount);
  return mistakePointsData;
}


export async function generateTestReportText(studentAnswerId) {
  // 1. 准备所有数据
  const data = await prepareAllData(studentAnswerId);
  if (!data) {
    return null;
  }

  // 2. 计算每个知识点的掌握程度
  const knowledgePointMasteries = await Promise.all(Array.from(data.allKnowledgePoints).map(kp => calculateKnowledgePointMastery(kp, data)));

  // 3. 根据配置的阈值分类知识点
  const mastered = knowledgePointMasteries.filter(kp => kp.masteryRate >= data.knowledgeStatsConfig.masteryThreshold);
  const partiallyMastered = knowledgePointMasteries.filter(kp => kp.masteryRate >= data.knowledgeStatsConfig.partialMasteryThreshold && kp.masteryRate < data.knowledgeStatsConfig.masteryThreshold);
  const needsImprovement = knowledgePointMasteries.filter(kp => kp.masteryRate < data.knowledgeStatsConfig.partialMasteryThreshold);

  // 4. 获取错误归因数据
  const mistakePoints = await getMistakePointsData(data);

  // 5. 获取错题详情
  const wrongQuestions = data.allQuestions.filter(question => data.wrongQuestionIds.has(question._id));

  // 6. 构建文本报告
  let report = "";

  // 基本统计信息
  report += `本次测验一共有${data.totalCount}道题，答对${data.correctCount}道，答错${data.wrongCount}道。\n\n`;

  // 知识点掌握情况
  if (mastered.length > 0) {
    report += "本次测验完全掌握的知识点有：\n";
    mastered.forEach(kp => {
      report += `${kp.name}\n`;
    });
    report += "\n";
  } else {
    report += "本次测验完全掌握的知识点有：\n无\n\n";
  }
  if (partiallyMastered.length > 0) {
    report += "本次测验部分掌握的知识点有：\n";
    partiallyMastered.forEach(kp => {
      report += `${kp.name}\n`;
    });
    report += "\n";
  } else {
    report += "本次测验部分掌握的知识点有：\n无\n\n";
  }
  if (needsImprovement.length > 0) {
    report += "本次测验没有掌握的知识点有：\n";
    needsImprovement.forEach(kp => {
      report += `${kp.name}\n`;
    });
    report += "\n";
  } else {
    report += "本次测验没有掌握的知识点有：\n无\n\n";
  }

  // 错误归因分析
  if (mistakePoints.length > 0) {
    report += "本次测验犯了以下错误：\n";
    mistakePoints.forEach((mistake, index) => {
      report += `第${index + 1}个错误：${mistake.name}\n`;
      if (mistake.description) {
        report += `错误描述：${mistake.description}\n`;
      }
    });
    report += "\n";
  }

  // 错题详情
  if (wrongQuestions.length > 0) {
    report += "本次测验以下题目做错了：\n\n";
    wrongQuestions.forEach((question, index) => {
      report += `第${index + 1}题：\n`;
      report += `题目文本：${question.questionText || "无"}\n`;
      report += `题目类型：${question.questionType || "未知"}\n`;
      report += `题目难度：${question.difficulty}\n`;

      // 答案处理
      if (question.answer && question.answer.length > 0) {
        report += `题目的答案：${question.answer.join("；")}\n`;
      }

      // 解析处理
      if (question.parse && question.parse.length > 0) {
        report += `题目的解析：${question.parse.join("；")}\n`;
      }

      // 知识点处理
      if (question.knowledgePoints && question.knowledgePoints.length > 0) {
        report += `此题目关联的知识点：${question.knowledgePoints.join("；")}\n`;
      }

      // 易错细节处理
      if (question.easyToMistakeDetail && question.easyToMistakeDetail.length > 0) {
        report += `此题目容易在以下细节犯错：${question.easyToMistakeDetail.join("；")}\n`;
      }
      report += "\n";
    });
  } else {
    report += "本次测验以下题目做错了：\n无\n\n";
  }
  return report;
}


export async function getReportData(studentAnswerId) {
  // 1. 准备所有数据
  const data = await prepareAllData(studentAnswerId);
  if (!data) {
    return null;
  }

  // 2. 计算每个知识点的掌握程度
  const knowledgePointMasteries = await Promise.all(Array.from(data.allKnowledgePoints).map(kp => calculateKnowledgePointMastery(kp, data)));

  // 3. 计算整体掌握率
  const overallMasteryRate = calculateOverallMasteryRate(knowledgePointMasteries);

  // 4. 根据配置的阈值分类知识点
  const mastered = knowledgePointMasteries.filter(kp => kp.masteryRate >= data.knowledgeStatsConfig.masteryThreshold);
  const partiallyMastered = knowledgePointMasteries.filter(kp => kp.masteryRate >= data.knowledgeStatsConfig.partialMasteryThreshold && kp.masteryRate < data.knowledgeStatsConfig.masteryThreshold);
  const needsImprovement = knowledgePointMasteries.filter(kp => kp.masteryRate < data.knowledgeStatsConfig.partialMasteryThreshold);

  // 5. 获取错误归因数据
  const mistakePoints = await getMistakePointsData(data);

  // 6. 获取错题详情数据并计算班级正确率
  const wrongQuestionsBase = data.allQuestions.filter(question => data.wrongQuestionIds.has(question._id));

  // 获取错题的班级正确率
  const wrongQuestionIdArray = Array.from(data.wrongQuestionIds);
  const classCorrectRates = getQuestionCorrectRates(data, wrongQuestionIdArray);

  // 创建学生答卷图片信息、课程错题状态和重做图片信息的映射
  const studentAnswerImageMap = new Map();
  const isCorrectedByMistakeAgainMap = new Map();
  const redoImageMap = new Map();
  data.wrongAnswerItems.forEach(item => {
    if (item.imagePath || item.imageUrl || item.imageFileID) {
      studentAnswerImageMap.set(item.questionId, {
        imagePath: item.imagePath,
        imageUrl: item.imageUrl,
        imageFileID: item.imageFileID
      });
    }

    // 记录课程错题状态
    if (item.isCorrectedByMistakeAgain !== undefined) {
      isCorrectedByMistakeAgainMap.set(item.questionId, item.isCorrectedByMistakeAgain);
    }

    // 获取重做图片信息
    const aiChatSession = data.aiChatSessionsMap.get(item._id);
    if (aiChatSession && (aiChatSession.redoImagePath || aiChatSession.redoImageUrl || aiChatSession.redoImageFileID)) {
      redoImageMap.set(item.questionId, {
        redoImagePath: aiChatSession.redoImagePath,
        redoImageUrl: aiChatSession.redoImageUrl,
        redoImageFileID: aiChatSession.redoImageFileID
      });
    }
  });

  // 构建包含班级正确率、学生答卷图片、课程错题状态和重做图片的错题数据
  const wrongQuestions = wrongQuestionsBase.map(question => ({
    ...question,
    classCorrectRate: classCorrectRates[question._id] || 0,
    studentAnswerImage: studentAnswerImageMap.get(question._id),
    isCorrectedByMistakeAgain: isCorrectedByMistakeAgainMap.get(question._id),
    redoImage: redoImageMap.get(question._id)
  }));

  // 7. 构建返回数据
  const headerData = {
    studentName: data.student.name,
    className: data.classroom.name,
    schoolName: data.school.name,
    grade: data.classroom.grade,
    paperTitle: data.questionPack.name,
    subject: data.questionPack.subject,
    testTime: data.formattedTestTime,
    correctCount: data.correctCount,
    wrongCount: data.wrongCount,
    totalCount: data.totalCount,
    overallMasteryRate,
    studentId: data.student._id,
    classroomId: data.classroom._id
  };
  const knowledgePointsData = {
    mastered,
    partiallyMastered,
    needsImprovement
  };
  return {
    studentId: data.student._id,
    header: headerData,
    knowledgePoints: knowledgePointsData,
    mistakePoints,
    wrongQuestions,
    aiDiagnosis: data.studentAnswer.aiDiagnosis,
    analysisCompletedTime: data.studentAnswer.analysisCompletedTime,
    classId: data.classroom._id,
    courseId: data.studentAnswer.courseId,
    questionPackId: data.questionPack._id,
    type: data.questionPack.type,
    subject: data.questionPack.subject
  };
}


export async function getAnswerItemsMapping(studentAnswerId) {
  try {
    // 获取学生的错题记录
    const wrongAnswerItems = await getWrongAnswerItemsFromDB(studentAnswerId);

    // 创建题目ID到答题记录ID的映射
    const mapping = new Map();
    wrongAnswerItems.forEach(item => {
      mapping.set(item.questionId, item._id);
    });
    return mapping;
  } catch (error) {
    console.error("获取答题记录映射失败:", error);
    return new Map();
  }
}


export async function recordReportView(studentAnswerId) {
  try {
    // 先获取当前答卷数据，检查是否已经查看过
    const studentAnswer = await getStudentAnswerFromDB(studentAnswerId);
    if (!studentAnswer) {
      console.error("未找到答卷:", studentAnswerId);
      return false;
    }

    // 如果已经查看过，则不更新
    if (studentAnswer.hasViewedReport) {
      return true;
    }

    // 记录首次查看时间
    const now = Date.now();
    return await updateStudentAnswerInDB(studentAnswerId, {
      hasViewedReport: true,
      reportViewedAt: now
    });
  } catch (error) {
    console.error("记录查看报告失败:", error);
    return false;
  }
}


export async function getLatestMistakeBatchPdf(studentAnswerId) {
  try {
    // 先获取学生答卷，从中获取学生ID
    const studentAnswer = await getStudentAnswerFromDB(studentAnswerId);
    if (!studentAnswer) {
      console.error("未找到学生答卷记录");
      return null;
    }

    // 查询该学生最近的一个错题集PDF记录
    const pdf = await getLatestMistakeBatchPdfFromDB(studentAnswer.studentId);
    if (!pdf) {
      return null;
    }

    // 获取对应的任务信息
    const task = await getMistakeBatchTaskFromDB(pdf.taskId);
    if (!task) {
      console.error("未找到错题集任务记录");
      return null;
    }
    return {
      pdf,
      task
    };
  } catch (error) {
    console.error("获取最近错题集PDF失败:", error);
    return null;
  }
}


export async function getMistakePointsForSubject(subject) {
  try {
    return await getMistakePointsBySubjectFromDB(subject);
  } catch (error) {
    console.error("获取错误归因列表失败:", error);
    return [];
  }
}


export async function getBatchQuestionMistakePoints(questionIds, studentId, classId, courseId) {
  try {
    if (questionIds.length === 0) {
      return new Map();
    }
    const records = await getBatchQuestionMistakePointsFromDB(questionIds, studentId, classId, courseId);

    // 组装数据：questionId -> mistakePointIds[]
    const result = new Map();
    records.forEach(record => {
      const existing = result.get(record.questionId) || [];
      existing.push(record.mistakePointId);
      result.set(record.questionId, existing);
    });
    return result;
  } catch (error) {
    console.error("批量获取题目错误归因失败:", error);
    return new Map();
  }
}


export async function updateQuestionMistakePoints(questionId, studentId, classId, courseId, questionPackId, type, mistakePointIds) {
  try {
    // 删除旧的错误归因记录
    const removed = await removeMistakePointsInDB(questionId, studentId, classId, courseId);
    if (!removed) {
      return {
        success: false,
        message: "删除旧记录失败"
      };
    }

    // 添加新的错误归因记录
    if (mistakePointIds.length > 0) {
      const newRecords = mistakePointIds.map(mistakePointId => ({
        mistakePointId,
        questionId,
        studentId,
        classId,
        courseId,
        questionPackId,
        type,
        created: timestamp()
      }));
      const added = await addMistakePointsInDB(newRecords);
      if (!added) {
        return {
          success: false,
          message: "添加新记录失败"
        };
      }
    }
    return {
      success: true,
      message: "更新成功"
    };
  } catch (error) {
    console.error("更新题目错误归因失败:", error);
    return {
      success: false,
      message: "更新失败"
    };
  }
}
