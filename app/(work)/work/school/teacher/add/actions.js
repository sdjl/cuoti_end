"use server";

import { addTeacherToCurrentSchool } from "../../../../../../lib/work/principal/mySchool.js";
import { getUserByOpenidFromDB } from "./datas.js";


export async function searchUserByOpenidAction(openid) {
  try {
    if (!openid.trim()) {
      return {
        user: null,
        error: "请输入有效的openid"
      };
    }
    const user = await getUserByOpenidFromDB(openid);
    return {
      user
    };
  } catch (error) {
    console.error("查询用户失败:", error);
    return {
      user: null,
      error: error instanceof Error ? error.message : "查询用户失败"
    };
  }
}


export async function addTeacherAction(teacherOpenid) {
  try {
    if (!teacherOpenid.trim()) {
      return {
        success: false,
        error: "请输入有效的openid"
      };
    }
    await addTeacherToCurrentSchool(teacherOpenid.trim());
    return {
      success: true
    };
  } catch (error) {
    console.error("添加教师失败:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "添加教师失败"
    };
  }
}
