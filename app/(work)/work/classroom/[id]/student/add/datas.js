"use server";

import { allDocs, command, getOne } from "../../../../../../../lib/common/database.js";
import { getCurrentSchoolId } from "../../../../../../../lib/work/teacher/mySchool.js";
import { isStudentInClass } from "../../../../../../../lib/work/teacher/myStudent.js";


export async function searchStudents(keyword) {
  const schoolId = await getCurrentSchoolId();
  const _ = command();

  // 使用正则表达式进行模糊搜索，同时搜索编号和姓名
  const searchRegex = new RegExp(keyword.trim(), "i");
  const students = await allDocs({
    c: "student",
    match: _.or({
      schoolId,
      studentCode: searchRegex
    }, {
      schoolId,
      name: searchRegex
    }),
    sort: {
      studentCode: 1
    },
    limit: 50,
    // 限制最多返回50个结果
    only: "_id,name,studentCode,gender,birthDate,publicSchoolName,ethnicity,homeAddress" // 只读取页面展示所需的字段
  });
  return students;
}


export async function checkStudentInClass(studentId, classRoomId) {
  return await isStudentInClass(studentId, classRoomId);
}


export async function checkStudentCodeExists(studentCode) {
  const schoolId = await getCurrentSchoolId();

  // 使用 getOne 判断是否存在（getOne 已经是高效查询）
  const student = await getOne("student", {
    schoolId,
    studentCode: studentCode.trim()
  });
  return student !== null;
}


export async function getNextStudentCode() {
  const schoolId = await getCurrentSchoolId();

  // 获取当前学校的所有学生，只读取 studentCode 字段
  const students = await allDocs({
    c: "student",
    match: {
      schoolId
    },
    only: "studentCode" // 只读取学生编号字段，提升性能
  });
  if (students.length === 0) {
    // 如果没有学生，返回空字符串
    return "";
  }

  // 过滤出所有纯数字的学生编号
  const numericCodes = students.map(s => s.studentCode).filter(code => /^\d+$/.test(code)).map(code => parseInt(code, 10));
  if (numericCodes.length === 0) {
    // 如果没有纯数字的学生编号，返回空字符串
    return "";
  }

  // 找到最大的数字编号
  const maxCode = Math.max(...numericCodes);

  // 返回最大编号+1
  return (maxCode + 1).toString();
}
