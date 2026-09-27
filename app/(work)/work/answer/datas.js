"use server";

import { allDocs, command } from "../../../../lib/common/database.js";

/**
 * 从数据库获取所有班级的课程关联关系
 */
export async function getClassCoursesFromDB(classIds) {
  const _ = command();
  return await allDocs({
    c: "class_course",
    match: {
      classId: _.in(classIds),
      isCompleted: false // 只获取未完成的课程
    }
  });
}

/**
 * 从数据库获取多个课程信息
 */
export async function getCoursesFromDB(courseIds) {
  const _ = command();
  return await allDocs({
    c: "course",
    match: {
      _id: _.in(courseIds)
    }
  });
}
