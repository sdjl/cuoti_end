"use server";

import { allDocs, command } from "../../../../../lib/common/database.js";
const MAX_DISPLAY_LIMIT = 100;
/**
 * 获取全校中奖记录
 */
export async function getSchoolLotteryRecordsFromDB(schoolId) {
  const _ = command();

  // 1. 查询中奖且公示的记录
  const lotteryRecords = await allDocs({
    c: "lottery_record",
    match: {
      schoolId,
      isWin: true,
      isPublic: true
    },
    sort: {
      created: -1
    },
    limit: MAX_DISPLAY_LIMIT,
    project: {
      _id: 1,
      prizeName: 1,
      studentId: 1,
      created: 1
    }
  });
  console.log("lotteryRecords", lotteryRecords);
  if (lotteryRecords.length === 0) {
    return [];
  }

  // 2. 收集所有学生ID
  const studentIds = lotteryRecords.map(record => record.studentId);

  // 3. 查询学生信息
  const students = await allDocs({
    c: "student",
    match: {
      _id: _.in(studentIds)
    },
    project: {
      _id: 1,
      name: 1
    }
  });

  // 4. 查询学生与班级关系（只查询在读状态）
  const studentClassRelations = await allDocs({
    c: "student_class",
    match: {
      studentId: _.in(studentIds),
      status: "在读"
    },
    project: {
      studentId: 1,
      classRoomId: 1
    }
  });

  // 5. 收集班级ID
  const classIds = studentClassRelations.map(relation => relation.classRoomId).filter(id => id);

  // 6. 查询班级信息
  const classrooms = await allDocs({
    c: "classroom",
    match: {
      _id: _.in(classIds)
    },
    project: {
      _id: 1,
      name: 1
    }
  });

  // 7. 构建映射
  const studentMap = new Map();
  students.forEach(student => {
    studentMap.set(student._id, student);
  });
  const studentClassMap = new Map();
  studentClassRelations.forEach(relation => {
    studentClassMap.set(relation.studentId, relation.classRoomId);
  });
  const classMap = new Map();
  classrooms.forEach(classroom => {
    classMap.set(classroom._id, classroom);
  });

  // 8. 组装数据
  const result = [];
  for (const record of lotteryRecords) {
    const student = studentMap.get(record.studentId);
    if (!student) continue;
    const classRoomId = studentClassMap.get(record.studentId);
    if (!classRoomId) continue;
    const classroom = classMap.get(classRoomId);
    if (!classroom) continue;

    // 隐藏学生姓名中间的字
    const studentName = hiddenMiddleName(student.name);
    result.push({
      _id: record._id,
      prizeName: record.prizeName || "未知奖品",
      className: classroom.name || "未知班级",
      studentName,
      created: record.created
    });
  }
  return result;
}

/**
 * 隐藏姓名中间的字
 */
function hiddenMiddleName(name) {
  if (!name || name.length <= 1) {
    return name;
  }
  if (name.length === 2) {
    return `${name[0]}*`;
  }

  // 3个字或更多，隐藏中间的字
  const firstChar = name[0];
  const lastChar = name[name.length - 1];
  const middleStars = "*".repeat(name.length - 2);
  return firstChar + middleStars + lastChar;
}
