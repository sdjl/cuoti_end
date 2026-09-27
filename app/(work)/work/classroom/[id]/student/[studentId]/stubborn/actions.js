"use server";

import { getCourseSubjectFromDB, getMistakePointIdsFromDB, getMistakePointsFromDB, getMistakeRecordsFromDB, getQuestionIdsByFilters, getQuestionKnowledgePointsFromDB, getQuestionPackTypeFromDB, getRedoImagesFromDB, getStudentAnswerIdsByClassId, getStudentAnswersFromDB, getStudentClassRoomsFromDB, getStudentFromDB, updateMistakeRecordInDB, updateTypicalMistakeInDB } from "./datas.js";

/**
 * 获取学生在某个班级的顽固错题记录
 */
export async function getMistakeRecordsAction({
  studentId,
  classId,
  correctionStatus,
  searchText,
  questionType,
  difficulty
}) {
  try {
    // 步骤1：如果有题目筛选条件，先根据条件查询题目ID
    const questionIds = await getQuestionIdsByFilters({
      searchText,
      questionType,
      difficulty
    });

    // 步骤2：根据学生ID、班级ID和题目ID获取答卷ID列表
    const studentAnswerIds = await getStudentAnswerIdsByClassId({
      studentId,
      classId,
      questionIds: questionIds.length > 0 ? questionIds : undefined
    });
    if (studentAnswerIds.length === 0) {
      return [];
    }

    // 步骤3：获取错题记录（包含题目类型和难度）
    const records = await getMistakeRecordsFromDB({
      studentAnswerIds,
      correctionStatus,
      questionIds: questionIds.length > 0 ? questionIds : undefined
    });
    if (records.length === 0) {
      return [];
    }

    // 步骤3-6：并行获取所有需要的关联数据
    const studentAnswerItemIds = records.map(r => r._id);
    const recordQuestionIds = [...new Set(records.map(r => r.questionId))];
    const [redoImages, knowledgePointsMap] = await Promise.all([
    // 获取重做图片
    getRedoImagesFromDB(studentAnswerItemIds),
    // 获取题目知识点
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
      // 实际上每个答卷可能有不同的错误归因，但在当前场景下（同一班级），通常是同一课程
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

    // 步骤7：组装最终数据 - 将所有信息合并到每条错题记录中
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
 * 获取学生的所有班级
 */
export async function getStudentClassRoomsAction(studentId) {
  try {
    const classRooms = await getStudentClassRoomsFromDB(studentId);
    return classRooms;
  } catch (error) {
    console.error("获取学生班级失败:", error);
    throw new Error("获取学生班级失败");
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
