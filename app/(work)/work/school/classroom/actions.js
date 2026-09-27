"use server";

import { createPrincipalClassRoom, deletePrincipalClassRoom, getPrincipalClassRoomById, getPrincipalClassRooms, getPrincipalClassRoomsCount, updatePrincipalClassRoom } from "../../../../../lib/work/principal/myClassroom.js";


export async function getClassRoomsAction({
  pageNum = 0,
  pageSize = 20,
  keyword = "",
  status = "all",
  grade = "all"
} = {}) {
  try {
    return await getPrincipalClassRooms({
      pageNum,
      pageSize,
      keyword,
      status,
      grade
    });
  } catch (error) {
    console.error("获取班级列表失败:", error);
    return [];
  }
}


export async function getClassRoomsCountAction({
  keyword = "",
  status = "all",
  grade = "all"
} = {}) {
  try {
    return await getPrincipalClassRoomsCount({
      keyword,
      status,
      grade
    });
  } catch (error) {
    console.error("获取班级总数失败:", error);
    return 0;
  }
}

/**
 * 删除班级
 */
export async function deleteClassRoomAction(classRoomId) {
  try {
    if (!classRoomId.trim()) {
      return {
        success: false,
        error: "班级ID不能为空"
      };
    }
    await deletePrincipalClassRoom(classRoomId);
    return {
      success: true
    };
  } catch (error) {
    console.error("删除班级失败:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "删除班级失败"
    };
  }
}

/**
 * 更新班级
 */
export async function updateClassRoomAction(classRoomId, classRoomData) {
  try {
    if (!classRoomId.trim()) {
      return {
        success: false,
        error: "班级ID不能为空"
      };
    }
    await updatePrincipalClassRoom(classRoomId, classRoomData);
    return {
      success: true
    };
  } catch (error) {
    console.error("更新班级失败:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "更新班级失败"
    };
  }
}

/**
 * 创建班级
 */
export async function createClassRoomAction(classRoomData) {
  try {
    const classRoomId = await createPrincipalClassRoom(classRoomData);
    return {
      success: true,
      classRoomId
    };
  } catch (error) {
    console.error("创建班级失败:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "创建班级失败"
    };
  }
}

/**
 * 根据ID获取班级
 */
export async function getClassRoomByIdAction(classRoomId) {
  try {
    const classRoom = await getPrincipalClassRoomById(classRoomId);
    return {
      classRoom
    };
  } catch (error) {
    console.error("获取班级失败:", error);
    return {
      classRoom: null,
      error: error instanceof Error ? error.message : "获取班级失败"
    };
  }
}
