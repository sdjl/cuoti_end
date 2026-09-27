"use server";

import { allDocs, command, getDoc, updateDoc, updateMatch } from "../../../../../../lib/common/database.js";

/**
 * 从数据库获取学校信息
 */
export async function getSchoolFromDB(schoolId) {
  return await getDoc("school", schoolId);
}

/**
 * 从数据库获取所有校长用户
 */
export async function getPrincipalsFromDB() {
  const _ = command();

  // 查询所有拥有校长角色的用户
  return await allDocs({
    c: "wx_user",
    match: {
      roles: _.in(["principal"]),
      status: "active" // 只获取活跃状态的用户
    },
    sort: {
      created: -1
    },
    // 按创建时间倒序
    only: "openid,userWxInfo,userInfo,roles,status" // 只获取需要的字段
  });
}

/**
 * 更新学校信息
 */
export async function updateSchoolInDB(schoolId, updateData) {
  return await updateDoc("school", schoolId, updateData);
}

/**
 * 批量更新班级的教师列表，移除校长用户
 */
export async function removeAdminsFromClassroomsInDB(schoolId, adminOpenids) {
  const _ = command();
  return await updateMatch("classroom", {
    schoolId: schoolId,
    teacherOpenids: _.in(adminOpenids) // 查找包含任意校长openid的班级
  }, {
    teacherOpenids: _.pullAll(adminOpenids),
    // 从数组中移除所有校长openids
    updated: Date.now()
  });
}
