"use server";

import { getCurrentSchoolId } from "../../../../../../lib/work/teacher/mySchool.js";
import { getBatchMistakePointsFromDB, getClassroomsFromDB, getCourseSubjectFromDB, getMistakeItemsByQuestion, getQuestionDetailsFromDB, getQuestionInfoFromDB, getQuestionPackTypeFromDB, getRedoImagesFromDB, getSchoolClassroomIds, getStudentAnswersByClassIds, getStudentsFromDB, updateMistakeRecordInDB, updateTypicalMistakeInDB } from "./datas.js";

/**
 * 获取某个题目在当前校园的所有错题记录
 *
 * @description
 * 此函数执行以下步骤来获取和组装错题记录数据：
 *
 * 步骤1：获取当前校园ID
 *   - 从JWT中获取当前用户所属的校园ID
 *
 * 步骤2：查询当前校园的所有班级ID
 *   - 输入：校园ID
 *   - 输出：班级ID数组 ['classId1', 'classId2', ...]
 *   - 数据来源：classroom 表
 *
 * 步骤3：查询这些班级的所有答卷
 *   - 输入：班级ID数组
 *   - 输出：答卷数组，每条包含 {_id, studentId, classId, courseId, questionPackId, created, ...}
 *   - 数据来源：student_answer 表
 *
 * 步骤4：查询指定题目的所有错题记录
 *   - 输入：答卷ID数组、题目ID
 *   - 输出：错题记录数组 [{_id, studentAnswerId, questionId, answerValue, parse, imageUrl, ...}]
 *   - 数据来源：student_answer_item 表
 *
 * 步骤5：获取重做图片
 *   - 输入：错题记录ID数组
 *   - 输出：itemId到重做图片信息的映射 {itemId1: {redoImageUrl, ...}, ...}
 *   - 数据来源：student_question_ai_chat_session 表
 *
 * 步骤6：获取学生信息
 *   - 输入：学生ID数组
 *   - 输出：studentId到学生信息的映射 {studentId1: {_id, name, ...}, ...}
 *   - 数据来源：student 表
 *
 * 步骤7：获取班级信息
 *   - 输入：班级ID数组（从答卷中提取）
 *   - 输出：classId到班级信息的映射 {classId1: {_id, name, ...}, ...}
 *   - 数据来源：classroom 表
 *
 * 步骤8：获取错误归因
 *   - 对每个答卷，根据其 studentId, classId, courseId, questionPackId 查询错误归因
 *   - 输入：答卷信息
 *   - 输出：questionId到错误归因详情数组的映射
 *   - 数据来源：mistake_point_question 表 + mistake_point 表
 *
 * 步骤9：组装最终数据
 *   - 将错题记录与对应的答卷、学生、班级、重做图片、错误归因信息合并
 *   - 按答卷创建时间逆序排序
 *   - 返回完整的错题记录数组供前端展示
 */
export async function getQuestionMistakeRecordsAction(questionId, correctionStatus) {
  try {
    // 步骤1：获取当前校园ID
    const schoolId = await getCurrentSchoolId();

    // 步骤2：查询当前校园的所有班级ID
    const classIds = await getSchoolClassroomIds(schoolId);
    if (classIds.length === 0) {
      return [];
    }

    // 步骤3：查询这些班级的所有答卷
    const studentAnswers = await getStudentAnswersByClassIds(classIds);
    if (studentAnswers.length === 0) {
      return [];
    }
    const studentAnswerIds = studentAnswers.map(a => a._id);

    // 步骤4：查询指定题目的所有错题记录
    const mistakeItems = await getMistakeItemsByQuestion({
      studentAnswerIds,
      questionId,
      correctionStatus
    });
    if (mistakeItems.length === 0) {
      return [];
    }

    // 创建答卷ID到答卷信息的映射，用于后续关联
    const answerMap = new Map();
    for (const answer of studentAnswers) {
      answerMap.set(answer._id, answer);
    }

    // 步骤5-7：获取所有需要的关联数据
    const mistakeItemIds = mistakeItems.map(item => item._id);
    const studentIds = [...new Set(studentAnswers.map(a => a.studentId))];
    const answerClassIds = [...new Set(studentAnswers.map(a => a.classId))];

    // 获取所有唯一的答卷配置（用于批量查询错误归因）
    const uniqueAnswerConfigs = [];
    const configKeys = new Set();
    for (const answer of studentAnswers) {
      const key = `${answer.studentId}_${answer.classId}_${answer.courseId || "null"}_${answer.questionPackId}`;
      if (!configKeys.has(key)) {
        configKeys.add(key);
        uniqueAnswerConfigs.push({
          studentId: answer.studentId,
          classId: answer.classId,
          courseId: answer.courseId || null,
          questionPackId: answer.questionPackId
        });
      }
    }

    // 步骤5-8：并行获取基础数据和错误归因
    // 注意：这里的并行查询是安全的，因为每个查询都只调用一次数据库
    const [redoImages, students, classrooms, allMistakePointsByConfig] = await Promise.all([
    // 步骤5：获取重做图片（单次查询）
    getRedoImagesFromDB(mistakeItemIds),
    // 步骤6：获取学生信息（单次查询）
    getStudentsFromDB(studentIds),
    // 步骤7：获取班级信息（单次查询）
    getClassroomsFromDB(answerClassIds),
    // 步骤8：批量获取所有配置的错误归因（内部最多2次查询：mistake_point_question + mistake_point）
    getBatchMistakePointsFromDB(uniqueAnswerConfigs)]);

    // 为每个答卷关联错误归因
    const mistakePointsByAnswer = {};
    for (const answer of studentAnswers) {
      const configKey = `${answer.studentId}_${answer.classId}_${answer.courseId || "null"}_${answer.questionPackId}`;
      mistakePointsByAnswer[answer._id] = allMistakePointsByConfig[configKey] || {};
    }

    // 步骤9：获取题目详情（知识点、难度、题目类型）
    const questionDetails = await getQuestionDetailsFromDB(questionId);

    // 步骤10：组装最终数据
    const recordsWithAllInfo = mistakeItems.map(item => {
      const answer = answerMap.get(item.studentAnswerId);
      const student = answer ? students[answer.studentId] : undefined;
      const classroom = answer ? classrooms[answer.classId] : undefined;
      const mistakePoints = answer ? mistakePointsByAnswer[answer._id]?.[questionId] || [] : [];
      return {
        ...item,
        // 答卷信息
        created: answer?.created,
        courseId: answer?.courseId,
        questionPackId: answer?.questionPackId,
        // 学生信息
        studentName: student?.name,
        studentId: answer?.studentId,
        // 班级信息
        className: classroom?.name,
        classId: answer?.classId,
        // 重做图片信息
        redoImageUrl: redoImages[item._id]?.redoImageUrl,
        redoImagePath: redoImages[item._id]?.redoImagePath,
        redoImageFileID: redoImages[item._id]?.redoImageFileID,
        // 错误归因信息
        mistakePoints,
        // 题目详情
        knowledgePoints: questionDetails.knowledgePoints || [],
        difficulty: questionDetails.difficulty || "未知",
        questionType: item.questionType || questionDetails.questionType || "未知"
      };
    });

    // 按答卷创建时间逆序排序
    recordsWithAllInfo.sort((a, b) => {
      const timeA = a.created || 0;
      const timeB = b.created || 0;
      return timeB - timeA;
    });
    return recordsWithAllInfo;
  } catch (error) {
    console.error("获取题目错题记录失败:", error);
    throw new Error("获取题目错题记录失败");
  }
}

/**
 * 获取题目信息
 */
export async function getQuestionInfoAction(questionId) {
  try {
    return await getQuestionInfoFromDB(questionId);
  } catch (error) {
    console.error("获取题目信息失败:", error);
    throw new Error("获取题目信息失败");
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
    } = await import("../../../../../../lib/collection/mistake");

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
