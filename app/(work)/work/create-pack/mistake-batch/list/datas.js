"use server";

import { allDocs, command, removeDoc, removeMatch } from "../../../../../../lib/common/database.js";
import { getCurrentSchoolId } from "../../../../../../lib/work/teacher/mySchool.js";
/**
 * 获取当前学校的错题批量生成任务列表
 */
export async function getMistakeBatchTasks({
  keyword = "",
  status = "all",
  subject = "all"
}) {
  const schoolId = await getCurrentSchoolId();
  const _ = command();

  // 构建查询条件
  const match = {
    schoolId
  };

  // 状态筛选
  if (status !== "all") {
    match.status = status;
  }

  // 科目筛选
  if (subject !== "all") {
    match.subject = subject;
  }

  // 关键词搜索（任务名称或描述）
  if (keyword.trim()) {
    match.$or = [{
      taskName: new RegExp(keyword, "i")
    }, {
      taskDescription: new RegExp(keyword, "i")
    }];
  }

  // 查询任务列表
  const tasksResult = await allDocs({
    c: "mistake_batch_task",
    match,
    sort: {
      created: -1
    } // 按创建时间倒序
  });

  // 获取所有相关的班级ID和题集ID
  const allClassIds = new Set();
  const allQuestionPackIds = new Set();
  tasksResult.forEach(task => {
    const taskObj = task;
    taskObj.classIds?.forEach(id => allClassIds.add(id));
    taskObj.questionPackIds?.forEach(id => allQuestionPackIds.add(id));
  });

  // 批量查询班级信息
  const classesResult = allClassIds.size > 0 ? await allDocs({
    c: "classroom",
    match: {
      _id: _.in(Array.from(allClassIds))
    },
    project: {
      _id: 1,
      name: 1,
      grade: 1
    }
  }) : [];

  // 批量查询题集信息
  const questionPacksResult = allQuestionPackIds.size > 0 ? await allDocs({
    c: "question_pack",
    match: {
      _id: _.in(Array.from(allQuestionPackIds))
    },
    project: {
      _id: 1,
      name: 1
    }
  }) : [];

  // 批量查询所有任务的学生PDF状态（用于统计已完成和失败的学生数，以及题目总数）
  const taskIds = tasksResult.map(task => {
    const taskObj = task;
    return taskObj._id;
  });
  const studentPdfsResult = taskIds.length > 0 ? await allDocs({
    c: "mistake_batch_student_pdf",
    match: {
      taskId: _.in(taskIds)
    },
    only: "_id,taskId,status,mistakeCount"
  }) : [];

  // 统计每个任务的学生状态和题目总数
  const taskStudentStats = new Map();
  studentPdfsResult.forEach(pdf => {
    const pdfObj = pdf;
    if (!taskStudentStats.has(pdfObj.taskId)) {
      taskStudentStats.set(pdfObj.taskId, {
        completedStudents: 0,
        failedStudents: 0,
        totalMistakeCount: 0
      });
    }
    const stats = taskStudentStats.get(pdfObj.taskId);

    // 统计已完成的学生
    if (pdfObj.status === "completed") {
      stats.completedStudents++;
    }

    // 统计失败的学生（包括 failed 和 clean_failed）
    if (pdfObj.status === "failed" || pdfObj.status === "clean_failed") {
      stats.failedStudents++;
    }

    // 累加题目总数
    if (pdfObj.mistakeCount) {
      stats.totalMistakeCount += pdfObj.mistakeCount;
    }
  });

  // 创建映射表
  const classMap = new Map();
  classesResult.forEach(c => {
    const classObj = c;
    classMap.set(classObj._id, {
      _id: classObj._id,
      name: classObj.name,
      grade: classObj.grade
    });
  });
  const questionPackMap = new Map();
  questionPacksResult.forEach(qp => {
    const qpObj = qp;
    questionPackMap.set(qpObj._id, {
      _id: qpObj._id,
      name: qpObj.name
    });
  });

  // 组装数据
  const tasksWithDetails = tasksResult.map(task => {
    const taskObj = task;
    const classes = (taskObj.classIds || []).map(id => classMap.get(id)).filter(item => !!item);
    const questionPacks = (taskObj.questionPackIds || []).map(id => questionPackMap.get(id)).filter(item => !!item);

    // 获取该任务的学生统计数据
    const stats = taskStudentStats.get(taskObj._id) || {
      completedStudents: 0,
      failedStudents: 0,
      totalMistakeCount: 0
    };
    return {
      ...taskObj,
      classes,
      questionPacks,
      // 使用实际统计的数据覆盖数据库中的值
      completedStudents: stats.completedStudents,
      failedStudents: stats.failedStudents,
      totalMistakeCount: stats.totalMistakeCount
    };
  });
  return tasksWithDetails;
}

/**
 * 获取当前学校的科目列表
 */
export async function getSchoolSubjects() {
  const schoolId = await getCurrentSchoolId();
  const subjects = await allDocs({
    c: "mistake_batch_task",
    match: {
      schoolId
    },
    project: {
      subject: 1
    }
  });

  // 去重并过滤空值
  const uniqueSubjects = Array.from(new Set(subjects.map(doc => doc.subject).filter(subject => !!subject)));
  return uniqueSubjects;
}

/**
 * 将任务及其所有相关数据标记为等待清理状态
 */
export async function markTaskForCleaning(taskId) {
  const {
    updateMatch,
    updateDoc
  } = await import("../../../../../../lib/common/database");

  // 1. 更新所有学生PDF为等待清理状态
  await updateMatch("mistake_batch_student_pdf", {
    taskId
  }, {
    status: "waiting_clean",
    processingToken: ""
  });

  // 2. 更新所有班级任务为等待清理状态
  await updateMatch("mistake_batch_class_task", {
    taskId
  }, {
    status: "waiting_clean",
    processingToken: ""
  });

  // 3. 更新主任务为等待清理状态
  await updateDoc("mistake_batch_task", taskId, {
    status: "waiting_clean",
    processingToken: ""
  });
}

/**
 * 删除任务的数据库记录（包括所有关联数据）
 */
export async function deleteTaskData(taskId) {
  // 1. 批量删除所有学生PDF数据
  await removeMatch("mistake_batch_student_pdf", {
    taskId
  });

  // 2. 批量删除所有班级任务数据
  await removeMatch("mistake_batch_class_task", {
    taskId
  });

  // 3. 删除主任务数据
  await removeDoc("mistake_batch_task", taskId);
}

/**
 * 更新任务的基本信息
 */
export async function updateMistakeBatchTask(taskId, data) {
  const {
    updateDoc
  } = await import("../../../../../../lib/common/database");
  await updateDoc("mistake_batch_task", taskId, {
    taskName: data.taskName,
    taskDescription: data.taskDescription,
    allowStudentsDownloadAnswers: data.allowStudentsDownloadAnswers
  });
}
