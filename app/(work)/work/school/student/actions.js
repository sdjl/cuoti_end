"use server";

import { updateClassRoomStudentCount } from "../../../../../lib/collection/classroom.js";
import { getStudentClassRelations } from "../../../../../lib/collection/student.js";
import { deleteMyStudent, getMyStudentById, getMyStudents, getMyStudentsCount, updateMyStudent } from "../../../../../lib/work/principal/myStudent.js";

/**
 * 获取学生列表
 */
export async function getStudentsAction({
  pageNum = 0,
  pageSize = 20,
  keyword = "",
  gender = "all"
} = {}) {
  try {
    return await getMyStudents({
      pageNum,
      pageSize,
      keyword,
      gender
    });
  } catch (error) {
    console.error("获取学生列表失败:", error);
    return [];
  }
}

/**
 * 获取学生总数
 */
export async function getStudentsCountAction({
  keyword = "",
  gender = "all"
} = {}) {
  try {
    return await getMyStudentsCount({
      keyword,
      gender
    });
  } catch (error) {
    console.error("获取学生总数失败:", error);
    return 0;
  }
}

/**
 * 删除学生
 */
export async function deleteStudentAction(studentId) {
  try {
    if (!studentId.trim()) {
      return {
        success: false,
        error: "学生ID不能为空"
      };
    }

    // 1. 先获取学生所在的班级列表
    const studentClassRelations = await getStudentClassRelations(studentId);
    const classRoomIds = studentClassRelations.map(relation => relation.classRoomId);

    // 2. 删除学生
    await deleteMyStudent(studentId);

    // 3. 更新相关班级的学生数量
    for (const classRoomId of classRoomIds) {
      try {
        await updateClassRoomStudentCount(classRoomId);
      } catch (error) {
        console.error(`更新班级 ${classRoomId} 学生数量失败:`, error);
        // 继续处理其他班级，不因为单个班级更新失败而中断
      }
    }
    return {
      success: true
    };
  } catch (error) {
    console.error("删除学生失败:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "删除学生失败"
    };
  }
}

/**
 * 更新学生
 */
export async function updateStudentAction(studentId, studentData) {
  try {
    if (!studentId.trim()) {
      return {
        success: false,
        error: "学生ID不能为空"
      };
    }
    await updateMyStudent(studentId, studentData);
    return {
      success: true
    };
  } catch (error) {
    console.error("更新学生失败:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "更新学生失败"
    };
  }
}

/**
 * 根据ID获取学生
 */
export async function getStudentByIdAction(studentId) {
  try {
    const student = await getMyStudentById(studentId);
    return {
      student
    };
  } catch (error) {
    console.error("获取学生失败:", error);
    return {
      student: null,
      error: error instanceof Error ? error.message : "获取学生失败"
    };
  }
}

/**
 * 批量获取学生的绑定人数
 */
export async function getStudentsBindCountsAction(studentIds) {
  try {
    const {
      getStudentsBindCounts
    } = await import("./datas");
    return await getStudentsBindCounts(studentIds);
  } catch (error) {
    console.error("获取学生绑定人数失败:", error);
    return {};
  }
}

/**
 * 批量获取学生的绑定人信息
 */
export async function getStudentsBindingsInfoAction(studentIds) {
  try {
    const {
      getStudentsBindingsInfo
    } = await import("./datas");
    return await getStudentsBindingsInfo(studentIds);
  } catch (error) {
    console.error("获取学生绑定人信息失败:", error);
    return {};
  }
}
