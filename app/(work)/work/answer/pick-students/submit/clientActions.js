/**
 * 客户端业务逻辑处理函数
 *
 * 包含学生答卷提交页面的数据处理和业务逻辑：
 * - 会话数据验证和处理
 * - 学生答案数据初始化
 * - 数据状态管理辅助函数
 */


export function loadSessionData() {
  try {
    const savedData = sessionStorage.getItem("answerSubmitData");
    if (!savedData) {
      return {
        data: null,
        error: "未找到提交数据，请重新选择学生"
      };
    }
    const parsedData = JSON.parse(savedData);

    // 检查数据完整性
    if (!parsedData.classRoom || !parsedData.course || !parsedData.questionPack || !parsedData.selectedStudents?.length) {
      return {
        data: null,
        error: "提交数据不完整，请重新选择学生"
      };
    }

    // 检查数据是否过期（24小时）
    const now = Date.now();
    const dataAge = now - parsedData.timestamp;
    const oneDay = 24 * 60 * 60 * 1000;
    if (dataAge > oneDay) {
      return {
        data: null,
        error: "提交数据已过期，请重新选择学生"
      };
    }
    return {
      data: parsedData,
      error: ""
    };
  } catch (error) {
    console.error("解析提交数据失败:", error);
    return {
      data: null,
      error: "提交数据格式错误，请重新选择学生"
    };
  }
}


export function initializeStudentAnswers(selectedStudents) {
  return selectedStudents.map(student => ({
    studentId: student._id,
    wrongQuestions: [],
    isSaved: false
  }));
}


export function calculateStatistics(studentAnswers, totalStudents) {
  const savedStudentsCount = studentAnswers.filter(answer => answer.isSaved).length;
  const unsavedStudentsCount = totalStudents - savedStudentsCount;
  return {
    savedStudentsCount,
    unsavedStudentsCount
  };
}


export function updateStudentAnswer(studentAnswers, studentId, wrongQuestions) {
  return studentAnswers.map(answer => answer.studentId === studentId ? {
    ...answer,
    wrongQuestions,
    isSaved: true,
    savedAt: Date.now()
  } : answer);
}


export function saveSelectedStudentIds(selectedStudents) {
  const selectedIds = selectedStudents.map(s => s._id);
  sessionStorage.setItem("selectedStudentIds", JSON.stringify(selectedIds));
}


export function getQuestionIdByNumber(questionIds, questionNumber) {
  return questionIds[questionNumber - 1] || "";
}


export function getQuestionNumberById(questionIds, questionId) {
  return questionIds.indexOf(questionId) + 1;
}


export function convertQuestionNumbersToIds(questionNumbers, questionIds, existingWrongQuestions) {
  return questionNumbers.map(qNum => {
    const questionId = getQuestionIdByNumber(questionIds, qNum);
    const existing = existingWrongQuestions.find(q => q.questionId === questionId);
    return existing || {
      questionId,
      mistakePointIds: []
    };
  });
}


export function convertQuestionIdsToNumbers(wrongQuestions, questionIds) {
  return wrongQuestions.map(q => getQuestionNumberById(questionIds, q.questionId));
}
