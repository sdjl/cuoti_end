"use server";

import { allDocs, command, getDoc, updateDoc } from "../../../../../../../lib/common/database.js";
/**
 * 获取学生PDF数据用于打包下载
 */
export async function getStudentPdfForDownload(studentPdfId) {
  const studentPdf = await getDoc("mistake_batch_student_pdf", studentPdfId);
  if (!studentPdf) {
    return null;
  }
  const task = await getDoc("mistake_batch_task", studentPdf.taskId);
  if (!task) {
    return null;
  }
  return {
    studentPdf,
    task
  };
}

/**
 * 获取任务详情
 */
export async function getTaskDetail(taskId) {
  const task = await getDoc("mistake_batch_task", taskId);
  if (!task) return null;
  return task;
}

/**
 * 获取任务的班级任务列表
 */
export async function getTaskClassTasks(taskId) {
  const classTasks = await allDocs({
    c: "mistake_batch_class_task",
    match: {
      taskId
    },
    sort: {
      created: 1
    }
  });
  return classTasks;
}

/**
 * 获取单个班级任务
 */
export async function getClassTask(classTaskId) {
  const classTask = await allDocs({
    c: "mistake_batch_class_task",
    match: {
      _id: classTaskId
    }
  });
  return classTask.length > 0 ? classTask[0] : null;
}

/**
 * 获取任务的所有学生PDF记录
 */
export async function getTaskStudentPdfs(taskId) {
  const _ = command();

  // 获取所有学生PDF记录
  const studentPdfs = await allDocs({
    c: "mistake_batch_student_pdf",
    match: {
      taskId
    },
    sort: {
      created: -1
    }
  });
  if (studentPdfs.length === 0) {
    return [];
  }

  // 获取所有相关的班级ID、题集ID和学生答题记录ID
  const allClassIds = new Set();
  const allQuestionPackIds = new Set();
  const allStudentAnswerItemIds = new Set();
  studentPdfs.forEach(pdf => {
    allClassIds.add(pdf.classId);
    pdf.questionPackIds?.forEach(id => allQuestionPackIds.add(id));
    pdf.studentAnswerItemIds?.forEach(id => allStudentAnswerItemIds.add(id));
  });

  // 批量查询班级信息
  const classesResult = allClassIds.size > 0 ? await allDocs({
    c: "classroom",
    match: {
      _id: _.in(Array.from(allClassIds))
    },
    only: "_id,name,grade"
  }) : [];

  // 批量查询题集信息
  const questionPacksResult = allQuestionPackIds.size > 0 ? await allDocs({
    c: "question_pack",
    match: {
      _id: _.in(Array.from(allQuestionPackIds))
    },
    only: "_id,name"
  }) : [];

  // 批量查询学生答题记录（用于计算顽固错题和重做正确率）
  const studentAnswerItemsResult = allStudentAnswerItemIds.size > 0 ? await allDocs({
    c: "student_answer_item",
    match: {
      _id: _.in(Array.from(allStudentAnswerItemIds))
    },
    only: "_id,hasResubmittedAnswer,isCorrectedByMistakeAgain"
  }) : [];

  // 创建映射表
  const classMap = new Map();
  classesResult.forEach(c => {
    classMap.set(c._id, {
      name: c.name,
      grade: c.grade
    });
  });
  const questionPackMap = new Map();
  questionPacksResult.forEach(qp => {
    questionPackMap.set(qp._id, {
      _id: qp._id,
      name: qp.name
    });
  });

  // 创建学生答题记录映射表
  const studentAnswerItemMap = new Map();
  studentAnswerItemsResult.forEach(item => {
    studentAnswerItemMap.set(item._id, {
      hasResubmittedAnswer: item.hasResubmittedAnswer,
      isCorrectedByMistakeAgain: item.isCorrectedByMistakeAgain
    });
  });

  // 组装数据
  const result = studentPdfs.map(pdf => {
    const classInfo = classMap.get(pdf.classId);
    const questionPacks = (pdf.questionPackIds || []).map(id => questionPackMap.get(id)).filter(item => !!item);

    // 计算顽固错题数量和重做正确率
    let stubbornMistakeCount = 0;
    let redoCorrectCount = 0;
    let resubmittedCount = 0; // 已重做的题目总数
    const totalMistakeCount = pdf.studentAnswerItemIds?.length || 0;
    (pdf.studentAnswerItemIds || []).forEach(itemId => {
      const item = studentAnswerItemMap.get(itemId);
      if (item) {
        // 统计已重做的题目数
        if (item.hasResubmittedAnswer === true) {
          resubmittedCount++;
        }
        // 顽固错题：已重新提交但仍然做错
        if (item.hasResubmittedAnswer === true && item.isCorrectedByMistakeAgain === false) {
          stubbornMistakeCount++;
        }
        // 重做正确：已重新提交且做对了
        if (item.hasResubmittedAnswer === true && item.isCorrectedByMistakeAgain === true) {
          redoCorrectCount++;
        }
      }
    });

    // 计算重做正确率：重做正确数 / 总错题数
    // 只有当有题目重做过且总错题数>0时才计算，否则返回null
    const redoAccuracyRate = totalMistakeCount > 0 && resubmittedCount > 0 ? redoCorrectCount / totalMistakeCount : null;
    return {
      ...pdf,
      className: classInfo?.name || "未知班级",
      grade: classInfo?.grade,
      questionPacks,
      stubbornMistakeCount,
      redoAccuracyRate
    };
  });
  return result;
}

/**
 * 获取学生PDF记录（用于重新生成）
 */
export async function getStudentPdfForRegenerate(studentPdfId) {
  const studentPdf = await getDoc("mistake_batch_student_pdf", studentPdfId);
  if (!studentPdf) {
    return null;
  }
  const task = await getDoc("mistake_batch_task", studentPdf.taskId);
  return {
    studentPdf,
    task
  };
}

/**
 * 删除班级任务的ZIP文件
 */
export async function deleteClassTaskZipFile(taskId, classId) {
  const {
    allDocs,
    updateDoc,
    command
  } = await import("../../../../../../../lib/common/database");
  const {
    deleteFile
  } = await import("../../../../../../../lib/common/file");

  // 查找该班级的任务
  const classTasks = await allDocs({
    c: "mistake_batch_class_task",
    match: {
      taskId,
      classId
    },
    limit: 1,
    only: "_id,zipFile"
  });
  if (classTasks.length === 0) {
    return; // 班级任务不存在
  }
  const classTask = classTasks[0];

  // 删除ZIP文件
  if (classTask.zipFile?.fileID) {
    try {
      await deleteFile([classTask.zipFile.fileID]);
    } catch (error) {
      console.error("删除班级ZIP文件失败:", error);
    }
  }

  // 更新班级任务，清除ZIP文件信息并重置状态和重试次数
  await updateDoc("mistake_batch_class_task", classTask._id, {
    status: "waiting",
    processingToken: "",
    zipFile: command().remove(),
    startTime: command().remove(),
    completedTime: command().remove(),
    failureReason: command().remove(),
    retryCount: 0
  });
}

/**
 * 清除任务的全部打包文件信息
 */
export async function clearTaskAllZipFile(taskId) {
  await updateDoc("mistake_batch_task", taskId, {
    allZipFile: command().remove()
  });
}

/**
 * 将学生PDF状态改为等待中
 */
export async function resetStudentPdfToWaiting(studentPdfId) {
  await updateDoc("mistake_batch_student_pdf", studentPdfId, {
    status: "waiting",
    processingToken: "",
    mistakePdf: command().remove(),
    answerPdf: command().remove(),
    startTime: command().remove(),
    completedTime: command().remove(),
    failureReason: command().remove(),
    retryCount: 0
  });
}

/**
 * 批量重试失败的任务（将failed状态改为waiting）
 */
export async function retryAllFailedTasks(taskId) {
  const {
    updateMatch
  } = await import("../../../../../../../lib/common/database");

  // 更新学生PDF任务
  const studentPdfCount = await updateMatch("mistake_batch_student_pdf", {
    taskId,
    status: "failed"
  }, {
    status: "waiting",
    processingToken: "",
    mistakePdf: command().remove(),
    answerPdf: command().remove(),
    startTime: command().remove(),
    completedTime: command().remove(),
    failureReason: command().remove(),
    retryCount: 0
  });

  // 更新班级任务
  const classTaskCount = await updateMatch("mistake_batch_class_task", {
    taskId,
    status: "failed"
  }, {
    status: "waiting",
    processingToken: "",
    zipFile: command().remove(),
    startTime: command().remove(),
    completedTime: command().remove(),
    failureReason: command().remove(),
    retryCount: 0
  });

  // 更新主任务
  const taskCount = await updateMatch("mistake_batch_task", {
    _id: taskId,
    status: "failed"
  }, {
    status: "waiting",
    processingToken: "",
    allZipFile: command().remove(),
    startTime: command().remove(),
    completedTime: command().remove(),
    failureReason: command().remove(),
    retryCount: 0
  });
  return studentPdfCount + classTaskCount + taskCount;
}

/**
 * 批量重试清理失败的任务（将clean_failed状态改为waiting_clean）
 */
export async function retryAllCleanFailedTasks(taskId) {
  const {
    updateMatch
  } = await import("../../../../../../../lib/common/database");

  // 更新学生PDF任务
  const studentPdfCount = await updateMatch("mistake_batch_student_pdf", {
    taskId,
    status: "clean_failed"
  }, {
    status: "waiting_clean",
    processingToken: "",
    cleaningStartTime: command().remove(),
    cleaningCompletedTime: command().remove(),
    failureReason: command().remove(),
    retryCount: 0
  });

  // 更新班级任务
  const classTaskCount = await updateMatch("mistake_batch_class_task", {
    taskId,
    status: "clean_failed"
  }, {
    status: "waiting_clean",
    processingToken: "",
    cleaningStartTime: command().remove(),
    cleaningCompletedTime: command().remove(),
    failureReason: command().remove(),
    retryCount: 0
  });

  // 更新主任务
  const taskCount = await updateMatch("mistake_batch_task", {
    _id: taskId,
    status: "clean_failed"
  }, {
    status: "waiting_clean",
    processingToken: "",
    cleaningStartTime: command().remove(),
    cleaningCompletedTime: command().remove(),
    failureReason: command().remove(),
    retryCount: 0
  });
  return studentPdfCount + classTaskCount + taskCount;
}

/**
 * 统计任务中失败的数量
 */
export async function countFailedTasks(taskId) {
  const {
    count
  } = await import("../../../../../../../lib/common/database");

  // 统计 failed 状态的任务
  const [studentPdfFailed, classTaskFailed, taskFailed] = await Promise.all([count("mistake_batch_student_pdf", {
    taskId,
    status: "failed"
  }), count("mistake_batch_class_task", {
    taskId,
    status: "failed"
  }), count("mistake_batch_task", {
    _id: taskId,
    status: "failed"
  })]);

  // 统计 clean_failed 状态的任务
  const [studentPdfCleanFailed, classTaskCleanFailed, taskCleanFailed] = await Promise.all([count("mistake_batch_student_pdf", {
    taskId,
    status: "clean_failed"
  }), count("mistake_batch_class_task", {
    taskId,
    status: "clean_failed"
  }), count("mistake_batch_task", {
    _id: taskId,
    status: "clean_failed"
  })]);
  return {
    failedCount: studentPdfFailed + classTaskFailed + taskFailed,
    cleanFailedCount: studentPdfCleanFailed + classTaskCleanFailed + taskCleanFailed
  };
}

/**
 * 删除任务的全部打包文件并重置任务状态为waiting
 */
export async function deleteTaskAllZipFileAndResetStatus(taskId) {
  const {
    deleteFile
  } = await import("../../../../../../../lib/common/file");

  // 获取任务信息
  const task = await getDoc("mistake_batch_task", taskId);
  if (!task) {
    return;
  }

  // 删除全部打包文件
  if (task.allZipFile?.fileID) {
    try {
      await deleteFile([task.allZipFile.fileID]);
    } catch (error) {
      console.error("删除全部打包文件失败:", error);
    }
  }

  // 更新任务，清除全部打包文件信息并重置状态为waiting和重试次数
  await updateDoc("mistake_batch_task", taskId, {
    status: "waiting",
    processingToken: "",
    allZipFile: command().remove(),
    startTime: command().remove(),
    completedTime: command().remove(),
    failureReason: command().remove(),
    retryCount: 0
  });
}

/**
 * 批量重新生成班级所有学生的PDF文件
 */
export async function regenerateClassAllStudentsPdf(classTaskId) {
  const {
    deleteFile
  } = await import("../../../../../../../lib/common/file");
  const {
    updateMatch
  } = await import("../../../../../../../lib/common/database");

  // 1. 获取班级任务信息
  const classTask = await getDoc("mistake_batch_class_task", classTaskId);
  if (!classTask) {
    throw new Error("班级任务不存在");
  }

  // 2. 获取该班级的所有学生PDF数据
  const studentPdfs = await allDocs({
    c: "mistake_batch_student_pdf",
    match: {
      taskId: classTask.taskId,
      classId: classTask.classId
    },
    only: "_id,mistakePdf,answerPdf"
  });

  // 3. 收集所有需要删除的文件ID
  const fileIdsToDelete = [];
  for (const pdf of studentPdfs) {
    if (pdf.mistakePdf?.fileID) {
      fileIdsToDelete.push(pdf.mistakePdf.fileID);
    }
    if (pdf.answerPdf?.fileID) {
      fileIdsToDelete.push(pdf.answerPdf.fileID);
    }
  }

  // 4. 删除所有学生PDF文件
  if (fileIdsToDelete.length > 0) {
    try {
      await deleteFile(fileIdsToDelete);
    } catch (error) {
      console.error("删除学生PDF文件失败:", error);
    }
  }

  // 5. 批量更新所有学生PDF状态为waiting
  await updateMatch("mistake_batch_student_pdf", {
    taskId: classTask.taskId,
    classId: classTask.classId
  }, {
    status: "waiting",
    processingToken: "",
    mistakePdf: command().remove(),
    answerPdf: command().remove(),
    startTime: command().remove(),
    completedTime: command().remove(),
    failureReason: command().remove(),
    retryCount: 0
  });

  // 6. 删除班级ZIP文件并重置班级任务状态
  await deleteClassTaskZipFile(classTask.taskId, classTask.classId);

  // 7. 删除任务全部打包文件并重置任务状态
  await deleteTaskAllZipFileAndResetStatus(classTask.taskId);
}
