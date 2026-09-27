"use server";

import { checkInvitationCodeExists, createInvitationCode, getInvitationCodeById, getPartnerInvitationCodes, getPartnerInvitationCodesCount, updateInvitationCode } from "./datas.js";

/**
 * 获取合作伙伴邀请码列表
 */
export async function getPartnerInvitationCodesAction({
  schoolId,
  pageNum = 0,
  pageSize = 20,
  code = "",
  status = "all",
  isUsed = "all"
}) {
  try {
    // 获取邀请码列表
    const invitationCodes = await getPartnerInvitationCodes({
      schoolId,
      pageNum,
      pageSize,
      code,
      status,
      isUsed
    });

    // 获取总数
    const totalCount = await getPartnerInvitationCodesCount({
      schoolId,
      code,
      status,
      isUsed
    });
    return {
      success: true,
      data: invitationCodes,
      totalCount
    };
  } catch (error) {
    console.error("获取合作伙伴邀请码列表失败:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "获取合作伙伴邀请码列表失败",
      data: [],
      totalCount: 0
    };
  }
}

/**
 * 根据ID获取邀请码详情（从已有数据中查找，避免重复读取数据库）
 */
export async function getInvitationCodeByIdAction(invitationCodeId, existingInvitationCodes) {
  try {
    // 如果提供了已有数据，先从中查找
    if (existingInvitationCodes) {
      const existingInvitationCode = existingInvitationCodes.find(item => item._id === invitationCodeId);
      if (existingInvitationCode) {
        return {
          success: true,
          invitationCode: existingInvitationCode
        };
      }
    }

    // 如果没有找到，再从数据库读取
    const invitationCode = await getInvitationCodeById(invitationCodeId);
    if (!invitationCode) {
      return {
        success: false,
        error: "邀请码不存在",
        invitationCode: null
      };
    }
    return {
      success: true,
      invitationCode
    };
  } catch (error) {
    console.error("获取邀请码详情失败:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "获取邀请码详情失败",
      invitationCode: null
    };
  }
}

/**
 * 创建邀请码
 */
export async function createInvitationCodeAction(invitationCodeData) {
  try {
    // 不允许schoolId为空
    if (!invitationCodeData.schoolId) {
      throw new Error("schoolId 不能为空");
    }
    // 检查邀请码是否已存在
    const codeExists = await checkInvitationCodeExists(invitationCodeData.code, invitationCodeData.schoolId);
    if (codeExists) {
      return {
        success: false,
        error: "邀请码已存在"
      };
    }
    const result = await createInvitationCode(invitationCodeData);
    if (!result.success) {
      return {
        success: false,
        error: "创建邀请码失败"
      };
    }
    return {
      success: true,
      id: result.id
    };
  } catch (error) {
    console.error("创建邀请码失败:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "创建邀请码失败"
    };
  }
}

/**
 * 更新邀请码
 */
export async function updateInvitationCodeAction(invitationCodeId, updateData) {
  try {
    // 如果要更新邀请码，检查是否已存在
    if (updateData.code) {
      const codeExists = await checkInvitationCodeExists(updateData.code, updateData.schoolId, invitationCodeId);
      if (codeExists) {
        return {
          success: false,
          error: "邀请码已存在"
        };
      }
    }
    const {
      success
    } = await updateInvitationCode(invitationCodeId, updateData);
    if (!success) {
      return {
        success: false,
        error: "更新邀请码失败"
      };
    }
    return {
      success: true
    };
  } catch (error) {
    console.error("更新邀请码失败:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "更新邀请码失败"
    };
  }
}
