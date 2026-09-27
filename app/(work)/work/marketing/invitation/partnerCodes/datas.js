"use server";

import { addDoc, command, count, docs, exists, getDoc, updateDoc } from "../../../../../../lib/common/database.js";

/** 邀请码集合名称 */
const INVITATION_CODE_COLLECTION = "invitation_code";

/**
 * 构建查询条件
 */
function buildQueryConditions({
  schoolId,
  code = "",
  status = "all",
  isUsed = "all"
}) {
  const _ = command();

  // 不允许schoolId为空
  if (!schoolId) {
    throw new Error("schoolId 不能为空");
  }
  const where = {
    type: "partner",
    schoolId
  };

  // 按邀请码过滤
  if (code.trim()) {
    where.code = new RegExp(code.trim(), "i");
  }

  // 按状态过滤
  if (status !== "all") {
    where.status = status;
  }

  // 按是否使用过过滤
  if (isUsed === "used") {
    where.usedCount = _.gt(0);
  } else if (isUsed === "unused") {
    where.usedCount = 0;
  }
  return where;
}

/**
 * 获取合作伙伴邀请码列表（分页）
 */
export async function getPartnerInvitationCodes({
  schoolId,
  pageNum = 0,
  pageSize = 20,
  code = "",
  status = "all",
  isUsed = "all"
}) {
  const where = buildQueryConditions({
    schoolId,
    code,
    status,
    isUsed
  });
  try {
    const invitationCodes = await docs({
      c: INVITATION_CODE_COLLECTION,
      w: where,
      pageNum,
      pageSize,
      orderBy: {
        created: -1
      }
    });
    return invitationCodes;
  } catch (error) {
    console.error("获取合作伙伴邀请码失败:", error);
    throw new Error("获取合作伙伴邀请码失败");
  }
}

/**
 * 获取邀请码总数（用于分页）
 */
export async function getPartnerInvitationCodesCount({
  schoolId,
  code = "",
  status = "all",
  isUsed = "all"
}) {
  const where = buildQueryConditions({
    schoolId,
    code,
    status,
    isUsed
  });
  try {
    const totalCount = await count(INVITATION_CODE_COLLECTION, where);
    return totalCount;
  } catch (error) {
    console.error("获取合作伙伴邀请码数量失败:", error);
    throw new Error("获取合作伙伴邀请码数量失败");
  }
}

/**
 * 根据ID获取单个邀请码
 */
export async function getInvitationCodeById(invitationCodeId) {
  try {
    const invitationCode = await getDoc(INVITATION_CODE_COLLECTION, invitationCodeId);
    return invitationCode;
  } catch (error) {
    console.error("获取邀请码详情失败:", error);
    throw new Error("获取邀请码详情失败");
  }
}

/**
 * 检查邀请码是否已存在
 */
export async function checkInvitationCodeExists(code, schoolId, excludeId) {
  try {
    const where = {
      code,
      schoolId
    };

    // 如果提供了排除的ID，则排除该ID
    if (excludeId) {
      const _ = command();
      where._id = _.neq(excludeId);
    }
    const isExists = await exists(INVITATION_CODE_COLLECTION, where);
    return isExists;
  } catch (error) {
    console.error("检查邀请码是否存在失败:", error);
    throw new Error("检查邀请码是否存在失败");
  }
}

/**
 * 创建新的邀请码
 */
export async function createInvitationCode(invitationCodeData) {
  try {
    const now = Date.now();
    const newInvitationCode = {
      ...invitationCodeData,
      type: "partner",
      classroomId: "",
      wxUserId: "",
      creatorStudentId: undefined,
      usedCount: 0,
      created: now,
      updated: now
    };
    const id = await addDoc(INVITATION_CODE_COLLECTION, newInvitationCode);
    return {
      success: true,
      id
    };
  } catch (error) {
    console.error("创建邀请码失败:", error);
    throw new Error("创建邀请码失败");
  }
}

/**
 * 更新邀请码
 */
export async function updateInvitationCode(invitationCodeId, updateData) {
  try {
    const success = await updateDoc(INVITATION_CODE_COLLECTION, invitationCodeId, {
      ...updateData,
      updated: Date.now()
    });
    return {
      success
    };
  } catch (error) {
    console.error("更新邀请码失败:", error);
    throw new Error("更新邀请码失败");
  }
}
