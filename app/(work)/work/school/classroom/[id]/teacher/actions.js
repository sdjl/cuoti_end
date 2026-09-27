"use server";

import { getPrincipalClassRoomById, updatePrincipalClassRoom } from "../../../../../../../lib/work/principal/myClassroom.js";
import { getCurrentSchoolFromDB } from "../../../../../../../lib/work/principal/mySchool.js";
import { getSchoolTeachersFromDB } from "./datas.js";

/**
 * 获取班级详情
 */
export async function getClassRoomDetailAction(classRoomId) {
  try {
    const classRoom = await getPrincipalClassRoomById(classRoomId);
    if (!classRoom) {
      return {
        success: false,
        error: "班级不存在"
      };
    }
    return {
      success: true,
      data: classRoom
    };
  } catch (error) {
    console.error("获取班级详情失败:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "获取班级详情失败"
    };
  }
}

/**
 * 获取当前校园的所有教师
 */
export async function getSchoolTeachersAction() {
  try {
    // 获得当前校园
    const currentSchool = await getCurrentSchoolFromDB();
    if (!currentSchool || currentSchool.teacherOpenids.length === 0) {
      return {
        success: true,
        data: []
      };
    }

    // 使用allDocs获取所有教师的完整信息
    const teacherDocs = await getSchoolTeachersFromDB(currentSchool.teacherOpenids);
    return {
      success: true,
      data: teacherDocs
    };
  } catch (error) {
    console.error("获取校园教师失败:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "获取校园教师失败"
    };
  }
}

/**
 * 更新班级的教师队伍
 */
export async function updateClassRoomTeachersAction(classRoomId, teacherOpenids) {
  try {
    await updatePrincipalClassRoom(classRoomId, {
      teacherOpenids,
      updated: Date.now()
    });
    return {
      success: true
    };
  } catch (error) {
    console.error("更新班级教师队伍失败:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "更新班级教师队伍失败"
    };
  }
}
