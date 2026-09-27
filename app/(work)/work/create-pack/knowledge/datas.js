"use server";

import { getStudentsByClassRoom } from "../../../../../lib/collection/student.js";
import { getPrincipalClassRooms } from "../../../../../lib/work/principal/myClassroom.js";

/**
 * 获取当前用户的所有班级列表
 */
export async function getMyClassRoomsForCreatePack() {
  try {
    return await getPrincipalClassRooms({
      pageNum: 0,
      pageSize: 10000,
      // 获取所有班级
      keyword: "",
      status: "正常",
      grade: "all"
    });
  } catch (error) {
    console.error("获取班级列表失败:", error);
    return [];
  }
}

/**
 * 获取指定班级的所有学生列表
 */
export async function getClassRoomStudents(classRoomId) {
  try {
    return await getStudentsByClassRoom(classRoomId, "在读");
  } catch (error) {
    console.error("获取班级学生列表失败:", error);
    return [];
  }
}
