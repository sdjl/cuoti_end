"use server";

import { count } from "../../../../lib/common/database.js";

/**
 * 获取课程数量
 */
export async function getCourseCountFromDB(schoolId) {
  return await count("course", {
    schoolId
  });
}
