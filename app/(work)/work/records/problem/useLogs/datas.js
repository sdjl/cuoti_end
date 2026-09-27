"use server";

/**
 * AI题目答疑日志数据查询模块
 *
 * 查询 ProblemQuestionDoc 数据，每一条记录对应一个 ProblemQuestionDoc
 *
 * 重要说明：
 * 不要在此页面中添加根据学生评分过滤的功能，这会导致查询大量的 ProblemSessionDoc 数据用于过滤，
 * 由于 ProblemSessionDoc 数据量巨大，会导致严重的性能问题。
 *
 * 当前支持的过滤条件：
 * - 学生姓名和编号（通过 StudentDoc 过滤）
 * - 时间范围（通过 ProblemQuestionDoc.created 过滤）
 * - 掌握情况（通过 ProblemQuestionDoc.isStudentMaster 过滤）
 * - 排序（通过 ProblemQuestionDoc.created 排序）
 */
import { allDocs, command, count, docs } from "../../../../../../lib/common/database.js";
/**
 * 生成共用的查询条件
 */
async function buildQueryConditions(schoolId, params) {
  const _ = command();
  const problemQuestionWhereConditions = {
    schoolId
  };

  // 1. 根据班级ID、学生ID、学生搜索和班级名称过滤出学生ID列表
  if (params.classId || params.studentId || params.studentSearch || params.classroomName) {
    // 如果直接提供了 studentId，优先使用
    if (params.studentId) {
      problemQuestionWhereConditions.studentId = params.studentId;
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
            problemQuestionWhereConditions: {
              _id: "nonexistent"
            }
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
            problemQuestionWhereConditions: {
              _id: "nonexistent"
            }
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
          problemQuestionWhereConditions: {
            _id: "nonexistent"
          }
        };
      }
      problemQuestionWhereConditions.studentId = _.in(studentIds);
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
        problemQuestionWhereConditions.created = _.gte(timeConditions.$gte).and(_.lte(timeConditions.$lte));
      } else if (timeConditions.$gte) {
        problemQuestionWhereConditions.created = _.gte(timeConditions.$gte);
      } else if (timeConditions.$lte) {
        problemQuestionWhereConditions.created = _.lte(timeConditions.$lte);
      }
    }
  }

  // 3. 掌握情况过滤
  if (params.masteryStatus && params.masteryStatus !== "all") {
    if (params.masteryStatus === "mastered") {
      problemQuestionWhereConditions.isStudentMaster = true;
    } else if (params.masteryStatus === "not_mastered") {
      problemQuestionWhereConditions.isStudentMaster = false;
    }
  }
  return {
    problemQuestionWhereConditions
  };
}

/**
 * 获取AI题目答疑日志列表
 */
export async function getAIQuestionLogs(schoolId, params) {
  const {
    problemQuestionWhereConditions
  } = await buildQueryConditions(schoolId, params);

  // 构建排序条件
  let orderBy = {
    created: -1
  }; // 默认最新在前
  if (params.sortOrder === "oldest") {
    orderBy = {
      created: 1
    };
  }

  // 查询 ProblemQuestionDoc
  const problemQuestions = await docs({
    c: "problem_question",
    w: problemQuestionWhereConditions,
    pageNum: params.pageNum,
    pageSize: params.pageSize,
    orderBy
  });
  if (problemQuestions.length === 0) {
    return [];
  }
  const _ = command();

  // 获取学生数据
  const studentIds = [...new Set(problemQuestions.map(pq => pq.studentId))];
  const students = await allDocs({
    c: "student",
    match: {
      _id: _.in(studentIds)
    }
  });
  const studentMap = new Map(students.map(student => [student._id, student]));

  // 获取班级数据
  const classIds = [...new Set(problemQuestions.map(pq => pq.classId))];
  const classrooms = await allDocs({
    c: "classroom",
    match: {
      _id: _.in(classIds)
    }
  });
  const classroomMap = new Map(classrooms.map(classroom => [classroom._id, classroom]));

  // 获取关联的 ProblemSessionDoc 数据（用于获取评分等信息）
  const problemQuestionIds = problemQuestions.map(pq => pq._id);
  const problemSessions = await allDocs({
    c: "problem_session",
    match: {
      problemQuestionId: _.in(problemQuestionIds)
    }
  });
  const problemSessionMap = new Map(problemSessions.map(session => [session.problemQuestionId, session]));

  // 组装结果数据
  const results = [];
  for (const problemQuestion of problemQuestions) {
    const problemQuestionData = problemQuestion;
    const student = studentMap.get(problemQuestionData.studentId);
    if (!student) continue;
    const classroom = classroomMap.get(problemQuestionData.classId);
    if (!classroom) continue;
    const problemSession = problemSessionMap.get(problemQuestionData._id);
    results.push({
      problemQuestion: problemQuestionData,
      problemSession,
      student,
      classroom,
      messageCount: 0,
      lastMessageTime: undefined
    });
  }
  return results;
}

/**
 * 获取AI题目答疑日志总数
 */
export async function getAIQuestionLogsCount(schoolId, params) {
  const {
    problemQuestionWhereConditions
  } = await buildQueryConditions(schoolId, params);
  return await count("problem_question", problemQuestionWhereConditions);
}

/**
 * 获取ProblemSessionDoc信息
 */
export async function getProblemSessionFromDB(sessionId) {
  return await allDocs({
    c: "problem_session",
    match: {
      _id: sessionId
    }
  });
}

/**
 * 删除相关的AI对话消息
 */
export async function deleteProblemSessionMessagesFromDB(sessionId) {
  const {
    removeMatch
  } = await import("../../../../../../lib/common/database");
  return await removeMatch("problem_session_message", {
    sessionId: sessionId
  });
}

/**
 * 删除自主上传错题会话
 */
export async function deleteProblemSessionFromDB(sessionId) {
  const {
    removeDoc
  } = await import("../../../../../../lib/common/database");
  return await removeDoc("problem_session", sessionId);
}
