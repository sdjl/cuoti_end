"use server";

/**
 * 学生学期综合报告页面的业务逻辑文件
 * 专注于业务逻辑和数据计算，数据库操作通过 datas.ts 完成
 */
import { getAllAIConfig } from "../../../../../../../(admin)/admin/backend/ai-config/actions.js";
import { getDifficultyValue } from "../../../../../../../../lib/config/knowledgeTree.js";
import { callAIAgent } from "../../../../../../../../lib/utils/aiAgent.js";
import { getClassCoursesFromDB, getClassroomFromDB, getCoursesBySubjectFromDB, getKnowledgeStatsConfigFromDB, getKnowledgeTreeConfigFromDB, getMistakePointQuestionsFromDB, getMistakePointsBySubjectFromDB, getProblemQuestionsFromDB, getQuestionKnowledgePointsFromDB, getQuestionPacksBySubjectFromDB, getQuestionsFromDB, getSchoolFromDB, getStudentAnswerIdsFromDB, getStudentAnswersFromDB, getStudentFromDB, getUncorrectedWrongItemsFromDB, getWrongItemsFromDB } from "./datas.js";
// 全局控制变量：是否将ProblemQuestionDoc数据包含在知识点掌握率统计中
const INCLUDE_PROBLEM_QUESTIONS_IN_STATS = true;

// === 基础函数 ===


async function prepareAllData(studentId, classroomId, subject) {
  try {
    // 1. 并行获取学生、班级基本信息
    const [student, classroom] = await Promise.all([getStudentFromDB(studentId), getClassroomFromDB(classroomId)]);

    // 验证学生和班级信息是否存在
    if (!student || !classroom) {
      return null;
    }

    // 根据班级信息获取学校信息
    const school = await getSchoolFromDB(classroom.schoolId);
    if (!school) {
      return null;
    }

    // 2. 获取学生在该班级的所有答卷记录（按科目过滤）
    const studentAnswers = await getStudentAnswersFromDB(studentId, classroomId);

    // 如果学生没有任何答卷记录，直接返回null
    if (studentAnswers.length === 0) {
      return null;
    }

    // 3. 获取班级的所有课程（按科目过滤）
    const classCourses = await getClassCoursesFromDB(classroomId);

    // 从课程中获取题目集合ID（按科目过滤）
    let questionPackIdsFromCourse = [];
    if (classCourses.length > 0) {
      // 获取班级关联的所有课程ID
      const courseIds = classCourses.map(cc => cc.courseId);

      // 查询属于指定科目的课程
      const courses = await getCoursesBySubjectFromDB(courseIds, subject);

      // 从课程中提取所有题目集合ID
      questionPackIdsFromCourse = courses.flatMap(course => course.questionPackIds);
    }

    // 从学生答卷中获取题目集合ID
    const questionPackIdsFromAnswers = studentAnswers.map(sa => sa.questionPackId);

    // 合并两个来源的题目集合ID（去重）
    const allQuestionPackIds = Array.from(new Set([...questionPackIdsFromCourse, ...questionPackIdsFromAnswers]));

    /* 这里的题集包含了课程答卷和错题本等自定义题集的答卷（下面称"非课程答卷"）
       那么这里就假设了学生的非课程答卷中的知识点必须是课程中的知识点的子集，
       否则这个学生的报告中的知识点集合会超过其他学生的集合，这会显得不太合理。
    */

    // 查询所有相关的题目集合，并按科目过滤
    const questionPacks = await getQuestionPacksBySubjectFromDB(allQuestionPackIds, subject);

    // 将题目集合转换为Map结构，便于后续查找
    const questionPacksMap = new Map(questionPacks.map(qp => [qp._id, qp]));

    // 4. 过滤答卷记录，只保留属于当前科目题集的答卷
    const filteredStudentAnswers = studentAnswers.filter(sa => questionPacksMap.has(sa.questionPackId));

    // 如果过滤后没有任何答卷记录，返回null
    if (filteredStudentAnswers.length === 0) {
      return null;
    }

    // 5. 获取所有错题记录
    const studentAnswerIds = filteredStudentAnswers.map(sa => sa._id);

    /** 所有错题记录（根据科目过滤） */
    const allWrongItems = await getWrongItemsFromDB(studentAnswerIds);

    // 6. 获取所有相关题目(包含课程题集和非课程题集中的题目)
    const allQuestionIds = Array.from(new Set([
    // 从题目集合中获取所有题目ID
    ...questionPacks.flatMap(qp => qp.questionIds),
    // 从错题记录中获取题目ID
    ...allWrongItems.map(item => item.questionId)]));

    /** 所有题目(根据科目过滤) */
    const questions = await getQuestionsFromDB(allQuestionIds);

    // 将题目转换为Map结构，便于后续查找
    const questionsMap = new Map(questions.map(q => [q._id, q]));

    // 7. 获取知识点掌握阈值配置
    const knowledgeStatsConfig = await getKnowledgeStatsConfigFromDB();

    // 8. 获取学生的ProblemQuestion题目数据（如果启用统计）
    let problemQuestions = [];
    if (INCLUDE_PROBLEM_QUESTIONS_IN_STATS) {
      problemQuestions = await getProblemQuestionsFromDB(studentId, classroomId, subject);
    }

    // 返回所有准备好的数据
    return {
      student,
      classroom,
      school,
      questionPacksMap,
      // 题目集合映射(根据科目过滤)
      studentAnswers: filteredStudentAnswers,
      // 学生在该班级的所有答卷记录（按科目过滤）
      allWrongItems,
      // 所有错题记录（根据科目过滤）
      questionsMap,
      // 所有题目（根据科目过滤）, 包含课程题集和非课程题集中的题目
      problemQuestions,
      // 学生的ProblemQuestion题目数据（根据科目过滤）
      knowledgeStatsConfig
    };
  } catch (error) {
    // 记录错误并返回null
    console.error("Error preparing student progress data:", error);
    return null;
  }
}

// === 第一个组件：头部数据 ===


function generateHeaderData(data, knowledgePointsMastery, subject) {
  // 1. 构建错题查找集合，用于快速检查题目是否做错
  const wrongItemsSet = new Set();
  for (const item of data.allWrongItems) {
    // 使用答卷ID和题目ID的组合作为唯一标识
    wrongItemsSet.add(`${item.studentAnswerId}-${item.questionId}`);
  }

  // 初始化计算变量
  let totalQuestions = 0;
  let correctQuestions = 0;

  // 2. 遍历所有答卷，计算总题目数和正确题目数
  for (const answer of data.studentAnswers) {
    // 获取对应的题目集合
    const questionPack = data.questionPacksMap.get(answer.questionPackId);
    if (!questionPack) continue;

    // 遍历题目集合中的每个题目
    for (const questionId of questionPack.questionIds) {
      // 确保题目存在于题目映射中
      if (!data.questionsMap.has(questionId)) continue;

      // 增加总题目计数
      totalQuestions += 1;

      // 使用Set快速检查该题目是否做错
      const isWrong = wrongItemsSet.has(`${answer._id}-${questionId}`);

      // 如果没有做错，则增加正确题目计数
      if (!isWrong) {
        correctQuestions += 1;
      }
    }
  }

  // 注意：这里不再统计ProblemQuestion到总体数据中，总体数据只考虑EXAM_QUESTION

  // 3. 计算自主上传错题题目统计（单独统计，不影响总体数据）
  const aiQuestionStats = INCLUDE_PROBLEM_QUESTIONS_IN_STATS ? {
    total: data.problemQuestions.length,
    mastered: data.problemQuestions.filter(pq => pq.isStudentMaster).length,
    unmastered: data.problemQuestions.length - data.problemQuestions.filter(pq => pq.isStudentMaster).length
  } : {
    total: 0,
    mastered: 0,
    unmastered: 0
  };

  // 4. 计算知识点掌握情况统计
  const totalKnowledgePoints = Object.keys(knowledgePointsMastery).length;
  const masteredKnowledgePoints = Object.values(knowledgePointsMastery).filter(mastered => mastered).length;

  // 计算总体知识点掌握率
  const overallMasteryRate = totalKnowledgePoints > 0 ? masteredKnowledgePoints / totalKnowledgePoints * 100 : 0;

  // 5. 组装并返回完整的头部数据
  return {
    studentName: data.student.name,
    className: data.classroom.name,
    grade: data.classroom.grade,
    schoolName: data.school.name,
    subject: subject,
    totalTests: data.studentAnswers.length,
    totalQuestions,
    correctQuestions,
    // 计算总体答对率
    overallCorrectRate: totalQuestions > 0 ? correctQuestions / totalQuestions * 100 : 0,
    testProgress: {
      completed: data.studentAnswers.length,
      total: Array.from(data.questionPacksMap.values()).length
    },
    totalKnowledgePoints,
    masteredKnowledgePoints,
    // 将掌握率四舍五入到小数点后一位
    overallMasteryRate: Math.round(overallMasteryRate * 10) / 10,
    // 自主上传错题题目统计
    aiQuestionStats
  };
}


async function calculateDetailedKnowledgePointsMastery(data) {
  // 1. 初始化所有知识点的权重映射
  const allKnowledgePointsMap = new Map();

  // 通过所有题目获取所有可能的知识点，并初始化权重映射
  for (const [, question] of data.questionsMap) {
    if (question.knowledgePoints) {
      for (const kp of question.knowledgePoints) {
        // 如果知识点存在且尚未在映射中，则添加到映射中
        if (kp && !allKnowledgePointsMap.has(kp)) {
          allKnowledgePointsMap.set(kp, {
            totalWeight: 0,
            correctWeight: 0
          });
        }
      }
    }
  }

  // 通过ProblemQuestion题目获取知识点，并初始化权重映射（如果启用统计）
  if (INCLUDE_PROBLEM_QUESTIONS_IN_STATS) {
    for (const problemQuestion of data.problemQuestions) {
      if (problemQuestion.knowledgePoints) {
        for (const kp of problemQuestion.knowledgePoints) {
          // 如果知识点存在且尚未在映射中，则添加到映射中
          if (kp && !allKnowledgePointsMap.has(kp)) {
            allKnowledgePointsMap.set(kp, {
              totalWeight: 0,
              correctWeight: 0
            });
          }
        }
      }
    }
  }

  // 2. 创建错题查找集合和课程错题成功映射，用于快速判断题目状态
  const wrongItemsSet = new Set();
  const correctedByMistakePracticeSet = new Set();
  for (const item of data.allWrongItems) {
    // 使用答卷ID和题目ID的组合创建唯一标识
    const itemKey = `${item.studentAnswerId}-${item.questionId}`;
    wrongItemsSet.add(itemKey);

    // 记录是否通过课程错题做对了
    if (item.isCorrectedByMistakeAgain === true) {
      correctedByMistakePracticeSet.add(itemKey);
    }
  }

  // 3. 处理每一个答卷，计算知识点的权重
  for (const answer of data.studentAnswers) {
    // 获取答卷对应的题目集合
    const questionPack = data.questionPacksMap.get(answer.questionPackId);
    if (!questionPack) continue;

    // 处理这个题集中的每一个题目
    for (const questionId of questionPack.questionIds) {
      const question = data.questionsMap.get(questionId);
      // 如果题目不存在或没有知识点，跳过
      if (!question || !question.knowledgePoints) continue;

      // 根据题目难度获取权重值
      const difficultyWeight = await getDifficultyValue(question.difficulty);

      // 判断该题目是否做错
      const itemKey = `${answer._id}-${questionId}`;
      const isWrong = wrongItemsSet.has(itemKey);

      // 判断该题目是否通过课程错题做对了
      const isCorrectedByMistake = correctedByMistakePracticeSet.has(itemKey);

      // 处理这个题目的每一个知识点
      for (const kp of question.knowledgePoints) {
        if (!kp) continue;
        const knowledgePoint = allKnowledgePointsMap.get(kp);
        if (knowledgePoint) {
          // 增加该知识点的总权重
          knowledgePoint.totalWeight += difficultyWeight;

          // 如果题目第一次做对了，或者通过课程错题做对了，增加正确权重
          if (!isWrong || isCorrectedByMistake) {
            knowledgePoint.correctWeight += difficultyWeight;
          }
        }
      }
    }
  }

  // 4. 处理ProblemQuestion题目的知识点权重（如果启用统计）
  if (INCLUDE_PROBLEM_QUESTIONS_IN_STATS) {
    for (const problemQuestion of data.problemQuestions) {
      // 如果题目没有知识点，跳过
      if (!problemQuestion.knowledgePoints) continue;

      // 根据题目难度获取权重值
      const difficultyWeight = await getDifficultyValue(problemQuestion.difficulty);

      // 处理这个题目的每一个知识点
      for (const kp of problemQuestion.knowledgePoints) {
        if (!kp) continue;
        const knowledgePoint = allKnowledgePointsMap.get(kp);
        if (knowledgePoint) {
          // 增加该知识点的总权重
          knowledgePoint.totalWeight += difficultyWeight;

          // 如果题目已掌握，增加正确权重
          if (problemQuestion.isStudentMaster) {
            knowledgePoint.correctWeight += difficultyWeight;
          }
        }
      }
    }
  }

  // 5. 根据掌握阈值生成知识点掌握情况映射和详细率信息
  const knowledgePointsMastery = {};
  const detailedMasteryMap = {};
  for (const [knowledgePointName, weights] of allKnowledgePointsMap) {
    // 计算该知识点的掌握率
    const masteryRate = weights.totalWeight > 0 ? weights.correctWeight / weights.totalWeight * 100 : 0;

    // 根据掌握率和阈值判断是否掌握
    knowledgePointsMastery[knowledgePointName] = masteryRate >= data.knowledgeStatsConfig.masteryThreshold;

    // 生成详细掌握率信息
    detailedMasteryMap[knowledgePointName] = {
      name: knowledgePointName,
      masteryRate: Math.round(masteryRate)
    };
  }
  return {
    masteryMap: knowledgePointsMastery,
    detailedMap: detailedMasteryMap
  };
}

// === 知识点掌握率计算 ===

// === 第三个组件：知识树掌握率统计 ===


function filterKnowledgeTree(nodes, knowledgePointsMastery) {
  const filteredNodes = [];

  // 遍历当前层级的所有节点
  for (const node of nodes) {
    // 检查当前节点是否是叶子节点（知识点）
    const isLeafNode = !node.children || node.children.length === 0;

    // 如果是叶子节点，检查是否在我们的数据中
    if (isLeafNode) {
      // 如果这个知识点在我们的掌握映射中存在，则保留
      if (Object.hasOwn(knowledgePointsMastery, node.name)) {
        filteredNodes.push({
          name: node.name,
          children: undefined
        });
      }
    } else {
      // 如果不是叶子节点，递归检查子节点
      const filteredChildren = filterKnowledgeTree(node.children || [], knowledgePointsMastery);

      // 如果有子节点被保留，则保留当前节点
      if (filteredChildren.length > 0) {
        filteredNodes.push({
          name: node.name,
          children: filteredChildren
        });
      }
    }
  }
  return filteredNodes;
}


function getAllLeafNodes(nodes) {
  const leafNodes = [];

  // 定义递归遍历函数
  function traverse(node) {
    // 如果没有子节点或子节点数组为空，则为叶子节点
    if (!node.children || node.children.length === 0) {
      leafNodes.push(node.name);
    } else {
      // 非叶子节点，递归处理每个子节点
      node.children.forEach(traverse);
    }
  }

  // 对每个根节点开始遍历
  nodes.forEach(traverse);
  return leafNodes;
}


function calculateNodeMastery(node, knowledgePointsMastery) {
  // 获取该节点下的所有叶子节点
  const leafNodes = getAllLeafNodes([node]);

  // 只统计在掌握映射中存在的知识点
  const relevantLeafNodes = leafNodes.filter(name => Object.hasOwn(knowledgePointsMastery, name));

  // 统计总数和已掌握数
  const totalPoints = relevantLeafNodes.length;
  const masteredPoints = relevantLeafNodes.filter(name => knowledgePointsMastery[name]).length;

  // 计算掌握率百分比，四舍五入到整数
  const mastery = totalPoints > 0 ? Math.round(masteredPoints / totalPoints * 100) : 0;
  return {
    totalPoints,
    masteredPoints,
    mastery
  };
}


function generateDetailedKnowledgeCategoriesData(filteredKnowledgeTree, knowledgePointsMastery, detailedMasteryMap, knowledgeStatsConfig) {
  const categories = [];
  const subCategoriesMap = {};

  // 预定义的颜色列表（20种颜色，不同色系错开排列）
  const colors = ["#ef4444",
  // 红色
  "#06b6d4",
  // 青色
  "#f59e0b",
  // 橙色
  "#8b5cf6",
  // 紫色
  "#10b981",
  // 绿色
  "#f43f5e",
  // 玫瑰色
  "#3b82f6",
  // 蓝色
  "#84cc16",
  // 酸橙色
  "#f97316",
  // 橙红色
  "#14b8a6",
  // 青绿色
  "#dc2626",
  // 深红色
  "#0891b2",
  // 深青色
  "#d97706",
  // 深橙色
  "#7c3aed",
  // 深紫色
  "#059669",
  // 深绿色
  "#e11d48",
  // 深玫瑰色
  "#1d4ed8",
  // 深蓝色
  "#65a30d",
  // 深酸橙色
  "#ea580c",
  // 深橙红色
  "#0d9488" // 深青绿色
  ];

  // 随机选择一个颜色的初始位置，避免每次都从第一个颜色开始
  const colorIndex = Math.floor(Math.random() * colors.length);

  // 遍历第一层级（根节点）作为大分类
  filteredKnowledgeTree.forEach(rootNode => {
    // 跳过第一层级的叶子节点
    if (!rootNode.children || rootNode.children.length === 0) {
      return;
    }

    // 计算第一层级下所有叶子节点的掌握率
    const masteryStats = calculateNodeMastery(rootNode, knowledgePointsMastery);

    // 只有有知识点数据的分类才添加到结果中
    if (masteryStats.totalPoints > 0) {
      // 循环使用颜色数组，确保每个分类有不同的颜色
      const color = colors[(categories.length + colorIndex) % colors.length];

      // 添加到大分类数组
      categories.push({
        name: rootNode.name,
        mastery: masteryStats.mastery,
        remaining: 100 - masteryStats.mastery,
        color: color,
        totalPoints: masteryStats.totalPoints,
        masteredPoints: masteryStats.masteredPoints
      });

      // 生成第二层级数据作为小分类
      const subCategories = [];

      // 遍历第二层级节点
      rootNode.children.forEach(secondLevelNode => {
        // 如果第二层级是叶子节点，忽略（因为我们只统计有子分类的节点）
        if (!secondLevelNode.children || secondLevelNode.children.length === 0) {
          return;
        }

        // 计算第二层级下所有叶子节点的掌握率
        const secondLevelStats = calculateNodeMastery(secondLevelNode, knowledgePointsMastery);

        // 只有有知识点数据的子分类才添加
        if (secondLevelStats.totalPoints > 0) {
          // 收集该子分类下的所有叶子知识点
          const leafKnowledgePoints = collectLeafKnowledgePoints(secondLevelNode);

          // 为该子分类生成详细掌握情况
          const detailedInfo = generateKnowledgePointDetailedInfo(leafKnowledgePoints, detailedMasteryMap, knowledgeStatsConfig);
          subCategories.push({
            name: secondLevelNode.name,
            mastery: secondLevelStats.mastery,
            totalPoints: secondLevelStats.totalPoints,
            masteredPoints: secondLevelStats.masteredPoints,
            detailedKnowledgePoints: detailedInfo
          });
        }
      });

      // 保持知识树原始顺序，不进行排序
      subCategoriesMap[rootNode.name] = subCategories;
    }
  });

  // 保持知识树原始顺序，不进行排序
  return {
    categories,
    subCategoriesMap
  };
}


function collectLeafKnowledgePoints(node) {
  const leafPoints = [];
  function traverse(currentNode) {
    if (!currentNode.children || currentNode.children.length === 0) {
      // 叶子节点
      leafPoints.push(currentNode.name);
    } else {
      // 非叶子节点，继续遍历子节点
      currentNode.children.forEach(traverse);
    }
  }
  traverse(node);
  return leafPoints;
}


function generateKnowledgePointDetailedInfo(knowledgePoints, detailedMasteryMap, knowledgeStatsConfig) {
  const mastered = [];
  const partiallyMastered = [];
  const needsImprovement = [];
  knowledgePoints.forEach(kpName => {
    const kpInfo = detailedMasteryMap[kpName];
    if (kpInfo) {
      if (kpInfo.masteryRate >= knowledgeStatsConfig.masteryThreshold) {
        mastered.push(kpInfo);
      } else if (kpInfo.masteryRate >= knowledgeStatsConfig.partialMasteryThreshold) {
        partiallyMastered.push(kpInfo);
      } else {
        needsImprovement.push(kpInfo);
      }
    }
  });

  // 按掌握率降序排序
  mastered.sort((a, b) => b.masteryRate - a.masteryRate);
  partiallyMastered.sort((a, b) => b.masteryRate - a.masteryRate);
  needsImprovement.sort((a, b) => b.masteryRate - a.masteryRate);
  return {
    mastered,
    partiallyMastered,
    needsImprovement
  };
}

// === 生成页面整体报告数据 ===


export async function getReportData(studentId, classroomId, subject) {
  // 1. 准备基础数据（按科目过滤）
  const data = await prepareAllData(studentId, classroomId, subject);
  if (!data) {
    // 如果无法获取到学生数据或学生无答卷记录，返回null
    return null;
  }

  // 2. 计算知识点掌握情况（包含详细掌握率信息）
  const {
    masteryMap: knowledgePointsMastery,
    detailedMap: detailedMasteryMap
  } = await calculateDetailedKnowledgePointsMastery(data);

  // 3. 获取知识树配置
  const knowledgeTreeConfig = await getKnowledgeTreeConfigFromDB(subject);

  // 4. 裁剪知识树，只保留有数据的知识点
  const filteredKnowledgeTree = knowledgeTreeConfig ? filterKnowledgeTree(knowledgeTreeConfig.nodes, knowledgePointsMastery) : [];

  // 5. 生成知识点分类统计数据（包含详细掌握情况）
  const knowledgeCategoriesData = generateDetailedKnowledgeCategoriesData(filteredKnowledgeTree, knowledgePointsMastery, detailedMasteryMap, data.knowledgeStatsConfig);

  // 6. 生成头部数据（包含所有统计信息）
  const headerData = generateHeaderData(data, knowledgePointsMastery, subject);

  // 7. 生成错误归因分析的AI提示字符串并获取错误归因统计数据
  const errorAnalysisResult = await generateErrorAnalysisPrompt(data.allWrongItems, studentId, classroomId, subject);

  // 8. 返回完整的报告数据
  return {
    headerData: headerData,
    knowledgePointsMastery,
    filteredKnowledgeTree,
    knowledgeCategoriesData,
    errorAnalysisPrompt: errorAnalysisResult.prompt,
    mistakePointsStats: errorAnalysisResult.mistakePointsStats
  };
}

// === 错误归因分析函数 ===


async function generateErrorAnalysisPrompt(allWrongItems, studentId, classroomId, subject) {
  try {
    // 1. 检查错题数量是否足够进行分析
    if (allWrongItems.length < 5) {
      // 错题数量不足5道，无法进行有效的错误归因分析
      return {
        prompt: "",
        mistakePointsStats: []
      };
    }

    // 2. 查询该学生在该班级的所有错误归因记录
    const mistakePointQuestions = await getMistakePointQuestionsFromDB(studentId, classroomId);

    // 如果没有错误归因记录，无法进行分析
    if (mistakePointQuestions.length === 0) {
      return {
        prompt: "",
        mistakePointsStats: []
      };
    }

    // 3. 获取所有涉及的错误归因详情，并按科目过滤
    const mistakePointIds = Array.from(new Set(mistakePointQuestions.map(item => item.mistakePointId)));

    // 查询属于当前科目的错误归因
    const mistakePoints = await getMistakePointsBySubjectFromDB(mistakePointIds, subject);

    // 如果没有符合科目的错误归因，无法进行分析
    if (mistakePoints.length === 0) {
      return {
        prompt: "",
        mistakePointsStats: []
      };
    }

    // 4. 统计每个错误归因的出现次数
    const validMistakePointIds = new Set(mistakePoints.map(mp => mp._id));
    const mistakePointCounts = new Map();

    // 只统计属于当前科目的错误归因
    mistakePointQuestions.forEach(item => {
      if (validMistakePointIds.has(item.mistakePointId)) {
        const currentCount = mistakePointCounts.get(item.mistakePointId) || 0;
        mistakePointCounts.set(item.mistakePointId, currentCount + 1);
      }
    });

    // 5. 构建统计结果并排序
    const mistakeStats = [];
    mistakePoints.forEach(mp => {
      const errorCount = mistakePointCounts.get(mp._id) || 0;
      // 只包含有错误记录的错误归因
      if (errorCount > 0) {
        mistakeStats.push({
          name: mp.name,
          errorCount: errorCount
        });
      }
    });

    // 按错误次数降序排列，便于AI分析主要问题
    mistakeStats.sort((a, b) => b.errorCount - a.errorCount);

    // 6. 生成要发给AI的提示字符串
    let statsText = "学生在各个错误归因犯错情况统计：\n";
    mistakeStats.forEach(stat => {
      statsText += `${stat.name} ${stat.errorCount}次\n`;
    });
    return {
      prompt: statsText,
      mistakePointsStats: mistakeStats
    };
  } catch (error) {
    // 发生错误时记录日志并返回空对象
    console.error("生成错误归因分析提示失败:", error);
    return {
      prompt: "",
      mistakePointsStats: []
    };
  }
}


export async function generateErrorAnalysis(promptText) {
  // 1. 检查是否有错题数据（空字符串表示数据不足）
  if (!promptText || promptText.trim() === "") {
    throw new Error("DATA_INSUFFICIENT");
  }

  // 2. 获取AI配置
  const aiConfigResult = await getAllAIConfig();
  if (!aiConfigResult.success || !aiConfigResult.data) {
    throw new Error("获取AI配置失败");
  }

  // 从配置中获取错误归因分析的Bot ID
  const botId = aiConfigResult.data.termMultiTestDiagnosisAgentBotId;
  if (!botId) {
    throw new Error("未配置错误归因分析AI Bot ID");
  }

  // 3. 调用AI分析
  const aiResponse = await callAIAgent({
    botId,
    msg: promptText
  });

  // 4. 解析AI返回结果
  // 按行分割AI返回的文本，过滤空行
  const lines = aiResponse.trim().split("\n").filter(line => line.trim());
  const errorAnalysisData = [];

  // 解析每一行数据
  lines.forEach(line => {
    // 统一分隔符（将中文分号转换为英文分号）
    const parts = line.replace("；", ";").split(";");

    // 检查行格式是否正确（应该有两部分：错误原因和数值）
    if (parts.length === 2) {
      const subject = parts[0].trim();
      const valueStr = parts[1].trim();
      const value = parseInt(valueStr, 10);

      // 验证数据有效性
      if (subject && !Number.isNaN(value) && value >= 0 && value <= 100) {
        errorAnalysisData.push({
          subject,
          value
        });
      }
    }
  });

  // 5. 验证AI返回数据格式是否符合要求
  if (errorAnalysisData.length < 3 || errorAnalysisData.length > 10) {
    throw new Error("AI_FORMAT_ERROR");
  }
  return errorAnalysisData;
}


export async function getKnowledgePointErrorStats(studentId, classroomId, limit = 10) {
  try {
    // 1. 查询学生在该班级的所有答卷ID
    const studentAnswers = await getStudentAnswerIdsFromDB(studentId, classroomId);
    if (studentAnswers.length === 0) {
      return [];
    }
    const studentAnswerIds = studentAnswers.map(answer => answer._id);

    // 2. 查询所有错题记录（只要未通过课程错题方式做对的）
    const wrongItems = await getUncorrectedWrongItemsFromDB(studentAnswerIds);
    if (wrongItems.length === 0) {
      return [];
    }

    // 3. 获取所有错题的题目ID
    const questionIds = [...new Set(wrongItems.map(item => item.questionId))];

    // 4. 查询所有题目的知识点
    const questions = await getQuestionKnowledgePointsFromDB(questionIds);

    // 5. 统计每个知识点的错误次数
    const knowledgePointCountMap = new Map();
    wrongItems.forEach(item => {
      const question = questions.find(q => q._id === item.questionId);
      if (question?.knowledgePoints) {
        question.knowledgePoints.forEach(kp => {
          const currentCount = knowledgePointCountMap.get(kp) || 0;
          knowledgePointCountMap.set(kp, currentCount + 1);
        });
      }
    });

    // 6. 转换为数组并按错误次数降序排序
    const stats = Array.from(knowledgePointCountMap.entries()).map(([knowledgePoint, errorCount]) => ({
      knowledgePoint,
      errorCount
    }));

    // 按错误次数降序排序
    stats.sort((a, b) => b.errorCount - a.errorCount);

    // 7. 返回前N个
    return stats.slice(0, limit);
  } catch (error) {
    console.error("获取知识点错误统计失败:", error);
    return [];
  }
}
