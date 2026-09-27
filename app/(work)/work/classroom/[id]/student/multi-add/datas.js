"use server";

import { allDocs, command } from "../../../../../../../lib/common/database.js";
import { getCurrentSchoolId } from "../../../../../../../lib/work/teacher/mySchool.js";


export async function searchSchoolStudents(options) {
  const schoolId = await getCurrentSchoolId();
  const _ = command();
  const {
    keyword,
    classRoomId,
    grade
  } = options;

  // 构建查询条件（微信云数据库查询条件支持多种类型）
  const matchConditions = [{
    schoolId
  }];

  // 关键词搜索（编号或姓名）
  if (keyword?.trim()) {
    const searchRegex = new RegExp(keyword.trim(), "i");
    matchConditions.push(_.or({
      studentCode: searchRegex
    }, {
      name: searchRegex
    }));
  }

  // 如果有班级或年级条件，需要关联查询
  if (classRoomId || grade) {
    let targetClassRoomIds = [];
    if (classRoomId && grade) {
      // 同时指定了班级和年级（AND 关系）
      // 先获取该年级的所有班级，检查指定的班级是否在其中
      const gradeClassrooms = await allDocs({
        c: "classroom",
        match: {
          schoolId,
          grade
        },
        only: "_id"
      });
      const gradeClassroomIds = gradeClassrooms.map(c => c._id);

      // 如果指定的班级属于该年级，使用该班级；否则返回空
      if (gradeClassroomIds.includes(classRoomId)) {
        targetClassRoomIds = [classRoomId];
      } else {
        return [];
      }
    } else if (classRoomId) {
      // 只指定了班级
      targetClassRoomIds = [classRoomId];
    } else if (grade) {
      // 只指定了年级，获取该年级的所有班级
      const gradeClassrooms = await allDocs({
        c: "classroom",
        match: {
          schoolId,
          grade
        },
        only: "_id"
      });
      targetClassRoomIds = gradeClassrooms.map(c => c._id);
    }
    if (targetClassRoomIds.length === 0) {
      return [];
    }

    // 获取这些班级的学生
    const studentClassList = await allDocs({
      c: "student_class",
      match: {
        classRoomId: _.in(targetClassRoomIds)
      },
      only: "studentId"
    });
    const studentIds = studentClassList.map(sc => sc.studentId);
    if (studentIds.length === 0) {
      return [];
    }
    matchConditions.push({
      _id: _.in(studentIds)
    });
  }

  // 构建最终查询条件
  let finalMatch;
  if (matchConditions.length === 1) {
    finalMatch = matchConditions[0];
  } else {
    // 微信云数据库 _.and() API 需要 any 类型参数
    const conditions = matchConditions;
    finalMatch = _.and(...conditions);
  }

  // 确定查询限制
  const hasSearchCondition = keyword || classRoomId || grade;
  const limit = hasSearchCondition ? undefined : 200;
  const students = await allDocs({
    c: "student",
    match: finalMatch,
    sort: {
      studentCode: -1
    },
    // 按编号逆序
    limit,
    only: "_id,name,studentCode"
  });
  return students;
}


export async function getSchoolClassRooms() {
  const schoolId = await getCurrentSchoolId();
  const classrooms = await allDocs({
    c: "classroom",
    match: {
      schoolId
    },
    sort: {
      name: 1
    },
    only: "_id,name,grade"
  });
  return classrooms;
}


export async function getClassRoomStudents(classRoomId) {
  // 先获取班级关联的学生ID
  const studentClassList = await allDocs({
    c: "student_class",
    match: {
      classRoomId
    },
    only: "studentId"
  });
  if (studentClassList.length === 0) {
    return [];
  }
  const studentIds = studentClassList.map(sc => sc.studentId);
  const _ = command();

  // 获取学生详细信息
  const students = await allDocs({
    c: "student",
    match: {
      _id: _.in(studentIds)
    },
    only: "_id,name,studentCode"
  });
  return students;
}


export async function checkStudentsInClass(studentIds, classRoomId) {
  if (studentIds.length === 0) {
    return [];
  }
  const _ = command();
  const relations = await allDocs({
    c: "student_class",
    match: {
      studentId: _.in(studentIds),
      classRoomId
    },
    only: "studentId"
  });
  return relations.map(r => r.studentId);
}
