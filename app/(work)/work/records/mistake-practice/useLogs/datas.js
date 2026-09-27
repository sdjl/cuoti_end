"use server";

/**
 * 课程错题日志数据查询模块
 *
 * 重要说明：
 * 不要在此页面中添加根据掌握情况过滤的功能，这会导致查询大量的 StudentAnswerItemDoc 数据用于过滤，
 * 由于 StudentAnswerItemDoc 数据量巨大，会导致严重的性能问题。
 */
import { allDocs, command, count, docs } from "../../../../../../lib/common/database.js";
/**
 * 生成共用的查询条件
 */
async function buildQueryConditions(schoolId, params) {
  const _ = command();
  const sessionWhereConditions = {};

  // 1. 根据班级ID、学生ID、学生搜索和班级名称过滤出学生ID列表
  if (params.classId || params.studentId || params.studentSearch || params.classroomName) {
    // 如果直接提供了 studentId，优先使用
    if (params.studentId) {
      sessionWhereConditions.studentId = params.studentId;
    } else {
      const studentWhereConditions = {
        schoolId
      };

      // 如果提供了班级名称，需要通过班级名称查询班级ID，再查询该班级的学生
      let targetClassId = params.classId;
      if (params.classroomName && !params.classId) {
        const classrooms = await allDocs({
          c: "classroom",
          match: {
            schoolId,
            name: params.classroomName
          },
          only: "_id"
        });
        if (classrooms.length > 0) {
          targetClassId = classrooms[0]._id;
        } else {
          // 如果没有找到匹配的班级，返回空查询条件
          return {
            sessionWhereConditions: {
              _id: "nonexistent"
            },
            studentAnswerItemIds: []
          };
        }
      }

      // 如果提供了班级ID，需要通过 student_class 查询该班级的学生
      if (targetClassId) {
        const studentClasses = await allDocs({
          c: "student_class",
          match: {
            classRoomId: targetClassId,
            status: "在读"
          },
          only: "studentId"
        });
        const classStudentIds = studentClasses.map(sc => sc.studentId);
        if (classStudentIds.length === 0) {
          // 如果该班级没有学生，返回空查询条件
          return {
            sessionWhereConditions: {
              _id: "nonexistent"
            },
            studentAnswerItemIds: []
          };
        }
        studentWhereConditions._id = _.in(classStudentIds);
      }

      // 学生搜索（可以是姓名或编号）
      if (params.studentSearch) {
        studentWhereConditions.$or = [{
          name: new RegExp(params.studentSearch, "i")
        }, {
          studentCode: new RegExp(params.studentSearch, "i")
        }];
      }
      const students = await allDocs({
        c: "student",
        match: studentWhereConditions,
        only: "_id"
      });
      const studentIds = students.map(student => student._id);
      if (studentIds.length === 0) {
        // 如果没有找到匹配的学生，返回空查询条件
        return {
          sessionWhereConditions: {
            _id: "nonexistent"
          },
          studentAnswerItemIds: []
        };
      }
      sessionWhereConditions.studentId = _.in(studentIds);
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
        sessionWhereConditions.created = _.gte(timeConditions.$gte).and(_.lte(timeConditions.$lte));
      } else if (timeConditions.$gte) {
        sessionWhereConditions.created = _.gte(timeConditions.$gte);
      } else if (timeConditions.$lte) {
        sessionWhereConditions.created = _.lte(timeConditions.$lte);
      }
    }
  }

  // 3. 学生评分过滤
  if (params.studentRating && params.studentRating !== "all") {
    if (params.studentRating === "none") {
      sessionWhereConditions["learningAssessment.studentRating"] = _.exists(false);
    } else {
      const rating = parseInt(params.studentRating);
      sessionWhereConditions["learningAssessment.studentRating"] = rating;
    }
  }
  return {
    sessionWhereConditions
  };
}

/**
 * 获取课程错题日志列表
 */
export async function getMistakePracticeLogs(schoolId, params) {
  const {
    sessionWhereConditions
  } = await buildQueryConditions(schoolId, params);
  const _ = command();

  // 构建排序条件
  let orderBy = {
    created: -1
  }; // 默认最新在前
  if (params.sortOrder === "oldest") {
    orderBy = {
      created: 1
    };
  }

  // 查询AI聊天会话
  const sessions = await docs({
    c: "student_question_ai_chat_session",
    w: sessionWhereConditions,
    pageNum: params.pageNum,
    pageSize: params.pageSize,
    orderBy
  });
  if (sessions.length === 0) {
    return [];
  }

  // 获取相关的StudentAnswerItem数据
  const studentAnswerItemIds = sessions.map(session => session.studentAnswerItemId);
  const studentAnswerItems = await allDocs({
    c: "student_answer_item",
    match: {
      _id: _.in(studentAnswerItemIds)
    }
  });
  const studentAnswerItemMap = new Map(studentAnswerItems.map(item => [item._id, item]));

  // 获取相关的StudentAnswer数据
  const studentAnswerIds = studentAnswerItems.map(item => item.studentAnswerId);
  const studentAnswers = await allDocs({
    c: "student_answer",
    match: {
      _id: _.in(studentAnswerIds)
    }
  });
  const studentAnswerMap = new Map(studentAnswers.map(answer => [answer._id, answer]));

  // 获取学生数据
  const studentIds = [...new Set(studentAnswers.map(answer => answer.studentId))];
  const students = await allDocs({
    c: "student",
    match: {
      _id: _.in(studentIds)
    }
  });
  const studentMap = new Map(students.map(student => [student._id, student]));

  // 获取班级数据
  const classIds = [...new Set(studentAnswers.map(answer => answer.classId))];
  const classrooms = await allDocs({
    c: "classroom",
    match: {
      _id: _.in(classIds)
    }
  });
  const classroomMap = new Map(classrooms.map(classroom => [classroom._id, classroom]));

  // 获取题目集合数据
  const questionPackIds = [...new Set(studentAnswers.map(answer => answer.questionPackId))];
  const questionPacks = await allDocs({
    c: "question_pack",
    match: {
      _id: _.in(questionPackIds)
    }
  });
  const questionPackMap = new Map(questionPacks.map(pack => [pack._id, pack]));

  // 获取题目数据（可选）
  const questionIds = [...new Set(studentAnswerItems.map(item => item.questionId))];
  const examQuestions = await allDocs({
    c: "exam_question",
    match: {
      _id: _.in(questionIds)
    }
  });
  const examQuestionMap = new Map(examQuestions.map(question => [question._id, question]));

  // 获取AI聊天会话数据
  const sessionIds = sessions.map(session => session._id);
  const aiChatSessions = await allDocs({
    c: "student_question_ai_chat_session",
    match: {
      _id: _.in(sessionIds)
    }
  });
  const aiChatSessionMap = new Map(aiChatSessions.map(session => [session._id, session]));

  // 组装结果数据
  const results = [];
  for (const session of sessions) {
    const sessionData = session;
    const studentAnswerItem = studentAnswerItemMap.get(sessionData.studentAnswerItemId);
    if (!studentAnswerItem) continue;
    const studentAnswer = studentAnswerMap.get(studentAnswerItem.studentAnswerId);
    if (!studentAnswer) continue;
    const student = studentMap.get(studentAnswer.studentId);
    if (!student) continue;
    const classroom = classroomMap.get(studentAnswer.classId);
    if (!classroom) continue;
    const questionPack = questionPackMap.get(studentAnswer.questionPackId);
    if (!questionPack) continue;
    const examQuestion = examQuestionMap.get(studentAnswerItem.questionId);
    const aiChatSession = aiChatSessionMap.get(sessionData._id);
    if (!aiChatSession) continue;
    results.push({
      studentAnswerItem,
      student,
      classroom,
      questionPack,
      studentAnswer,
      examQuestion,
      aiChatSession
    });
  }
  return results;
}

/**
 * 获取课程错题日志总数
 */
export async function getMistakePracticeLogsCount(schoolId, params) {
  const {
    sessionWhereConditions
  } = await buildQueryConditions(schoolId, params);
  return await count("student_question_ai_chat_session", sessionWhereConditions);
}

/**
 * 获取StudentAnswerItemDoc信息
 */
export async function getStudentAnswerItemFromDB(studentAnswerItemId) {
  return await allDocs({
    c: "student_answer_item",
    match: {
      _id: studentAnswerItemId
    }
  });
}

/**
 * 获取AI聊天会话
 */
export async function getAIChatSessionFromDB(aiChatSessionId) {
  return await allDocs({
    c: "student_question_ai_chat_session",
    match: {
      _id: aiChatSessionId
    }
  });
}

/**
 * 获取AI聊天消息
 */
export async function getAIChatMessagesFromDB(aiChatSessionId) {
  return await allDocs({
    c: "student_question_ai_chat_message",
    match: {
      sessionId: aiChatSessionId
    }
  });
}

/**
 * 删除聊天消息
 */
export async function deleteAIChatMessagesFromDB(sessionId) {
  const {
    removeMatch
  } = await import("../../../../../../lib/common/database");
  return await removeMatch("student_question_ai_chat_message", {
    sessionId: sessionId
  });
}

/**
 * 删除聊天会话
 */
export async function deleteAIChatSessionFromDB(sessionId) {
  const {
    removeDoc
  } = await import("../../../../../../lib/common/database");
  return await removeDoc("student_question_ai_chat_session", sessionId);
}

/**
 * 更新StudentAnswerItemDoc，删除相关字段
 */
export async function updateStudentAnswerItemRemoveFieldsFromDB(studentAnswerItemId) {
  const {
    updateDoc,
    command
  } = await import("../../../../../../lib/common/database");
  const _ = command();
  return await updateDoc("student_answer_item", studentAnswerItemId, {
    isCorrectedByMistakeAgain: _.remove(),
    mistakeMasteredTime: _.remove(),
    aiChatSessionId: _.remove()
  });
}
