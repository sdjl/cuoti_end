"use server";

import { createCourse, deleteCourse, getCourseById, getCourses, getCoursesCount, getCourseUsageCount, getPublicQuestionPacks, getPublicQuestionPacksCount, getQuestionPacksByIds, isCourseNameDuplicate, updateCourse } from "../../collection/course.js";
import { updateDoc } from "../../common/database.js";
import { CONFIG_KEYS } from "../../config/constants.js";
import { getSetting } from "../../utils/setting.js";
import { getCurrentSchoolId, isPrincipalFromJWT } from "./mySchool.js";


export async function getMyCourses({
  pageNum = 0,
  pageSize = 20,
  keyword = "",
  subject = "",
  status = "all"
} = {}) {
  const schoolId = await getCurrentSchoolId();
  return getCourses({
    pageNum,
    pageSize,
    keyword,
    schoolId,
    subject,
    status
  });
}


export async function getMyCoursesCount({
  keyword = "",
  subject = "",
  status = "all"
} = {}) {
  const schoolId = await getCurrentSchoolId();
  return getCoursesCount({
    keyword,
    schoolId,
    subject,
    status
  });
}


export async function assertCourseOwnership(courseId) {
  const schoolId = await getCurrentSchoolId();
  const course = await getCourseById(courseId);
  if (!course) {
    throw new Error("课程不存在");
  }
  if (course.schoolId !== schoolId) {
    throw new Error("该课程不属于当前管理的校园");
  }
}


export async function getMyCourseById(courseId) {
  await assertCourseOwnership(courseId);
  return await getCourseById(courseId);
}


export async function createMyCourse(courseData) {
  const schoolId = await getCurrentSchoolId();

  // 检查课程名称是否重复
  const isDuplicate = await isCourseNameDuplicate(schoolId, courseData.name);
  if (isDuplicate) {
    throw new Error("课程名称已存在");
  }

  // 创建课程
  return createCourse({
    schoolId: schoolId,
    subject: courseData.subject,
    name: courseData.name,
    description: courseData.description,
    status: courseData.status,
    questionPackIds: []
  });
}


export async function updateMyCourse(courseId, courseData) {
  await assertCourseOwnership(courseId);
  const schoolId = await getCurrentSchoolId();

  // 检查课程名称是否重复（排除当前课程）
  const isDuplicate = await isCourseNameDuplicate(schoolId, courseData.name, courseId);
  if (isDuplicate) {
    throw new Error("课程名称已存在");
  }

  // 更新课程
  return updateCourse(courseId, {
    subject: courseData.subject,
    name: courseData.name,
    description: courseData.description,
    status: courseData.status
  });
}


export async function deleteMyCourse(courseId) {
  await assertCourseOwnership(courseId);

  // 检查是否有班级正在使用此课程
  const usageCount = await getCourseUsageCount(courseId);
  if (usageCount > 0) {
    throw new Error(`此课程正在被 ${usageCount} 个班级使用，无法删除`);
  }

  // 删除课程
  return deleteCourse(courseId);
}


export async function updateCourseQuestionPacks(courseId, questionPackIds) {
  await assertCourseOwnership(courseId);

  // 更新课程的题集列表
  await updateDoc("course", courseId, {
    questionPackIds: questionPackIds
  });
  return true;
}


export async function getMyQuestionPacksByIds(questionPackIds) {
  return getQuestionPacksByIds(questionPackIds);
}


export async function getMyPublicQuestionPacks({
  pageNum = 0,
  pageSize = 20,
  keyword = "",
  subject = ""
} = {}) {
  return getPublicQuestionPacks({
    pageNum,
    pageSize,
    keyword,
    subject
  });
}


export async function getMyPublicQuestionPacksCount({
  keyword = "",
  subject = ""
} = {}) {
  return getPublicQuestionPacksCount({
    keyword,
    subject
  });
}


export async function getMySubjects() {
  const settings = await getSetting(CONFIG_KEYS.SUBJECTS);
  const subjectConfigs = settings[CONFIG_KEYS.SUBJECTS] || [];
  return subjectConfigs.map(config => config.name);
}

/**
 * 断言当前用户是校长权限
 * @throws {Error} 当当前用户不是校长时抛出异常
 */
export async function assertIsPrincipal() {
  const isPrincipal = await isPrincipalFromJWT();
  if (!isPrincipal) {
    throw new Error("只有校长可以操作课程");
  }
}
