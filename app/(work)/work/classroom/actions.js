"use server";

import { getTeacherAllClassRooms, getTeacherAllClassRoomsCount, getTeacherClassRoomById } from "../../../../lib/work/teacher/myClassroom.js";
import { getCurrentSchoolId, isPrincipalFromJWT } from "../../../../lib/work/teacher/mySchool.js";
import { getClassCourseStatsFromDB, getClassRoomsByIdsFromDB, searchClassIdsByStudentFromDB, searchStudentSuggestionsFromDB } from "./datas.js";

/**
 * 获取当前用户管理的班级列表
 */
export async function getClassRoomsAction({
  keyword = "",
  status = "all",
  grade = "all"
} = {}) {
  try {
    return await getTeacherAllClassRooms({
      keyword,
      status,
      grade
    });
  } catch (error) {
    console.error("获取班级列表失败:", error);
    return [];
  }
}

/**
 * 获取当前用户管理的班级总数
 */
export async function getClassRoomsCountAction({
  keyword = "",
  status = "all",
  grade = "all"
} = {}) {
  try {
    return await getTeacherAllClassRoomsCount({
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
 * 根据ID获取班级详情
 */
export async function getClassRoomByIdAction(classRoomId) {
  try {
    const classRoom = await getTeacherClassRoomById(classRoomId);
    return {
      classRoom
    };
  } catch (error) {
    console.error("获取班级详情失败:", error);
    return {
      classRoom: null,
      error: error instanceof Error ? error.message : "获取班级详情失败"
    };
  }
}

/**
 * 检查当前用户是否是校长
 */
export async function checkIsPrincipalAction() {
  try {
    return await isPrincipalFromJWT();
  } catch (error) {
    console.error("检查用户权限失败:", error);
    return false;
  }
}

/**
 * 获取班级课程统计信息
 */
export async function getClassRoomCourseStatsAction(classIds) {
  try {
    return await getClassCourseStatsFromDB(classIds);
  } catch (error) {
    console.error("获取班级课程统计失败:", error);
    return {};
  }
}

/**
 * 根据班级ID列表获取班级信息
 */
export async function getClassRoomsByIdsAction(classIds) {
  try {
    return await getClassRoomsByIdsFromDB(classIds);
  } catch (error) {
    console.error("根据ID列表获取班级失败:", error);
    return [];
  }
}

/**
 * 搜索学生姓名建议列表
 */
export async function searchStudentSuggestionsAction(keyword) {
  try {
    const schoolId = await getCurrentSchoolId();
    return await searchStudentSuggestionsFromDB(schoolId, keyword);
  } catch (error) {
    console.error("搜索学生建议失败:", error);
    return [];
  }
}

/**
 * 根据学生姓名或编号搜索班级ID列表
 */
export async function searchClassIdsByStudentAction(studentKeyword) {
  try {
    const schoolId = await getCurrentSchoolId();
    return await searchClassIdsByStudentFromDB(schoolId, studentKeyword);
  } catch (error) {
    console.error("根据学生搜索班级失败:", error);
    return [];
  }
}
