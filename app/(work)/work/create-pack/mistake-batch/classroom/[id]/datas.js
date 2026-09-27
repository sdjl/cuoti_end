"use server";

import { allDocs, command, getDoc } from "../../../../../../../lib/common/database.js";
/**
 * 从数据库获取班级信息
 */
export async function getClassroomInfoFromDB(schoolId, classId) {
  const classroom = await getDoc("classroom", classId, {
    only: "_id,name,schoolId"
  });
  if (!classroom) {
    throw new Error("班级不存在");
  }
  const classroomDoc = classroom;

  // 验证班级是否属于当前校园
  if (classroomDoc.schoolId !== schoolId) {
    throw new Error("无权访问该班级");
  }
  return {
    _id: classroomDoc._id,
    name: classroomDoc.name
  };
}

/**
 * 从数据库获取班级的所有任务数据
 */
export async function getClassroomTasksFromDB(schoolId, classId) {
  const _ = command();

  // 1. 查询班级任务
  const classTasks = await allDocs({
    c: "mistake_batch_class_task",
    match: {
      schoolId,
      classId
    },
    sort: {
      created: -1 // 按创建时间倒序
    }
  });
  if (classTasks.length === 0) {
    return [];
  }

  // 2. 获取所有任务ID
  const taskIds = classTasks.map(ct => ct.taskId);

  // 3. 查询关联的任务数据
  const tasks = await allDocs({
    c: "mistake_batch_task",
    match: {
      _id: _.in(taskIds)
    }
  });

  // 4. 组装数据
  const taskMap = new Map(tasks.map(t => [t._id, t]));
  const result = classTasks.map(ct => {
    const task = taskMap.get(ct.taskId);
    if (!task) return null;
    return {
      ...ct,
      task
    };
  }).filter(item => item !== null);
  return result;
}

/**
 * 从数据库获取班级在某个任务下的学生PDF数据
 */
export async function getClassroomStudentPdfsFromDB(schoolId, classId, taskId) {
  const _ = command();

  // 1. 查询学生PDF数据
  const studentPdfs = await allDocs({
    c: "mistake_batch_student_pdf",
    match: {
      schoolId,
      classId,
      taskId
    },
    sort: {
      studentName: 1 // 按学生姓名排序
    }
  });
  if (studentPdfs.length === 0) {
    return [];
  }

  // 2. 收集所有题集ID
  const questionPackIds = Array.from(new Set(studentPdfs.flatMap(pdf => pdf.questionPackIds)));

  // 3. 查询题集信息
  const questionPacks = await allDocs({
    c: "question_pack",
    match: {
      _id: _.in(questionPackIds)
    },
    only: "_id,name"
  });

  // 4. 组装数据
  const questionPackMap = new Map(questionPacks.map(qp => [qp._id, qp]));
  const result = studentPdfs.map(pdf => ({
    ...pdf,
    questionPacks: pdf.questionPackIds.map(qpId => questionPackMap.get(qpId)).filter(qp => qp !== undefined)
  }));
  return result;
}
