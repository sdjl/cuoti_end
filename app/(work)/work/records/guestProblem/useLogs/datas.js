"use server";

/**
 * 非登录用户AI题目答疑日志数据查询模块
 *
 * 查询 GuestProblemQuestionDoc 数据，每一条记录对应一个 GuestProblemQuestionDoc
 *
 * 重要说明：
 * 非登录用户通过openid识别，不依赖学校ID。
 * 查询条件支持：
 * - 学生姓名（通过 GuestStudentInfoDoc 过滤）
 * - 时间范围（通过 GuestProblemQuestionDoc.created 过滤）
 * - 掌握情况（通过 GuestProblemQuestionDoc.isStudentMaster 过滤）
 * - 排序（通过 GuestProblemQuestionDoc.created 排序）
 */
import { allDocs, command, count, docs } from "../../../../../../lib/common/database.js";
import { getCurrentSchoolId } from "../../../../../../lib/work/teacher/mySchool.js";
/**
 * 生成共用的查询条件
 */
async function buildQueryConditions(params) {
  const _ = command();
  const guestProblemQuestionWhereConditions = {};

  // 1. 根据学生姓名或openid过滤
  if (params.studentName?.trim()) {
    const searchValue = params.studentName.trim();

    // 检查输入是否像openid（长度大于20个字符，包含字母数字）
    const isOpenidSearch = searchValue.length > 15 && /^[a-zA-Z0-9_-]+$/.test(searchValue);
    if (isOpenidSearch) {
      // 直接按openid搜索
      guestProblemQuestionWhereConditions.openid = new RegExp(searchValue, "i");
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
        // 如果没有找到匹配的学生，返回空查询条件
        return {
          guestProblemQuestionWhereConditions: {
            _id: "nonexistent"
          }
        };
      }
      guestProblemQuestionWhereConditions.openid = _.in(openids);
    }
  }

  // 2. 时间范围过滤
  if (params.startTime || params.endTime) {
    const timeConditions = {};
    if (params.startTime) {
      const startTimestamp = new Date(`${params.startTime}T00:00:00`).getTime();
      timeConditions.$gte = startTimestamp;
    }
    if (params.endTime) {
      const endTimestamp = new Date(`${params.endTime}T23:59:59`).getTime();
      timeConditions.$lte = endTimestamp;
    }
    if (Object.keys(timeConditions).length > 0) {
      if (timeConditions.$gte && timeConditions.$lte) {
        guestProblemQuestionWhereConditions.created = _.gte(timeConditions.$gte).and(_.lte(timeConditions.$lte));
      } else if (timeConditions.$gte) {
        guestProblemQuestionWhereConditions.created = _.gte(timeConditions.$gte);
      } else if (timeConditions.$lte) {
        guestProblemQuestionWhereConditions.created = _.lte(timeConditions.$lte);
      }
    }
  }

  // 3. 掌握情况过滤
  if (params.masteryStatus && params.masteryStatus !== "all") {
    if (params.masteryStatus === "mastered") {
      guestProblemQuestionWhereConditions.isStudentMaster = true;
    } else if (params.masteryStatus === "not_mastered") {
      guestProblemQuestionWhereConditions.isStudentMaster = false;
    }
  }
  return {
    guestProblemQuestionWhereConditions
  };
}

/**
 * 获取非登录用户AI题目答疑日志列表
 */

export async function getGuestAIQuestionLogs(params) {
  const {
    guestProblemQuestionWhereConditions
  } = await buildQueryConditions(params);

  // 构建排序条件
  let orderBy = {
    created: -1
  }; // 默认最新在前
  if (params.sortOrder === "oldest") {
    orderBy = {
      created: 1
    };
  }

  // 查询 GuestProblemQuestionDoc
  const guestProblemQuestions = await docs({
    c: "guest_problem_question",
    w: guestProblemQuestionWhereConditions,
    pageNum: params.pageNum,
    pageSize: params.pageSize,
    orderBy
  });
  if (guestProblemQuestions.length === 0) {
    return [];
  }
  const _ = command();

  // 获取学生信息数据
  const openids = [...new Set(guestProblemQuestions.map(gpq => gpq.openid))];
  const currentSchoolId = await getCurrentSchoolId();
  const guestStudentInfos = await allDocs({
    c: "guest_student_info",
    match: {
      openid: _.in(openids),
      schoolId: currentSchoolId // 只查询当前校园的数据
    }
  });
  const guestStudentInfoMap = new Map(guestStudentInfos.map(guestStudentInfo => [guestStudentInfo.openid, guestStudentInfo]));

  // 获取关联的 GuestProblemSessionDoc 数据
  const guestProblemQuestionIds = guestProblemQuestions.map(gpq => gpq._id);
  const guestProblemSessions = await allDocs({
    c: "guest_problem_session",
    match: {
      guestProblemQuestionId: _.in(guestProblemQuestionIds)
    }
  });
  const guestProblemSessionMap = new Map(guestProblemSessions.map(session => [session.guestProblemQuestionId, session]));

  // 组装结果数据
  const results = [];
  for (const guestProblemQuestion of guestProblemQuestions) {
    const guestProblemQuestionData = guestProblemQuestion;
    const guestStudentInfo = guestStudentInfoMap.get(guestProblemQuestionData.openid);

    // 如果没有对应的学生信息，创建一个默认的学生信息
    const defaultGuestStudentInfo = guestStudentInfo || {
      _id: "unknown",
      openid: guestProblemQuestionData.openid,
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
    const guestProblemSession = guestProblemSessionMap.get(guestProblemQuestionData._id);
    results.push({
      guestProblemQuestion: guestProblemQuestionData,
      guestProblemSession,
      guestStudentInfo: defaultGuestStudentInfo,
      messageCount: 0,
      lastMessageTime: undefined
    });
  }
  return results;
}

/**
 * 获取非登录用户AI题目答疑日志总数
 */
export async function getGuestAIQuestionLogsCount(params) {
  const {
    guestProblemQuestionWhereConditions
  } = await buildQueryConditions(params);
  return await count("guest_problem_question", guestProblemQuestionWhereConditions);
}

/**
 * 获取GuestProblemSessionDoc信息
 */
export async function getGuestProblemSessionFromDB(sessionId) {
  return await allDocs({
    c: "guest_problem_session",
    match: {
      _id: sessionId
    }
  });
}

/**
 * 删除相关的AI对话消息
 */
export async function deleteGuestProblemSessionMessagesFromDB(sessionId) {
  const {
    removeMatch
  } = await import("../../../../../../lib/common/database");
  return await removeMatch("guest_problem_session_message", {
    sessionId: sessionId
  });
}

/**
 * 删除自主上传错题会话
 */
export async function deleteGuestProblemSessionFromDB(sessionId) {
  const {
    removeDoc
  } = await import("../../../../../../lib/common/database");
  return await removeDoc("guest_problem_session", sessionId);
}
