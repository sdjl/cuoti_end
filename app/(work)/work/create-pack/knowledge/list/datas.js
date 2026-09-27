"use server";

import { allDocs, command } from "../../../../../../lib/common/database.js";
import { getCurrentSchoolId } from "../../../../../../lib/work/teacher/mySchool.js";
/**
 * 获取最近创建定制题集的学生列表
 * 只显示最近50个学生，按时间逆序排序
 */
export async function getRecentStudentsWithKnowledgePacks() {
  const schoolId = await getCurrentSchoolId();
  const _ = command();

  // 使用聚合查询获取每个学生最后一次创建题集的时间
  const aggregateResult = await allDocs({
    c: "question_pack",
    match: {
      schoolId,
      type: "知识点",
      studentId: _.neq(null) // studentId 不为 null
    },
    sort: {
      created: -1
    },
    only: "studentId, classId, created",
    limit: 1000 // 先获取最近1000个题集
  });

  // 按学生分组，只保留每个学生最新的记录
  const studentMap = new Map();
  aggregateResult.forEach(pack => {
    const studentId = pack.studentId;
    const existing = studentMap.get(studentId);
    if (!existing) {
      studentMap.set(studentId, {
        studentId,
        classId: pack.classId || "",
        lastCreatedTime: pack.created
      });
    }
  });

  // 获取前50个学生
  const topStudents = Array.from(studentMap.values()).sort((a, b) => b.lastCreatedTime - a.lastCreatedTime).slice(0, 50);
  if (topStudents.length === 0) {
    return [];
  }

  // 获取学生信息
  const studentIds = topStudents.map(s => s.studentId);
  const studentsResult = await allDocs({
    c: "student",
    match: {
      _id: _.in(studentIds)
    },
    project: {
      _id: 1,
      name: 1,
      classId: 1
    }
  });
  const studentInfoMap = new Map();
  studentsResult.forEach(student => {
    studentInfoMap.set(student._id, {
      name: student.name,
      classId: student.classId
    });
  });

  // 获取班级信息
  const classIds = Array.from(new Set(topStudents.map(s => s.classId).filter(Boolean)));
  const classesResult = classIds.length > 0 ? await allDocs({
    c: "classroom",
    match: {
      _id: _.in(classIds)
    },
    project: {
      _id: 1,
      name: 1,
      grade: 1
    }
  }) : [];
  const classMap = new Map();
  classesResult.forEach(cls => {
    classMap.set(cls._id, {
      name: cls.name,
      grade: cls.grade
    });
  });

  // 组装数据
  const result = [];
  for (const student of topStudents) {
    const studentInfo = studentInfoMap.get(student.studentId);
    if (!studentInfo) continue;
    const classInfo = classMap.get(student.classId);
    result.push({
      studentId: student.studentId,
      studentName: studentInfo.name || "未知学生",
      classId: student.classId,
      className: classInfo?.name || "未知班级",
      grade: classInfo?.grade,
      lastCreatedTime: student.lastCreatedTime
    });
  }
  return result;
}
