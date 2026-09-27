"use server";

import { allDocs, command, count, docs, updateDoc } from "../../../../../../lib/common/database.js";
import { timestamp } from "../../../../../../lib/common/time.js";
import { getTeacherAllClassRooms } from "../../../../../../lib/work/teacher/myClassroom.js";
/**
 * 构建查询条件（仅限当前用户所管理的班级数据）
 */
export async function buildTeacherReplyQueryConditions(schoolId, params) {
  const _ = command();
  const where = {
    schoolId
  };

  // 1) 获取当前用户管理的班级
  const myClassRooms = await getTeacherAllClassRooms();
  const myClassIds = new Set(myClassRooms.map(c => c._id));
  let targetClassIds = Array.from(myClassIds);
  if (params.classId && params.classId !== "all") {
    targetClassIds = myClassIds.has(params.classId) ? [params.classId] : [];
  }

  // 没有可管理的班级，直接返回空条件
  if (targetClassIds.length === 0) {
    return {
      where: {
        _id: "nonexistent"
      }
    };
  }

  // 2) 限定班级
  where.classId = _.in(targetClassIds);

  // 3) 学生过滤（在学校范围内按姓名/编号模糊，最终通过 studentId 过滤题目）
  if (params.studentName?.trim() || params.studentCode?.trim()) {
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
    const studentIds = students.map(s => s._id);
    if (studentIds.length === 0) {
      return {
        where: {
          _id: "nonexistent"
        }
      };
    }
    where.studentId = _.in(studentIds);
  }

  // 4) 是否需要老师回复筛选
  if (params.isNeedTeacherReply && params.isNeedTeacherReply !== "all") {
    if (params.isNeedTeacherReply === "need") where.isNeedTeacherReply = true;else where.isNeedTeacherReply = _.neq(true);
  }

  // 5) 是否已掌握筛选
  if (params.isStudentMaster && params.isStudentMaster !== "all") {
    where.isStudentMaster = params.isStudentMaster === "yes";
  }
  return {
    where: where
  };
}

/**
 * 统计数量（仅限当前用户所管理的班级数据）
 */
export async function getTeacherReplyCount(schoolId, params) {
  const {
    where
  } = await buildTeacherReplyQueryConditions(schoolId, params);
  return count("problem_question", where);
}

/**
 * 查询列表（每条为 ProblemQuestionDoc）
 */
export async function getTeacherReplyList(schoolId, params) {
  const _ = command();
  const {
    where
  } = await buildTeacherReplyQueryConditions(schoolId, params);
  const pageNum = params.pageNum ?? 0;
  const pageSize = params.pageSize ?? 20;

  // 1) 分页读取 ProblemQuestionDoc，按 created 逆序
  const problemQuestions = await docs({
    c: "problem_question",
    w: where,
    pageNum,
    pageSize,
    orderBy: {
      created: -1
    }
  });
  if (problemQuestions.length === 0) return [];

  // 2) 关联读取 student 与 classroom
  const studentIds = Array.from(new Set(problemQuestions.map(q => q.studentId)));
  const classIds = Array.from(new Set(problemQuestions.map(q => q.classId)));
  const [students, classrooms] = await Promise.all([allDocs({
    c: "student",
    match: {
      _id: _.in(studentIds)
    }
  }), allDocs({
    c: "classroom",
    match: {
      _id: _.in(classIds)
    }
  })]);
  const studentMap = new Map();
  for (const st of students) {
    studentMap.set(st._id, st);
  }
  const classroomMap = new Map();
  for (const cr of classrooms) {
    classroomMap.set(cr._id, cr);
  }

  // 3) 组装结果
  const result = problemQuestions.map(pq => {
    return {
      problemQuestion: pq,
      student: studentMap.get(pq.studentId),
      classroom: classroomMap.get(pq.classId)
    };
  });
  return result;
}

/**
 * 老师回复一条消息：在 ProblemQuestionDoc.teacherStudentMessages 末尾追加，并把 isNeedTeacherReply 设为 false
 */
export async function replyTeacherMessage(problemQuestionId, content) {
  const _ = command();
  const msg = {
    created: timestamp(),
    role: "teacher",
    content
  };
  return updateDoc("problem_question", problemQuestionId, {
    teacherStudentMessages: _.push([msg]),
    isNeedTeacherReply: false
  });
}

/**
 * 读取某个 ProblemQuestion 对应的 AI 聊天记录（学生与AI）
 */
export async function getProblemAiMessages(problemQuestionId) {
  // 查找关联的会话
  const sessions = await allDocs({
    c: "problem_session",
    match: {
      problemQuestionId
    }
  });
  if (!sessions || sessions.length === 0) return [];
  const sessionId = sessions[0]._id;
  const list = await allDocs({
    c: "problem_session_message",
    match: {
      sessionId
    },
    sort: {
      created: 1
    }
  });
  return list;
}
