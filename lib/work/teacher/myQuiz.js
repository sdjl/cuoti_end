"use server";

import { createQuiz, deleteQuiz, getQuizById, getQuizzes, getQuizzesCount, updateQuiz } from "../../collection/quiz.js";
import { getCurrentSchoolGrades, getCurrentSchoolId } from "./mySchool.js";


export async function getMyQuizzes({
  pageNum = 0,
  pageSize = 20,
  keyword = "",
  subject = "all",
  grade = "all",
  status = "all",
  teamEnabled = "all",
  activityStatus = "all"
} = {}) {
  const schoolId = await getCurrentSchoolId();
  return getQuizzes({
    pageNum,
    pageSize,
    keyword,
    schoolId,
    subject,
    grade,
    status,
    teamEnabled,
    activityStatus
  });
}


export async function getMyQuizzesCount({
  keyword = "",
  subject = "all",
  grade = "all",
  status = "all",
  teamEnabled = "all",
  activityStatus = "all"
} = {}) {
  const schoolId = await getCurrentSchoolId();
  return getQuizzesCount({
    keyword,
    schoolId,
    subject,
    grade,
    status,
    teamEnabled,
    activityStatus
  });
}


export async function getMyQuizById(quizId) {
  const schoolId = await getCurrentSchoolId();
  const quiz = await getQuizById(quizId);
  if (!quiz || quiz.schoolId !== schoolId) {
    return null;
  }
  return quiz;
}


export async function createMyQuiz(quizData) {
  const schoolId = await getCurrentSchoolId();
  const data = {
    ...quizData,
    schoolId
  };
  return createQuiz(data);
}


export async function updateMyQuiz(quizId, quizData) {
  const quiz = await getMyQuizById(quizId);
  if (!quiz) {
    throw new Error("口述核心知识点不存在或不属于当前校园");
  }
  return updateQuiz(quizId, quizData);
}


export async function deleteMyQuiz(quizId) {
  const quiz = await getMyQuizById(quizId);
  if (!quiz) {
    throw new Error("口述核心知识点不存在或不属于当前校园");
  }
  return deleteQuiz(quizId);
}


export async function getMySchoolGrades() {
  return getCurrentSchoolGrades();
}
