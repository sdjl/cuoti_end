"use server";

import { allDocs, command } from "../../../../lib/common/database.js";
const CLASS_COURSE_COLLECTION = "class_course";
const STUDENT_COLLECTION = "student";
const STUDENT_CLASS_COLLECTION = "student_class";
const CLASSROOM_COLLECTION = "classroom";

/**
 * 获取班级课程统计信息
 */
export async function getClassCourseStatsFromDB(classIds) {
  if (classIds.length === 0) {
    return {};
  }
  const _ = command();

  // 查询所有班级的课程关联记录
  const classCourseRelations = await allDocs({
    c: CLASS_COURSE_COLLECTION,
    match: {
      classId: _.in(classIds)
    },
    project: {
      classId: 1
    }
  });

  // 统计每个班级的课程数量
  const stats = {};

  // 初始化所有班级的统计为0
  classIds.forEach(classId => {
    stats[classId] = 0;
  });

  // 计算每个班级的课程数量
  classCourseRelations.forEach(relation => {
    stats[relation.classId] = (stats[relation.classId] || 0) + 1;
  });
  return stats;
}


export async function getClassRoomsByIdsFromDB(classIds) {
  if (classIds.length === 0) {
    return [];
  }
  const _ = command();
  const classRooms = await allDocs({
    c: CLASSROOM_COLLECTION,
    match: {
      _id: _.in(classIds)
    },
    sort: {
      created: -1
    }
  });
  return classRooms;
}


export async function searchStudentSuggestionsFromDB(schoolId, keyword) {
  if (!keyword.trim()) {
    return [];
  }
  const _ = command();
  const searchRegex = new RegExp(keyword.trim(), "i");

  // 搜索学生（按姓名或编号）
  const students = await allDocs({
    c: STUDENT_COLLECTION,
    match: _.and({
      schoolId
    },
    // 只搜索当前校园的学生
    _.or({
      name: searchRegex
    },
    // 按姓名搜索
    {
      studentCode: searchRegex
    } // 按编号搜索
    )),
    project: {
      _id: 1,
      name: 1,
      studentCode: 1
    },
    limit: 20 // 限制返回数量
  });
  return students;
}


export async function searchClassIdsByStudentFromDB(schoolId, studentKeyword) {
  if (!studentKeyword.trim()) {
    return [];
  }
  const _ = command();
  const searchRegex = new RegExp(studentKeyword.trim(), "i");

  // 1. 根据姓名或编号搜索学生（只搜索当前校园的学生）
  const students = await allDocs({
    c: STUDENT_COLLECTION,
    match: _.and({
      schoolId
    },
    // 只搜索当前校园的学生
    _.or({
      name: searchRegex
    },
    // 按姓名搜索
    {
      studentCode: searchRegex
    } // 按编号搜索
    )),
    project: {
      _id: 1
    }
  });
  if (students.length === 0) {
    return [];
  }

  // 2. 获取这些学生所在的班级ID
  const studentIds = students.map(s => s._id);
  const studentClassRelations = await allDocs({
    c: STUDENT_CLASS_COLLECTION,
    match: {
      studentId: _.in(studentIds),
      status: "在读" // 只查找在读状态的学生
    },
    project: {
      classRoomId: 1
    }
  });

  // 3. 去重并返回班级ID列表
  const classIds = Array.from(new Set(studentClassRelations.map(r => r.classRoomId)));
  return classIds;
}
