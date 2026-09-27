"use server";

import { allDocs, getDoc } from "../common/database.js";

/**
 * 错题集PDF数据（包含任务信息）
 */


export async function getStudentLatestMistakeBatchPdf(studentId) {
  try {
    // 查询该学生最近的一个错题集PDF记录
    const mistakeBatchPdfs = await allDocs({
      c: "mistake_batch_student_pdf",
      match: {
        studentId
      },
      sort: {
        created: -1 // 按创建时间倒序
      },
      limit: 1 // 只取最近的一条
    });
    if (!mistakeBatchPdfs[0]) {
      return null;
    }
    const pdf = mistakeBatchPdfs[0];

    // 获取对应的任务信息
    const task = await getDoc("mistake_batch_task", pdf.taskId);
    if (!task) {
      console.error("未找到错题集任务记录");
      return null;
    }
    return {
      pdf,
      task
    };
  } catch (error) {
    console.error("获取学生最近错题集PDF失败:", error);
    return null;
  }
}


export async function validateStudentPassword(studentId, password) {
  try {
    const student = await getDoc("student", studentId);
    if (!student) {
      return false;
    }
    return student.operationPassword === password;
  } catch (error) {
    console.error("验证学生操作密码失败:", error);
    return false;
  }
}
