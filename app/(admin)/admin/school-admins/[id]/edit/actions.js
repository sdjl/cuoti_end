"use server";

import { getPrincipalsFromDB, getSchoolFromDB, removeAdminsFromClassroomsInDB, updateSchoolInDB } from "./datas.js";
/**
 * 获取学校详情
 */
export async function getSchoolDetailAction(schoolId) {
  try {
    const school = await getSchoolFromDB(schoolId);
    if (!school) {
      return {
        success: false,
        error: "学校不存在"
      };
    }
    return {
      success: true,
      data: school
    };
  } catch (error) {
    console.error("获取学校详情失败:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "获取学校详情时发生未知错误"
    };
  }
}

/**
 * 获取所有校长用户
 */
export async function getPrincipalsAction() {
  try {
    // 查询所有拥有校长角色的用户
    const principals = await getPrincipalsFromDB();
    return {
      success: true,
      data: principals
    };
  } catch (error) {
    console.error("获取校长列表失败:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "获取校长列表时发生未知错误"
    };
  }
}

/**
 * 更新学校校长列表
 */
export async function updateSchoolAdminsAction(schoolId, adminOpenids) {
  try {
    // 验证学校是否存在
    const school = await getSchoolFromDB(schoolId);
    if (!school) {
      return {
        success: false,
        error: "学校不存在"
      };
    }
    const schoolDoc = school;

    // 1. 从学校的teacherOpenids中移除所有新的校长用户
    let newTeacherOpenids = schoolDoc.teacherOpenids || [];
    if (adminOpenids.length > 0) {
      newTeacherOpenids = newTeacherOpenids.filter(teacherOpenid => !adminOpenids.includes(teacherOpenid));
    }

    // 2. 更新学校的校长列表和教师列表
    const updated = await updateSchoolInDB(schoolId, {
      adminOpenids,
      teacherOpenids: newTeacherOpenids,
      updated: Date.now()
    });
    if (!updated) {
      return {
        success: false,
        error: "更新失败，可能是因为数据没有变化"
      };
    }

    // 3. 从该学校下所有班级的teacherOpenids中移除所有校长用户
    if (adminOpenids.length > 0) {
      await removeAdminsFromClassroomsInDB(schoolId, adminOpenids);
    }
    return {
      success: true,
      data: true
    };
  } catch (error) {
    console.error("更新学校校长失败:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "更新学校校长时发生未知错误"
    };
  }
}
