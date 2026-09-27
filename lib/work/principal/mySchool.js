"use server";

import { addTeacherToSchool, getSchoolAdministratorsAndTeachers, removeTeacherFromSchool } from "../../collection/school.js";
import { agg, allDocs, command, getDoc, getOne, updateDoc, updateMatch } from "../../common/database.js";
import { timestamp } from "../../common/time.js";
import { addJWTField, getCurrentUserOpenid, getJWTField } from "../../utils/auth.js";

/** 简化的校长和老师数据类型，用于页面显示 */


export async function getMySchools() {
  const openid = await getCurrentUserOpenid();
  if (!openid) {
    return {
      principalSchools: [],
      teacherSchools: []
    };
  }
  const _ = command();

  // 查询用户作为校长的校园（在adminOpenids中）
  const principalSchools = await allDocs({
    c: "school",
    match: {
      adminOpenids: _.in([openid]),
      status: "正常"
    },
    sort: {
      created: 1
    }
  });

  // 查询用户作为老师的校园（在teacherOpenids中但不在adminOpenids中）
  const teacherSchools = await allDocs({
    c: "school",
    match: {
      teacherOpenids: _.in([openid]),
      adminOpenids: _.nin([openid]),
      // 不在adminOpenids中
      status: "正常"
    },
    sort: {
      created: 1
    }
  });
  return {
    principalSchools,
    teacherSchools
  };
}


export async function switchCurrentSchool(schoolId) {
  const openid = await getCurrentUserOpenid();
  if (!openid) {
    return null;
  }

  // 验证校园是否存在并且用户有管理权限
  const schoolDoc = await getDoc("school", schoolId);
  if (!schoolDoc) {
    return null;
  }
  const school = schoolDoc;

  // 检查用户是否有管理权限（校长或老师）
  const isAdmin = school.adminOpenids?.includes(openid);
  const isTeacher = school.teacherOpenids?.includes(openid);
  if (!isAdmin && !isTeacher) {
    return null;
  }
  if (school.status !== "正常") {
    return null;
  }

  // 判断用户是否是校长
  const isPrincipal = isAdmin;

  // 更新数据库中用户的workSetting.currentSchool（数据库中保存完整对象）
  // 先根据openid查找用户文档
  const userDoc = await getOne("wx_user", {
    openid
  });
  if (!userDoc) {
    return null;
  }
  const userId = userDoc._id;
  await updateDoc("wx_user", userId, {
    "workSetting.currentSchool": school,
    "workSetting.isPrincipal": isPrincipal,
    updated: timestamp()
  });

  // 创建不包含敏感字段的学校对象，用于保存到JWT
  // 排除：adminOpenids、teacherOpenids、config 字段
  const {
    adminOpenids: _,
    teacherOpenids: __,
    config: ___,
    ...schoolForJWT
  } = school;

  // 更新JWT中的workSetting（JWT中必须排除敏感字段）
  const workSetting = {
    currentSchool: schoolForJWT,
    isPrincipal: isPrincipal
  };
  const jwtUpdateSuccess = await addJWTField("workSetting", workSetting);
  if (!jwtUpdateSuccess) {
    return null;
  }
  return school;
}


export async function getCurrentSchoolFromJWT() {
  const workSetting = await getJWTField("workSetting");
  return workSetting?.currentSchool || null;
}


export async function getCurrentSchoolFromDB() {
  // 先从JWT获取当前校园的基本信息
  const currentSchoolFromJWT = await getCurrentSchoolFromJWT();
  if (!currentSchoolFromJWT) {
    return null;
  }

  // 从数据库中获取完整的校园信息
  const schoolDoc = await getDoc("school", currentSchoolFromJWT._id);
  if (!schoolDoc) {
    return null;
  }
  return schoolDoc;
}


export async function isPrincipalFromJWT() {
  const workSetting = await getJWTField("workSetting");
  return workSetting?.isPrincipal || false;
}

/**
 * 断言当前用户是校长，如果不是则抛出异常
 * @throws {Error} 如果当前用户不是校长则抛出异常
 */
export async function assertIsPrincipal() {
  const isPrincipal = await isPrincipalFromJWT();
  if (!isPrincipal) {
    throw new Error("当前用户不是校长，无法执行此操作");
  }
}


export async function getCurrentSchoolId() {
  const currentSchool = await getCurrentSchoolFromJWT();
  if (!currentSchool || !currentSchool._id) {
    throw new Error("当前用户未设置校园，请先选择要管理的校园");
  }
  return currentSchool._id;
}


export async function getCurrentSchoolStudentCount() {
  try {
    const schoolId = await getCurrentSchoolId();

    // 使用聚合查询对班级的studentCount字段求和
    const result = await agg("classroom").match({
      schoolId: schoolId,
      status: "正常"
    }).group({
      _id: null,
      totalStudents: {
        $sum: "$studentCount"
      }
    }).limit(1).end();

    // 如果没有班级或班级中没有学生，返回0
    if (!result.data || result.data.length === 0) {
      return 0;
    }
    return result.data[0].totalStudents || 0;
  } catch (error) {
    console.error("获取学生总数失败:", error);
    return 0;
  }
}


export async function getCurrentSchoolStaff() {
  const schoolId = await getCurrentSchoolId();
  const {
    administrators,
    teachers
  } = await getSchoolAdministratorsAndTeachers(schoolId);

  // 转换为简化的数据格式
  const simplifyUser = user => ({
    _id: user._id,
    openid: user.openid,
    name: user.userInfo?.name,
    nickname: user.userWxInfo?.nickname,
    headimgurl: user.userWxInfo?.headimgurl,
    gender: user.userInfo?.gender,
    phone: user.userInfo?.phone,
    email: user.userInfo?.email,
    address: user.userInfo?.address,
    remark: user.userInfo?.remark,
    roles: user.roles,
    status: user.status,
    created: user.created
  });
  return {
    administrators: administrators.map(simplifyUser),
    teachers: teachers.map(simplifyUser)
  };
}


export async function addTeacherToCurrentSchool(teacherOpenid) {
  // 确保当前用户是校长
  await assertIsPrincipal();

  // 获取当前校园ID
  const schoolId = await getCurrentSchoolId();
  return addTeacherToSchool(schoolId, teacherOpenid);
}


export async function removeTeacherFromCurrentSchool(teacherOpenid) {
  await assertIsPrincipal();
  const schoolId = await getCurrentSchoolId();
  return await removeTeacherFromSchool(schoolId, teacherOpenid);
}


export async function getCurrentSchoolGrades() {
  const schoolId = await getCurrentSchoolId();
  const school = await getDoc("school", schoolId);
  if (!school) {
    throw new Error("找不到当前校园");
  }
  const schoolDoc = school;
  return schoolDoc.grades || [];
}


export async function setCurrentSchoolGrades(grades) {
  await assertIsPrincipal();
  const schoolId = await getCurrentSchoolId();
  const success = await updateDoc("school", schoolId, {
    grades: grades,
    updated: timestamp()
  });
  return success;
}


export async function renameGrade(oldGradeName, newGradeName, allGrades) {
  try {
    await assertIsPrincipal();
    const schoolId = await getCurrentSchoolId();

    // 检查新年级名称是否已存在（排除当前正在编辑的年级）
    const otherGrades = allGrades.filter(grade => grade !== oldGradeName);
    if (otherGrades.includes(newGradeName)) {
      return {
        success: false,
        error: "年级名称已存在"
      };
    }

    // 更新年级列表
    const updatedGrades = allGrades.map(grade => grade === oldGradeName ? newGradeName : grade);

    // 更新学校的年级列表
    const updateSchoolSuccess = await updateDoc("school", schoolId, {
      grades: updatedGrades,
      updated: timestamp()
    });
    if (!updateSchoolSuccess) {
      return {
        success: false,
        error: "更新学校年级列表失败"
      };
    }

    // 更新所有班级的年级字段
    const updatedClassroomCount = await updateMatch("classroom", {
      schoolId: schoolId,
      grade: oldGradeName
    }, {
      grade: newGradeName,
      updated: timestamp()
    });
    const updateClassroomResult = updatedClassroomCount >= 0;
    if (!updateClassroomResult) {
      // 如果更新班级失败，尝试回滚学校的年级列表
      await updateDoc("school", schoolId, {
        grades: allGrades,
        updated: timestamp()
      });
      return {
        success: false,
        error: "更新班级年级字段失败"
      };
    }
    return {
      success: true
    };
  } catch (error) {
    console.error("重命名年级失败:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "重命名年级失败"
    };
  }
}
