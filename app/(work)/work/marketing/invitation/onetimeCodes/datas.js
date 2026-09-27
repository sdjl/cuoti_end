"use server";

import { addDocList, allDocs, command, count, docs, getDoc, removeMatch, updateDoc } from "../../../../../../lib/common/database.js";

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
    type: "onetime",
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
 * 生成随机邀请码
 */
function generateRandomCode(length, prefix) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const remainingLength = length - prefix.length;
  let result = prefix;
  for (let i = 0; i < remainingLength; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * 批量生成唯一的邀请码
 */
async function generateUniqueCodes(count, length, prefix) {
  const codes = [];
  const _ = command();
  while (codes.length < count) {
    // 生成一批邀请码
    const batchSize = Math.min(100, count - codes.length); // 每次生成最多100个
    const newCodes = [];
    for (let i = 0; i < batchSize; i++) {
      newCodes.push(generateRandomCode(length, prefix));
    }

    // 检查这批邀请码是否已存在
    const existingCodes = await allDocs({
      c: INVITATION_CODE_COLLECTION,
      match: {
        code: _.in(newCodes)
      },
      project: {
        code: 1
      }
    });
    const existingCodeSet = new Set(existingCodes.map(item => item.code));

    // 只保留不存在的邀请码
    const uniqueCodes = newCodes.filter(code => !existingCodeSet.has(code));
    codes.push(...uniqueCodes);
  }
  return codes.slice(0, count); // 确保返回精确数量
}

/**
 * 获取一次性邀请码列表（分页）
 */
export async function getOnetimeInvitationCodes({
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
    console.error("获取一次性邀请码失败:", error);
    throw new Error("获取一次性邀请码失败");
  }
}

/**
 * 获取邀请码总数（用于分页）
 */
export async function getOnetimeInvitationCodesCount({
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
    console.error("获取一次性邀请码数量失败:", error);
    throw new Error("获取一次性邀请码数量失败");
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
 * 批量创建一次性邀请码
 */
export async function createOnetimeInvitationCodes({
  schoolId,
  count,
  codeLength,
  prefix,
  experienceDays,
  validDays
}) {
  try {
    // 不允许schoolId为空
    if (!schoolId) {
      throw new Error("schoolId 不能为空");
    }
    // 生成唯一的邀请码
    const codes = await generateUniqueCodes(count, codeLength, prefix);
    const now = Date.now();
    const invitationCodes = codes.map(code => ({
      code,
      type: "onetime",
      status: "active",
      experienceDays,
      validDays,
      schoolId,
      classroomId: "",
      wxUserId: "",
      creatorStudentId: undefined,
      usedCount: 0,
      created: now,
      updated: now
    }));
    const result = await addDocList(INVITATION_CODE_COLLECTION, invitationCodes);
    return {
      success: true,
      count: result.len,
      ids: result.ids
    };
  } catch (error) {
    console.error("批量创建一次性邀请码失败:", error);
    throw new Error("批量创建一次性邀请码失败");
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

/**
 * 批量删除未使用的邀请码
 */
export async function deleteUnusedInvitationCodes({
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
  where.usedCount = 0;
  try {
    const deletedCount = await removeMatch(INVITATION_CODE_COLLECTION, where);
    return {
      success: true,
      deletedCount
    };
  } catch (error) {
    console.error("批量删除未使用邀请码失败:", error);
    throw new Error("批量删除未使用邀请码失败");
  }
}

/**
 * 导出未使用的邀请码
 */
export async function exportUnusedInvitationCodes({
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
  where.usedCount = 0;
  try {
    const invitationCodes = await allDocs({
      c: INVITATION_CODE_COLLECTION,
      match: where,
      project: {
        code: 1
      },
      sort: {
        created: -1
      }
    });
    const codes = invitationCodes.map(item => item.code);
    return {
      success: true,
      codes
    };
  } catch (error) {
    console.error("导出未使用邀请码失败:", error);
    throw new Error("导出未使用邀请码失败");
  }
}
