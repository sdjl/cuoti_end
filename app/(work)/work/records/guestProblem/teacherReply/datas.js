"use server";

import { allDocs, command, count, docs, updateDoc } from "../../../../../../lib/common/database.js";
import { timestamp } from "../../../../../../lib/common/time.js";
import { getCurrentSchoolId } from "../../../../../../lib/work/teacher/mySchool.js";
/**
 * 构建查询条件（非登录用户数据）
 */
export async function buildGuestTeacherReplyQueryConditions(params) {
  const _ = command();
  const where = {};

  // 1) 学生过滤（通过学生姓名或openid）
  if (params.studentName?.trim() || params.openid?.trim()) {
    const searchValue = params.studentName?.trim() || params.openid?.trim() || "";

    // 检查输入是否像openid（长度大于15个字符，包含字母数字）
    const isOpenidSearch = searchValue.length > 15 && /^[a-zA-Z0-9_-]+$/.test(searchValue);
    if (isOpenidSearch || params.openid) {
      // 直接按openid搜索
      where.openid = new RegExp(searchValue, "i");
    } else {
      // 按学生姓名搜索，需要先从guest_student_info查找openid
      const currentSchoolId = await getCurrentSchoolId();
      const guestStudentWhereConditions = {
        "studentInfo.studentName": new RegExp(searchValue, "i"),
        schoolId: currentSchoolId // 只查询当前校园的数据
      };
      const guestStudents = await allDocs({
        c: "guest_student_info",
        match: guestStudentWhereConditions,
        only: "openid"
      });
      const openids = guestStudents.map(guestStudent => guestStudent.openid);
      if (openids.length === 0) {
        return {
          where: {
            _id: "nonexistent"
          }
        };
      }
      where.openid = _.in(openids);
    }
  }

  // 2) 是否需要老师回复筛选
  if (params.isNeedTeacherReply && params.isNeedTeacherReply !== "all") {
    if (params.isNeedTeacherReply === "need") where.isNeedTeacherReply = true;else where.isNeedTeacherReply = _.neq(true);
  }

  // 3) 是否已掌握筛选
  if (params.isStudentMaster && params.isStudentMaster !== "all") {
    where.isStudentMaster = params.isStudentMaster === "yes";
  }
  return {
    where: where
  };
}

/**
 * 统计数量（非登录用户数据）
 */
export async function getGuestTeacherReplyCount(params) {
  const {
    where
  } = await buildGuestTeacherReplyQueryConditions(params);
  return count("guest_problem_question", where);
}

/**
 * 查询列表（每条为 GuestProblemQuestionDoc）
 */
export async function getGuestTeacherReplyList(params) {
  const _ = command();
  const {
    where
  } = await buildGuestTeacherReplyQueryConditions(params);
  const pageNum = params.pageNum ?? 0;
  const pageSize = params.pageSize ?? 20;

  // 1) 分页读取 GuestProblemQuestionDoc，按 created 逆序
  const guestProblemQuestions = await docs({
    c: "guest_problem_question",
    w: where,
    pageNum,
    pageSize,
    orderBy: {
      created: -1
    }
  });
  if (guestProblemQuestions.length === 0) return [];

  // 2) 关联读取 guest_student_info
  const openids = Array.from(new Set(guestProblemQuestions.map(q => q.openid)));
  const currentSchoolId = await getCurrentSchoolId();
  const guestStudentInfos = await allDocs({
    c: "guest_student_info",
    match: {
      openid: _.in(openids),
      schoolId: currentSchoolId // 只查询当前校园的数据
    }
  });
  const guestStudentInfoMap = new Map();
  for (const gsi of guestStudentInfos) {
    guestStudentInfoMap.set(gsi.openid, gsi);
  }

  // 3) 组装结果
  const result = [];
  for (const gpq of guestProblemQuestions) {
    const guestStudentInfo = guestStudentInfoMap.get(gpq.openid);

    // 如果没有对应的学生信息，创建默认的
    const defaultGuestStudentInfo = guestStudentInfo || {
      _id: "unknown",
      openid: gpq.openid,
      schoolId: currentSchoolId,
      // 使用当前校园ID
      studentInfo: {
        studentName: "未知学生",
        schoolName: "未填写",
        grade: "未填写"
      },
      isContactedByTeacher: false,
      created: Date.now()
    };
    result.push({
      guestProblemQuestion: gpq,
      guestStudentInfo: defaultGuestStudentInfo
    });
  }
  return result;
}

/**
 * 老师回复一条消息：在 GuestProblemQuestionDoc.teacherStudentMessages 末尾追加，并把 isNeedTeacherReply 设为 false
 */
export async function replyGuestTeacherMessage(guestProblemQuestionId, content) {
  const _ = command();
  const msg = {
    created: timestamp(),
    role: "teacher",
    content
  };
  return updateDoc("guest_problem_question", guestProblemQuestionId, {
    teacherStudentMessages: _.push([msg]),
    isNeedTeacherReply: false
  });
}

/**
 * 读取某个 GuestProblemQuestion 对应的 AI 聊天记录（学生与AI）
 */
export async function getGuestProblemAiMessages(guestProblemQuestionId) {
  // 查找关联的会话
  const sessions = await allDocs({
    c: "guest_problem_session",
    match: {
      problemQuestionId: guestProblemQuestionId
    }
  });
  if (!sessions || sessions.length === 0) return [];
  const sessionId = sessions[0]._id;
  const list = await allDocs({
    c: "guest_problem_session_message",
    match: {
      sessionId
    },
    sort: {
      created: 1
    }
  });
  return list;
}
