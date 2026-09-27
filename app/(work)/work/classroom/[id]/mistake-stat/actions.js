"use server";

import { getCurrentSchoolId } from "../../../../../../lib/work/teacher/mySchool.js";
import { getClassCourseMistakeStats, getClassRoomById, getClassSelfUploadMistakeStats } from "./datas.js";
/**
 * 获取班级信息
 */
export async function getClassRoomAction(classId) {
  const schoolId = await getCurrentSchoolId();

  // 获取班级信息
  const classroom = await getClassRoomById(classId);
  if (!classroom) {
    throw new Error("班级不存在");
  }

  // 验证班级是否属于当前校园
  if (classroom.schoolId !== schoolId) {
    throw new Error("无权访问该班级");
  }
  return classroom;
}

/**
 * 获取班级课程错题统计
 */
export async function getCourseMistakeStatsAction(classId) {
  const schoolId = await getCurrentSchoolId();

  // 验证班级权限
  const classroom = await getClassRoomById(classId);
  if (!classroom || classroom.schoolId !== schoolId) {
    throw new Error("无权访问该班级");
  }
  return await getClassCourseMistakeStats(classId);
}

/**
 * 获取班级自主上传错题统计
 */
export async function getSelfUploadMistakeStatsAction(classId) {
  const schoolId = await getCurrentSchoolId();

  // 验证班级权限
  const classroom = await getClassRoomById(classId);
  if (!classroom || classroom.schoolId !== schoolId) {
    throw new Error("无权访问该班级");
  }
  return await getClassSelfUploadMistakeStats(classId);
}
