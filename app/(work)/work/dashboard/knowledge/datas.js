/**
 * 知识点学情看板数据查询
 */
"use server";

import { allDocs, command } from "../../../../../lib/common/database.js";
import { getKnowledgeTreeConfig } from "../../../../../lib/config/knowledgeTree.js";
import { getCurrentSchoolGrades, getCurrentSchoolId } from "../../../../../lib/work/teacher/mySchool.js";
/**
 * 获取当前校园的所有班级和年级列表
 */
export async function getClassroomsWithGrades() {
  // 1. 获取当前校园ID
  const schoolId = await getCurrentSchoolId();

  // 2. 获取当前校园配置的年级列表（按配置顺序）
  const grades = await getCurrentSchoolGrades();

  // 3. 查询当前校园的所有班级
  const classrooms = await allDocs({
    c: "classroom",
    match: {
      schoolId
    },
    only: "_id,name,grade"
  });

  // 4. 按年级配置顺序排序班级
  const gradeOrder = new Map(grades.map((grade, index) => [grade, index]));
  classrooms.sort((a, b) => {
    const orderA = gradeOrder.get(a.grade) ?? 999;
    const orderB = gradeOrder.get(b.grade) ?? 999;
    if (orderA !== orderB) {
      return orderA - orderB;
    }

    // 同一年级内按班级名称排序
    return a.name.localeCompare(b.name, "zh-CN");
  });
  return {
    classrooms,
    grades
  };
}

/**
 * 将系统知识树格式转换为组件需要的格式
 */
function convertSystemTreeToComponentTree(systemNodes, level = 1) {
  if (!systemNodes) return [];
  return systemNodes.map(node => ({
    name: node.name,
    level,
    children: node.children ? convertSystemTreeToComponentTree(node.children, level + 1) : undefined
  }));
}

/**
 * 获取指定科目的知识树结构（用于看板展示）
 */
export async function getKnowledgeTreeForDashboard(subject) {
  try {
    // 获取知识树配置
    const config = await getKnowledgeTreeConfig(subject);
    if (!config || !config.nodes) {
      return [];
    }

    // 转换为组件需要的格式
    const tree = convertSystemTreeToComponentTree(config.nodes);
    return tree;
  } catch (error) {
    console.error(`获取 ${subject} 知识树失败:`, error);
    return [];
  }
}

/**
 * 查询指定班级的知识点相关数据
 * 此函数仅负责数据查询，不进行计算
 */
export async function queryKnowledgePointData(classIds, knowledgePointName, subject) {
  try {
    const _ = command();

    // 1. 查询所有班级的 StudentAnswerDoc
    const studentAnswers = await allDocs({
      c: "student_answer",
      match: {
        classId: _.in(classIds)
      }
    });
    if (studentAnswers.length === 0) {
      return null;
    }

    // 2. 获取所有题集ID
    const questionPackIds = [...new Set(studentAnswers.map(a => a.questionPackId))];

    // 3. 查询所有题集
    const questionPacks = await allDocs({
      c: "question_pack",
      match: {
        _id: _.in(questionPackIds),
        subject // 只查询当前科目的题集
      }
    });

    // 4. 获取所有题目ID
    const allQuestionIds = new Set();
    questionPacks.forEach(pack => {
      if (pack.questionIds) {
        pack.questionIds.forEach(qid => allQuestionIds.add(qid));
      }
    });

    // 5. 查询包含该知识点的所有题目
    const questions = await allDocs({
      c: "exam_question",
      match: {
        _id: _.in(Array.from(allQuestionIds)),
        knowledgePoints: knowledgePointName
      },
      only: "_id,difficulty,knowledgePoints"
    });
    if (questions.length === 0) {
      return null;
    }

    // 6. 查询所有错题记录
    const questionIdsSet = new Set(questions.map(q => q._id));
    const answerIds = studentAnswers.map(a => a._id);
    const wrongItems = await allDocs({
      c: "student_answer_item",
      match: {
        studentAnswerId: _.in(answerIds),
        questionId: _.in(Array.from(questionIdsSet))
      },
      only: "studentAnswerId,questionId,isCorrectedByMistakeAgain"
    });

    // 7. 查询班级信息
    const classrooms = await allDocs({
      c: "classroom",
      match: {
        _id: _.in(classIds)
      },
      only: "_id,name"
    });
    return {
      studentAnswers,
      questionPacks,
      questions,
      wrongItems,
      classrooms
    };
  } catch (error) {
    console.error("查询知识点数据失败:", error);
    return null;
  }
}

/**
 * 查询包含指定知识点的题目数据（用于题目列表统计）
 *
 * 优化查询策略：
 * 1. 先查询知识点对应的题目
 * 2. 根据题目查询包含这些题目的题集（过滤科目）
 * 3. 根据当前校园的班级ID查询答卷
 * 4. 根据答卷查询错题记录
 *
 * 这样可以最大程度减少查询的数据量
 */
export async function queryQuestionListData(knowledgePointName, subject) {
  try {
    const _ = command();
    const schoolId = await getCurrentSchoolId();

    // 1. 查询当前校园的所有班级ID
    const classrooms = await allDocs({
      c: "classroom",
      match: {
        schoolId
      },
      only: "_id"
    });
    if (classrooms.length === 0) {
      return {
        questions: [],
        studentAnswers: [],
        questionPacks: [],
        wrongItems: []
      };
    }
    const classIds = classrooms.map(c => c._id);

    // 2. 查询包含该知识点的所有题目（只获取必要字段）
    const questions = await allDocs({
      c: "exam_question",
      match: {
        knowledgePoints: knowledgePointName
      },
      only: "_id,questionType,questionText,answer,knowledgePoints,difficulty,imagePath,imageUrl"
    });
    if (questions.length === 0) {
      return {
        questions: [],
        studentAnswers: [],
        questionPacks: [],
        wrongItems: []
      };
    }
    const questionIds = questions.map(q => q._id);

    // 3. 查询包含这些题目的题集（过滤科目，只获取必要字段）
    const questionPacks = await allDocs({
      c: "question_pack",
      match: {
        questionIds: _.in(questionIds),
        subject
      },
      only: "_id,questionIds"
    });
    if (questionPacks.length === 0) {
      return {
        questions,
        studentAnswers: [],
        questionPacks: [],
        wrongItems: []
      };
    }
    const questionPackIds = questionPacks.map(pack => pack._id);

    // 4. 根据班级ID和题集ID查询答卷（只获取必要字段）
    const studentAnswers = await allDocs({
      c: "student_answer",
      match: {
        classId: _.in(classIds),
        questionPackId: _.in(questionPackIds)
      },
      only: "_id,questionPackId"
    });
    if (studentAnswers.length === 0) {
      return {
        questions,
        studentAnswers: [],
        questionPacks,
        wrongItems: []
      };
    }
    const answerIds = studentAnswers.map(a => a._id);

    // 5. 根据答卷查询错题记录（只查询与这些题目相关的错题）
    const wrongItems = await allDocs({
      c: "student_answer_item",
      match: {
        studentAnswerId: _.in(answerIds),
        questionId: _.in(questionIds)
      },
      only: "studentAnswerId,questionId,isCorrectedByMistakeAgain"
    });
    return {
      questions,
      studentAnswers,
      questionPacks,
      wrongItems
    };
  } catch (error) {
    console.error("查询题目列表数据失败:", error);
    return {
      questions: [],
      studentAnswers: [],
      questionPacks: [],
      wrongItems: []
    };
  }
}
