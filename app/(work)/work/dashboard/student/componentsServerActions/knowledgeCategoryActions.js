"use server";

/**
 * 知识点分类掌握情况组件的 Server Actions
 *
 * 用于以下组件：
 * - app/(work)/work/dashboard/student/components/KnowledgeCategoryAnalysis.tsx
 * - app/(work)/work/dashboard/student/components/SubCategoryDetailDialog.tsx
 *
 * 此文件专门用于处理知识点分类掌握情况的数据计算
 * 计算学生在某个科目下的知识点分类掌握情况
 *
 * 配置变量：
 * - INCLUDE_PROBLEM_QUESTIONS_IN_STATS: 是否将ProblemQuestionDoc数据包含在统计中（默认true）
 *
 * 计算规则（参考 docs/常用代码样例/知识点掌握率计算说明.md）：
 * 1. 获取学生的所有答卷和错题数据
 * 2. 计算每个知识点的掌握率
 * 3. 根据知识树结构生成分类统计数据
 * 4. 支持包含或排除自主上传错题（ProblemQuestion）
 */
import { getDifficultyValue, getKnowledgeStatsConfig, getKnowledgeTreeConfig } from "../../../../../../lib/config/knowledgeTree.js";
import { getQuestionPacksFullInfoByIds, getQuestionsByIds, getStudentAllAnswersForSubject, getStudentAnswerItemsByAnswerIds, getStudentProblemQuestions } from "../datas.js";
// 是否将ProblemQuestionDoc数据包含在知识点掌握率统计中
const INCLUDE_PROBLEM_QUESTIONS_IN_STATS = true;

/**
 * 知识点详细掌握率信息
 */


export async function getKnowledgeCategoryDataAction(studentId, subject) {
  try {
    // 1. 获取知识树配置
    const knowledgeTreeConfig = await getKnowledgeTreeConfig(subject);
    if (!knowledgeTreeConfig || !knowledgeTreeConfig.nodes) {
      return {
        success: true,
        data: null
      };
    }

    // 2. 获取知识点统计配置
    const knowledgeStatsConfig = await getKnowledgeStatsConfig();

    // 3. 获取学生的所有答卷数据（该科目）
    const studentAnswers = await getStudentAllAnswersForSubject(studentId, subject);
    if (studentAnswers.length === 0 && !INCLUDE_PROBLEM_QUESTIONS_IN_STATS) {
      return {
        success: true,
        data: null
      };
    }

    // 4. 获取所有题集信息（包含questionIds）
    const questionPackIds = [...new Set(studentAnswers.map(a => a.questionPackId))];
    const questionPacks = questionPackIds.length > 0 ? await getQuestionPacksFullInfoByIds(questionPackIds) : [];

    // 创建题集映射
    const questionPacksMap = new Map(questionPacks.map(qp => [qp._id, qp]));

    // 5. 获取所有错题记录
    const answerIds = studentAnswers.map(a => a._id);
    const allWrongItems = answerIds.length > 0 ? await getStudentAnswerItemsByAnswerIds(answerIds) : [];

    // 6. 获取所有相关题目（包括做对和做错的题目）
    const allQuestionIds = new Set();

    // 从题集中获取所有题目ID
    for (const questionPack of questionPacks) {
      if (questionPack.questionIds) {
        for (const qId of questionPack.questionIds) {
          allQuestionIds.add(qId);
        }
      }
    }
    const questions = allQuestionIds.size > 0 ? await getQuestionsByIds([...allQuestionIds]) : [];

    // 创建题目映射
    const questionsMap = new Map(questions.map(q => [q._id, q]));

    // 7. 如果需要，获取学生的自主上传错题
    let problemQuestions = [];
    if (INCLUDE_PROBLEM_QUESTIONS_IN_STATS) {
      problemQuestions = await getStudentProblemQuestions(studentId, subject);
    }

    // 8. 计算知识点掌握情况
    const {
      masteryMap,
      detailedMap
    } = await calculateKnowledgePointsMastery(studentAnswers, questionPacksMap, allWrongItems, questionsMap, problemQuestions, knowledgeStatsConfig);

    // 9. 裁剪知识树（只保留有数据的知识点）
    const filteredKnowledgeTree = filterKnowledgeTree(knowledgeTreeConfig.nodes, masteryMap);

    // 10. 生成知识点分类统计数据
    const knowledgeCategoriesData = generateDetailedKnowledgeCategoriesData(filteredKnowledgeTree, masteryMap, detailedMap, knowledgeStatsConfig);
    return {
      success: true,
      data: knowledgeCategoriesData
    };
  } catch (error) {
    console.error("获取知识点分类数据失败:", error);
    return {
      success: false,
      data: null
    };
  }
}

/**
 * 计算知识点掌握情况
 *
 * 算法说明：
 * 1. 遍历所有答卷和题目（包括做对和做错的题目）
 * 2. 使用难度权重计算掌握率：容易=1，中等=2，困难=3，超难=4
 * 3. 掌握率 = (正确权重 / 总权重) × 100%
 * 4. 如果题目第一次就做对，或通过错题订正做对，则计入正确权重
 */
async function calculateKnowledgePointsMastery(studentAnswers, questionPacksMap, allWrongItems, questionsMap, problemQuestions, knowledgeStatsConfig) {
  // 1. 初始化所有知识点的权重映射
  const allKnowledgePointsMap = new Map();

  // 2. 通过所有题目获取所有可能的知识点，并初始化权重映射
  for (const [, question] of questionsMap) {
    if (question.knowledgePoints) {
      for (const kp of question.knowledgePoints) {
        if (kp && !allKnowledgePointsMap.has(kp)) {
          allKnowledgePointsMap.set(kp, {
            totalWeight: 0,
            correctWeight: 0
          });
        }
      }
    }
  }

  // 3. 创建错题查找集合，用于快速判断题目是否做错
  const wrongItemsSet = new Set();
  const correctedByMistakePracticeSet = new Set();
  for (const item of allWrongItems) {
    // 使用答卷ID和题目ID的组合创建唯一标识
    const itemKey = `${item.studentAnswerId}-${item.questionId}`;
    wrongItemsSet.add(itemKey);

    // 记录是否通过错题本练习做对了
    if (item.isCorrectedByMistakeAgain === true) {
      correctedByMistakePracticeSet.add(itemKey);
    }
  }

  // 4. 遍历所有答卷，处理每一个答卷中的每一个题目
  for (const answer of studentAnswers) {
    // 获取答卷对应的题目集合
    const questionPack = questionPacksMap.get(answer.questionPackId);
    if (!questionPack || !questionPack.questionIds) continue;

    // 处理这个题集中的每一个题目（包括做对和做错的）
    for (const questionId of questionPack.questionIds) {
      const question = questionsMap.get(questionId);
      // 如果题目不存在或没有知识点，跳过
      if (!question || !question.knowledgePoints) continue;

      // 根据题目难度获取权重值
      const difficultyWeight = await getDifficultyValue(question.difficulty);

      // 判断该题目是否做错
      const itemKey = `${answer._id}-${questionId}`;
      const isWrong = wrongItemsSet.has(itemKey);

      // 判断该题目是否通过错题本练习做对了
      const isCorrectedByMistake = correctedByMistakePracticeSet.has(itemKey);

      // 处理这个题目的每一个知识点
      for (const kp of question.knowledgePoints) {
        if (!kp) continue;
        const knowledgePoint = allKnowledgePointsMap.get(kp);
        if (knowledgePoint) {
          // 增加该知识点的总权重
          knowledgePoint.totalWeight += difficultyWeight;

          // 如果题目第一次做对了，或者通过错题本练习做对了，增加正确权重
          if (!isWrong || isCorrectedByMistake) {
            knowledgePoint.correctWeight += difficultyWeight;
          }
        }
      }
    }
  }

  // 5. 如果包含自主上传错题，处理ProblemQuestion中的知识点
  if (INCLUDE_PROBLEM_QUESTIONS_IN_STATS) {
    for (const problemQuestion of problemQuestions) {
      // 如果题目没有知识点，跳过
      if (!problemQuestion.knowledgePoints) continue;

      // 根据题目难度获取权重值
      const difficultyWeight = await getDifficultyValue(problemQuestion.difficulty);

      // 处理这个题目的每一个知识点
      for (const kp of problemQuestion.knowledgePoints) {
        if (!kp) continue;

        // 如果该知识点不在映射中，添加它
        if (!allKnowledgePointsMap.has(kp)) {
          allKnowledgePointsMap.set(kp, {
            totalWeight: 0,
            correctWeight: 0
          });
        }
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

  // 6. 计算每个知识点的掌握率并判断是否掌握
  const knowledgePointsMastery = {};
  const detailedMasteryMap = {};
  const masteryThreshold = knowledgeStatsConfig.masteryThreshold || 90;
  for (const [knowledgePointName, weights] of allKnowledgePointsMap) {
    // 计算该知识点的掌握率
    const masteryRate = weights.totalWeight > 0 ? weights.correctWeight / weights.totalWeight * 100 : 0;

    // 根据掌握率和阈值判断是否掌握
    knowledgePointsMastery[knowledgePointName] = masteryRate >= masteryThreshold;

    // 生成详细掌握率信息
    detailedMasteryMap[knowledgePointName] = {
      name: knowledgePointName,
      masteryRate: Math.round(masteryRate) // 四舍五入到整数
    };
  }
  return {
    masteryMap: knowledgePointsMastery,
    detailedMap: detailedMasteryMap
  };
}

/**
 * 使用深度优先搜索裁剪知识树，只保留有数据的知识点及其路径
 */
function filterKnowledgeTree(nodes, knowledgePointsMastery) {
  const filteredNodes = [];
  for (const node of nodes) {
    const isLeafNode = !node.children || node.children.length === 0;
    if (isLeafNode) {
      if (Object.hasOwn(knowledgePointsMastery, node.name)) {
        filteredNodes.push({
          name: node.name,
          children: undefined
        });
      }
    } else {
      const filteredChildren = filterKnowledgeTree(node.children || [], knowledgePointsMastery);
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

/**
 * 获取知识树中所有叶子节点
 */
function getAllLeafNodes(nodes) {
  const leafNodes = [];
  function traverse(node) {
    if (!node.children || node.children.length === 0) {
      leafNodes.push(node.name);
    } else {
      node.children.forEach(traverse);
    }
  }
  nodes.forEach(traverse);
  return leafNodes;
}

/**
 * 计算某个节点下所有叶子节点的掌握率
 */
function calculateNodeMastery(node, knowledgePointsMastery) {
  const leafNodes = getAllLeafNodes([node]);
  const relevantLeafNodes = leafNodes.filter(name => Object.hasOwn(knowledgePointsMastery, name));
  const totalPoints = relevantLeafNodes.length;
  const masteredPoints = relevantLeafNodes.filter(name => knowledgePointsMastery[name]).length;
  const mastery = totalPoints > 0 ? Math.round(masteredPoints / totalPoints * 100) : 0;
  return {
    totalPoints,
    masteredPoints,
    mastery
  };
}

/**
 * 根据裁剪后的知识树和详细掌握情况生成知识点分类统计数据
 */
function generateDetailedKnowledgeCategoriesData(filteredKnowledgeTree, knowledgePointsMastery, detailedMasteryMap, knowledgeStatsConfig) {
  const categories = [];
  const subCategoriesMap = {};

  // 预定义的颜色列表
  const colors = ["#ef4444", "#06b6d4", "#f59e0b", "#8b5cf6", "#10b981", "#f43f5e", "#3b82f6", "#84cc16", "#f97316", "#14b8a6", "#dc2626", "#0891b2", "#d97706", "#7c3aed", "#059669", "#e11d48", "#1d4ed8", "#65a30d", "#ea580c", "#0d9488"];
  const colorIndex = Math.floor(Math.random() * colors.length);

  // 遍历第一层级（根节点）作为大分类
  filteredKnowledgeTree.forEach(rootNode => {
    if (!rootNode.children || rootNode.children.length === 0) {
      return;
    }
    const masteryStats = calculateNodeMastery(rootNode, knowledgePointsMastery);
    if (masteryStats.totalPoints > 0) {
      const color = colors[(categories.length + colorIndex) % colors.length];
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
      rootNode.children.forEach(secondLevelNode => {
        if (!secondLevelNode.children || secondLevelNode.children.length === 0) {
          return;
        }
        const subMasteryStats = calculateNodeMastery(secondLevelNode, knowledgePointsMastery);
        if (subMasteryStats.totalPoints > 0) {
          // 获取第三层级的详细知识点信息
          const detailedKnowledgePoints = generateDetailedKnowledgePoints(secondLevelNode, knowledgePointsMastery, detailedMasteryMap, knowledgeStatsConfig);
          subCategories.push({
            name: secondLevelNode.name,
            mastery: subMasteryStats.mastery,
            totalPoints: subMasteryStats.totalPoints,
            masteredPoints: subMasteryStats.masteredPoints,
            detailedKnowledgePoints
          });
        }
      });
      if (subCategories.length > 0) {
        subCategoriesMap[rootNode.name] = subCategories;
      }
    }
  });
  return {
    categories,
    subCategoriesMap
  };
}

/**
 * 生成详细知识点信息（第三层级和第四层级）
 */
function generateDetailedKnowledgePoints(node, knowledgePointsMastery, detailedMasteryMap, knowledgeStatsConfig) {
  const mastered = [];
  const partiallyMastered = [];
  const needsImprovement = [];
  const masteryThreshold = knowledgeStatsConfig.masteryThreshold || 90;
  const partialMasteryThreshold = knowledgeStatsConfig.partialMasteryThreshold || 60;

  // 获取所有叶子节点
  const leafNodes = getAllLeafNodes([node]);

  // 分类统计
  leafNodes.forEach(leafName => {
    if (!Object.hasOwn(knowledgePointsMastery, leafName)) {
      return;
    }
    const detailedInfo = detailedMasteryMap[leafName];
    if (!detailedInfo) {
      return;
    }
    const point = {
      name: leafName,
      masteryRate: detailedInfo.masteryRate
    };
    if (detailedInfo.masteryRate >= masteryThreshold) {
      mastered.push(point);
    } else if (detailedInfo.masteryRate >= partialMasteryThreshold) {
      partiallyMastered.push(point);
    } else {
      needsImprovement.push(point);
    }
  });
  return {
    mastered,
    partiallyMastered,
    needsImprovement
  };
}
