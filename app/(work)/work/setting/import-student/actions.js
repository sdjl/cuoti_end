"use server";

import { getCurrentSchoolFromJWT } from "../../../../../lib/work/principal/mySchool.js";
import { getSchoolDocFromDB, updateSchoolConfigInDB } from "./datas.js";

/**
 * 获取当前校园的导入学生配置
 */
export async function getImportStudentConfig() {
  try {
    const currentSchool = await getCurrentSchoolFromJWT();
    if (!currentSchool) {
      return {
        success: false,
        error: "请先选择要管理的校园"
      };
    }
    const schoolDoc = await getSchoolDocFromDB(currentSchool._id);
    if (!schoolDoc) {
      return {
        success: false,
        error: "校园信息不存在"
      };
    }

    // 获取当前配置，如果没有则使用默认配置
    const currentConfig = schoolDoc.config?.importStudentData?.tableColumns || {};

    // 默认字段映射
    const defaultColumns = {
      studentCode: "学号",
      name: "姓名",
      birthDate: "出生日期",
      ethnicity: "民族",
      homeAddress: "家庭地址",
      gender: "性别",
      notes: "备注"
    };

    // 合并默认配置和当前配置
    const tableColumns = {
      ...defaultColumns,
      ...currentConfig
    };
    return {
      success: true,
      data: {
        schoolId: currentSchool._id,
        schoolName: currentSchool.name,
        tableColumns
      }
    };
  } catch (error) {
    console.error("获取导入学生配置失败:", error);
    return {
      success: false,
      error: "获取配置失败"
    };
  }
}

/**
 * 保存导入学生配置
 */
export async function saveImportStudentConfig(schoolId, tableColumns) {
  try {
    const currentSchool = await getCurrentSchoolFromJWT();
    if (!currentSchool || currentSchool._id !== schoolId) {
      return {
        success: false,
        error: "无权限操作此校园"
      };
    }

    // 获取当前校园数据
    const schoolDoc = await getSchoolDocFromDB(schoolId);
    if (!schoolDoc) {
      return {
        success: false,
        error: "校园信息不存在"
      };
    }

    // 更新校园配置
    const currentConfig = schoolDoc.config || {};
    const updatedConfig = {
      ...currentConfig,
      importStudentData: {
        ...currentConfig.importStudentData,
        tableColumns
      }
    };
    const updateResult = await updateSchoolConfigInDB(schoolId, updatedConfig);
    if (!updateResult) {
      return {
        success: false,
        error: "保存配置失败"
      };
    }
    return {
      success: true,
      message: "配置保存成功"
    };
  } catch (error) {
    console.error("保存导入学生配置失败:", error);
    return {
      success: false,
      error: "保存配置失败"
    };
  }
}
