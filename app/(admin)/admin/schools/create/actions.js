"use server";

import { createSchool } from "../../../../../lib/collection/school.js";
/**
 * 创建学校的 Server Action
 */
export async function createSchoolAction(schoolData) {
  try {
    // 验证必填字段
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

    // 准备数据
    const data = {
      name: schoolData.name.trim(),
      region: schoolData.region.trim(),
      address: schoolData.address?.trim() || "",
      phone: schoolData.phone?.trim() || "",
      description: schoolData.description?.trim() || "",
      status: schoolData.status,
      adminOpenids: [],
      // 默认空数组
      teacherOpenids: [],
      // 默认空数组
      grades: [] // 默认空数组
    };

    // 创建学校
    const schoolId = await createSchool(data);
    return {
      success: true,
      data: schoolId
    };
  } catch (error) {
    console.error("创建学校失败:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "创建学校时发生未知错误"
    };
  }
}
