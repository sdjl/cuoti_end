"use server";

import { getDoc } from "../../../../../../../lib/common/database.js";
const SCHOOL_COLLECTION = "school";

/**
 * 获取学校信息
 */
export async function getSchoolDocFromDB(schoolId) {
  return await getDoc(SCHOOL_COLLECTION, schoolId);
}
