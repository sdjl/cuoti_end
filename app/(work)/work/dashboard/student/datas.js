"use server";

/**
 * 学生学情看板的数据库操作函数
 *
 * 注意：此文件专注于数据库操作，所有从 lib/common/database 导入的函数都在这个文件中导入。
 * 业务逻辑应该放在 actions.ts 文件中。
 *
 * 此页面查看的是某个学生在所有班级中的某个科目的综合数据，
 * 而不是这个学生在某个班级中的数据。
 */
import { allDocs, command } from "../../../../../lib/common/database.js";

export async function searchStudents(searchTerm, schoolId) {
  if (!searchTerm || searchTerm.trim().length === 0) {
    return [];
  }
  const _ = command();
  const trimmedTerm = searchTerm.trim();

  // 构建查询条件：使用正则表达式搜索姓名或学生编号
  const orCondition = _.or({
    name: new RegExp(trimmedTerm, "i")
  }, {
    studentCode: new RegExp(trimmedTerm, "i")
  });

  // 必须同时满足学校条件和搜索条件
  const finalMatch = _.and(orCondition, {
    schoolId
  });

  // 查询学生数据
  const students = await allDocs({
    c: "student",
    match: finalMatch,
    only: "_id,name,studentCode,schoolId,gender",
    sort: {
      name: 1
    },
    limit: 20 // 限制返回最多20条结果
  });
  return students;
}

// 注意：其他组件的数据暂时使用 mockData.ts 中的假数据
// 此文件只保留已实现的数据库查询函数


export async function getStudentAllAnswers(studentId) {
  // 查询学生的所有答卷
  const answers = await allDocs({
    c: "student_answer",
    match: {
      studentId
    },
    sort: {
      created: -1
    }
  });
  return answers;
}


export async function getQuestionPacksByIds(questionPackIds) {
  if (questionPackIds.length === 0) {
    return [];
  }
  const _ = command();
  const questionPacks = await allDocs({
    c: "question_pack",
    match: {
      _id: _.in(questionPackIds)
    },
    only: "_id,subject,name,type"
  });
  return questionPacks;
}


export async function getStudentAnswerItemsByAnswerIds(answerIds) {
  if (answerIds.length === 0) {
    return [];
  }
  const _ = command();
  const items = await allDocs({
    c: "student_answer_item",
    match: {
      studentAnswerId: _.in(answerIds)
    }
  });
  return items;
}


export async function getQuestionsByIds(questionIds) {
  if (questionIds.length === 0) {
    return [];
  }
  const _ = command();
  const questions = await allDocs({
    c: "exam_question",
    match: {
      _id: _.in(questionIds)
    },
    only: "_id,knowledgePoints,difficulty"
  });
  return questions;
}


export async function getStudentRecentAnswersByType(studentId, type, limit = 5) {
  const _ = command();

  // 1. 先获取该类型的所有题集ID
  const questionPacks = await allDocs({
    c: "question_pack",
    match: {
      type
    },
    only: "_id"
  });
  if (questionPacks.length === 0) {
    return [];
  }
  const questionPackIds = questionPacks.map(pack => pack._id);

  // 2. 查询学生在这些题集中的答卷，按创建时间倒序，限制数量
  const answers = await allDocs({
    c: "student_answer",
    match: {
      studentId,
      questionPackId: _.in(questionPackIds)
    },
    sort: {
      created: -1
    },
    limit
  });
  if (answers.length === 0) {
    return [];
  }

  // 3. 获取每个答卷的错题数量
  const answerIds = answers.map(a => a._id);
  const answerItems = await allDocs({
    c: "student_answer_item",
    match: {
      studentAnswerId: _.in(answerIds)
    },
    only: "studentAnswerId"
  });

  // 4. 统计每个答卷的错题数量
  const questionCountMap = new Map();
  for (const item of answerItems) {
    const count = questionCountMap.get(item.studentAnswerId) || 0;
    questionCountMap.set(item.studentAnswerId, count + 1);
  }

  // 5. 组装结果
  return answers.map(answer => ({
    ...answer,
    questionCount: questionCountMap.get(answer._id) || 0
  }));
}


export async function getClassroomsByIds(classIds) {
  if (classIds.length === 0) {
    return [];
  }
  const _ = command();
  const classrooms = await allDocs({
    c: "classroom",
    match: {
      _id: _.in(classIds)
    },
    only: "_id,name"
  });
  return classrooms;
}


export async function getCoursesByIds(courseIds) {
  if (courseIds.length === 0) {
    return [];
  }
  const _ = command();
  const courses = await allDocs({
    c: "course",
    match: {
      _id: _.in(courseIds)
    },
    only: "_id,name"
  });
  return courses;
}


export async function getStudentClassrooms(studentId) {
  // 1. 查询学生与班级的所有关联关系（包括在读和退学）
  const studentClasses = await allDocs({
    c: "student_class",
    match: {
      studentId
    },
    only: "classRoomId,status"
  });
  if (studentClasses.length === 0) {
    return [];
  }

  // 2. 获取所有班级ID
  const classroomIds = studentClasses.map(sc => sc.classRoomId);
  const _ = command();

  // 3. 查询班级信息
  const classrooms = await allDocs({
    c: "classroom",
    match: {
      _id: _.in(classroomIds)
    },
    only: "_id,name,grade"
  });

  // 4. 创建班级ID到状态的映射
  const classStatusMap = new Map();
  for (const sc of studentClasses) {
    classStatusMap.set(sc.classRoomId, sc.status);
  }

  // 5. 返回包含状态的班级信息
  return classrooms.map(classroom => ({
    ...classroom,
    status: classStatusMap.get(classroom._id) || "在读"
  }));
}


export async function getStudentAllAnswersForSubject(studentId, subject) {
  // 1. 先查询该科目的所有题集
  const questionPacks = await allDocs({
    c: "question_pack",
    match: {
      subject
    },
    only: "_id"
  });
  if (questionPacks.length === 0) {
    return [];
  }
  const _ = command();
  const questionPackIds = questionPacks.map(pack => pack._id);

  // 2. 查询学生在这些题集中的所有答卷
  const answers = await allDocs({
    c: "student_answer",
    match: {
      studentId,
      questionPackId: _.in(questionPackIds)
    },
    sort: {
      created: -1
    }
  });
  return answers;
}


export async function getStudentProblemQuestions(studentId, subject) {
  const problemQuestions = await allDocs({
    c: "problem_question",
    match: {
      studentId,
      subject
    }
  });
  return problemQuestions;
}


export async function getStudentMistakePointQuestions(studentId, subject) {
  // 1. 先查询该科目的所有错误归因
  const mistakePoints = await allDocs({
    c: "mistake_point",
    match: {
      subject
    },
    only: "_id"
  });
  if (mistakePoints.length === 0) {
    return [];
  }
  const _ = command();
  const mistakePointIds = mistakePoints.map(mp => mp._id);

  // 2. 查询学生在这些错误归因下的所有关联记录
  const mistakePointQuestions = await allDocs({
    c: "mistake_point_question",
    match: {
      studentId,
      mistakePointId: _.in(mistakePointIds)
    }
  });
  return mistakePointQuestions;
}


export async function getMistakePointsByIds(mistakePointIds) {
  if (mistakePointIds.length === 0) {
    return [];
  }
  const _ = command();
  const mistakePoints = await allDocs({
    c: "mistake_point",
    match: {
      _id: _.in(mistakePointIds)
    }
  });
  return mistakePoints;
}


export async function getStudentMistakeBatchPdfs(studentId, subject, limit) {
  // 1. 先查询该科目的所有任务
  const tasks = await allDocs({
    c: "mistake_batch_task",
    match: {
      subject
    },
    only: "_id"
  });
  if (tasks.length === 0) {
    return [];
  }
  const _ = command();
  const taskIds = tasks.map(task => task._id);

  // 2. 查询学生在这些任务下的PDF记录
  const pdfRecords = await allDocs({
    c: "mistake_batch_student_pdf",
    match: {
      studentId,
      taskId: _.in(taskIds)
    },
    sort: {
      created: -1
    },
    limit
  });
  return pdfRecords;
}


export async function getStudentAllMistakeBatchPdfs(studentId, subject) {
  // 1. 先查询该科目的所有任务
  const tasks = await allDocs({
    c: "mistake_batch_task",
    match: {
      subject
    },
    only: "_id"
  });
  if (tasks.length === 0) {
    return [];
  }
  const _ = command();
  const taskIds = tasks.map(task => task._id);

  // 2. 查询学生在这些任务下的所有PDF记录
  const pdfRecords = await allDocs({
    c: "mistake_batch_student_pdf",
    match: {
      studentId,
      taskId: _.in(taskIds)
    }
  });
  return pdfRecords;
}


export async function getMistakeBatchTasksByIds(taskIds) {
  if (taskIds.length === 0) {
    return [];
  }
  const _ = command();
  const tasks = await allDocs({
    c: "mistake_batch_task",
    match: {
      _id: _.in(taskIds)
    }
  });
  return tasks;
}


export async function getStudentKnowledgeQuestionPacks(studentId, subject, limit) {
  const questionPacks = await allDocs({
    c: "question_pack",
    match: {
      studentId,
      subject,
      type: "知识点"
    },
    sort: {
      created: -1
    },
    limit
  });
  return questionPacks;
}


export async function getQuestionPacksFullInfoByIds(questionPackIds) {
  if (questionPackIds.length === 0) {
    return [];
  }
  const _ = command();
  const questionPacks = await allDocs({
    c: "question_pack",
    match: {
      _id: _.in(questionPackIds)
    },
    only: "_id,questionIds"
  });
  return questionPacks;
}


export async function getStudentHonorApplications(studentId, limit) {
  const applications = await allDocs({
    c: "honor_application",
    match: {
      studentId
    },
    sort: {
      created: -1
    },
    limit
  });
  return applications;
}


export async function getStudentLotteryRecords(studentId, limit) {
  const records = await allDocs({
    c: "lottery_record",
    match: {
      studentId,
      isWin: true // 仅查询中奖记录
    },
    sort: {
      created: -1
    },
    limit
  });
  return records;
}


export async function getStudentStudyRecords(studentId, limit) {
  const records = await allDocs({
    c: "study_record",
    match: {
      studentId
    },
    sort: {
      created: -1
    },
    limit
  });
  return records;
}


export async function getStudentPointsHistory(studentId, limit) {
  const records = await allDocs({
    c: "student_growth",
    match: {
      studentId
    },
    sort: {
      created: -1
    },
    limit
  });
  return records;
}


export async function getStudentExchangeRecords(studentId, limit) {
  const records = await allDocs({
    c: "points_exchange",
    match: {
      studentId
    },
    sort: {
      created: -1
    },
    limit
  });
  return records;
}


export async function getWxUsersByIds(userIds) {
  if (userIds.length === 0) {
    return [];
  }
  const _ = command();
  const users = await allDocs({
    c: "wx_user",
    match: {
      _id: _.in(userIds)
    }
  });
  return users;
}
