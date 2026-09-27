"use server";

import { allDocs, command, count, docs, getDoc, removeDoc } from "../../../../../lib/common/database.js";
import { deleteFile } from "../../../../../lib/common/file.js";

// 数据库集合名称常量
const QUIZ_TAKE_COLLECTION = "quiz_take";
const QUIZ_COLLECTION = "quiz";
const STUDENT_COLLECTION = "student";
const CLASSROOM_COLLECTION = "classroom";
const QUIZ_QUESTION_COLLECTION = "quiz_question";
const QUIZ_SESSION_COLLECTION = "quiz_session";
const QUIZ_SESSION_MESSAGE_COLLECTION = "quiz_session_message";


function buildQuizWhereCondition({
  keyword = "",
  subject = "all",
  grade = "all",
  schoolId = ""
} = {}) {
  const _ = command();
  const andList = [];

  // 学校ID筛选（必须条件）
  if (schoolId) {
    andList.push({
      schoolId
    });
  }

  // 关键词搜索（口述核心知识点标题、描述）
  if (keyword.trim()) {
    const searchRegex = new RegExp(keyword.trim(), "i");
    andList.push(_.or({
      title: searchRegex
    }, {
      description: searchRegex
    }));
  }

  // 科目筛选
  if (subject !== "all") {
    andList.push({
      subject
    });
  }

  // 年级筛选
  if (grade !== "all") {
    andList.push({
      grade
    });
  }

  // 构建最终的查询条件
  let where = {};
  if (andList.length > 0) {
    where = _.and(...andList);
  }
  return where;
}


function buildQuizTakeWhereCondition({
  schoolId = "",
  quizIds = [],
  teamOpenids = []
} = {}) {
  const _ = command();
  const andList = [];

  // 学校ID筛选（必须条件）
  if (schoolId) {
    andList.push({
      schoolId
    });
  }

  // 口述核心知识点ID筛选
  if (quizIds.length > 0) {
    andList.push({
      quizId: _.in(quizIds)
    });
  }

  // 如果提供了teamOpenids，添加openid过滤条件
  if (teamOpenids.length > 0) {
    andList.push({
      _openid: _.in(teamOpenids)
    });
  }

  // 构建最终的查询条件
  let where = {};
  if (andList.length > 0) {
    where = _.and(...andList);
  }
  return where;
}


export async function getQuizTakes({
  pageNum = 0,
  pageSize = 20,
  keyword = "",
  subject = "all",
  grade = "all",
  schoolId = "",
  teamId = null
} = {}) {
  try {
    let teamOpenids = [];

    // 如果提供了teamId，先获取队伍成员的openid列表
    if (teamId) {
      const team = await getDoc("quiz_team", teamId);
      if (team && team.schoolId === schoolId) {
        teamOpenids = team.teamOpenids || [];
      } else {
        // 如果队伍不存在或不属于当前学校，返回空结果
        return [];
      }
    }

    // 1. 先根据关键词、科目、年级查询符合条件的口述核心知识点
    const quizWhere = buildQuizWhereCondition({
      keyword,
      subject,
      grade,
      schoolId
    });
    const quizzes = await allDocs({
      c: QUIZ_COLLECTION,
      match: quizWhere
    });
    if (quizzes.length === 0) {
      return [];
    }

    // 2. 根据口述核心知识点ID查询参与记录
    const quizIds = quizzes.map(quiz => quiz._id);
    const takeWhere = buildQuizTakeWhereCondition({
      schoolId,
      quizIds,
      teamOpenids
    });
    const quizTakes = await docs({
      c: QUIZ_TAKE_COLLECTION,
      w: takeWhere,
      pageNum,
      pageSize,
      orderBy: {
        created: -1
      }
    });
    if (quizTakes.length === 0) {
      return [];
    }

    // 3. 获取相关的学生信息
    const studentIds = [...new Set(quizTakes.map(take => take.studentId).filter(Boolean))];
    const students = studentIds.length > 0 ? await allDocs({
      c: STUDENT_COLLECTION,
      match: {
        _id: command().in(studentIds)
      }
    }) : [];

    // 4. 获取相关的班级信息（如果QuizTakeDoc有classId的话）
    const classIds = [...new Set(quizTakes.map(take => take.classId).filter(Boolean))];
    const classrooms = classIds.length > 0 ? await allDocs({
      c: CLASSROOM_COLLECTION,
      match: {
        _id: command().in(classIds)
      }
    }) : [];

    // 5. 构建映射
    const quizMap = new Map(quizzes.map(quiz => [quiz._id, quiz]));
    const studentMap = new Map(students.map(student => [student._id, student]));
    const classroomMap = new Map(classrooms.map(classroom => [classroom._id, classroom]));

    // 6. 组合数据
    const result = quizTakes.map(take => ({
      ...take,
      quiz: quizMap.get(take.quizId),
      student: studentMap.get(take.studentId || ""),
      classroom: take.classId ? classroomMap.get(take.classId) : undefined
    }));
    return result;
  } catch (error) {
    console.error("获取口述核心知识点参与记录失败:", error);
    return [];
  }
}


export async function getQuizTakesCount({
  keyword = "",
  subject = "all",
  grade = "all",
  schoolId = "",
  teamId = null
} = {}) {
  try {
    let teamOpenids = [];

    // 如果提供了teamId，先获取队伍成员的openid列表
    if (teamId) {
      const team = await getDoc("quiz_team", teamId);
      if (team && team.schoolId === schoolId) {
        teamOpenids = team.teamOpenids || [];
      } else {
        // 如果队伍不存在或不属于当前学校，返回0
        return 0;
      }
    }

    // 1. 先根据关键词、科目、年级查询符合条件的口述核心知识点
    const quizWhere = buildQuizWhereCondition({
      keyword,
      subject,
      grade,
      schoolId
    });
    const quizzes = await allDocs({
      c: QUIZ_COLLECTION,
      match: quizWhere
    });
    if (quizzes.length === 0) {
      return 0;
    }

    // 2. 根据口述核心知识点ID统计参与记录数量
    const quizIds = quizzes.map(quiz => quiz._id);
    const takeWhere = buildQuizTakeWhereCondition({
      schoolId,
      quizIds,
      teamOpenids
    });
    return await count(QUIZ_TAKE_COLLECTION, takeWhere);
  } catch (error) {
    console.error("获取口述核心知识点参与记录总数失败:", error);
    return 0;
  }
}


export async function getSchoolQuizSubjects(schoolId) {
  try {
    if (!schoolId) {
      return [];
    }
    const quizzes = await allDocs({
      c: QUIZ_COLLECTION,
      match: {
        schoolId
      }
    });
    const subjects = [...new Set(quizzes.map(quiz => quiz.subject).filter(Boolean))];
    return subjects.sort();
  } catch (error) {
    console.error("获取口述核心知识点科目列表失败:", error);
    return [];
  }
}


export async function getSchoolQuizGrades(schoolId) {
  try {
    if (!schoolId) {
      return [];
    }
    const quizzes = await allDocs({
      c: QUIZ_COLLECTION,
      match: {
        schoolId
      }
    });
    const grades = [...new Set(quizzes.map(quiz => quiz.grade).filter(Boolean))];
    return grades.sort();
  } catch (error) {
    console.error("获取口述核心知识点年级列表失败:", error);
    return [];
  }
}


export async function deleteQuizTake(takeId, schoolId) {
  try {
    // 1. 验证权限 - 获取要删除的 QuizTakeDoc
    const quizTake = await getDoc(QUIZ_TAKE_COLLECTION, takeId);
    if (!quizTake || quizTake.schoolId !== schoolId) {
      throw new Error("口述核心知识点记录不存在或无权限删除");
    }

    // 2. 获取所有关联的 QuizQuestionDoc
    const quizQuestions = await allDocs({
      c: QUIZ_QUESTION_COLLECTION,
      match: {
        takeId
      }
    });
    if (quizQuestions.length > 0) {
      const quizQuestionIds = quizQuestions.map(qq => qq._id);

      // 3. 获取所有关联的 QuizSessionDoc
      const sessions = await allDocs({
        c: QUIZ_SESSION_COLLECTION,
        match: {
          quizQuestionId: command().in(quizQuestionIds)
        }
      });
      if (sessions.length > 0) {
        const sessionIds = sessions.map(session => session._id);

        // 4. 获取所有关联的 QuizSessionMessageDoc
        const messages = await allDocs({
          c: QUIZ_SESSION_MESSAGE_COLLECTION,
          match: {
            sessionId: command().in(sessionIds)
          }
        });

        // 5. 收集所有需要删除的文件ID
        const fileIds = [];
        messages.forEach(message => {
          if (message.audioFile?.fileId) {
            fileIds.push(message.audioFile.fileId);
          }
          if (message.imageFile?.fileId) {
            fileIds.push(message.imageFile.fileId);
          }
        });

        // 6. 删除文件
        if (fileIds.length > 0) {
          try {
            await deleteFile(fileIds);
          } catch (error) {
            console.error("删除文件失败:", error);
            // 文件删除失败不阻止数据删除，继续执行
          }
        }

        // 7. 删除 QuizSessionMessageDoc
        for (const message of messages) {
          await removeDoc(QUIZ_SESSION_MESSAGE_COLLECTION, message._id);
        }

        // 8. 删除 QuizSessionDoc
        for (const session of sessions) {
          await removeDoc(QUIZ_SESSION_COLLECTION, session._id);
        }
      }

      // 9. 删除 QuizQuestionDoc
      for (const quizQuestion of quizQuestions) {
        await removeDoc(QUIZ_QUESTION_COLLECTION, quizQuestion._id);
      }
    }

    // 10. 最后删除 QuizTakeDoc
    await removeDoc(QUIZ_TAKE_COLLECTION, takeId);
  } catch (error) {
    console.error("删除口述核心知识点记录失败:", error);
    throw error;
  }
}
