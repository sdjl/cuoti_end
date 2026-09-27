"use server";

import { getCurrentUserOpenid } from "../../../../../../lib/utils/auth.js";
import { getTeacherAllClassRooms } from "../../../../../../lib/work/teacher/myClassroom.js";
import { createManualRecord, getManualRecordById, getManualRecords, getManualRecordsCount, searchStudentsInClass, updateManualRecordReason } from "./datas.js";

/**
 * 获取手动积分记录列表
 */
export async function getManualRecordsAction({
  classIds,
  pageNum = 0,
  pageSize = 20,
  selectedClassId = "all",
  searchText = "",
  studentSearch = ""
}) {
  try {
    // 不允许classIds为空
    if (!classIds || classIds.length === 0) {
      throw new Error("classIds 不能为空");
    }

    // 获取手动积分记录列表
    const records = await getManualRecords({
      classIds,
      pageNum,
      pageSize,
      selectedClassId,
      searchText,
      studentSearch
    });

    // 获取总数
    const totalCount = await getManualRecordsCount({
      classIds,
      selectedClassId,
      searchText,
      studentSearch
    });
    return {
      success: true,
      data: records,
      totalCount
    };
  } catch (error) {
    console.error("获取手动积分记录列表失败:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "获取手动积分记录列表失败",
      data: [],
      totalCount: 0
    };
  }
}

/**
 * 获取当前用户可查看的班级列表
 */
export async function getAvailableClassroomsAction() {
  try {
    const classrooms = await getTeacherAllClassRooms();
    return {
      success: true,
      data: classrooms
    };
  } catch (error) {
    console.error("获取班级列表失败:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "获取班级列表失败",
      data: []
    };
  }
}

/**
 * 获取单个手动积分记录详情
 */
export async function getManualRecordByIdAction(recordId) {
  try {
    const record = await getManualRecordById(recordId);
    if (!record) {
      return {
        success: false,
        error: "手动积分记录不存在",
        record: null
      };
    }
    return {
      success: true,
      record
    };
  } catch (error) {
    console.error("获取手动积分记录详情失败:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "获取手动积分记录详情失败",
      record: null
    };
  }
}

/**
 * 创建手动积分记录
 */
export async function createManualRecordAction({
  schoolId,
  classroomId,
  studentId,
  points,
  reason
}) {
  try {
    // 获取当前用户ID
    const operatorUserId = await getCurrentUserOpenid();
    if (!operatorUserId) {
      return {
        success: false,
        error: "未能获取当前用户信息"
      };
    }
    const result = await createManualRecord({
      schoolId,
      classroomId,
      studentId,
      points,
      reason,
      operatorUserId
    });
    return result;
  } catch (error) {
    console.error("创建手动积分记录失败:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "创建手动积分记录失败"
    };
  }
}

/**
 * 更新手动积分记录原因
 */
export async function updateManualRecordReasonAction({
  recordId,
  reason
}) {
  try {
    const result = await updateManualRecordReason({
      recordId,
      reason
    });
    return result;
  } catch (error) {
    console.error("更新手动积分记录原因失败:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "更新修改原因失败"
    };
  }
}

/**
 * 在指定班级中搜索学生
 */
export async function searchStudentsInClassAction({
  classId,
  searchText
}) {
  try {
    const students = await searchStudentsInClass(classId, searchText);
    return {
      success: true,
      students
    };
  } catch (error) {
    console.error("搜索班级学生失败:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "搜索学生失败",
      students: []
    };
  }
}
