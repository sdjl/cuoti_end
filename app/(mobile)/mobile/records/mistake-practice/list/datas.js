"use server";

import { allDocs, docs } from "../../../../../../lib/common/database.js";
import { validateStudentPassword as validateStudentPasswordFromUtils } from "../../../../../../lib/utils/student.js";
export async function validateStudentPassword(studentId, password) {
  return await validateStudentPasswordFromUtils(studentId, password);
}
export async function fetchStudentSessions(params) {
  const {
    studentId,
    pageNum,
    pageSize
  } = params;

  // 读取会话分页（按创建时间逆序）
  const sessionDocs = await docs({
    c: "student_question_ai_chat_session",
    w: {
      studentId
    },
    pageNum,
    pageSize,
    orderBy: {
      created: -1
    }
  });
  if (sessionDocs.length === 0) {
    return {
      items: [],
      hasMore: false
    };
  }

  // 取出关联的 answerItemIds 与 questionIds，一次性读取
  const answerItemIds = Array.from(new Set(sessionDocs.map(s => s.studentAnswerItemId)));
  const questionIds = Array.from(new Set(sessionDocs.map(s => s.questionId)));

  // 读取答题条目与题目信息
  const answerItems = await allDocs({
    c: "student_answer_item",
    match: {
      _id: {
        $in: answerItemIds
      }
    }
  });
  const questions = await allDocs({
    c: "exam_question",
    match: {
      _id: {
        $in: questionIds
      }
    }
  });
  const answerItemMap = new Map(answerItems.map(a => [a._id, a]));
  const questionMap = new Map(questions.map(q => [q._id, q]));
  const items = sessionDocs.map(session => {
    const answerItem = answerItemMap.get(session.studentAnswerItemId);
    const question = questionMap.get(session.questionId);
    return {
      session,
      answerItem,
      question
    };
  });

  // 判断下一页是否还有数据
  const nextPage = await docs({
    c: "student_question_ai_chat_session",
    w: {
      studentId
    },
    pageNum: pageNum + 1,
    pageSize,
    orderBy: {
      created: -1
    }
  });
  const hasMore = nextPage.length > 0;
  return {
    items,
    hasMore
  };
}
