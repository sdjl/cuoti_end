"use server";

import { getTeacherAllClassRooms } from "../../../../../../lib/work/teacher/myClassroom.js";
import { getPointsHistoryRecords, getPointsHistoryRecordsCount } from "./datas.js";

/**
 * 获取积分变动记录列表
 */
export async function getPointsHistoryRecordsAction({
  classIds,
  pageNum = 0,
  pageSize = 20,
  selectedClassId = "all",
  studentSearch = "",
  growthType = "all",
  isShowInGrowthPath = "all",
  targetStudentId = null
}) {
  try {
    // 不允许classIds为空
    if (!classIds || classIds.length === 0) {
      throw new Error("classIds 不能为空");
    }

    // 获取积分变动记录列表
    const records = await getPointsHistoryRecords({
      classIds,
      pageNum,
      pageSize,
      selectedClassId,
      studentSearch,
      growthType,
      isShowInGrowthPath,
      targetStudentId
    });

    // 获取总数
    const totalCount = await getPointsHistoryRecordsCount({
      classIds,
      selectedClassId,
      studentSearch,
      growthType,
      isShowInGrowthPath,
      targetStudentId
    });
    return {
      success: true,
      data: records,
      totalCount
    };
  } catch (error) {
    console.error("获取积分变动记录列表失败:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "获取积分变动记录列表失败",
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
    console.error("获取可查看班级列表失败:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "获取可查看班级列表失败",
      data: []
    };
  }
}
