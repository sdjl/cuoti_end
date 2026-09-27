"use server";

import { allDocs, command, count, docs, getDoc, updateDoc } from "../../../../../../lib/common/database.js";

/** 邀请码集合名称 */
const INVITATION_CODE_COLLECTION = "invitation_code";

/** 学生集合名称 */
const STUDENT_COLLECTION = "student";

/** 班级集合名称 */
const CLASSROOM_COLLECTION = "classroom";

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
    type: "student",
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
 * 获取学生邀请码列表（分页）
 */
export async function getStudentInvitationCodes({
  pageNum = 0,
  pageSize = 20,
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
    console.error("获取学生邀请码失败:", error);
    throw new Error("获取学生邀请码失败");
  }
}

/**
 * 获取邀请码总数（用于分页）
 */
export async function getStudentInvitationCodesCount({
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
    console.error("获取学生邀请码数量失败:", error);
    throw new Error("获取学生邀请码数量失败");
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
 * 获取相关的学生信息
 */
export async function getStudentsByIds(studentIds) {
  if (studentIds.length === 0) return [];
  const _ = command();
  try {
    const students = await allDocs({
      c: STUDENT_COLLECTION,
      match: {
        _id: _.in(studentIds)
      }
    });
    return students;
  } catch (error) {
    console.error("获取学生信息失败:", error);
    throw new Error("获取学生信息失败");
  }
}

/**
 * 获取相关的班级信息
 */
export async function getClassroomsByIds(classroomIds) {
  if (classroomIds.length === 0) return [];
  const _ = command();
  try {
    const classrooms = await allDocs({
      c: CLASSROOM_COLLECTION,
      match: {
        _id: _.in(classroomIds)
      }
    });
    return classrooms;
  } catch (error) {
    console.error("获取班级信息失败:", error);
    throw new Error("获取班级信息失败");
  }
}
