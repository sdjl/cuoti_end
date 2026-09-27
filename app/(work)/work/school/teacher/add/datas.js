"use server";

import { getOne } from "../../../../../../lib/common/database.js";
const WX_USER_COLLECTION = "wx_user";

/**
 * 根据openid查询用户信息
 */
export async function getUserByOpenidFromDB(openid) {
  return await getOne(WX_USER_COLLECTION, {
    openid: openid.trim()
  });
}
