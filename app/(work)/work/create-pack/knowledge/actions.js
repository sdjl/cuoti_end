"use server";

import { getClassRoomStudents, getMyClassRoomsForCreatePack } from "./datas.js";

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
