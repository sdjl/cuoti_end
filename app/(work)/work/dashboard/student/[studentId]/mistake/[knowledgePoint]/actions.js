"use server";

import { getCourseSubjectFromDB, getMistakePointIdsFromDB, getMistakePointsFromDB, getMistakeRecordsFromDB, getQuestionIdsByKnowledgePoint, getQuestionKnowledgePointsFromDB, getQuestionPackTypeFromDB, getRedoImagesFromDB, getStudentAnswerIdsByStudentAndQuestions, getStudentAnswersFromDB, getStudentFromDB, updateMistakeRecordInDB, updateTypicalMistakeInDB } from "./datas.js";

/**
 * 获取学生在某个知识点上的错题记录
 *
 * @description
 * 此函数执行以下步骤来获取和组装错题记录数据：
 *
 * 步骤1：根据知识点和筛选条件查询题目ID
 *   - 输入：知识点名称、搜索文本、题目类型、难度
 *   - 输出：符合条件的题目ID数组 ['questionId1', 'questionId2', ...]
 *   - 数据来源：exam_question 表
 *
 * 步骤2：根据学生ID和题目ID列表获取答卷ID
 *   - 输入：学生ID、题目ID数组
 *   - 输出：该学生包含这些题目的答卷ID数组 ['studentAnswerId1', ...]
 *   - 数据来源：student_answer_item 表 -> student_answer 表
 *   - 逻辑：先查询包含这些题目的答卷项，再过滤出属于该学生的答卷
 *
 * 步骤3：获取错题记录
 *   - 输入：答卷ID数组、过关状态、题目ID数组
 *   - 输出：错题记录数组，每条记录包含 {_id, questionId, answerValue, parse, questionType, difficulty, ...}
 *   - 数据来源：student_answer_item 表 + exam_question 表
 *   - 逻辑：查询这些答卷的错题，并合并题目的类型和难度信息
 *
 * 步骤4：获取答卷完整信息（用于查询错误归因）
 *   - 输入：答卷ID数组
 *   - 输出：答卷信息数组，每条包含 {_id, studentId, classId, courseId, questionPackId, ...}
 *   - 数据来源：student_answer 表
 *   - 目的：获取查询错误归因所需的参数
 *
 * 步骤5：获取错误归因ID映射
 *   - 输入：studentId, classId, courseId, questionPackId
 *   - 输出：题目ID到错误归因ID数组的映射 {questionId1: ['mistakePointId1', ...], ...}
 *   - 数据来源：mistake_point_question 表
 *
 * 步骤6：获取错误归因详情
 *   - 输入：所有错误归因ID数组
 *   - 输出：错误归因详情数组 [{_id, name, description, subject, ...}, ...]
 *   - 数据来源：mistake_point 表
 *
 * 步骤7：获取题目知识点
 *   - 输入：所有题目ID数组
 *   - 输出：题目ID到知识点数组的映射 {questionId1: ['知识点1', '知识点2'], ...}
 *   - 数据来源：exam_question 表
 *
 * 步骤8：获取重做图片
 *   - 输入：错题记录ID数组
 *   - 输出：错题记录ID到重做图片信息的映射 {itemId1: {redoImageUrl, ...}, ...}
 *   - 数据来源：student_question_ai_chat_session 表
 *
 * 步骤9：组装最终数据
 *   - 将错误归因、知识点、重做图片信息合并到每条错题记录中
 *   - 最终返回的每条记录包含完整信息，可直接用于前端展示
 */
export async function getMistakeRecordsAction({
  studentId,
  knowledgePoint,
  correctionStatus,
  searchText,
  questionType,
  difficulty
}) {
  try {
    // 步骤1：根据知识点和筛选条件查询题目ID
    const questionIds = await getQuestionIdsByKnowledgePoint({
      knowledgePoint: decodeURIComponent(knowledgePoint),
      searchText,
      questionType,
      difficulty
    });
    if (questionIds.length === 0) {
      return [];
    }

    // 步骤2：根据学生ID和题目ID列表获取答卷ID列表
    const studentAnswerIds = await getStudentAnswerIdsByStudentAndQuestions(studentId, questionIds);
    if (studentAnswerIds.length === 0) {
      return [];
    }

    // 步骤3：获取错题记录（包含题目类型和难度）
    const records = await getMistakeRecordsFromDB({
      studentAnswerIds,
      correctionStatus,
      questionIds
    });
    if (records.length === 0) {
      return [];
    }

    // 步骤4-9：并行获取所有需要的关联数据
    const studentAnswerItemIds = records.map(r => r._id);
    const recordQuestionIds = [...new Set(records.map(r => r.questionId))];
    const [redoImages, knowledgePointsMap] = await Promise.all([
    // 步骤8：获取重做图片
    getRedoImagesFromDB(studentAnswerItemIds),
    // 步骤7：获取题目知识点
    getQuestionKnowledgePointsFromDB(recordQuestionIds)]);

    // 步骤4：获取答卷信息以查询错误归因和提交时间
    const studentAnswers = await getStudentAnswersFromDB(studentAnswerIds);

    // 创建答卷ID到答卷信息的映射
    const answerMap = new Map();
    for (const answer of studentAnswers) {
      answerMap.set(answer._id, answer);
    }
    const mistakePointsByQuestion = {};

    // 如果有答卷，批量查询错误归因
    if (studentAnswers.length > 0) {
      // 为了简化，我们假设使用第一个答卷的信息来查询错误归因
      // 实际上每个答卷可能有不同的错误归因，但在当前场景下（同一知识点），通常是同一课程
      const answerInfo = studentAnswers[0];
      // 步骤5：获取错误归因ID映射
      const mistakePointIds = await getMistakePointIdsFromDB({
        studentId: answerInfo.studentId,
        classId: answerInfo.classId,
        courseId: answerInfo.courseId,
        questionPackId: answerInfo.questionPackId
      });

      // 步骤6：获取所有错误归因详情
      const allMistakePointIds = [...new Set(Object.values(mistakePointIds).flat())];
      const mistakePoints = await getMistakePointsFromDB(allMistakePointIds);

      // 创建错误归因ID到详情的映射
      const mistakePointsDetailsMap = new Map();
      mistakePoints.forEach(mp => {
        mistakePointsDetailsMap.set(mp._id, mp);
      });

      // 为每个题目组装错误归因详情
      Object.entries(mistakePointIds).forEach(([qId, mpIds]) => {
        mistakePointsByQuestion[qId] = mpIds.map(id => mistakePointsDetailsMap.get(id)).filter(mp => mp !== undefined);
      });
    }

    // 步骤9：组装最终数据 - 将所有信息合并到每条错题记录中
    const recordsWithAllInfo = records.map(record => {
      const answer = answerMap.get(record.studentAnswerId);
      return {
        ...record,
        // 答卷信息
        created: answer?.created,
        courseId: answer?.courseId,
        questionPackId: answer?.questionPackId,
        studentId: answer?.studentId,
        classId: answer?.classId,
        // 重做图片信息
        redoImageUrl: redoImages[record._id]?.redoImageUrl,
        redoImagePath: redoImages[record._id]?.redoImagePath,
        redoImageFileID: redoImages[record._id]?.redoImageFileID,
        // 错误归因信息
        mistakePoints: mistakePointsByQuestion[record.questionId] || [],
        // 知识点信息
        knowledgePoints: knowledgePointsMap[record.questionId] || []
      };
    });
    return recordsWithAllInfo;
  } catch (error) {
    console.error("获取错题记录失败:", error);
    throw new Error("获取错题记录失败");
  }
}

/**
 * 获取学生信息
 */
export async function getStudentInfoAction(studentId) {
  try {
    const student = await getStudentFromDB(studentId);
    return student;
  } catch (error) {
    console.error("获取学生信息失败:", error);
    throw new Error("获取学生信息失败");
  }
}

/**
 * 根据课程ID获取科目信息
 */
export async function getCourseSubjectAction(courseId) {
  try {
    return await getCourseSubjectFromDB(courseId);
  } catch (error) {
    console.error("获取课程科目失败:", error);
    return null;
  }
}

/**
 * 更新错题记录的典型错题标记
 */
export async function updateTypicalMistakeAction(itemId, isTypicalMistake) {
  try {
    await updateTypicalMistakeInDB(itemId, isTypicalMistake);
    return {
      success: true
    };
  } catch (error) {
    console.error("更新典型错题标记失败:", error);
    return {
      success: false,
      error: "更新失败"
    };
  }
}

/**
 * 更新错题记录信息
 */
export async function updateMistakeRecordAction({
  itemId,
  answerValue,
  parse,
  mistakePointIds,
  questionId,
  studentId,
  classId,
  courseId,
  questionPackId
}) {
  try {
    const {
      updateMistakePointQuestions
    } = await import("../../../../../../../../lib/collection/mistake");

    // 更新 StudentAnswerItemDoc
    await updateMistakeRecordInDB(itemId, answerValue, parse);

    // 获取题目集合的type
    const questionPackType = await getQuestionPackTypeFromDB(questionPackId);

    // 更新错误归因关联
    if (mistakePointIds && mistakePointIds.length > 0) {
      await updateMistakePointQuestions({
        mistakePointIds,
        questionId,
        studentId,
        classId,
        courseId,
        questionPackId,
        type: questionPackType
      });
    }
    return {
      success: true
    };
  } catch (error) {
    console.error("更新错题记录失败:", error);
    return {
      success: false,
      error: "更新失败"
    };
  }
}
