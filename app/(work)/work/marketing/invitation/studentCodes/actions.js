"use server";

import { getClassroomsByIds, getInvitationCodeById, getStudentInvitationCodes, getStudentInvitationCodesCount, getStudentsByIds, updateInvitationCode } from "./datas.js";

/**
 * 获取学生邀请码列表
 */
export async function getStudentInvitationCodesAction({
  pageNum = 0,
  pageSize = 20,
  schoolId,
  code = "",
  status = "all",
  isUsed = "all"
}) {
  try {
    // 获取邀请码列表
    const invitationCodes = await getStudentInvitationCodes({
      pageNum,
      pageSize,
      schoolId,
      code,
      status,
      isUsed
    });

    // 获取总数
    const totalCount = await getStudentInvitationCodesCount({
      schoolId,
      code,
      status,
      isUsed
    });

    // 获取相关的学生和班级信息
    const studentIds = invitationCodes.map(item => item.creatorStudentId).filter(Boolean);
    const classroomIds = invitationCodes.map(item => item.classroomId);
    const [students, classrooms] = await Promise.all([getStudentsByIds(studentIds), getClassroomsByIds(classroomIds)]);

    // 创建查找映射
    const studentMap = new Map(students.map(s => [s._id, s]));
    const classroomMap = new Map(classrooms.map(c => [c._id, c]));

    // 扩展邀请码信息
    const enrichedInvitationCodes = invitationCodes.map(item => ({
      ...item,
      student: item.creatorStudentId ? studentMap.get(item.creatorStudentId) : null,
      classroom: classroomMap.get(item.classroomId)
    }));
    return {
      success: true,
      data: enrichedInvitationCodes,
      totalCount
    };
  } catch (error) {
    console.error("获取学生邀请码列表失败:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "获取学生邀请码列表失败",
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

    // 获取相关的学生和班级信息
    const [students, classrooms] = await Promise.all([invitationCode.creatorStudentId ? getStudentsByIds([invitationCode.creatorStudentId]) : Promise.resolve([]), getClassroomsByIds([invitationCode.classroomId])]);
    const enrichedInvitationCode = {
      ...invitationCode,
      student: students[0] || null,
      classroom: classrooms[0] || null
    };
    return {
      success: true,
      invitationCode: enrichedInvitationCode
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
