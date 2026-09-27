"use server";

import { getOne, updateDoc } from "../../../../../../../lib/common/database.js";
const WX_USER_COLLECTION = "wx_user";

/**
 * 根据教师ID获取教师信息
 */
export async function getTeacherFromDB(teacherId) {
  return await getOne(WX_USER_COLLECTION, {
    _id: teacherId.trim()
  });
}

/**
 * 更新教师信息
 */
export async function updateTeacherInDB(teacherId, updateData) {
  return await updateDoc(WX_USER_COLLECTION, teacherId.trim(), updateData);
}
