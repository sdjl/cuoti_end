import { addDoc, allDocs, command, count, docs, getDoc, getOne, removeDoc, removeMatch, updateDoc } from "../common/database.js";

// 集合名称常量
const STUDENT_COLLECTION = "student";
const STUDENT_CLASS_COLLECTION = "student_class";
const USER_STUDENT_COLLECTION = "user_student";


export function buildStudentWhereCondition({
  keyword = "",
  schoolId = "",
  gender = "all"
} = {}) {
  const _ = command();
  const orList = [];
  const andList = [];

  // 关键词搜索（学生姓名、学生编号、家庭地址、备注）
  if (keyword.trim()) {
    const searchRegex = new RegExp(keyword.trim(), "i");
    orList.push({
      name: searchRegex
    }, {
      studentCode: searchRegex
    }, {
      homeAddress: searchRegex
    }, {
      notes: searchRegex
    });
  }

  // 学校ID筛选
  if (schoolId) {
    andList.push({
      schoolId
    });
  }

  // 性别筛选
  if (gender && gender !== "all") {
    andList.push({
      gender
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


export async function getStudents({
  pageNum = 0,
  pageSize = 20,
  keyword = "",
  schoolId = "",
  gender = "all"
} = {}) {
  const where = buildStudentWhereCondition({
    keyword,
    schoolId,
    gender
  });
  return docs({
    c: STUDENT_COLLECTION,
    w: where,
    pageNum,
    pageSize,
    orderBy: {
      created: -1
    }
  });
}


export async function getStudentsCount({
  keyword = "",
  schoolId = "",
  gender = "all"
} = {}) {
  const where = buildStudentWhereCondition({
    keyword,
    schoolId,
    gender
  });
  return count(STUDENT_COLLECTION, where);
}


export async function getStudentById(studentId) {
  return getDoc(STUDENT_COLLECTION, studentId);
}


export async function getStudentByCode(schoolId, studentCode) {
  return getOne(STUDENT_COLLECTION, {
    schoolId,
    studentCode
  });
}


export async function createStudent(studentData) {
  if (!studentData.schoolId) {
    throw new Error("必须提供校园ID");
  }
  const timestamp = Date.now();
  const data = {
    ...studentData,
    created: timestamp,
    updated: timestamp
  };
  return addDoc(STUDENT_COLLECTION, data);
}


export async function updateStudent(studentId, studentData) {
  if ("schoolId" in studentData) {
    throw new Error("禁止更新校园ID");
  }
  const timestamp = Date.now();
  const data = {
    ...studentData,
    updated: timestamp
  };
  return updateDoc(STUDENT_COLLECTION, studentId, data);
}


export async function deleteStudent(studentId) {
  try {
    // 1. 删除该学生与班级的所有关联关系
    await removeMatch(STUDENT_CLASS_COLLECTION, {
      studentId
    });

    // 2. 删除用户与学生的绑定关系
    await removeMatch(USER_STUDENT_COLLECTION, {
      studentId
    });

    // 3. 删除学生本身
    return await removeDoc(STUDENT_COLLECTION, studentId);
  } catch (error) {
    console.error("删除学生失败:", error);
    return false;
  }
}


export async function getStudentClassRelations(studentId) {
  return allDocs({
    c: STUDENT_CLASS_COLLECTION,
    match: {
      studentId
    },
    sort: {
      _id: -1
    }
  });
}


export async function addStudentToClass(studentId, classRoomId, notes, status = "在读") {
  const data = {
    studentId,
    classRoomId,
    status,
    notes
  };
  return addDoc(STUDENT_CLASS_COLLECTION, data);
}


export async function updateStudentClassRelation(relationId, data) {
  // 禁止更新班级ID
  if ("classRoomId" in data) {
    throw new Error("禁止更新班级ID");
  }
  return updateDoc(STUDENT_CLASS_COLLECTION, relationId, data);
}


export async function removeStudentFromClass(studentId, classRoomId) {
  return removeMatch(STUDENT_CLASS_COLLECTION, {
    studentId,
    classRoomId
  });
}


export async function getStudentsByClassRoom(classRoomId, status = "all") {
  // 1. 获取班级的所有学生关系
  const relations = await allDocs({
    c: STUDENT_CLASS_COLLECTION,
    match: {
      classRoomId,
      status: status === "all" ? undefined : status
    }
  });
  if (relations.length === 0) {
    return [];
  }

  // 2. 获取学生ID列表
  const studentIds = relations.map(relation => relation.studentId);

  // 3. 批量获取学生信息
  const _ = command();
  return allDocs({
    c: STUDENT_COLLECTION,
    match: {
      _id: _.in(studentIds)
    },
    sort: {
      studentCode: 1
    }
  });
}
