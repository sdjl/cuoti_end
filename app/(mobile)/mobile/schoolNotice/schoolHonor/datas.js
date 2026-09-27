"use server";

import { allDocs, command } from "../../../../../lib/common/database.js";
const MAX_DISPLAY_LIMIT = 100;
/**
 * 获取全校荣誉记录
 */
export async function getSchoolHonorRecordsFromDB(schoolId) {
  const _ = command();

  // 1. 查询已通过且公示的荣誉申请记录
  const honorRecords = await allDocs({
    c: "honor_application",
    match: {
      schoolId,
      status: "completed",
      showInSchoolHonorBoard: true
    },
    sort: {
      created: -1
    },
    limit: MAX_DISPLAY_LIMIT,
    project: {
      _id: 1,
      honorName: 1,
      studentId: 1,
      examScore: 1,
      subject: 1,
      examName: 1,
      teacherRemark: 1,
      created: 1
    }
  });
  if (honorRecords.length === 0) {
    return [];
  }

  // 2. 收集所有学生ID
  const studentIds = honorRecords.map(record => record.studentId);

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

  // 4. 构建学生映射
  const studentMap = new Map();
  students.forEach(student => {
    studentMap.set(student._id, student);
  });

  // 5. 组装数据
  const result = [];
  for (const record of honorRecords) {
    const student = studentMap.get(record.studentId);
    if (!student) continue;

    // 隐藏学生姓名中间的字
    const studentName = hiddenMiddleName(student.name);
    result.push({
      _id: record._id,
      honorName: record.honorName || "未知荣誉",
      studentName,
      examScore: record.examScore,
      subject: record.subject,
      examName: record.examName,
      teacherRemark: record.teacherRemark,
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
