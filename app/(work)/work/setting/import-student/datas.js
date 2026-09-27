"use server";

import { getDoc, updateDoc } from "../../../../../lib/common/database.js";
const SCHOOL_COLLECTION = "school";

/**
 * 获取学校文档
 */
export async function getSchoolDocFromDB(schoolId) {
  return await getDoc(SCHOOL_COLLECTION, schoolId);
}

/**
 * 更新学校配置
 */
export async function updateSchoolConfigInDB(schoolId, config) {
  return await updateDoc(SCHOOL_COLLECTION, schoolId, {
    config
  });
}
