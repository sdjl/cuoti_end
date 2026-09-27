"use server";

import { getOne, updateDoc } from "../../../../../lib/common/database.js";
const WX_USER_COLLECTION = "wx_user";

/**
 * 根据openid获取用户文档
 */
export async function getUserByOpenidFromDB(openid) {
  return await getOne(WX_USER_COLLECTION, {
    openid
  });
}

/**
 * 更新用户信息
 */
export async function updateUserInfoInDB(userId, updateData) {
  return await updateDoc(WX_USER_COLLECTION, userId, updateData);
}
