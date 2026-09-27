"use server";

import { assertClassRoomOwnership, getTeacherClassRoomById } from "../../../../../../../../lib/work/teacher/myClassroom.js";
import { getCurrentSchoolFromJWT } from "../../../../../../../../lib/work/teacher/mySchool.js";
import { getMyStudentById } from "../../../../../../../../lib/work/teacher/myStudent.js";
import { getQuestionsByIdsFromDB, getStudentAnswerItemsFromDB, getStudentAnswersFromDB } from "./datas.js";

/**
 * 获取学生信息用于显示在页面和PDF中
 */
export async function getStudentInfoForExportAction(classId, studentId) {
  try {
    // 验证班级权限
    await assertClassRoomOwnership(classId);

    // 获取学生信息
    const student = await getMyStudentById(studentId);
    if (!student) {
      throw new Error("学生不存在");
    }

    // 获取班级信息
    const classroom = await getTeacherClassRoomById(classId);
    if (!classroom) {
      throw new Error("班级不存在");
    }

    // 获取学校信息
    const school = await getCurrentSchoolFromJWT();
    if (!school) {
      throw new Error("学校信息不存在");
    }

    // 格式化当前时间
    const now = new Date();
    const generatedTime = now.toLocaleString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    });
    return {
      studentName: student.name,
      studentGender: student.gender,
      studentCode: student.studentCode,
      schoolName: school.name,
      className: classroom.name,
      generatedTime
    };
  } catch (error) {
    console.error("获取学生信息失败:", error);
    throw error;
  }
}

/**
 * 获取导出的错题数据
 */
export async function getWrongQuestionsForExportAction(classId, answerIds) {
  try {
    // 验证班级权限
    await assertClassRoomOwnership(classId);
    if (answerIds.length === 0) {
      return [];
    }

    // 1. 获取选中答卷的错题记录，按时间排序（最先做错的在前面）
    const studentAnswerItems = await getStudentAnswerItemsFromDB(answerIds);
    if (studentAnswerItems.length === 0) {
      return [];
    }

    // 2. 获取对应的题目信息
    const questionIds = studentAnswerItems.map(item => item.questionId);
    const questions = await getQuestionsByIdsFromDB(questionIds);

    // 3. 获取对应的答卷信息
    const answers = await getStudentAnswersFromDB(answerIds);

    // 4. 组装数据，按做错时间排序
    const result = [];

    // 为每个错题记录找到对应的题目和答卷信息
    for (const item of studentAnswerItems) {
      const question = questions.find(q => q._id === item.questionId);
      const answer = answers.find(a => a._id === item.studentAnswerId);
      if (question && answer) {
        result.push({
          studentAnswerItem: item,
          question,
          studentAnswer: answer
        });
      }
    }

    // 5. 按要求排序：首先按答卷时间升序，同一答卷内按题目在试卷中的顺序
    result.sort((a, b) => {
      // 首先按答卷创建时间排序（最早的在前面）
      const timeDiff = a.studentAnswer.created - b.studentAnswer.created;
      if (timeDiff !== 0) {
        return timeDiff;
      }

      // 如果是同一个答卷，按题目在试卷中的顺序排序（先按页码，再按题目序号）
      const pageA = a.question.pageNumber || 0;
      const pageB = b.question.pageNumber || 0;
      if (pageA !== pageB) {
        return pageA - pageB;
      }
      const questionA = a.question.questionNumber || 0;
      const questionB = b.question.questionNumber || 0;
      return questionA - questionB;
    });
    return result;
  } catch (error) {
    console.error("获取错题数据失败:", error);
    throw error;
  }
}
