"use server";

import { assertClassRoomOwnership, getTeacherClassRoomById } from "../../../../../../../lib/work/teacher/myClassroom.js";
import { getMyStudentById, updateMyStudent } from "../../../../../../../lib/work/teacher/myStudent.js";
import { getStudentClassFromDB, updateStudentClassInDB } from "./datas.js";

/**
 * 获取学生和班级关系信息
 */
export async function getStudentWithClassInfoAction(classRoomId, studentId) {
  try {
    // 验证班级权限
    await assertClassRoomOwnership(classRoomId);
    if (!studentId.trim()) {
      return {
        student: null,
        studentClass: null,
        error: "学生ID不能为空"
      };
    }

    // 获取学生信息
    const student = await getMyStudentById(studentId);
    if (!student) {
      return {
        student: null,
        studentClass: null,
        error: "学生不存在"
      };
    }

    // 获取学生班级关系信息
    const studentClass = await getStudentClassFromDB(studentId, classRoomId);
    if (!studentClass) {
      return {
        student: null,
        studentClass: null,
        error: "学生不在此班级中"
      };
    }
    return {
      student,
      studentClass
    };
  } catch (error) {
    console.error("获取学生信息失败:", error);
    return {
      student: null,
      studentClass: null,
      error: error instanceof Error ? error.message : "获取学生信息失败"
    };
  }
}

/**
 * 更新学生和班级关系信息
 */
export async function updateStudentAndClassInfoAction(classRoomId, studentId, studentData, classRelationData) {
  try {
    // 验证班级权限
    await assertClassRoomOwnership(classRoomId);
    if (!studentId.trim()) {
      return {
        success: false,
        error: "学生ID不能为空"
      };
    }
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

    // 检查学生是否存在
    const student = await getMyStudentById(studentId);
    if (!student) {
      return {
        success: false,
        error: "学生不存在"
      };
    }

    // 检查学生班级关系是否存在
    const studentClass = await getStudentClassFromDB(studentId, classRoomId);
    if (!studentClass) {
      return {
        success: false,
        error: "学生不在此班级中"
      };
    }

    // 更新学生信息
    const studentUpdateSuccess = await updateMyStudent(studentId, {
      studentCode: studentData.studentCode,
      name: studentData.name,
      birthDate: studentData.birthDate,
      ethnicity: studentData.ethnicity,
      homeAddress: studentData.homeAddress,
      gender: studentData.gender,
      publicSchoolName: studentData.publicSchoolName,
      contactPhones: studentData.contactPhones,
      notes: studentData.notes
    });
    if (!studentUpdateSuccess) {
      return {
        success: false,
        error: "更新学生信息失败"
      };
    }

    // 更新班级关系信息
    await updateStudentClassInDB(studentClass._id, classRelationData.notes, classRelationData.status);
    return {
      success: true
    };
  } catch (error) {
    console.error("更新学生信息失败:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "更新学生信息失败"
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
