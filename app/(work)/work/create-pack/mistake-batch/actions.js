"use server";

import { getTeacherAllClassRooms } from "../../../../../lib/work/teacher/myClassroom.js";
import { createMistakeBatchTask, getQuestionPacksByTimeRange, getStudentMistakesPreview } from "./datas.js";

/**
 * 获取当前用户管理的班级列表（一次性获取所有正常状态的班级）
 */
export async function getClassRoomsAction({
  status = "all"
} = {}) {
  try {
    return await getTeacherAllClassRooms({
      keyword: "",
      status,
      grade: "all"
    });
  } catch (error) {
    console.error("获取班级列表失败:", error);
    return [];
  }
}

/**
 * 根据班级、科目和时间区间查询题集
 */
export async function getQuestionPacksAction({
  classIds,
  subject,
  startDate,
  endDate
}) {
  try {
    return await getQuestionPacksByTimeRange({
      classIds,
      subject,
      startDate,
      endDate
    });
  } catch (error) {
    console.error("查询题集失败:", error);
    return [];
  }
}

/**
 * 获取学生错题预览数据
 */
export async function getStudentMistakesPreviewAction({
  classIds,
  questionPackIds
}) {
  try {
    return await getStudentMistakesPreview({
      classIds,
      questionPackIds
    });
  } catch (error) {
    console.error("获取学生错题预览数据失败:", error);
    return [];
  }
}

/**
 * 创建批量错题生成任务
 */
export async function createMistakeBatchTaskAction(params) {
  try {
    const taskId = await createMistakeBatchTask(params);
    return {
      success: true,
      taskId
    };
  } catch (error) {
    console.error("创建批量错题任务失败:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "创建任务失败"
    };
  }
}
