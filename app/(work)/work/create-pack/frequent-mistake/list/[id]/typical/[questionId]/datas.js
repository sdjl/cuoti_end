"use server";

import { addDocList, allDocs, command, removeDoc } from "../../../../../../../../../lib/common/database.js";
// 数据库集合名称常量
const COLLECTION_NAMES = {
  STUDENT_ANSWER: "student_answer",
  STUDENT_ANSWER_ITEM: "student_answer_item",
  STUDENT: "student",
  CLASS_ROOM: "classroom",
  FREQUENT_MISTAKE_TYPICAL_ERROR: "frequent_mistake_typical_error"
};

/** 获取可添加的典型错题列表（StudentAnswerItemDoc.isTypicalMistake=true且questionId匹配的） */
export async function getAvailableTypicalErrors(questionId) {
  const _ = command();

  // 查询该题目的所有典型错题StudentAnswerItemDoc
  const studentAnswerItems = await allDocs({
    c: COLLECTION_NAMES.STUDENT_ANSWER_ITEM,
    match: {
      questionId,
      isTypicalMistake: _.eq(true)
    },
    sort: {
      created: -1
    }
  });
  if (studentAnswerItems.length === 0) {
    return [];
  }

  // 获取所有相关的studentAnswerId
  const studentAnswerIds = [...new Set(studentAnswerItems.map(item => item.studentAnswerId))];

  // 查询所有相关的StudentAnswerDoc以获取classId和studentId
  const studentAnswers = await allDocs({
    c: COLLECTION_NAMES.STUDENT_ANSWER,
    match: {
      _id: _.in(studentAnswerIds)
    }
  });

  // 构建studentAnswerId到StudentAnswerDoc的映射
  const studentAnswerMap = new Map(studentAnswers.map(sa => [sa._id, sa]));

  // 获取所有相关的studentId和classId
  const studentIds = [...new Set(studentAnswers.map(sa => sa.studentId))];
  const classIds = [...new Set(studentAnswers.map(sa => sa.classId))];

  // 一次性查询所有学生和班级信息
  const [students, classrooms] = await Promise.all([allDocs({
    c: COLLECTION_NAMES.STUDENT,
    match: {
      _id: _.in(studentIds)
    }
  }), allDocs({
    c: COLLECTION_NAMES.CLASS_ROOM,
    match: {
      _id: _.in(classIds)
    }
  })]);

  // 构建映射以便快速查找
  const studentMap = new Map(students.map(s => [s._id, s]));
  const classroomMap = new Map(classrooms.map(c => [c._id, c]));

  // 组装数据
  const typicalErrorItems = [];
  for (const item of studentAnswerItems) {
    const studentAnswer = studentAnswerMap.get(item.studentAnswerId);
    if (!studentAnswer) continue;
    const student = studentMap.get(studentAnswer.studentId);
    const classroom = classroomMap.get(studentAnswer.classId);
    if (student && classroom) {
      typicalErrorItems.push({
        studentAnswerItem: item,
        student,
        classroom
      });
    }
  }
  return typicalErrorItems;
}

/** 获取已添加的典型错题列表 */
export async function getAddedTypicalErrors(frequentMistakeId, questionId) {
  const _ = command();

  // 查询该题目的所有已添加的典型错题
  const typicalErrors = await allDocs({
    c: COLLECTION_NAMES.FREQUENT_MISTAKE_TYPICAL_ERROR,
    match: {
      frequentMistakeId,
      questionId
    },
    sort: {
      sortOrder: 1,
      created: 1
    }
  });
  if (typicalErrors.length === 0) {
    return [];
  }

  // 获取所有相关的studentAnswerItemId
  const studentAnswerItemIds = typicalErrors.map(te => te.studentAnswerItemId);

  // 查询所有StudentAnswerItemDoc
  const studentAnswerItems = await allDocs({
    c: COLLECTION_NAMES.STUDENT_ANSWER_ITEM,
    match: {
      _id: _.in(studentAnswerItemIds)
    }
  });

  // 构建studentAnswerItemId到StudentAnswerItemDoc的映射
  const studentAnswerItemMap = new Map(studentAnswerItems.map(item => [item._id, item]));

  // 获取所有相关的studentAnswerId
  const studentAnswerIds = [...new Set(studentAnswerItems.map(item => item.studentAnswerId))];

  // 查询所有相关的StudentAnswerDoc
  const studentAnswers = await allDocs({
    c: COLLECTION_NAMES.STUDENT_ANSWER,
    match: {
      _id: _.in(studentAnswerIds)
    }
  });

  // 构建studentAnswerId到StudentAnswerDoc的映射
  const studentAnswerMap = new Map(studentAnswers.map(sa => [sa._id, sa]));

  // 获取所有相关的studentId和classId
  const studentIds = [...new Set(studentAnswers.map(sa => sa.studentId))];
  const classIds = [...new Set(studentAnswers.map(sa => sa.classId))];

  // 一次性查询所有学生和班级信息
  const [students, classrooms] = await Promise.all([allDocs({
    c: COLLECTION_NAMES.STUDENT,
    match: {
      _id: _.in(studentIds)
    }
  }), allDocs({
    c: COLLECTION_NAMES.CLASS_ROOM,
    match: {
      _id: _.in(classIds)
    }
  })]);

  // 构建映射以便快速查找
  const studentMap = new Map(students.map(s => [s._id, s]));
  const classroomMap = new Map(classrooms.map(c => [c._id, c]));

  // 组装数据
  const addedTypicalErrors = [];
  for (const typicalError of typicalErrors) {
    const studentAnswerItem = studentAnswerItemMap.get(typicalError.studentAnswerItemId);
    if (!studentAnswerItem) continue;
    const studentAnswer = studentAnswerMap.get(studentAnswerItem.studentAnswerId);
    if (!studentAnswer) continue;
    const student = studentMap.get(studentAnswer.studentId);
    const classroom = classroomMap.get(studentAnswer.classId);
    if (student && classroom) {
      addedTypicalErrors.push({
        typicalError,
        item: {
          studentAnswerItem,
          student,
          classroom
        }
      });
    }
  }
  return addedTypicalErrors;
}

/** 添加典型错题 */
export async function addTypicalErrors(frequentMistakeId, questionId, studentAnswerItemIds) {
  // 查询已存在的典型错题记录
  const existingTypicalErrors = await allDocs({
    c: COLLECTION_NAMES.FREQUENT_MISTAKE_TYPICAL_ERROR,
    match: {
      frequentMistakeId,
      questionId
    }
  });

  // 构建已存在的studentAnswerItemId集合
  const existingItemIds = new Set(existingTypicalErrors.map(te => te.studentAnswerItemId));

  // 过滤出不存在的studentAnswerItemId
  const newItemIds = studentAnswerItemIds.filter(id => !existingItemIds.has(id));
  if (newItemIds.length === 0) {
    return;
  }

  // 获取当前最大的sortOrder
  let maxSortOrder = 0;
  if (existingTypicalErrors.length > 0) {
    maxSortOrder = Math.max(...existingTypicalErrors.map(te => te.sortOrder || 0));
  }

  // 批量插入新的典型错题记录
  const now = Date.now();
  const newTypicalErrors = newItemIds.map((studentAnswerItemId, index) => ({
    frequentMistakeId,
    questionId,
    studentAnswerItemId,
    sortOrder: maxSortOrder + index + 1,
    created: now,
    updated: now
  }));
  await addDocList(COLLECTION_NAMES.FREQUENT_MISTAKE_TYPICAL_ERROR, newTypicalErrors);
}

/** 删除典型错题 */
export async function deleteTypicalError(typicalErrorId) {
  await removeDoc(COLLECTION_NAMES.FREQUENT_MISTAKE_TYPICAL_ERROR, typicalErrorId);
}

/** 更新典型错题排序 */
export async function updateTypicalErrorsSort(items) {
  const {
    updateDoc
  } = await import("../../../../../../../../../lib/common/database");
  const now = Date.now();

  // 批量更新每个典型错题的sortOrder
  await Promise.all(items.map(item => updateDoc(COLLECTION_NAMES.FREQUENT_MISTAKE_TYPICAL_ERROR, item.id, {
    sortOrder: item.sortOrder,
    updated: now
  })));
}
