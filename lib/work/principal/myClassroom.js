"use server";

import { createClassRoom, deleteClassRoom, getClassRoomById, getClassRooms, getClassRoomsCount, updateClassRoom } from "../../collection/classroom.js";
import { getCurrentSchoolId } from "./mySchool.js";


export async function getPrincipalClassRooms({
  pageNum = 0,
  pageSize = 20,
  keyword = "",
  status = "all",
  grade = "all"
} = {}) {
  const schoolId = await getCurrentSchoolId();
  return getClassRooms({
    pageNum,
    pageSize,
    keyword,
    schoolId,
    status,
    grade
  });
}


export async function getPrincipalClassRoomsCount({
  keyword = "",
  status = "all",
  grade = "all"
} = {}) {
  const schoolId = await getCurrentSchoolId();
  return getClassRoomsCount({
    keyword,
    schoolId,
    status,
    grade
  });
}


export async function assertClassRoomOwnership(classRoomId) {
  const schoolId = await getCurrentSchoolId();
  const classRoom = await getClassRoomById(classRoomId);
  if (!classRoom) {
    throw new Error("班级不存在");
  }
  if (classRoom.schoolId !== schoolId) {
    throw new Error("该班级不属于当前管理的校园");
  }
}


export async function getPrincipalClassRoomById(classRoomId) {
  await assertClassRoomOwnership(classRoomId);
  return await getClassRoomById(classRoomId);
}


export async function createPrincipalClassRoom(classRoomData) {
  const schoolId = await getCurrentSchoolId();
  return createClassRoom({
    ...classRoomData,
    schoolId
  });
}


export async function updatePrincipalClassRoom(classRoomId, classRoomData) {
  await assertClassRoomOwnership(classRoomId);
  return updateClassRoom(classRoomId, classRoomData);
}


export async function deletePrincipalClassRoom(classRoomId) {
  await assertClassRoomOwnership(classRoomId);
  return deleteClassRoom(classRoomId);
}
