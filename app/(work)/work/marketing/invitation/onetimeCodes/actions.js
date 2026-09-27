"use server";

import { createOnetimeInvitationCodes, deleteUnusedInvitationCodes, exportUnusedInvitationCodes, getInvitationCodeById, getOnetimeInvitationCodes, getOnetimeInvitationCodesCount, updateInvitationCode } from "./datas.js";

/**
 * 获取一次性邀请码列表
 */
export async function getOnetimeInvitationCodesAction({
  schoolId,
  pageNum = 0,
  pageSize = 20,
  code = "",
  status = "all",
  isUsed = "all"
}) {
  try {
    // 获取邀请码列表
    const invitationCodes = await getOnetimeInvitationCodes({
      schoolId,
      pageNum,
      pageSize,
      code,
      status,
      isUsed
    });

    // 获取总数
    const totalCount = await getOnetimeInvitationCodesCount({
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
    console.error("获取一次性邀请码列表失败:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "获取一次性邀请码列表失败",
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
 * 批量创建一次性邀请码
 */
export async function createOnetimeInvitationCodesAction({
  schoolId,
  count,
  codeLength,
  prefix,
  experienceDays,
  validDays
}) {
  try {
    const result = await createOnetimeInvitationCodes({
      schoolId,
      count,
      codeLength,
      prefix,
      experienceDays,
      validDays
    });
    if (!result.success) {
      return {
        success: false,
        error: "批量创建邀请码失败"
      };
    }
    return {
      success: true,
      count: result.count,
      ids: result.ids
    };
  } catch (error) {
    console.error("批量创建邀请码失败:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "批量创建邀请码失败"
    };
  }
}

/**
 * 更新邀请码
 */
export async function updateInvitationCodeAction(invitationCodeId, updateData) {
  try {
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

/**
 * 批量删除未使用的邀请码
 */
export async function deleteUnusedInvitationCodesAction({
  schoolId,
  code = "",
  status = "all",
  isUsed = "all"
}) {
  try {
    const result = await deleteUnusedInvitationCodes({
      schoolId,
      code,
      status,
      isUsed
    });
    if (!result.success) {
      return {
        success: false,
        error: "批量删除未使用邀请码失败",
        deletedCount: 0
      };
    }
    return {
      success: true,
      deletedCount: result.deletedCount
    };
  } catch (error) {
    console.error("批量删除未使用邀请码失败:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "批量删除未使用邀请码失败",
      deletedCount: 0
    };
  }
}

/**
 * 导出未使用的邀请码
 */
export async function exportUnusedInvitationCodesAction({
  schoolId,
  code = "",
  status = "all",
  isUsed = "all"
}) {
  try {
    const result = await exportUnusedInvitationCodes({
      schoolId,
      code,
      status,
      isUsed
    });
    if (!result.success) {
      return {
        success: false,
        error: "导出未使用邀请码失败",
        codes: []
      };
    }
    return {
      success: true,
      codes: result.codes
    };
  } catch (error) {
    console.error("导出未使用邀请码失败:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "导出未使用邀请码失败",
      codes: []
    };
  }
}
