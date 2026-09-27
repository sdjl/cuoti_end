import { allDocs, command } from "../../../../../../lib/common/database.js";
import { DISPLAY_TEXT } from "../../../../../../lib/config/constants.js";
export async function getGuestAIQuestionStatistics(filter) {
  const _ = command();
  try {
    // 构建基础查询条件
    const sessionMatchConditions = {};
    const questionMatchConditions = {};

    // 添加时间过滤条件
    if (filter?.timeRange && filter.timeRange !== "all" && filter.startDate && filter.endDate) {
      const startTimestamp = filter.startDate.getTime();
      const endTimestamp = filter.endDate.getTime() + 24 * 60 * 60 * 1000 - 1;
      const timeCondition = _.gte(startTimestamp).and(_.lte(endTimestamp));
      questionMatchConditions.created = timeCondition;
      sessionMatchConditions.created = timeCondition;
    }

    // 获取符合条件的题目
    const guestProblemQuestions = await allDocs({
      c: "guest_problem_question",
      match: questionMatchConditions
    });
    if (guestProblemQuestions.length === 0) {
      return getEmptyGuestStatistics();
    }
    const guestProblemQuestionIds = guestProblemQuestions.map(gpq => gpq._id);

    // 获取相关的会话
    // 注意：数据库中实际使用的字段名是 problemQuestionId，而不是 guestProblemQuestionId
    sessionMatchConditions.problemQuestionId = _.in(guestProblemQuestionIds);
    const guestProblemSessions = await allDocs({
      c: "guest_problem_session",
      match: sessionMatchConditions
    });

    // 获取会话的所有消息（如果有会话的话）
    let sessionMessages = [];
    if (guestProblemSessions.length > 0) {
      const sessionIds = guestProblemSessions.map(gps => gps._id);
      sessionMessages = await allDocs({
        c: "guest_problem_session_message",
        match: {
          sessionId: _.in(sessionIds)
        }
      });
    }

    // 计算题目掌握统计
    const totalQuestions = guestProblemQuestions.length;
    const masteredQuestions = guestProblemQuestions.filter(q => q.isStudentMaster).length;
    const unmasteredQuestions = totalQuestions - masteredQuestions;
    const questionMasteryRate = totalQuestions > 0 ? masteredQuestions / totalQuestions * 100 : 0;

    // 计算会话统计数据
    const totalSessions = guestProblemSessions.length;
    const completedSessions = guestProblemSessions.filter(s => s.status === "completed").length;
    const activeSessions = guestProblemSessions.filter(s => s.status === "active").length;
    const aiMasteredSessions = guestProblemSessions.filter(s => s.isStudentMaster).length;
    const aiUnmasteredSessions = totalSessions - aiMasteredSessions;
    const ratedSessions = guestProblemSessions.filter(s => s.learningAssessment?.studentRating).length;
    const unratedSessions = totalSessions - ratedSessions;
    const totalMessages = sessionMessages.length;
    const aiMessages = sessionMessages.filter(m => m.role === "assistant").length;
    const userMessages = sessionMessages.filter(m => m.role === "user").length;
    const imageMessages = sessionMessages.filter(m => m.role === "user" && m.image).length;
    const averageMessagesPerSession = totalSessions > 0 ? totalMessages / totalSessions : 0;
    const completionRate = totalSessions > 0 ? completedSessions / totalSessions * 100 : 0;
    const aiMasteryRate = totalSessions > 0 ? aiMasteredSessions / totalSessions * 100 : 0;
    const studentRatingRate = totalSessions > 0 ? ratedSessions / totalSessions * 100 : 0;
    return {
      totalQuestions,
      masteredQuestions,
      unmasteredQuestions,
      totalSessions,
      completedSessions,
      activeSessions,
      aiMasteredSessions,
      aiUnmasteredSessions,
      ratedSessions,
      unratedSessions,
      totalMessages,
      aiMessages,
      userMessages,
      imageMessages,
      averageMessagesPerSession: Math.round(averageMessagesPerSession * 10) / 10,
      completionRate: Math.round(completionRate * 10) / 10,
      aiMasteryRate: Math.round(aiMasteryRate * 10) / 10,
      studentRatingRate: Math.round(studentRatingRate * 10) / 10,
      questionMasteryRate: Math.round(questionMasteryRate * 10) / 10
    };
  } catch (error) {
    console.error(`获取非登录用户${DISPLAY_TEXT.SELF_UPLOAD_MISTAKE}统计数据失败:`, error);
    throw new Error(`获取非登录用户${DISPLAY_TEXT.SELF_UPLOAD_MISTAKE}统计数据失败`);
  }
}

/**
 * 获取非登录用户学生自主上传错题统计数据（按学生分组）
 */
export async function getGuestStudentAIQuestionStatistics(filter) {
  const _ = command();
  try {
    // 构建时间过滤条件
    let timeConditions = {};
    if (filter?.timeRange && filter.timeRange !== "all") {
      if (filter.timeRange === "custom" && filter.startDate && filter.endDate) {
        const startTimestamp = filter.startDate.getTime();
        const endTimestamp = filter.endDate.getTime() + 24 * 60 * 60 * 1000 - 1;
        timeConditions = {
          created: _.gte(startTimestamp).and(_.lte(endTimestamp))
        };
      } else if (filter.startDate && filter.endDate) {
        const startTimestamp = filter.startDate.getTime();
        const endTimestamp = filter.endDate.getTime() + 24 * 60 * 60 * 1000 - 1;
        timeConditions = {
          created: _.gte(startTimestamp).and(_.lte(endTimestamp))
        };
      }
    }

    // 获取所有符合时间条件的非登录用户题目
    const guestProblemQuestions = await allDocs({
      c: "guest_problem_question",
      match: timeConditions
    });
    if (guestProblemQuestions.length === 0) {
      return [];
    }

    // 获取所有相关的openid
    const openids = Array.from(new Set(guestProblemQuestions.map(gpq => gpq.openid)));

    // 获取学生信息
    const guestStudentInfos = await allDocs({
      c: "guest_student_info",
      match: {
        openid: _.in(openids)
      }
    });
    const guestStudentInfoMap = new Map();
    for (const gsi of guestStudentInfos) {
      guestStudentInfoMap.set(gsi.openid, gsi);
    }

    // 按openid分组统计题目数据
    const studentStatsMap = new Map();
    guestProblemQuestions.forEach(question => {
      const openid = question.openid;
      if (!studentStatsMap.has(openid)) {
        const guestStudentInfo = guestStudentInfoMap.get(openid);
        const studentInfo = guestStudentInfo?.studentInfo;
        studentStatsMap.set(openid, {
          totalQuestions: 0,
          masteredQuestions: 0,
          studentName: studentInfo?.studentName || "未知学生",
          studentPhone: studentInfo?.studentPhone,
          schoolName: studentInfo?.schoolName,
          grade: studentInfo?.grade
        });
      }
      const stats = studentStatsMap.get(openid);
      stats.totalQuestions++;
      if (question.isStudentMaster) {
        stats.masteredQuestions++;
      }
    });

    // 生成最终结果
    const result = Array.from(studentStatsMap.entries()).map(([openid, stats]) => ({
      openid,
      studentName: stats.studentName,
      studentPhone: stats.studentPhone,
      schoolName: stats.schoolName,
      grade: stats.grade,
      totalQuestions: stats.totalQuestions,
      masteredQuestions: stats.masteredQuestions,
      unmasteredQuestions: stats.totalQuestions - stats.masteredQuestions
    }));

    // 按题目总数从高到低排序
    result.sort((a, b) => b.totalQuestions - a.totalQuestions);
    return result;
  } catch (error) {
    console.error(`获取非登录用户学生${DISPLAY_TEXT.SELF_UPLOAD_MISTAKE}统计数据失败:`, error);
    throw new Error(`获取非登录用户学生${DISPLAY_TEXT.SELF_UPLOAD_MISTAKE}统计数据失败`);
  }
}

/**
 * 返回空统计数据
 */
function getEmptyGuestStatistics() {
  return {
    totalQuestions: 0,
    masteredQuestions: 0,
    unmasteredQuestions: 0,
    totalSessions: 0,
    completedSessions: 0,
    activeSessions: 0,
    aiMasteredSessions: 0,
    aiUnmasteredSessions: 0,
    ratedSessions: 0,
    unratedSessions: 0,
    totalMessages: 0,
    aiMessages: 0,
    userMessages: 0,
    imageMessages: 0,
    averageMessagesPerSession: 0,
    completionRate: 0,
    aiMasteryRate: 0,
    studentRatingRate: 0,
    questionMasteryRate: 0
  };
}
