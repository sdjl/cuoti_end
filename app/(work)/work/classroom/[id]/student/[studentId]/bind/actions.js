"use server";

import { getCurrentSchoolId } from "../../../../../../../../lib/work/teacher/mySchool.js";
import { deleteAllStudentBindings, deleteStudentBindPassword, generateStudentBindPassword, getStudentBindCount, getStudentBindInfo, getStudentBindingsInfo } from "./datas.js";

/**
 * 获取学生绑定信息Action
 */
export async function getStudentBindInfoAction(classRoomId, studentId) {
  try {
    // 验证有当前学校权限（校长或教师都可以）
    await getCurrentSchoolId();
    if (!classRoomId.trim()) {
      return {
        student: null,
        classRoom: null,
        error: "班级ID不能为空"
      };
    }
    if (!studentId.trim()) {
      return {
        student: null,
        classRoom: null,
        error: "学生ID不能为空"
      };
    }
    return await getStudentBindInfo(studentId, classRoomId);
  } catch (error) {
    console.error("获取学生绑定信息失败:", error);
    return {
      student: null,
      classRoom: null,
      error: error instanceof Error ? error.message : "获取学生绑定信息失败"
    };
  }
}

/**
 * 生成学生绑定密码Action
 */
export async function generateStudentBindPasswordAction(classRoomId, studentId) {
  try {
    // 验证有当前学校权限（校长或教师都可以）
    await getCurrentSchoolId();
    if (!classRoomId.trim()) {
      return {
        success: false,
        error: "班级ID不能为空"
      };
    }
    if (!studentId.trim()) {
      return {
        success: false,
        error: "学生ID不能为空"
      };
    }
    return await generateStudentBindPassword(studentId);
  } catch (error) {
    console.error("生成绑定密码失败:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "生成绑定密码失败"
    };
  }
}

/**
 * 删除学生绑定密码Action
 */
export async function deleteStudentBindPasswordAction(classRoomId, studentId) {
  try {
    // 验证有当前学校权限（校长或教师都可以）
    await getCurrentSchoolId();
    if (!classRoomId.trim()) {
      return {
        success: false,
        error: "班级ID不能为空"
      };
    }
    if (!studentId.trim()) {
      return {
        success: false,
        error: "学生ID不能为空"
      };
    }
    return await deleteStudentBindPassword(studentId);
  } catch (error) {
    console.error("删除绑定密码失败:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "删除绑定密码失败"
    };
  }
}

/**
 * 获取学生绑定成功人数Action
 */
export async function getStudentBindCountAction(studentId) {
  try {
    // 验证有当前学校权限（校长或教师都可以）
    await getCurrentSchoolId();
    if (!studentId.trim()) {
      return {
        success: false,
        error: "学生ID不能为空"
      };
    }
    return await getStudentBindCount(studentId);
  } catch (error) {
    console.error("获取学生绑定人数失败:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "获取学生绑定人数失败"
    };
  }
}

/**
 * 删除学生所有绑定关系Action
 */
export async function deleteAllStudentBindingsAction(classRoomId, studentId, studentName) {
  try {
    // 验证有当前学校权限（校长或教师都可以）
    await getCurrentSchoolId();
    if (!classRoomId.trim()) {
      return {
        success: false,
        error: "班级ID不能为空"
      };
    }
    if (!studentId.trim()) {
      return {
        success: false,
        error: "学生ID不能为空"
      };
    }
    if (!studentName.trim()) {
      return {
        success: false,
        error: "学生姓名不能为空"
      };
    }
    return await deleteAllStudentBindings(studentId, studentName);
  } catch (error) {
    console.error("删除学生所有绑定关系失败:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "删除学生所有绑定关系失败"
    };
  }
}

/**
 * 获取学生的所有绑定人信息Action
 */
export async function getStudentBindingsInfoAction(studentId) {
  try {
    // 验证有当前学校权限（校长或教师都可以）
    await getCurrentSchoolId();
    if (!studentId.trim()) {
      return {
        success: false,
        error: "学生ID不能为空"
      };
    }
    return await getStudentBindingsInfo(studentId);
  } catch (error) {
    console.error("获取学生绑定人信息失败:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "获取学生绑定人信息失败"
    };
  }
}
