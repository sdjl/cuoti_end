"use server";

import { getMistakePointsBySubject } from "../../../../../../lib/collection/mistake.js";
import { getMultiStudentAnswers, saveStudentAnswerData } from "../../../../../../lib/work/teacher/myStudent.js";
import { getQuestionsFromDB } from "./datas.js";


export async function getMistakePoints(subject) {
  try {
    const mistakePoints = await getMistakePointsBySubject(subject);
    return {
      success: true,
      data: mistakePoints
    };
  } catch (error) {
    console.error("获取错误归因失败:", error);
    return {
      success: false,
      data: [],
      error: "获取错误归因失败"
    };
  }
}


export async function getQuestionData(questionIds) {
  try {
    if (questionIds.length === 0) {
      return {
        success: true,
        data: []
      };
    }

    // 一次性查询所有题目数据
    const questions = await getQuestionsFromDB(questionIds);

    // 按照原始questionIds的顺序排序，保持数组长度一致，不存在的题目为null
    const sortedQuestions = questionIds.map(id => {
      const found = questions.find(q => q._id === id);
      return found || null;
    });
    return {
      success: true,
      data: sortedQuestions
    };
  } catch (error) {
    console.error("获取题目数据失败:", error);
    return {
      success: false,
      data: [],
      error: "获取题目数据失败"
    };
  }
}


export async function getExistingStudentAnswersAction(params) {
  return await getMultiStudentAnswers(params);
}


export async function saveStudentAnswer(answerData, type) {
  try {
    const result = await saveStudentAnswerData(answerData, type);
    if (result.success) {
      return {
        success: true,
        message: "成功保存学生答卷数据"
      };
    } else {
      return {
        success: false,
        error: result.error || "保存失败"
      };
    }
  } catch (error) {
    console.error("保存答卷失败:", error);
    return {
      success: false,
      error: "保存答卷失败"
    };
  }
}
