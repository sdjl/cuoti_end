"use server";

import { getStudentsByClassRoom } from "../../../../../../lib/collection/student.js";
import { getTeacherAllClassRooms } from "../../../../../../lib/work/teacher/myClassroom.js";
import { getCurrentSchoolId } from "../../../../../../lib/work/teacher/mySchool.js";
import { getClassroomShareStatistics, getStudentShareStatistics } from "./datas.js";

/**
 * 获取班级分享统计数据Action
 */
export async function getClassroomShareStatisticsAction(filter) {
  try {
    // 获取当前校园ID
    const schoolId = await getCurrentSchoolId();

    // 获取班级所有学生
    let students = [];
    if (filter.classRoomId) {
      students = await getStudentsByClassRoom(filter.classRoomId);
    }
    const result = await getClassroomShareStatistics(filter, schoolId, students);
    return {
      success: true,
      data: result
    };
  } catch (error) {
    console.error("获取班级分享统计失败:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "获取班级分享统计数据失败"
    };
  }
}

/**
 * 获取学生个人分享统计数据Action
 */
export async function getStudentShareStatisticsAction(filter) {
  try {
    // 获取当前校园ID
    const schoolId = await getCurrentSchoolId();
    if (!filter.studentId || !filter.classRoomId) {
      return {
        success: false,
        error: "学生ID和班级ID不能为空"
      };
    }

    // 获取学生信息
    const students = await getStudentsByClassRoom(filter.classRoomId);
    const student = students.find(s => s._id === filter.studentId);
    if (!student) {
      return {
        success: false,
        error: "未找到指定学生"
      };
    }
    const result = await getStudentShareStatistics(filter, schoolId, student);
    return {
      success: true,
      data: result
    };
  } catch (error) {
    console.error("获取学生分享统计失败:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "获取学生分享统计数据失败"
    };
  }
}

/**
 * 获取当前用户管理的班级列表Action
 */
export async function getClassRoomsAction() {
  try {
    const classRooms = await getTeacherAllClassRooms();
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
    const students = await getStudentsByClassRoom(classRoomId);
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
