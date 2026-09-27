"use server";

import { updateClassRoomStudentCount } from "../../../../../../lib/collection/classroom.js";
import { assertClassRoomOwnership, getTeacherClassRoomById } from "../../../../../../lib/work/teacher/myClassroom.js";
import { getClassStudents, removeStudentFromMyClass, removeStudentsFromMyClassBatch } from "../../../../../../lib/work/teacher/myStudent.js";

/**
 * 获取班级所有学生列表（不带过滤）
 */
export async function getClassStudentsAction(classRoomId) {
  try {
    // 首先验证权限
    await assertClassRoomOwnership(classRoomId);

    // 获取班级学生列表
    return await getClassStudents(classRoomId);
  } catch (error) {
    console.error("获取班级学生列表失败:", error);
    return [];
  }
}

/**
 * 获取班级信息并验证权限
 */
export async function getClassRoomInfoAction(classRoomId) {
  try {
    // 验证权限并获取班级信息
    await assertClassRoomOwnership(classRoomId);
    const classRoom = await getTeacherClassRoomById(classRoomId);
    if (!classRoom) {
      return {
        classRoom: null,
        error: "班级不存在"
      };
    }
    return {
      classRoom
    };
  } catch (error) {
    console.error("获取班级信息失败:", error);
    return {
      classRoom: null,
      error: error instanceof Error ? error.message : "获取班级信息失败"
    };
  }
}

/**
 * 从班级中移除单个学生
 */
export async function removeStudentFromClassAction(studentId, classRoomId) {
  try {
    // 首先验证权限
    await assertClassRoomOwnership(classRoomId);

    // 移除学生
    const removedCount = await removeStudentFromMyClass(studentId, classRoomId);
    if (removedCount > 0) {
      // 更新班级学生数量
      await updateClassRoomStudentCount(classRoomId);
      return {
        success: true
      };
    } else {
      return {
        success: false,
        error: "学生不在此班级中"
      };
    }
  } catch (error) {
    console.error("移除学生失败:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "移除学生失败"
    };
  }
}

/**
 * 从班级中批量移除多个学生
 */
export async function removeStudentsFromClassAction(studentIds, classRoomId) {
  try {
    // 首先验证权限
    await assertClassRoomOwnership(classRoomId);

    // 批量移除学生
    const removedCount = await removeStudentsFromMyClassBatch(studentIds, classRoomId);

    // 更新班级学生数量
    await updateClassRoomStudentCount(classRoomId);
    return {
      success: true,
      removedCount
    };
  } catch (error) {
    console.error("批量移除学生失败:", error);
    return {
      success: false,
      removedCount: 0,
      error: error instanceof Error ? error.message : "批量移除学生失败"
    };
  }
}

/**
 * 获取班级的所有科目
 */
export async function getClassSubjectsAction(classRoomId) {
  try {
    // 首先验证权限
    await assertClassRoomOwnership(classRoomId);

    // 导入课程相关函数
    const {
      getClassCourses
    } = await import("../../../../../../lib/work/teacher/myCourse");

    // 获取班级的所有课程
    const courses = await getClassCourses(classRoomId);

    // 提取所有课程的科目并去重
    const subjects = [...new Set(courses.map(course => course.subject))];
    return {
      subjects
    };
  } catch (error) {
    console.error("获取班级科目失败:", error);
    return {
      subjects: [],
      error: error instanceof Error ? error.message : "获取班级科目失败"
    };
  }
}

/**
 * 批量获取学生的绑定人数
 */
export async function getStudentsBindCountsAction(classRoomId, studentIds) {
  try {
    // 首先验证权限
    await assertClassRoomOwnership(classRoomId);
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
export async function getStudentsBindingsInfoAction(classRoomId, studentIds) {
  try {
    // 首先验证权限
    await assertClassRoomOwnership(classRoomId);
    const {
      getStudentsBindingsInfo
    } = await import("./datas");
    return await getStudentsBindingsInfo(studentIds);
  } catch (error) {
    console.error("获取学生绑定人信息失败:", error);
    return {};
  }
}

/**
 * 更新学生备注
 */
export async function updateStudentNotesAction(classRoomId, studentId, notes) {
  try {
    // 首先验证权限
    await assertClassRoomOwnership(classRoomId);
    const {
      updateMyStudent
    } = await import("../../../../../../lib/work/teacher/myStudent");
    await updateMyStudent(studentId, {
      notes
    });
    return {
      success: true
    };
  } catch (error) {
    console.error("更新学生备注失败:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "更新学生备注失败"
    };
  }
}

/**
 * 更新班级备注
 */
export async function updateClassNotesAction(classRoomId, studentId, notes) {
  try {
    // 首先验证权限
    await assertClassRoomOwnership(classRoomId);
    const {
      updateClassNotes
    } = await import("./datas");
    await updateClassNotes(classRoomId, studentId, notes);
    return {
      success: true
    };
  } catch (error) {
    console.error("更新班级备注失败:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "更新班级备注失败"
    };
  }
}
