"use server";

import { allDocs, command, count, docs, updateDoc } from "../../../../../../lib/common/database.js";
import { timestamp } from "../../../../../../lib/common/time.js";
import { getTeacherAllClassRooms } from "../../../../../../lib/work/teacher/myClassroom.js";
/**
 * 构建查询条件（仅限当前用户所管理的班级数据）
 */
export async function buildTeacherReplyQueryConditions(schoolId, params) {
  const _ = command();
  const sessionWhereConditions = {};
  const emptyResult = {
    sessionWhereConditions: {
      _id: null
    }
  };

  // 1) 获取当前用户管理的班级
  const myClassRooms = await getTeacherAllClassRooms();
  if (myClassRooms.length === 0) {
    return emptyResult;
  }
  const myClassIds = new Set(myClassRooms.map(c => c._id));
  let targetClassIds = Array.from(myClassIds);
  if (params.classId && params.classId !== "all") {
    // 仅允许筛选在我管理的班级范围内
    targetClassIds = myClassIds.has(params.classId) ? [params.classId] : [];
  }
  if (targetClassIds.length === 0) {
    return emptyResult;
  }

  // 2) 查找班级内的学生
  const studentClassRels = await allDocs({
    c: "student_class",
    match: {
      classRoomId: _.in(targetClassIds),
      status: "在读"
    },
    only: "studentId"
  });
  if (studentClassRels.length === 0) {
    return emptyResult;
  }
  // 直接基于班级关系的学生ID限制；如有学生过滤，则在班级学生范围内取交集
  const classStudentIds = studentClassRels.map(r => r.studentId);
  let finalStudentIds = classStudentIds;
  if (params.studentName || params.studentCode) {
    const studentWhere = {
      schoolId
    };
    if (params.studentName?.trim()) {
      studentWhere.name = params.studentName.trim();
    }
    if (params.studentCode?.trim()) {
      studentWhere.studentCode = params.studentCode.trim();
    }
    const students = await allDocs({
      c: "student",
      match: studentWhere,
      only: "_id"
    });
    const filteredStudentIds = new Set(students.map(s => s._id));
    finalStudentIds = classStudentIds.filter(id => filteredStudentIds.has(id));
    if (finalStudentIds.length === 0) {
      return emptyResult;
    }
  }

  // 只保留一个查询条件：studentId（来源于班级，若有，则叠加学生过滤）
  sessionWhereConditions.studentId = _.in(finalStudentIds);

  // 是否需要老师回复筛选
  if (params.isNeedTeacherReply && params.isNeedTeacherReply !== "all") {
    // 如果需要老师帮助
    if (params.isNeedTeacherReply === "need") sessionWhereConditions.isNeedTeacherReply = true;else {
      sessionWhereConditions.isNeedTeacherReply = _.neq(true);
    }
  }

  // 是否已掌握筛选
  if (params.isStudentMaster && params.isStudentMaster !== "all") {
    sessionWhereConditions.isStudentMaster = params.isStudentMaster === "yes";
  }
  return {
    sessionWhereConditions: sessionWhereConditions
  };
}

/**
 * 统计数量（仅限当前用户所管理的班级数据）
 */
export async function getTeacherReplyCount(schoolId, params) {
  const {
    sessionWhereConditions
  } = await buildTeacherReplyQueryConditions(schoolId, params);
  return count("student_question_ai_chat_session", sessionWhereConditions);
}

/**
 * 查询列表（预留，暂不实现返回空数组）
 */
export async function getTeacherReplyList(schoolId, params) {
  const _ = command();
  const {
    sessionWhereConditions
  } = await buildTeacherReplyQueryConditions(schoolId, params);
  const pageNum = params.pageNum ?? 0;
  const pageSize = params.pageSize ?? 20;

  // 1) 分页读取会话
  const sessions = await docs({
    c: "student_question_ai_chat_session",
    w: sessionWhereConditions,
    pageNum,
    pageSize,
    orderBy: {
      created: -1
    }
  });
  if (sessions.length === 0) return [];

  // 2) 关联ID收集，批量读取关联数据
  const studentAnswerItemIds = sessions.map(s => s.studentAnswerItemId);
  const studentIds = Array.from(new Set(sessions.map(s => s.studentId)));
  const questionIds = Array.from(new Set(sessions.map(s => s.questionId)));
  const [answerItems, students, examQuestions] = await Promise.all([allDocs({
    c: "student_answer_item",
    match: {
      _id: _.in(studentAnswerItemIds)
    }
  }), allDocs({
    c: "student",
    match: {
      _id: _.in(studentIds)
    }
  }), allDocs({
    c: "exam_question",
    match: {
      _id: _.in(questionIds)
    }
  })]);
  const answerItemIdToItem = new Map();
  for (const it of answerItems) {
    answerItemIdToItem.set(it._id, it);
  }
  const studentIdToStudent = new Map();
  for (const st of students) {
    studentIdToStudent.set(st._id, st);
  }
  const questionIdToQuestion = new Map();
  for (const q of examQuestions) {
    questionIdToQuestion.set(q._id, q);
  }

  // 3) 通过 answerItem -> answer 获取 classId 和 questionPackId，进而获取班级、题集
  const answerIds = Array.from(new Set(answerItems.map(ai => ai.studentAnswerId)));
  const studentAnswers = await allDocs({
    c: "student_answer",
    match: {
      _id: _.in(answerIds)
    }
  });
  const answerIdToAnswer = new Map();
  for (const a of studentAnswers) {
    answerIdToAnswer.set(a._id, a);
  }
  const classIds = Array.from(new Set(studentAnswers.map(a => a.classId)));
  const questionPackIds = Array.from(new Set(studentAnswers.map(a => a.questionPackId)));
  const [classrooms, questionPacks] = await Promise.all([allDocs({
    c: "classroom",
    match: {
      _id: _.in(classIds)
    }
  }), allDocs({
    c: "question_pack",
    match: {
      _id: _.in(questionPackIds)
    }
  })]);
  const classIdToClassroom = new Map();
  for (const c of classrooms) {
    classIdToClassroom.set(c._id, c);
  }
  const packIdToPack = new Map();
  for (const p of questionPacks) {
    packIdToPack.set(p._id, p);
  }

  // 4) 组装结果
  const result = sessions.map(s => {
    const answerItem = answerItemIdToItem.get(s.studentAnswerItemId);
    const answer = answerItem ? answerIdToAnswer.get(answerItem.studentAnswerId) : undefined;
    const classroom = answer ? classIdToClassroom.get(answer.classId) : undefined;
    const questionPack = answer ? packIdToPack.get(answer.questionPackId) : undefined;
    const student = studentIdToStudent.get(s.studentId);
    const examQuestion = questionIdToQuestion.get(s.questionId);
    return {
      session: s,
      student: student,
      classroom: classroom,
      questionPack: questionPack,
      examQuestion,
      studentAnswerItem: answerItem
    };
  });
  return result;
}

/**
 * 老师回复一条消息：在会话的 teacherStudentMessages 末尾追加，并把 isNeedTeacherReply 设为 false
 */
export async function replyTeacherMessage(sessionId, content) {
  const _ = command();
  const msg = {
    created: timestamp(),
    role: "teacher",
    content
  };
  return updateDoc("student_question_ai_chat_session", sessionId, {
    teacherStudentMessages: _.push([msg]),
    isNeedTeacherReply: false
  });
}

/**
 * 读取某个会话的 AI 聊天记录（学生与AI）
 */
export async function getSessionAiMessages(sessionId) {
  const list = await allDocs({
    c: "student_question_ai_chat_message",
    match: {
      sessionId
    },
    sort: {
      created: 1
    }
  });
  return list;
}
