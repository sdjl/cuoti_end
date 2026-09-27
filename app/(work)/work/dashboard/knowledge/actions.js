"use server";

/**
 * 文件职责说明：
 * - 如果某个 Server Action 函数会用于 components 目录中的多个组件（一个以上），
 *   那么这个函数应该写到 actions.ts 文件中
 * - 如果这个函数在 page.tsx 文件中被使用，那么这个函数应该写到 actions.ts 文件中
 * - 如果这个函数没有在 page.tsx 文件中被使用，并且只会用于单个组件，那么这个函数应该写到 componentsServerActions
 *   目录下和这个组件对应的文件中
 *
 * 此文件用于处理知识点学情看板相关的业务逻辑。
 */
import { getDifficultyValue, getKnowledgeStatsConfig } from "../../../../../lib/config/knowledgeTree.js";
import { queryKnowledgePointData, queryQuestionListData } from "./datas.js";
/**
 * 计算指定班级在某个知识点上的掌握率统计
 *
 * 使用位置：
 * - page.tsx（多次使用：line 69, 109）
 *
 * 重要说明：
 * 1. 此组件只能统计单个知识点，无法实现选择多个知识点
 *    原因：当选择多个知识点时，无法判定某个学生是否掌握"这些知识点"
 *    （是掌握任意一个就算掌握？还是全部掌握才算掌握？逻辑不明确）
 *
 * 2. 掌握率的计算逻辑：
 *    - 先计算每个学生是否掌握该知识点
 *    - 学生掌握判断：(学生正确权重 / 学生总权重) >= masteryThreshold
 *    - 班级掌握率 = (掌握的学生数 / 做过题的学生数) × 100%
 *
 * 3. 做过题的学生数 = 班级总学生数 - 未做题的学生数
 *    - 未做题：该学生的所有答卷中，没有包含该知识点的题目
 *    - 只有做过该知识点题目的学生才参与掌握率计算
 *
 * 4. masteryThreshold（掌握阈值）从系统配置中读取
 *    - 配置键：knowledge_stats_config.masteryThreshold
 *    - 默认值：90（即90%以上才算掌握）
 */
export async function calculateKnowledgePointStatsByClasses(classIds, knowledgePointName, subject) {
  try {
    // 1. 获取配置
    const config = await getKnowledgeStatsConfig();

    // 2. 查询数据
    const data = await queryKnowledgePointData(classIds, knowledgePointName, subject);
    if (!data) {
      return [];
    }
    const {
      studentAnswers,
      questionPacks,
      questions,
      wrongItems,
      classrooms
    } = data;

    // 3. 创建映射
    const questionsMap = new Map(questions.map(q => [q._id, q]));
    const classroomsMap = new Map(classrooms.map(c => [c._id, c]));
    const questionPacksMap = new Map(questionPacks.map(pack => [pack._id, pack]));

    // 4. 创建错题查找集合
    const wrongItemsSet = new Set();
    const correctedSet = new Set();
    wrongItems.forEach(item => {
      const key = `${item.studentAnswerId}-${item.questionId}`;
      wrongItemsSet.add(key);
      if (item.isCorrectedByMistakeAgain === true) {
        correctedSet.add(key);
      }
    });

    // 5. 按班级和学生统计
    const classStatsMap = new Map();

    // 初始化班级统计
    classIds.forEach(classId => {
      const classroom = classroomsMap.get(classId);
      if (classroom) {
        classStatsMap.set(classId, {
          className: classroom.name,
          allStudentIds: new Set(),
          studentStats: new Map()
        });
      }
    });

    // 6. 遍历答卷，按学生统计
    for (const answer of studentAnswers) {
      const classStats = classStatsMap.get(answer.classId);
      if (!classStats) continue;

      // 记录班级中的所有学生
      classStats.allStudentIds.add(answer.studentId);

      // 获取题集
      const questionPack = questionPacksMap.get(answer.questionPackId);
      if (!questionPack || !questionPack.questionIds) continue;

      // 获取或初始化学生统计
      let studentStat = classStats.studentStats.get(answer.studentId);
      if (!studentStat) {
        studentStat = {
          totalWeight: 0,
          correctWeight: 0,
          totalQuestions: 0,
          correctQuestions: 0
        };
        classStats.studentStats.set(answer.studentId, studentStat);
      }

      // 遍历题集中的题目
      for (const questionId of questionPack.questionIds) {
        const question = questionsMap.get(questionId);
        if (!question) continue;

        // 获取难度权重
        const weight = await getDifficultyValue(question.difficulty);

        // 判断是否做错
        const itemKey = `${answer._id}-${questionId}`;
        const isWrong = wrongItemsSet.has(itemKey);
        const isCorrected = correctedSet.has(itemKey);

        // 统计
        studentStat.totalWeight += weight;
        studentStat.totalQuestions += 1;

        // 如果第一次做对，或者通过错题订正做对了，则计入正确
        if (!isWrong || isCorrected) {
          studentStat.correctWeight += weight;
          studentStat.correctQuestions += 1;
        }
      }
    }

    // 7. 计算每个班级的统计数据
    const results = [];
    classStatsMap.forEach((stats, classId) => {
      const totalStudentCount = stats.allStudentIds.size;
      const studiedStudentCount = stats.studentStats.size;
      const notStudiedStudentCount = totalStudentCount - studiedStudentCount;

      // 统计掌握的学生数
      let masteredStudentCount = 0;
      let totalAttempts = 0;
      let correctCount = 0;
      let wrongCount = 0;
      stats.studentStats.forEach(studentStat => {
        // 计算学生的掌握率
        const studentMasteryRate = studentStat.totalWeight > 0 ? studentStat.correctWeight / studentStat.totalWeight * 100 : 0;

        // 判断学生是否掌握
        if (studentMasteryRate >= config.masteryThreshold) {
          masteredStudentCount++;
        }

        // 累加做题统计
        totalAttempts += studentStat.totalQuestions;
        correctCount += studentStat.correctQuestions;
        wrongCount += studentStat.totalQuestions - studentStat.correctQuestions;
      });

      // 计算班级掌握率：掌握的学生数 / 做过题的学生数
      const masteryRate = studiedStudentCount > 0 ? Math.round(masteredStudentCount / studiedStudentCount * 100) : 0;

      // 计算正确率和错误率
      const correctRate = totalAttempts > 0 ? Math.round(correctCount / totalAttempts * 100) : 0;
      const wrongRate = 100 - correctRate;
      results.push({
        classId,
        className: stats.className,
        totalStudentCount,
        studiedStudentCount,
        notStudiedStudentCount,
        masteredStudentCount,
        totalAttempts,
        correctCount,
        wrongCount,
        masteryRate,
        correctRate,
        wrongRate
      });
    });

    // 8. 按掌握率从高到低排序
    results.sort((a, b) => b.masteryRate - a.masteryRate);
    return results;
  } catch (error) {
    console.error("计算知识点统计数据失败:", error);
    return [];
  }
}

/**
 * 查询包含指定知识点的所有题目及其统计数据
 *
 * 使用位置：
 * - page.tsx（line 114）
 *
 * 重要说明：
 * 1. 所有数据库查询操作在 datas.ts 中完成
 * 2. 本文件只负责计算统计数据
 * 3. 题目正确判断逻辑：
 *    - StudentAnswerItemDoc 不存在 → 第一次做对 → 正确
 *    - StudentAnswerItemDoc 存在且 isCorrectedByMistakeAgain=true → 通过错题订正做对 → 正确
 *    - 其他情况 → 错误
 */
export async function getQuestionListByKnowledgePoint(knowledgePointName, subject) {
  try {
    // 1. 从 datas.ts 中查询所有需要的数据
    const data = await queryQuestionListData(knowledgePointName, subject);
    const {
      questions,
      studentAnswers,
      questionPacks,
      wrongItems
    } = data;
    if (questions.length === 0) {
      return [];
    }
    const questionIds = questions.map(q => q._id);
    if (studentAnswers.length === 0) {
      // 没有答卷数据，返回题目基本信息，统计为0
      return questions.map(q => ({
        _id: q._id,
        questionType: q.questionType || "未知",
        questionText: q.questionText,
        answer: q.answer,
        knowledgePoints: q.knowledgePoints,
        difficulty: q.difficulty,
        imagePath: q.imagePath,
        imageUrl: q.imageUrl,
        created: 0,
        totalAttempts: 0,
        correctCount: 0,
        wrongCount: 0,
        correctRate: 0,
        wrongRate: 0
      }));
    }

    // 2. 创建映射
    const questionPacksMap = new Map(questionPacks.map(pack => [pack._id, pack]));

    // 创建错题查找集合
    const wrongItemsSet = new Set();
    const correctedSet = new Set();
    wrongItems.forEach(item => {
      const key = `${item.studentAnswerId}-${item.questionId}`;
      wrongItemsSet.add(key);
      if (item.isCorrectedByMistakeAgain === true) {
        correctedSet.add(key);
      }
    });

    // 3. 统计每个题目的数据
    const questionStatsMap = new Map();

    // 初始化题目统计
    questionIds.forEach(qid => {
      questionStatsMap.set(qid, {
        totalAttempts: 0,
        correctCount: 0,
        wrongCount: 0
      });
    });

    // 遍历答卷统计
    studentAnswers.forEach(answer => {
      const questionPack = questionPacksMap.get(answer.questionPackId);
      if (!questionPack || !questionPack.questionIds) return;

      // 遍历题集中的题目
      questionPack.questionIds.forEach(questionId => {
        const stats = questionStatsMap.get(questionId);
        if (!stats) return;

        // 判断是否做错
        const itemKey = `${answer._id}-${questionId}`;
        const isWrong = wrongItemsSet.has(itemKey);
        const isCorrected = correctedSet.has(itemKey);

        // 统计
        stats.totalAttempts += 1;

        // 如果第一次做对，或者通过错题订正做对了，则计入正确
        if (!isWrong || isCorrected) {
          stats.correctCount += 1;
        } else {
          stats.wrongCount += 1;
        }
      });
    });

    // 4. 生成结果
    const results = questions.map(q => {
      const stats = questionStatsMap.get(q._id);
      const totalAttempts = stats?.totalAttempts || 0;
      const correctCount = stats?.correctCount || 0;
      const wrongCount = stats?.wrongCount || 0;
      const correctRate = totalAttempts > 0 ? Math.round(correctCount / totalAttempts * 100) : 0;
      const wrongRate = 100 - correctRate;
      return {
        _id: q._id,
        questionType: q.questionType || "未知",
        questionText: q.questionText,
        answer: q.answer,
        knowledgePoints: q.knowledgePoints,
        difficulty: q.difficulty,
        imagePath: q.imagePath,
        imageUrl: q.imageUrl,
        created: 0,
        // 题目创建时间需要从试卷中获取，暂时为0
        totalAttempts,
        correctCount,
        wrongCount,
        correctRate,
        wrongRate
      };
    });
    return results;
  } catch (error) {
    console.error("计算题目列表统计失败:", error);
    return [];
  }
}
