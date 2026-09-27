"use server";

import { updateClassRoomStudentCount } from "../../../../../../../lib/collection/classroom.js";
import { assertClassRoomOwnership, getTeacherClassRoomById } from "../../../../../../../lib/work/teacher/myClassroom.js";
import { addStudentToMyClass, createMyStudent, getStudentByCodeInSchool, isStudentInClass } from "../../../../../../../lib/work/teacher/myStudent.js";
import { checkStudentCodeExists, checkStudentInClass, getNextStudentCode, searchStudents } from "./datas.js";

/**
 * 根据学生编号查询学生信息
 */
export async function searchStudentByCodeAction(classRoomId, studentCode) {
  try {
    // 验证班级权限
    await assertClassRoomOwnership(classRoomId);
    if (!studentCode.trim()) {
      return {
        student: null,
        error: "学生编号不能为空"
      };
    }
    const student = await getStudentByCodeInSchool(studentCode.trim());
    if (!student) {
      return {
        student: null
      };
    }

    // 检查学生是否已经在班级中
    const isInClass = await isStudentInClass(student._id, classRoomId);
    return {
      student,
      isInClass
    };
  } catch (error) {
    console.error("查询学生失败:", error);
    return {
      student: null,
      error: error instanceof Error ? error.message : "查询学生失败"
    };
  }
}

/**
 * 根据编号或姓名搜索学生（支持模糊搜索）
 */
export async function searchStudentsAction(classRoomId, keyword) {
  try {
    // 验证班级权限
    await assertClassRoomOwnership(classRoomId);
    if (!keyword.trim()) {
      return {
        students: [],
        error: "搜索关键词不能为空"
      };
    }

    // 从 datas.ts 中搜索学生
    const students = await searchStudents(keyword);

    // 检查每个学生是否已经在班级中
    const studentsWithStatus = await Promise.all(students.map(async student => {
      const isInClass = await checkStudentInClass(student._id, classRoomId);
      return {
        ...student,
        isInClass
      };
    }));
    return {
      students: studentsWithStatus
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
 * 获取下一个建议的学生编号
 */
export async function getNextStudentCodeAction() {
  try {
    // 从 datas.ts 中获取下一个学生编号
    const suggestedCode = await getNextStudentCode();
    return {
      suggestedCode
    };
  } catch (error) {
    console.error("获取下一个学生编号失败:", error);
    return {
      suggestedCode: "",
      error: error instanceof Error ? error.message : "获取下一个学生编号失败"
    };
  }
}

/**
 * 将已存在的学生添加到班级
 */
export async function addExistingStudentToClassAction(classRoomId, studentId, classRoomNotes, status = "在读") {
  try {
    // 验证班级权限
    await assertClassRoomOwnership(classRoomId);
    if (!studentId.trim()) {
      return {
        success: false,
        error: "学生ID不能为空"
      };
    }

    // 添加学生到班级
    await addStudentToMyClass(studentId, classRoomId, classRoomNotes, status);

    // 更新班级学生数量
    await updateClassRoomStudentCount(classRoomId);
    return {
      success: true
    };
  } catch (error) {
    console.error("添加学生到班级失败:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "添加学生到班级失败"
    };
  }
}

/**
 * 创建新学生并添加到班级
 */
export async function createAndAddStudentAction(classRoomId, studentData, classRoomNotes, status = "在读") {
  try {
    // 验证班级权限
    await assertClassRoomOwnership(classRoomId);
    if (!studentData.studentCode.trim()) {
      return {
        success: false,
        error: "学生编号不能为空"
      };
    }
    if (!studentData.name.trim()) {
      return {
        success: false,
        error: "学生姓名不能为空"
      };
    }

    // 检查学生编号是否已存在
    const codeExists = await checkStudentCodeExists(studentData.studentCode);
    if (codeExists) {
      return {
        success: false,
        error: `学生编号 "${studentData.studentCode}" 已存在，请使用其他编号`
      };
    }

    // 创建学生并添加到班级
    await createMyStudent(classRoomId, studentData, classRoomNotes, status);

    // 更新班级学生数量
    await updateClassRoomStudentCount(classRoomId);

    // 获取创建的学生信息
    const student = await getStudentByCodeInSchool(studentData.studentCode);
    return {
      success: true,
      student: student || undefined
    };
  } catch (error) {
    console.error("创建学生失败:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "创建学生失败"
    };
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
