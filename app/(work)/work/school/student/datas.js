"use server";

import { allDocs, command } from "../../../../../lib/common/database.js";


export async function getStudentsBindCounts(studentIds) {
  try {
    if (studentIds.length === 0) {
      return {};
    }
    const _ = command();

    // 查询所有相关的绑定关系，排除isTeacher=true的记录
    const bindings = await allDocs({
      c: "user_student",
      match: {
        studentId: _.in(studentIds),
        isTeacher: _.neq(true)
      },
      project: {
        studentId: 1
      }
    });

    // 统计每个学生的绑定人数
    const counts = {};
    for (const binding of bindings) {
      counts[binding.studentId] = (counts[binding.studentId] || 0) + 1;
    }
    return counts;
  } catch (error) {
    console.error("批量获取学生绑定人数失败:", error);
    return {};
  }
}


export async function getStudentsBindingsInfo(studentIds) {
  try {
    if (studentIds.length === 0) {
      return {};
    }
    const _ = command();

    // 查询所有相关的绑定关系，排除isTeacher=true的记录
    const bindings = await allDocs({
      c: "user_student",
      match: {
        studentId: _.in(studentIds),
        isTeacher: _.neq(true)
      },
      only: "studentId,relationType,bindPhone"
    });

    // 按学生ID组织绑定信息
    const bindingsMap = {};
    for (const binding of bindings) {
      // 只保留有关系或电话的绑定记录
      if (binding.relationType || binding.bindPhone) {
        if (!bindingsMap[binding.studentId]) {
          bindingsMap[binding.studentId] = [];
        }
        bindingsMap[binding.studentId].push({
          relationType: binding.relationType,
          bindPhone: binding.bindPhone
        });
      }
    }
    return bindingsMap;
  } catch (error) {
    console.error("批量获取学生绑定人信息失败:", error);
    return {};
  }
}
