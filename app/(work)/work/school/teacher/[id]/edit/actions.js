"use server";

import { timestamp } from "../../../../../../../lib/common/time.js";
import { getWxUserById, updateUserSpecialFlags } from "../../../../../../../lib/utils/wxUser.js";
import { assertIsPrincipal } from "../../../../../../../lib/work/principal/mySchool.js";
import { getTeacherFromDB, updateTeacherInDB } from "./datas.js";

/**
 * 根据教师ID获取教师信息
 */
export async function getTeacherInfo(teacherId) {
  try {
    // 确保当前用户是校长
    await assertIsPrincipal();
    if (!teacherId.trim()) {
      return {
        teacher: null,
        error: "教师ID不能为空"
      };
    }
    const teacher = await getTeacherFromDB(teacherId);
    if (!teacher) {
      return {
        teacher: null,
        error: "找不到该教师"
      };
    }
    return {
      teacher
    };
  } catch (error) {
    console.error("获取教师信息失败:", error);
    return {
      teacher: null,
      error: error instanceof Error ? error.message : "获取教师信息失败"
    };
  }
}

/**
 * 更新教师信息
 */
export async function updateTeacherInfo(teacherId, userInfo, remark) {
  try {
    // 确保当前用户是校长
    await assertIsPrincipal();
    if (!teacherId.trim()) {
      return {
        success: false,
        message: "教师ID不能为空"
      };
    }

    // 检查教师是否存在
    const teacher = await getTeacherFromDB(teacherId);
    if (!teacher) {
      return {
        success: false,
        message: "找不到该教师"
      };
    }

    // 构建更新数据
    const updateData = {
      updated: timestamp()
    };

    // 更新userInfo字段
    Object.keys(userInfo).forEach(key => {
      const value = userInfo[key];
      if (value !== undefined) {
        updateData[`userInfo.${key}`] = value;
      }
    });

    // 更新备注字段
    if (remark !== undefined) {
      updateData["userInfo.remark"] = remark;
    }

    // 更新数据库中的教师信息
    const updateResult = await updateTeacherInDB(teacherId, updateData);
    if (!updateResult) {
      return {
        success: false,
        message: "更新数据库失败"
      };
    }
    return {
      success: true,
      message: "教师信息更新成功"
    };
  } catch (error) {
    console.error("更新教师信息失败:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "更新失败，请稍后重试"
    };
  }
}

/**
 * 更新教师的特殊身份标识（isWorkAssistant）
 */
export async function updateTeacherSpecialFlags(teacherId, flags) {
  try {
    // 确保当前用户是校长
    await assertIsPrincipal();
    if (!teacherId.trim()) {
      return {
        success: false,
        message: "教师ID不能为空"
      };
    }

    // 检查教师是否存在
    const teacher = await getWxUserById(teacherId.trim());
    if (!teacher) {
      return {
        success: false,
        message: "找不到该教师"
      };
    }

    // 更新教师特殊标识
    const success = await updateUserSpecialFlags(teacherId.trim(), flags);
    if (!success) {
      return {
        success: false,
        message: "更新数据库失败"
      };
    }
    return {
      success: true,
      message: "教师特殊权限更新成功"
    };
  } catch (error) {
    console.error("更新教师特殊标识失败:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "更新失败，请稍后重试"
    };
  }
}
