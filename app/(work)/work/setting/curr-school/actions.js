"use server";

import { getMySchools as getSchools, switchCurrentSchool as switchSchool } from "../../../../../lib/work/principal/mySchool.js";
/**
 * 获取用户管理的校园列表（包括校长和老师身份）
 */
export async function getMySchools() {
  const {
    principalSchools,
    teacherSchools
  } = await getSchools();
  return {
    success: true,
    message: "获取成功",
    principalSchools,
    teacherSchools
  };
}

/**
 * 切换当前管理的校园
 */
export async function switchCurrentSchool(schoolId) {
  const school = await switchSchool(schoolId);
  if (!school) {
    return {
      success: false,
      message: "切换失败"
    };
  }
  return {
    success: true,
    message: "切换成功",
    school
  };
}
