"use server";

import { getClassRoomById, updateClassRoom } from "../../collection/classroom.js";
import { allDocs, command, count } from "../../common/database.js";
import { getCurrentUserOpenid } from "../../utils/auth.js";
import { getCurrentSchoolId, isPrincipalFromJWT } from "./mySchool.js";


function buildTeacherClassRoomWhereCondition({
  keyword = "",
  schoolId,
  status = "all",
  grade = "all",
  teacherOpenid
}) {
  const _ = command();
  const orList = [];
  const andList = [];

  // 关键词搜索（班级名称、班主任姓名、班主任电话、描述）
  if (keyword.trim()) {
    const searchRegex = new RegExp(keyword.trim(), "i");
    orList.push({
      name: searchRegex
    }, {
      headTeacher: searchRegex
    }, {
      headTeacherPhone: searchRegex
    }, {
      description: searchRegex
    });
  }

  // 学校ID筛选
  andList.push({
    schoolId
  }); // 校园ID现在是必须传入的

  // 状态筛选
  if (status && status !== "all") {
    andList.push({
      status
    });
  }

  // 年级筛选
  if (grade && grade !== "all") {
    andList.push({
      grade
    });
  }

  // 教师权限筛选（教师只能看到自己管理的班级）
  if (teacherOpenid) {
    andList.push({
      teacherOpenids: _.in([teacherOpenid])
    });
  }

  // 构建最终的查询条件
  let where = {};
  if (orList.length > 0 && andList.length > 0) {
    where = _.and(_.or(...orList), ...andList);
  } else if (orList.length > 0) {
    where = _.or(...orList);
  } else if (andList.length > 0) {
    where = _.and(...andList);
  }
  return where;
}


export async function getTeacherAllClassRooms({
  keyword = "",
  status = "all",
  grade = "all"
} = {}) {
  const schoolId = await getCurrentSchoolId();
  const isPrincipal = await isPrincipalFromJWT();

  // 如果是教师，需要获取当前用户的openid用于权限过滤
  let teacherOpenid;
  if (!isPrincipal) {
    const openid = await getCurrentUserOpenid();
    if (!openid) {
      return [];
    }
    teacherOpenid = openid;
  }

  // 使用统一的查询条件构建函数
  const where = buildTeacherClassRoomWhereCondition({
    keyword,
    schoolId,
    status,
    grade,
    teacherOpenid // 校长时为undefined，教师时为具体的openid
  });
  return allDocs({
    c: "classroom",
    match: where,
    sort: {
      created: -1
    }
  });
}


export async function getTeacherAllClassRoomsCount({
  keyword = "",
  status = "all",
  grade = "all"
} = {}) {
  const schoolId = await getCurrentSchoolId();
  const isPrincipal = await isPrincipalFromJWT();

  // 如果是教师，需要获取当前用户的openid用于权限过滤
  let teacherOpenid;
  if (!isPrincipal) {
    const openid = await getCurrentUserOpenid();
    if (!openid) {
      return 0;
    }
    teacherOpenid = openid;
  }

  // 使用统一的查询条件构建函数
  const where = buildTeacherClassRoomWhereCondition({
    keyword,
    schoolId,
    status,
    grade,
    teacherOpenid // 校长时为undefined，教师时为具体的openid
  });
  return count("classroom", where);
}


export async function assertClassRoomOwnership(classRoomId) {
  const schoolId = await getCurrentSchoolId();
  const isPrincipal = await isPrincipalFromJWT();
  const classRoom = await getClassRoomById(classRoomId);
  if (!classRoom) {
    throw new Error("班级不存在");
  }
  if (classRoom.schoolId !== schoolId) {
    throw new Error("该班级不属于当前管理的校园");
  }

  // 如果是校长，已经验证完成
  if (isPrincipal) {
    return;
  }

  // 如果是教师，需要验证是否在班级的teacherOpenids中
  const openid = await getCurrentUserOpenid();
  if (!openid) {
    throw new Error("用户身份验证失败");
  }
  if (!classRoom.teacherOpenids.includes(openid)) {
    throw new Error("您没有权限管理该班级");
  }
}


export async function getTeacherClassRoomById(classRoomId) {
  await assertClassRoomOwnership(classRoomId);
  return await getClassRoomById(classRoomId);
}


export async function updateTeacherClassRoom(classRoomId, classRoomData) {
  await assertClassRoomOwnership(classRoomId);
  return updateClassRoom(classRoomId, classRoomData);
}
