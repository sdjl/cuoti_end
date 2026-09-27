"use server";

import { getCurrentSchoolStaff, removeTeacherFromCurrentSchool } from "../../../../../lib/work/principal/mySchool.js";


export async function getSchoolStaffAction() {
  try {
    return await getCurrentSchoolStaff();
  } catch (error) {
    console.error("获取校园教师数据失败:", error);
    return {
      administrators: [],
      teachers: []
    };
  }
}


export async function getAllSchoolStaffAction() {
  try {
    return await getCurrentSchoolStaff();
  } catch (error) {
    console.error("获取所有校园教师数据失败:", error);
    return {
      administrators: [],
      teachers: []
    };
  }
}

/**
 * 分页获取教师数据（已弃用，现在使用前端分页）
 * @deprecated 使用 getAllSchoolStaffAction 代替，在前端实现分页
 */
export async function getTeachersWithPaginationAction(page, pageSize = 20) {
  try {
    const {
      teachers
    } = await getCurrentSchoolStaff();
    const total = teachers.length;
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedTeachers = teachers.slice(startIndex, endIndex);
    return {
      teachers: paginatedTeachers,
      total
    };
  } catch (error) {
    console.error("获取分页教师数据失败:", error);
    return {
      teachers: [],
      total: 0
    };
  }
}


export async function removeTeacherAction(teacherOpenid) {
  try {
    if (!teacherOpenid.trim()) {
      return {
        success: false,
        error: "教师OpenID不能为空"
      };
    }
    await removeTeacherFromCurrentSchool(teacherOpenid.trim());
    return {
      success: true
    };
  } catch (error) {
    console.error("删除教师失败:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "删除教师失败"
    };
  }
}
