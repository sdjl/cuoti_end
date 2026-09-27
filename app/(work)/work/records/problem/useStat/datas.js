import { getStudentsByClassRoom } from "../../../../../../lib/collection/student.js";
import { allDocs, command } from "../../../../../../lib/common/database.js";
import { DISPLAY_TEXT } from "../../../../../../lib/config/constants.js";
export async function getAIQuestionStatistics(filter) {
  const _ = command();
  try {
    // 构建基础查询条件
    const sessionMatchConditions = {};
    const questionMatchConditions = {};

    // 添加时间过滤条件
    if (filter?.timeRange && filter.timeRange !== "all") {
      if (filter.timeRange === "custom" && filter.startDate && filter.endDate) {
        const startTimestamp = filter.startDate.getTime();
        const endTimestamp = filter.endDate.getTime() + 24 * 60 * 60 * 1000 - 1;
        sessionMatchConditions.created = _.gte(startTimestamp).and(_.lte(endTimestamp));
      } else if (filter.startDate && filter.endDate) {
        const startTimestamp = filter.startDate.getTime();
        const endTimestamp = filter.endDate.getTime() + 24 * 60 * 60 * 1000 - 1;
        sessionMatchConditions.created = _.gte(startTimestamp).and(_.lte(endTimestamp));
      }
    }

    // 根据筛选范围添加条件
    if (filter) {
      switch (filter.scope) {
        case "classroom":
          if (filter.classRoomId) {
            // 获取该班级的所有学生ID
            const students = await getStudentsByClassRoom(filter.classRoomId);
            const studentIds = students.map(s => s._id);
            if (studentIds.length > 0) {
              questionMatchConditions.studentId = {
                $in: studentIds
              };
            } else {
              // 如果班级没有学生，返回空统计
              return getEmptyStatistics();
            }
          } else {
            return getEmptyStatistics();
          }
          break;
        case "student":
          if (filter.studentId && filter.classRoomId) {
            questionMatchConditions.studentId = filter.studentId;
          } else {
            return getEmptyStatistics();
          }
          break;
      }
    }

    // 获取符合条件的题目
    const problemQuestions = await allDocs({
      c: "problem_question",
      match: questionMatchConditions
    });
    if (problemQuestions.length === 0) {
      return getEmptyStatistics();
    }
    const problemQuestionIds = problemQuestions.map(pq => pq._id);

    // 获取相关的会话
    sessionMatchConditions.problemQuestionId = _.in(problemQuestionIds);
    const problemSessions = await allDocs({
      c: "problem_session",
      match: sessionMatchConditions
    });
    if (problemSessions.length === 0) {
      return getEmptyStatistics();
    }

    // 获取会话的所有消息
    const sessionIds = problemSessions.map(ps => ps._id);
    const sessionMessages = await allDocs({
      c: "problem_session_message",
      match: {
        sessionId: _.in(sessionIds)
      }
    });

    // 计算题目掌握统计
    const totalQuestions = problemQuestions.length;
    const masteredQuestions = problemQuestions.filter(q => q.isStudentMaster).length;
    const unmasteredQuestions = totalQuestions - masteredQuestions;
    const questionMasteryRate = totalQuestions > 0 ? masteredQuestions / totalQuestions * 100 : 0;

    // 计算会话统计数据
    const totalSessions = problemSessions.length;
    const completedSessions = problemSessions.filter(s => s.status === "completed").length;
    const activeSessions = problemSessions.filter(s => s.status === "active").length;
    const aiMasteredSessions = problemSessions.filter(s => s.isStudentMaster).length;
    const aiUnmasteredSessions = totalSessions - aiMasteredSessions;
    const ratedSessions = problemSessions.filter(s => s.learningAssessment?.studentRating).length;
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
    console.error(`获取${DISPLAY_TEXT.SELF_UPLOAD_MISTAKE}统计数据失败:`, error);
    throw new Error(`获取${DISPLAY_TEXT.SELF_UPLOAD_MISTAKE}统计数据失败`);
  }
}

/**
 * 获取班级学生自主上传错题统计数据
 */
export async function getStudentAIQuestionStatistics(classRoomId, filter) {
  const _ = command();
  try {
    // 获取班级所有学生
    const students = await getStudentsByClassRoom(classRoomId);
    if (students.length === 0) {
      return [];
    }
    const studentIds = students.map(s => s._id);

    // 获取所有学生的题目
    const problemQuestions = await allDocs({
      c: "problem_question",
      match: {
        studentId: _.in(studentIds)
      }
    });
    if (problemQuestions.length === 0) {
      return students.map(student => ({
        studentId: student._id,
        studentName: student.name,
        studentCode: student.studentCode,
        totalQuestions: 0,
        masteredQuestions: 0,
        unmasteredQuestions: 0
      }));
    }

    // 如果有时间过滤条件，需要按题目创建时间过滤
    let filteredProblemQuestions = problemQuestions;
    if (filter?.timeRange && filter.timeRange !== "all") {
      if (filter.timeRange === "custom" && filter.startDate && filter.endDate) {
        const startTimestamp = filter.startDate.getTime();
        const endTimestamp = filter.endDate.getTime() + 24 * 60 * 60 * 1000 - 1;
        filteredProblemQuestions = problemQuestions.filter(pq => pq.created >= startTimestamp && pq.created <= endTimestamp);
      } else if (filter.startDate && filter.endDate) {
        const startTimestamp = filter.startDate.getTime();
        const endTimestamp = filter.endDate.getTime() + 24 * 60 * 60 * 1000 - 1;
        filteredProblemQuestions = problemQuestions.filter(pq => pq.created >= startTimestamp && pq.created <= endTimestamp);
      }
    }

    // 按学生ID分组统计题目数据
    const studentStatsMap = new Map();
    filteredProblemQuestions.forEach(question => {
      const studentId = question.studentId;
      if (!studentStatsMap.has(studentId)) {
        studentStatsMap.set(studentId, {
          totalQuestions: 0,
          masteredQuestions: 0
        });
      }
      const stats = studentStatsMap.get(studentId);
      stats.totalQuestions++;
      if (question.isStudentMaster) {
        stats.masteredQuestions++;
      }
    });

    // 生成最终结果
    const result = students.map(student => {
      const stats = studentStatsMap.get(student._id) || {
        totalQuestions: 0,
        masteredQuestions: 0
      };
      return {
        studentId: student._id,
        studentName: student.name,
        studentCode: student.studentCode,
        totalQuestions: stats.totalQuestions,
        masteredQuestions: stats.masteredQuestions,
        unmasteredQuestions: stats.totalQuestions - stats.masteredQuestions
      };
    });

    // 按题目总数从高到低排序
    result.sort((a, b) => b.totalQuestions - a.totalQuestions);
    return result;
  } catch (error) {
    console.error(`获取学生${DISPLAY_TEXT.SELF_UPLOAD_MISTAKE}统计数据失败:`, error);
    throw new Error(`获取学生${DISPLAY_TEXT.SELF_UPLOAD_MISTAKE}统计数据失败`);
  }
}

/**
 * 返回空统计数据
 */
function getEmptyStatistics() {
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
