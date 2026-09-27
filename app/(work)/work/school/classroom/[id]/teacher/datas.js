"use server";

import { allDocs, command } from "../../../../../../../lib/common/database.js";
const WX_USER_COLLECTION = "wx_user";

/**
 * 获取校园的所有教师
 */
export async function getSchoolTeachersFromDB(teacherOpenids) {
  if (teacherOpenids.length === 0) {
    return [];
  }
  const _ = command();
  const teacherDocs = await allDocs({
    c: WX_USER_COLLECTION,
    match: {
      openid: _.in(teacherOpenids)
    },
    sort: {
      created: -1
    } // 按创建时间排序
  });
  return teacherDocs;
}
