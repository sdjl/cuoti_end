"use server";

import { getDoc } from "../../common/database.js";
// 从校长学校管理模块导出函数
import { getCurrentSchoolFromDB as _getCurrentSchoolFromDB, getCurrentSchoolFromJWT as _getCurrentSchoolFromJWT, getCurrentSchoolId as _getCurrentSchoolId, isPrincipalFromJWT as _isPrincipalFromJWT } from "../principal/mySchool.js";


export const getCurrentSchoolFromJWT = _getCurrentSchoolFromJWT;


export const getCurrentSchoolFromDB = _getCurrentSchoolFromDB;


export const isPrincipalFromJWT = _isPrincipalFromJWT;


export const getCurrentSchoolId = _getCurrentSchoolId;


export async function getCurrentSchoolGrades() {
  const schoolId = await getCurrentSchoolId();
  const school = await getDoc("school", schoolId);
  if (!school) {
    throw new Error("找不到当前校园");
  }
  const schoolDoc = school;

  // 兼容现有数据，如果没有grades字段则返回空数组
  return schoolDoc.grades || [];
}
