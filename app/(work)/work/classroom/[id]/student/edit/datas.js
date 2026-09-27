"use server";

import { getOne, updateDoc } from "../../../../../../../lib/common/database.js";
const STUDENT_CLASS_COLLECTION = "student_class";

/**
 * 获取学生班级关系信息
 */
export async function getStudentClassFromDB(studentId, classRoomId) {
  return await getOne(STUDENT_CLASS_COLLECTION, {
    studentId,
    classRoomId
  });
}

/**
 * 更新学生班级关系信息
 */
export async function updateStudentClassInDB(studentClassId, notes, status) {
  return await updateDoc(STUDENT_CLASS_COLLECTION, studentClassId, {
    notes,
    status
  });
}
