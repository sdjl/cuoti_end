"use server";

import { updateClassRoomStudentCount } from "../../../../../../../lib/collection/classroom.js";
import { assertClassRoomOwnership } from "../../../../../../../lib/work/teacher/myClassroom.js";
import { addStudentToMyClassBatch } from "../../../../../../../lib/work/teacher/myStudent.js";
import { checkStudentsInClass, getClassRoomStudents, getSchoolClassRooms, searchSchoolStudents } from "./datas.js";

/**
 * 搜索学生
 */
export async function searchStudentsAction(classRoomId, options) {
  try {
    // 验证班级权限
    await assertClassRoomOwnership(classRoomId);
    const students = await searchSchoolStudents(options);
    return {
      students
    };
  } catch (error) {
    console.error("搜索学生失败:", error);
    return {
      students: [],
      error: error instanceof Error ? error.message : "搜索学生失败"
    };
  }
}

/**
 * 获取学校的所有班级
 */
export async function getSchoolClassRoomsAction(classRoomId) {
  try {
    // 验证权限
    await assertClassRoomOwnership(classRoomId);
    const classrooms = await getSchoolClassRooms();
    return {
      classrooms
    };
  } catch (error) {
    console.error("获取班级列表失败:", error);
    return {
      classrooms: [],
      error: error instanceof Error ? error.message : "获取班级列表失败"
    };
  }
}

/**
 * 获取当前班级的学生
 */
export async function getClassRoomStudentsAction(classRoomId) {
  try {
    // 验证权限
    await assertClassRoomOwnership(classRoomId);
    const students = await getClassRoomStudents(classRoomId);
    return {
      students
    };
  } catch (error) {
    console.error("获取班级学生失败:", error);
    return {
      students: [],
      error: error instanceof Error ? error.message : "获取班级学生失败"
    };
  }
}

/**
 * 批量添加学生到班级
 */
export async function batchAddStudentsToClassAction(classRoomId, studentIds) {
  try {
    // 验证班级权限
    await assertClassRoomOwnership(classRoomId);
    if (studentIds.length === 0) {
      return {
        success: false,
        addedCount: 0,
        skippedCount: 0,
        error: "请至少选择一个学生"
      };
    }

    // 检查哪些学生已经在班级中
    const existingStudentIds = await checkStudentsInClass(studentIds, classRoomId);

    // 过滤出需要添加的学生
    const studentsToAdd = studentIds.filter(id => !existingStudentIds.includes(id));
    if (studentsToAdd.length === 0) {
      return {
        success: true,
        addedCount: 0,
        skippedCount: studentIds.length,
        error: "所选学生都已在班级中"
      };
    }

    // 批量添加学生
    await addStudentToMyClassBatch(studentsToAdd, classRoomId);

    // 更新班级学生数量
    await updateClassRoomStudentCount(classRoomId);
    return {
      success: true,
      addedCount: studentsToAdd.length,
      skippedCount: existingStudentIds.length
    };
  } catch (error) {
    console.error("批量添加学生失败:", error);
    return {
      success: false,
      addedCount: 0,
      skippedCount: 0,
      error: error instanceof Error ? error.message : "批量添加学生失败"
    };
  }
}
