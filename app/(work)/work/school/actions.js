"use server";

import { getJWTField } from "../../../../lib/utils/auth.js";
import { getPrincipalClassRoomsCount } from "../../../../lib/work/principal/myClassroom.js";
import { getCurrentSchoolFromDB, getCurrentSchoolFromJWT, getCurrentSchoolStudentCount, isPrincipalFromJWT } from "../../../../lib/work/principal/mySchool.js";
import { getCourseCountFromDB } from "./datas.js";

/**
 * 获取当前学校信息
 */
export async function getCurrentSchool() {
  try {
    return await getCurrentSchoolFromJWT();
  } catch (error) {
    console.error("获取当前学校失败:", error);
    return null;
  }
}

/**
 * 获取学校统计数据
 */
export async function getSchoolStats() {
  try {
    // 从数据库获取完整的校园信息（包含adminOpenids和teacherOpenids）
    const currentSchool = await getCurrentSchoolFromDB();
    if (!currentSchool) {
      return {
        teacherCount: 0,
        classroomCount: 0,
        studentCount: 0,
        courseCount: 0
      };
    }

    // 获取教师数量（校长和普通老师）
    const teacherCount = (currentSchool.adminOpenids?.length || 0) + (currentSchool.teacherOpenids?.length || 0);

    // 获取班级数量
    const classroomCount = await getPrincipalClassRoomsCount();

    // 获取学生数量（通过班级studentCount字段求和）
    const studentCount = await getCurrentSchoolStudentCount();

    // 获取课程数量（从 course 集合中查询当前校园的课程）
    const courseCount = await getCourseCountFromDB(currentSchool._id);
    return {
      teacherCount,
      classroomCount,
      studentCount,
      courseCount
    };
  } catch (error) {
    console.error("获取学校统计数据失败:", error);
    return {
      teacherCount: 0,
      classroomCount: 0,
      studentCount: 0,
      courseCount: 0
    };
  }
}

/**
 * 获取当前用户信息
 */
export async function getCurrentUserInfo() {
  try {
    const userInfo = await getJWTField("userInfo");
    const userWxInfo = await getJWTField("userWxInfo");
    const isPrincipal = await isPrincipalFromJWT();
    if (!userInfo || !userWxInfo) {
      return null;
    }
    return {
      userInfo,
      userWxInfo,
      isPrincipal
    };
  } catch (error) {
    console.error("获取当前用户信息失败:", error);
    return null;
  }
}
