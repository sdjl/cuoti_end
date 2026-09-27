"use server";

import { deleteAnswersPdfData, deleteQuestionPackData, deleteQuestionsPdfData, deleteStudentAnswerData, generateAnswersPdfData, generateQuestionsPdfData, getStudentAndClassroomData, getStudentCustomQuestionPacks } from "./datas.js";

/**
 * 获取学生和班级信息
 */
export async function getStudentAndClassroomInfo(studentId, classRoomId) {
  return await getStudentAndClassroomData(studentId, classRoomId);
}

/**
 * 获取学生的定制题集列表
 */
export async function getCustomQuestionPackList(studentId, classRoomId, subjectFilter, hasAnswerFilter, searchTerm, hasQuestionsPdfFilter, hasAnswersPdfFilter, isAnalysisCompletedFilter) {
  return await getStudentCustomQuestionPacks(studentId, classRoomId, subjectFilter, hasAnswerFilter, searchTerm, hasQuestionsPdfFilter, hasAnswersPdfFilter, isAnalysisCompletedFilter);
}

/**
 * 删除题集
 */
export async function deleteQuestionPack(questionPackId) {
  return await deleteQuestionPackData(questionPackId);
}

/**
 * 删除学生答卷
 */
export async function deleteStudentAnswer(studentId, classRoomId, questionPackId) {
  return await deleteStudentAnswerData(studentId, classRoomId, questionPackId);
}

/**
 * 生成题目PDF
 */
export async function generateQuestionsPdf(studentId, classRoomId, questionPackId) {
  return await generateQuestionsPdfData(studentId, classRoomId, questionPackId);
}

/**
 * 生成答案PDF
 */
export async function generateAnswersPdf(studentId, classRoomId, questionPackId) {
  return await generateAnswersPdfData(studentId, classRoomId, questionPackId);
}

/**
 * 删除题目PDF
 */
export async function deleteQuestionsPdf(questionPackId) {
  return await deleteQuestionsPdfData(questionPackId);
}

/**
 * 删除答案PDF
 */
export async function deleteAnswersPdf(questionPackId) {
  return await deleteAnswersPdfData(questionPackId);
}

/**
 * 更新题集基本信息
 */
export async function updateQuestionPack(questionPackId, updateData) {
  try {
    const {
      updateQuestionPackInDB
    } = await import("./datas");
    const result = await updateQuestionPackInDB(questionPackId, updateData.name, updateData.description);
    if (result) {
      return {
        success: true
      };
    } else {
      return {
        success: false,
        error: "更新失败"
      };
    }
  } catch (error) {
    console.error("更新题集失败:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "未知错误"
    };
  }
}
