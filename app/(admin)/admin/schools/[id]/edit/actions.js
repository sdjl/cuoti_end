"use server";

import { getSchoolById, updateSchool } from "../../../../../../lib/collection/school.js";
/**
 * 获取单个学校信息的 Server Action
 */
export async function getSchoolByIdAction(schoolId) {
  try {
    // 验证参数
    if (!schoolId?.trim()) {
      return {
        success: false,
        error: "学校ID不能为空"
      };
    }

    // 获取学校信息
    const school = await getSchoolById(schoolId.trim());
    if (!school) {
      return {
        success: false,
        error: "找不到指定的学校"
      };
    }
    return {
      success: true,
      data: school
    };
  } catch (error) {
    console.error("获取学校信息失败:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "获取学校信息时发生未知错误"
    };
  }
}

/**
 * 更新学校信息的 Server Action
 */
export async function updateSchoolAction(schoolId, schoolData) {
  try {
    // 验证参数
    if (!schoolId?.trim()) {
      return {
        success: false,
        error: "学校ID不能为空"
      };
    }
    if (!schoolData.name?.trim()) {
      return {
        success: false,
        error: "学校名称不能为空"
      };
    }
    if (!schoolData.region?.trim()) {
      return {
        success: false,
        error: "必须选择区域"
      };
    }

    // 准备更新数据
    const updateData = {
      name: schoolData.name.trim(),
      region: schoolData.region.trim(),
      address: schoolData.address?.trim() || "",
      phone: schoolData.phone?.trim() || "",
      description: schoolData.description?.trim() || "",
      status: schoolData.status
    };

    // 更新学校
    const success = await updateSchool(schoolId.trim(), updateData);
    if (success) {
      return {
        success: true
      };
    } else {
      return {
        success: false,
        error: "更新学校信息失败"
      };
    }
  } catch (error) {
    console.error("更新学校失败:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "更新学校时发生未知错误"
    };
  }
}
