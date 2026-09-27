import { addDoc, command, count, docs, getDoc, removeDoc, updateDoc } from "../common/database.js";

// 集合名称常量
const COURSE_COLLECTION = "course";
const QUESTION_PACK_COLLECTION = "question_pack";
const CLASS_COURSE_COLLECTION = "class_course";


export function buildCourseWhereCondition({
  keyword = "",
  schoolId = "",
  subject = "",
  status = "all"
} = {}) {
  const _ = command();
  const orList = [];
  const andList = [];

  // 关键词搜索（课程名称、描述）
  if (keyword.trim()) {
    const searchRegex = new RegExp(keyword.trim(), "i");
    orList.push({
      name: searchRegex
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

  // 科目筛选
  if (subject.trim() && subject !== "all") {
    andList.push({
      subject: subject.trim()
    });
  }

  // 状态筛选
  if (status && status !== "all") {
    andList.push({
      status
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


export async function getCourses({
  pageNum = 0,
  pageSize = 20,
  keyword = "",
  schoolId = "",
  subject = "",
  status = "all"
} = {}) {
  const where = buildCourseWhereCondition({
    keyword,
    schoolId,
    subject,
    status
  });
  return docs({
    c: COURSE_COLLECTION,
    w: where,
    pageNum,
    pageSize,
    orderBy: {
      created: -1
    }
  });
}


export async function getCoursesCount({
  keyword = "",
  schoolId = "",
  subject = "",
  status = "all"
} = {}) {
  const where = buildCourseWhereCondition({
    keyword,
    schoolId,
    subject,
    status
  });
  return count(COURSE_COLLECTION, where);
}


export async function getCourseById(courseId) {
  return getDoc(COURSE_COLLECTION, courseId);
}


export async function createCourse(courseData) {
  const timestamp = Date.now();
  const data = {
    ...courseData,
    created: timestamp
  };
  return addDoc(COURSE_COLLECTION, data);
}


export async function updateCourse(courseId, courseData) {
  return updateDoc(COURSE_COLLECTION, courseId, courseData);
}


export async function deleteCourse(courseId) {
  return removeDoc(COURSE_COLLECTION, courseId);
}


export async function isCourseNameDuplicate(schoolId, courseName, excludeCourseId) {
  const existingCourses = await docs({
    c: COURSE_COLLECTION,
    w: {
      schoolId: schoolId,
      name: courseName
    }
  });
  if (excludeCourseId) {
    return existingCourses.some(course => course._id !== excludeCourseId);
  }
  return existingCourses.length > 0;
}


export async function getCourseUsageCount(courseId) {
  return count(CLASS_COURSE_COLLECTION, {
    courseId
  });
}


export async function getQuestionPacksByIds(questionPackIds) {
  if (questionPackIds.length === 0) {
    return [];
  }
  const _ = command();
  const result = await docs({
    c: QUESTION_PACK_COLLECTION,
    w: {
      _id: _.in(questionPackIds)
    },
    pageSize: questionPackIds.length
  });
  return result;
}


export function buildQuestionPackWhereCondition({
  keyword = "",
  subject = "",
  schoolId = null,
  studentId = null,
  type = "试卷"
} = {}) {
  const _ = command();
  const orList = [];
  const andList = [];

  // 基础条件
  andList.push({
    schoolId
  });
  andList.push({
    studentId
  });
  andList.push({
    type
  });

  // 科目过滤
  if (subject.trim()) {
    andList.push({
      subject: subject.trim()
    });
  }

  // 关键词搜索（题集名称、描述）
  if (keyword.trim()) {
    const searchRegex = new RegExp(keyword.trim(), "i");
    orList.push({
      name: searchRegex
    }, {
      description: searchRegex
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


export async function getPublicQuestionPacks({
  pageNum = 0,
  pageSize = 20,
  keyword = "",
  subject = ""
} = {}) {
  const where = buildQuestionPackWhereCondition({
    keyword,
    subject,
    schoolId: null,
    studentId: null,
    type: "试卷"
  });
  return docs({
    c: QUESTION_PACK_COLLECTION,
    w: where,
    pageNum,
    pageSize,
    orderBy: {
      created: -1
    }
  });
}


export async function getPublicQuestionPacksCount({
  keyword = "",
  subject = ""
} = {}) {
  const where = buildQuestionPackWhereCondition({
    keyword,
    subject,
    schoolId: null,
    studentId: null,
    type: "试卷"
  });
  return count(QUESTION_PACK_COLLECTION, where);
}
