import { addDoc, allDocs, command, count, docs, getDoc, removeDoc, removeMatch, updateDoc } from "../common/database.js";

// 集合名称常量
const CLASSROOM_COLLECTION = "classroom";
const STUDENT_CLASS_COLLECTION = "student_class";


export function buildClassRoomWhereCondition({
  keyword = "",
  schoolId = "",
  status = "all",
  grade = "all"
} = {}) {
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
  if (schoolId) {
    andList.push({
      schoolId
    });
  }

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

  // 构建最终的查询条件
  let where = {};
  if (orList.length > 0 && andList.length > 0) {
    // 既有OR条件又有AND条件
    where = _.and(_.or(...orList), ...andList);
  } else if (orList.length > 0) {
    // 只有OR条件
    where = _.or(...orList);
  } else if (andList.length > 0) {
    // 只有AND条件
    where = _.and(...andList);
  }
  return where;
}


export async function getClassRooms({
  pageNum = 0,
  pageSize = 20,
  keyword = "",
  schoolId = "",
  status = "all",
  grade = "all"
} = {}) {
  const where = buildClassRoomWhereCondition({
    keyword,
    schoolId,
    status,
    grade
  });
  return docs({
    c: CLASSROOM_COLLECTION,
    w: where,
    pageNum,
    pageSize,
    orderBy: {
      created: -1
    }
  });
}


export async function getClassRoomsCount({
  keyword = "",
  schoolId = "",
  status = "all",
  grade = "all"
} = {}) {
  const where = buildClassRoomWhereCondition({
    keyword,
    schoolId,
    status,
    grade
  });
  return count(CLASSROOM_COLLECTION, where);
}


export async function getClassRoomById(classRoomId) {
  return getDoc(CLASSROOM_COLLECTION, classRoomId);
}


export async function getAllClassRoomsBySchoolId(schoolId) {
  return allDocs({
    c: CLASSROOM_COLLECTION,
    match: {
      schoolId
    },
    sort: {
      created: -1
    }
  });
}


export async function createClassRoom(classRoomData) {
  const timestamp = Date.now();
  const data = {
    ...classRoomData,
    studentCount: 0,
    // 新创建的班级学生数量为0
    created: timestamp,
    updated: timestamp
  };
  return addDoc(CLASSROOM_COLLECTION, data);
}


export async function updateClassRoom(classRoomId, classRoomData) {
  const timestamp = Date.now();
  const data = {
    ...classRoomData,
    updated: timestamp
  };
  return updateDoc(CLASSROOM_COLLECTION, classRoomId, data);
}


export async function deleteClassRoom(classRoomId) {
  try {
    // 1. 删除该班级与学生的所有关联关系
    await removeMatch(STUDENT_CLASS_COLLECTION, {
      classRoomId
    });

    // 2. 删除班级本身
    return await removeDoc(CLASSROOM_COLLECTION, classRoomId);
  } catch (error) {
    console.error("删除班级失败:", error);
    return false;
  }
}


export async function getClassRoomStudentCount(classRoomId) {
  return count(STUDENT_CLASS_COLLECTION, {
    classRoomId
  });
}


export async function updateClassRoomStudentCount(classRoomId) {
  const studentCount = await getClassRoomStudentCount(classRoomId);
  return updateDoc(CLASSROOM_COLLECTION, classRoomId, {
    studentCount,
    updated: Date.now()
  });
}
