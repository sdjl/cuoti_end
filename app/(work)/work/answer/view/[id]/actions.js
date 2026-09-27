"use server";

import { getStudentMistakePoints } from "../../../../../../lib/collection/mistake.js";
import { getAnswerItemsFromDB, getClassRoomFromDB, getCourseFromDB, getMistakePointsFromDB, getQuestionPackFromDB, getQuestionsFromDB, getStudentAnswerFromDB, getStudentFromDB } from "./datas.js";

export async function getStudentAnswerViewData(studentAnswerId) {
  try {
    // 1. 获取学生答卷记录
    const studentAnswer = await getStudentAnswerFromDB(studentAnswerId);
    if (!studentAnswer) {
      return {
        success: false,
        error: "未找到该学生的答卷记录"
      };
    }

    // 2. 并行获取基础数据
    const [student, classRoom, course, questionPack] = await Promise.all([getStudentFromDB(studentAnswer.studentId), getClassRoomFromDB(studentAnswer.classId), studentAnswer.courseId ? getCourseFromDB(studentAnswer.courseId) : Promise.resolve(null), getQuestionPackFromDB(studentAnswer.questionPackId)]);

    // 检查必需数据
    if (!student) {
      return {
        success: false,
        error: "学生信息不存在"
      };
    }
    if (!classRoom) {
      return {
        success: false,
        error: "班级信息不存在"
      };
    }
    if (!questionPack) {
      return {
        success: false,
        error: "题集信息不存在"
      };
    }

    // 课程可能为null（错题集等情况）
    const mockCourse = {
      _id: "",
      schoolId: classRoom.schoolId,
      subject: questionPack.subject,
      name: "无关联课程",
      description: "",
      questionPackIds: [],
      created: Date.now(),
      status: "使用中"
    };

    // 3. 获取答案条目
    const answerItems = await getAnswerItemsFromDB(studentAnswer._id);

    // 4. 获取所有题目ID
    const allQuestionIds = new Set();
    answerItems.forEach(item => {
      allQuestionIds.add(item.questionId);
    });

    // 5. 并行获取错误归因数据和题目数据
    const [mistakePointsData, questions] = await Promise.all([
    // 获取学生的错误归因数据
    getStudentMistakePoints({
      studentId: studentAnswer.studentId,
      classId: studentAnswer.classId,
      courseId: studentAnswer.courseId,
      questionPackId: studentAnswer.questionPackId
    }),
    // 获取题目数据
    allQuestionIds.size > 0 ? getQuestionsFromDB(Array.from(allQuestionIds)) : Promise.resolve([])]);

    // 获取错误归因详情映射
    const questionMistakePoints = mistakePointsData.success ? mistakePointsData.data || {} : {};

    // 获取所有涉及的错误归因ID
    const allMistakePointIds = new Set();
    Object.values(questionMistakePoints).forEach(mistakePointIds => {
      mistakePointIds.forEach(id => allMistakePointIds.add(id));
    });

    // 获取错误归因详情
    const mistakePoints = allMistakePointIds.size > 0 ? getMistakePointsFromDB(Array.from(allMistakePointIds)) : Promise.resolve([]);

    // 6. 构建数据映射
    const mistakePointsMap = new Map();
    (await mistakePoints).forEach(point => {
      mistakePointsMap.set(point._id, point);
    });
    const questionsMap = new Map();
    questions.forEach(question => {
      questionsMap.set(question._id, question);
    });

    // 7. 组装答案条目数据，包含错误归因信息和题目信息
    const answerItemsWithDetails = answerItems.map(item => {
      const question = questionsMap.get(item.questionId);
      if (!question) {
        console.warn(`题目 ${item.questionId} 不存在`);
        return null;
      }

      // 获取该题目的错误归因ID列表
      const itemMistakePointIds = questionMistakePoints[item.questionId] || [];
      return {
        ...item,
        mistakePointIds: itemMistakePointIds,
        // 添加这个字段用于兼容
        mistakePoints: itemMistakePointIds.map(id => mistakePointsMap.get(id)).filter(point => point !== undefined),
        question
      };
    }).filter(item => item !== null);
    return {
      success: true,
      data: {
        student,
        classRoom,
        course: course || mockCourse,
        questionPack,
        studentAnswer,
        answerItems: answerItemsWithDetails
      }
    };
  } catch (error) {
    console.error("获取学生答卷查看数据失败:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "获取数据失败"
    };
  }
}
