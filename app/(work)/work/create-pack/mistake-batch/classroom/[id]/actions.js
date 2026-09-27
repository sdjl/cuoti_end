"use server";

import { getCurrentSchoolId } from "../../../../../../../lib/work/teacher/mySchool.js";
import { getClassroomInfoFromDB, getClassroomStudentPdfsFromDB, getClassroomTasksFromDB } from "./datas.js";
/**
 * 获取班级信息
 */
export async function getClassroomInfoAction(classId) {
  const schoolId = await getCurrentSchoolId();
  return await getClassroomInfoFromDB(schoolId, classId);
}

/**
 * 获取班级的所有任务数据
 */
export async function getClassroomTasksAction(classId) {
  const schoolId = await getCurrentSchoolId();
  return await getClassroomTasksFromDB(schoolId, classId);
}

/**
 * 获取班级在某个任务下的学生PDF数据
 */
export async function getClassroomStudentPdfsAction(classId, taskId) {
  const schoolId = await getCurrentSchoolId();
  return await getClassroomStudentPdfsFromDB(schoolId, classId, taskId);
}
