"use server";

import { command, count, getDoc, removeMatch, updateDoc } from "../../../../../../../../lib/common/database.js";
import { timestamp } from "../../../../../../../../lib/common/time.js";

/**
 * 获取学生的绑定信息和班级信息
 */
export async function getStudentBindInfo(studentId, classRoomId) {
  try {
    const [student, classRoom] = await Promise.all([getDoc("student", studentId), getDoc("classroom", classRoomId)]);
    if (!student) {
      return {
        student: null,
        classRoom: null,
        error: "学生不存在"
      };
    }
    if (!classRoom) {
      return {
        student: student,
        classRoom: null,
        error: "班级不存在"
      };
    }
    return {
      student: student,
      classRoom: classRoom
    };
  } catch (error) {
    console.error("获取学生绑定信息失败:", error);
    return {
      student: null,
      classRoom: null,
      error: error instanceof Error ? error.message : "获取学生信息失败"
    };
  }
}

/**
 * 生成随机绑定密码
 */
function generateBindPassword() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 20; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * 为学生生成绑定密码
 */
export async function generateStudentBindPassword(studentId) {
  try {
    const bindPassword = generateBindPassword();
    const bindPasswordGeneratedAt = timestamp();
    const success = await updateDoc("student", studentId, {
      bindPassword,
      bindPasswordGeneratedAt
    });
    if (!success) {
      return {
        success: false,
        error: "更新学生绑定密码失败"
      };
    }
    return {
      success: true,
      bindPassword,
      bindPasswordGeneratedAt
    };
  } catch (error) {
    console.error("生成绑定密码失败:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "生成绑定密码失败"
    };
  }
}

/**
 * 删除学生的绑定密码
 */
export async function deleteStudentBindPassword(studentId) {
  try {
    const _ = command();
    const success = await updateDoc("student", studentId, {
      bindPassword: _.remove(),
      bindPasswordGeneratedAt: _.remove()
    });
    if (!success) {
      return {
        success: false,
        error: "删除绑定密码失败"
      };
    }
    return {
      success: true
    };
  } catch (error) {
    console.error("删除绑定密码失败:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "删除绑定密码失败"
    };
  }
}

/**
 * 获取学生绑定成功的人数
 */
export async function getStudentBindCount(studentId) {
  try {
    // 统计该学生的绑定关系数量，排除isTeacher=true的记录
    const _ = command();
    const bindCount = await count("user_student", {
      studentId: studentId,
      isTeacher: _.neq(true)
    });
    return {
      success: true,
      bindCount: bindCount
    };
  } catch (error) {
    console.error("获取学生绑定人数失败:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "获取学生绑定人数失败"
    };
  }
}

/**
 * 获取学生的所有绑定人信息（包括关系和电话）
 */
export async function getStudentBindingsInfo(studentId) {
  try {
    const _ = command();
    const {
      allDocs
    } = await import("../../../../../../../../lib/common/database");

    // 获取所有绑定关系，排除isTeacher=true的记录
    const userStudents = await allDocs({
      c: "user_student",
      match: {
        studentId: studentId,
        isTeacher: _.neq(true)
      },
      only: "relationType,bindPhone"
    });

    // 只返回有关系或电话的绑定记录
    const bindings = userStudents.filter(us => us.relationType || us.bindPhone).map(us => ({
      relationType: us.relationType,
      bindPhone: us.bindPhone
    }));
    return {
      success: true,
      bindings
    };
  } catch (error) {
    console.error("获取学生绑定人信息失败:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "获取学生绑定人信息失败"
    };
  }
}

/**
 * 删除学生的所有绑定关系
 */
export async function deleteAllStudentBindings(studentId, studentName) {
  try {
    // 验证学生姓名
    const student = await getDoc("student", studentId);
    if (!student) {
      return {
        success: false,
        error: "学生不存在"
      };
    }
    if (student.name !== studentName) {
      return {
        success: false,
        error: "学生姓名验证失败，请输入正确的学生姓名"
      };
    }

    // 删除所有该学生的用户绑定关系
    const deletedCount = await removeMatch("user_student", {
      studentId: studentId
    });
    return {
      success: true,
      deletedCount
    };
  } catch (error) {
    console.error("删除学生所有绑定关系失败:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "删除学生所有绑定关系失败"
    };
  }
}
