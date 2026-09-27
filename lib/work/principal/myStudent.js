"use server";

import { deleteStudent, getStudentById, getStudents, getStudentsCount, updateStudent } from "../../collection/student.js";
import { getCurrentSchoolId } from "./mySchool.js";


export async function getMyStudents({
  pageNum = 0,
  pageSize = 20,
  keyword = "",
  gender = "all"
} = {}) {
  const schoolId = await getCurrentSchoolId();
  return getStudents({
    pageNum,
    pageSize,
    keyword,
    schoolId,
    gender
  });
}


export async function getMyStudentsCount({
  keyword = "",
  gender = "all"
} = {}) {
  const schoolId = await getCurrentSchoolId();
  return getStudentsCount({
    keyword,
    schoolId,
    gender
  });
}


export async function assertStudentBelongsToCurrentSchool(studentId) {
  const schoolId = await getCurrentSchoolId();
  const student = await getStudentById(studentId);
  if (!student || student.schoolId !== schoolId) {
    throw new Error("该学生不属于当前校园");
  }
}


export async function deleteMyStudent(studentId) {
  await assertStudentBelongsToCurrentSchool(studentId);
  return deleteStudent(studentId);
}


export async function getMyStudentById(studentId) {
  const schoolId = await getCurrentSchoolId();
  const student = await getStudentById(studentId);
  if (!student || student.schoolId !== schoolId) {
    throw new Error("该学生不属于当前校园");
  }
  return student;
}


export async function updateMyStudent(studentId, studentData) {
  await assertStudentBelongsToCurrentSchool(studentId);
  return updateStudent(studentId, studentData);
}
