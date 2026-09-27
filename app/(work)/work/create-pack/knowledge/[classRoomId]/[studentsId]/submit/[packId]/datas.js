"use server";

import { getClassRoomById } from "../../../../../../../../../lib/collection/classroom.js";
import { getMistakePointsBySubject, getStudentMistakePoints } from "../../../../../../../../../lib/collection/mistake.js";
import { getStudentById } from "../../../../../../../../../lib/collection/student.js";
import { allDocs, command, getDoc, getOne } from "../../../../../../../../../lib/common/database.js";
import { saveStudentAnswerData } from "../../../../../../../../../lib/work/teacher/myStudent.js";

/**
 * 获取提交答卷页面所需的所有数据
 */
export async function getSubmitPageData(studentId, classRoomId, questionPackId) {
  try {
    // 获取基础数据
    const [student, classroom, questionPackRaw] = await Promise.all([getStudentById(studentId), getClassRoomById(classRoomId), getDoc("question_pack", questionPackId)]);
    const questionPack = questionPackRaw;
    if (!student) {
      return {
        success: false,
        error: "学生信息不存在"
      };
    }
    if (!classroom) {
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

    // 获取错误归因数据
    const mistakePoints = await getMistakePointsBySubject(questionPack.subject);

    // 获取题目数据
    let questions = [];
    if (questionPack.questionIds && questionPack.questionIds.length > 0) {
      const _ = command();
      const questionResults = await import("../../../../../../../../../lib/common/database").then(db => db.allDocs({
        c: "exam_question",
        match: {
          _id: _.in(questionPack.questionIds)
        }
      }));
      questions = questionResults;

      // 按照题集中的顺序排列题目
      questions = questionPack.questionIds.map(id => questions.find(q => q._id === id)).filter(Boolean);
    }
    return {
      success: true,
      data: {
        student,
        classroom,
        questionPack,
        mistakePoints,
        questions
      }
    };
  } catch (error) {
    console.error("获取提交答卷页面数据失败:", error);
    return {
      success: false,
      error: "获取页面数据失败"
    };
  }
}

/**
 * 获取学生已有的答卷数据
 */
export async function getExistingStudentAnswer(studentId, classRoomId, questionPackId) {
  try {
    // 获取班级信息以获得schoolId
    const classroom = await getClassRoomById(classRoomId);
    if (!classroom) {
      return {
        success: false,
        error: "班级信息不存在"
      };
    }

    // 查找学生答卷记录
    const studentAnswer = await getOne("student_answer", {
      studentId,
      classId: classRoomId,
      courseId: "",
      // 定制题集courseId为空
      questionPackId
    });
    if (!studentAnswer) {
      return {
        success: true,
        data: {
          hasExistingData: false,
          wrongQuestions: []
        }
      };
    }
    const studentAnswerId = studentAnswer._id;

    // 获取学生答卷项目
    const studentAnswerItems = await allDocs({
      c: "student_answer_item",
      match: {
        studentAnswerId
      }
    });

    // 获取学生的错误归因数据
    const mistakePointsResult = await getStudentMistakePoints({
      studentId,
      classId: classRoomId,
      courseId: "",
      // 定制题集courseId为空
      questionPackId
    });
    const questionMistakePoints = mistakePointsResult.success ? mistakePointsResult.data || {} : {};

    // 构建返回数据，包含图片信息和错误归因信息
    const wrongQuestions = studentAnswerItems.map(item => ({
      questionId: item.questionId,
      mistakePointIds: questionMistakePoints[item.questionId] || [],
      imagePath: item.imagePath,
      imageUrl: item.imageUrl,
      imageFileID: item.imageFileID
    }));
    return {
      success: true,
      data: {
        hasExistingData: wrongQuestions.length > 0,
        wrongQuestions
      }
    };
  } catch (error) {
    console.error("获取已有答卷数据失败:", error);
    return {
      success: false,
      error: "获取已有答卷数据失败"
    };
  }
}

/**
 * 保存学生答卷数据
 */
export async function saveCustomStudentAnswer(studentId, classRoomId, questionPackId, wrongQuestions) {
  try {
    const result = await saveStudentAnswerData({
      classId: classRoomId,
      courseId: "",
      // 定制题集没有课程ID
      questionPackId,
      studentId,
      wrongQuestions
    }, "知识点");
    if (result.success) {
      return {
        success: true
      };
    } else {
      return {
        success: false,
        error: result.error || "保存失败"
      };
    }
  } catch (error) {
    console.error("保存学生答卷失败:", error);
    return {
      success: false,
      error: "保存答卷失败"
    };
  }
}
