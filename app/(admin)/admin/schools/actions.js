"use server";

import { deleteSchool, getSchoolById, getSchools, getSchoolsCount } from "../../../../lib/collection/school.js";
import { isSuperAdmin } from "../../../../lib/utils/auth.js";
/**
 * 获取学校列表的 Server Action
 */
export async function getSchoolsAction({
  pageNum = 0,
  pageSize = 20,
  keyword = "",
  region = "",
  status
} = {}) {
  try {
    const schools = await getSchools({
      pageNum,
      pageSize,
      keyword,
      region,
      status
    });
    return {
      success: true,
      data: schools
    };
  } catch (error) {
    console.error("获取学校列表失败:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "获取学校列表时发生未知错误"
    };
  }
}

/**
 * 获取学校数量的 Server Action
 */
export async function getSchoolsCountAction({
  keyword = "",
  region = "",
  status
} = {}) {
  try {
    const count = await getSchoolsCount({
      keyword,
      region,
      status
    });
    return {
      success: true,
      data: count
    };
  } catch (error) {
    console.error("获取学校数量失败:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "获取学校数量时发生未知错误"
    };
  }
}

/**
 * 删除学校的 Server Action（只有超级管理员可以执行）
 */
export async function deleteSchoolAction(schoolId, schoolName) {
  try {
    // 检查用户是否是超级管理员
    const hasPermission = await isSuperAdmin();
    if (!hasPermission) {
      return {
        success: false,
        error: "只有超级管理员可以删除学校"
      };
    }

    // 验证参数
    if (!schoolId?.trim()) {
      return {
        success: false,
        error: "学校ID不能为空"
      };
    }
    if (!schoolName?.trim()) {
      return {
        success: false,
        error: "请输入学校名称进行确认"
      };
    }

    // 获取学校信息进行名称验证
    const school = await getSchoolById(schoolId.trim());
    if (!school) {
      return {
        success: false,
        error: "找不到指定的学校"
      };
    }

    // 验证学校名称是否匹配
    if (school.name !== schoolName.trim()) {
      return {
        success: false,
        error: "输入的学校名称不正确"
      };
    }

    // 执行删除操作
    const success = await deleteSchool(schoolId.trim());
    if (success) {
      return {
        success: true,
        message: `学校"${school.name}"已成功删除`
      };
    } else {
      return {
        success: false,
        error: "删除学校失败"
      };
    }
  } catch (error) {
    console.error("删除学校失败:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "删除学校时发生未知错误"
    };
  }
}
