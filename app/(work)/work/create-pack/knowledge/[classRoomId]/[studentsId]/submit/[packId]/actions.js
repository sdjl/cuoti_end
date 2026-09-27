"use server";

import { getExistingStudentAnswer, getSubmitPageData, saveCustomStudentAnswer } from "./datas.js";

/**
 * 获取提交答卷页面所需数据
 */
export async function getSubmitData(studentId, classRoomId, questionPackId) {
  return await getSubmitPageData(studentId, classRoomId, questionPackId);
}

/**
 * 获取学生已有答卷数据
 */
export async function getExistingAnswerData(studentId, classRoomId, questionPackId) {
  return await getExistingStudentAnswer(studentId, classRoomId, questionPackId);
}

/**
 * 保存学生答卷
 */
export async function saveStudentAnswerAction(studentId, classRoomId, questionPackId, wrongQuestions) {
  return await saveCustomStudentAnswer(studentId, classRoomId, questionPackId, wrongQuestions);
}
