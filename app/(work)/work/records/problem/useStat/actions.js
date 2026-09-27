"use server";

import { DISPLAY_TEXT } from "../../../../../../lib/config/constants.js";
import { getClassRoomStudents, getMyClassRoomsForCreatePack } from "../../../create-pack/knowledge/datas.js";
import { getAIQuestionStatistics, getStudentAIQuestionStatistics } from "./datas.js";
export async function getAIQuestionStatisticsAction(filter) {
  try {
    const result = await getAIQuestionStatistics(filter);
    return {
      success: true,
      data: result
    };
  } catch (error) {
    console.error(`获取${DISPLAY_TEXT.SELF_UPLOAD_MISTAKE}统计失败:`, error);
    return {
      success: false,
      error: "获取统计数据失败"
    };
  }
}

/**
 * 获取班级列表Action
 */
export async function getClassRoomsAction() {
  try {
    const classRooms = await getMyClassRoomsForCreatePack();
    return {
      success: true,
      data: classRooms
    };
  } catch (error) {
    console.error("获取班级列表失败:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "获取班级列表失败"
    };
  }
}

/**
 * 获取班级学生列表Action
 */
export async function getClassRoomStudentsAction(classRoomId) {
  try {
    if (!classRoomId) {
      return {
        success: false,
        error: "班级ID不能为空"
      };
    }
    const students = await getClassRoomStudents(classRoomId);
    return {
      success: true,
      data: students
    };
  } catch (error) {
    console.error("获取班级学生列表失败:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "获取班级学生列表失败"
    };
  }
}

/**
 * 获取学生自主上传错题统计数据Action
 */
export async function getStudentAIQuestionStatisticsAction(classRoomId, filter) {
  try {
    if (!classRoomId) {
      return {
        success: false,
        error: "班级ID不能为空"
      };
    }
    const statistics = await getStudentAIQuestionStatistics(classRoomId, filter);
    return {
      success: true,
      data: statistics
    };
  } catch (error) {
    console.error(`获取学生${DISPLAY_TEXT.SELF_UPLOAD_MISTAKE}统计数据失败:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : `获取学生${DISPLAY_TEXT.SELF_UPLOAD_MISTAKE}统计数据失败`
    };
  }
}
