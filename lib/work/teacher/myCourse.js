"use server";

import { getCourseById as getCourseByCourseId, getQuestionPacksByIds } from "../../collection/course.js";
import { addDoc, allDocs, command, count, docs, exists, removeMatch } from "../../common/database.js";
import { assertClassRoomOwnership } from "./myClassroom.js";
import { getCurrentSchoolId } from "./mySchool.js";

// 集合名称常量
const COURSE_COLLECTION = "course";
const CLASS_COURSE_COLLECTION = "class_course";


async function getClassCourseIds(classId) {
  const classCourses = await allDocs({
    c: CLASS_COURSE_COLLECTION,
    match: {
      classId
    },
    project: {
      courseId: 1
    }
  });
  return classCourses.map(cc => cc.courseId);
}


function buildAvailableCoursesWhereCondition(schoolId, existingCourseIds, keyword = "", subject = "", status = "使用中") {
  const _ = command();
  const whereCondition = {
    schoolId
  };

  // 状态筛选
  if (status !== "all") {
    whereCondition.status = status;
  }

  // 排除已有的课程
  if (existingCourseIds.length > 0) {
    whereCondition._id = _.nin(existingCourseIds);
  }

  // 科目筛选
  if (subject.trim()) {
    whereCondition.subject = subject.trim();
  }

  // 关键词搜索
  const orList = [];
  const andList = [whereCondition];
  if (keyword.trim()) {
    const searchRegex = new RegExp(keyword.trim(), "i");
    orList.push({
      name: searchRegex
    }, {
      description: searchRegex
    });
  }
  let finalWhere = whereCondition;
  if (orList.length > 0) {
    finalWhere = _.and(_.or(...orList), ...andList);
  }
  return finalWhere;
}


export async function getClassCourses(classId) {
  // 验证班级权限
  await assertClassRoomOwnership(classId);

  // 获取班级已有的课程ID - 使用子函数
  const courseIds = await getClassCourseIds(classId);
  if (courseIds.length === 0) {
    return [];
  }

  // 获取课程详情
  const _ = command();
  const courses = await allDocs({
    c: COURSE_COLLECTION,
    match: {
      _id: _.in(courseIds)
    },
    sort: {
      created: -1
    }
  });
  return courses;
}


export async function getAvailableCoursesForClass(classId, {
  pageNum = 0,
  pageSize = 20,
  keyword = "",
  subject = "",
  status = "使用中" // 只显示使用中的课程
} = {}) {
  // 验证班级权限
  await assertClassRoomOwnership(classId);
  const schoolId = await getCurrentSchoolId();

  // 获取班级已有的课程ID - 使用子函数
  const existingCourseIds = await getClassCourseIds(classId);

  // 构建查询条件
  const finalWhere = buildAvailableCoursesWhereCondition(schoolId, existingCourseIds, keyword, subject, status);

  // 使用docs函数进行分页查询
  const courses = await docs({
    c: COURSE_COLLECTION,
    w: finalWhere,
    pageNum,
    pageSize,
    orderBy: {
      created: -1
    }
  });
  return courses;
}


export async function getAvailableCoursesForClassCount(classId, {
  keyword = "",
  subject = "",
  status = "使用中" // 只显示使用中的课程
} = {}) {
  // 验证班级权限
  await assertClassRoomOwnership(classId);
  const schoolId = await getCurrentSchoolId();

  // 获取班级已有的课程ID - 使用子函数
  const existingCourseIds = await getClassCourseIds(classId);

  // 构建查询条件
  const finalWhere = buildAvailableCoursesWhereCondition(schoolId, existingCourseIds, keyword, subject, status);
  return count(COURSE_COLLECTION, finalWhere);
}


export async function addCourseToClass(classId, courseId) {
  // 验证班级权限
  await assertClassRoomOwnership(classId);
  const schoolId = await getCurrentSchoolId();

  // 验证课程是否存在且属于当前校园
  const course = await getCourseByCourseId(courseId);
  if (!course) {
    throw new Error("课程不存在");
  }
  if (course.schoolId !== schoolId) {
    throw new Error("无权限添加该课程");
  }
  if (course.status !== "使用中") {
    throw new Error("只能添加使用中的课程");
  }

  // 检查是否已经添加过该课程 - 使用exists函数
  const alreadyExists = await exists(CLASS_COURSE_COLLECTION, {
    classId,
    courseId
  });
  if (alreadyExists) {
    throw new Error("该课程已添加到班级中");
  }

  // 添加课程到班级
  const result = await addDoc(CLASS_COURSE_COLLECTION, {
    classId,
    courseId,
    isCompleted: false,
    completedQuestionPackIds: []
  });
  return !!result;
}


export async function removeCourseFromClass(classId, courseId) {
  // 验证班级权限
  await assertClassRoomOwnership(classId);

  // 移除课程
  const deletedCount = await removeMatch(CLASS_COURSE_COLLECTION, {
    classId,
    courseId
  });
  return deletedCount > 0;
}


export async function getCourseById(courseId) {
  const schoolId = await getCurrentSchoolId();

  // 获取课程
  const course = await getCourseByCourseId(courseId);
  if (!course) {
    return null;
  }

  // 验证权限：只需要验证这个课程属于当前校园即可
  if (course.schoolId !== schoolId) {
    throw new Error("无权限查看该课程");
  }

  // 获取课程关联的题集
  let questionPacks = [];
  if (course.questionPackIds && course.questionPackIds.length > 0) {
    questionPacks = await getQuestionPacksByIds(course.questionPackIds);
  }
  return {
    ...course,
    questionPacks
  };
}
