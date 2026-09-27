"use server";

import { allDocs, getDoc } from "../../../../../../../lib/common/database.js";

// 数据库集合名称常量
const COLLECTION_NAMES = {
  QUIZ: "quiz",
  QUIZ_TAKE: "quiz_take",
  QUIZ_QUESTION: "quiz_question",
  QUIZ_SESSION: "quiz_session",
  QUIZ_SESSION_MESSAGE: "quiz_session_message",
  EXAM_QUESTION: "exam_question"
};
export async function getQuizTakeData(takeId) {
  try {
    // 获取口述核心知识点参与记录
    const quizTake = await getDoc(COLLECTION_NAMES.QUIZ_TAKE, takeId);
    if (!quizTake) {
      return {
        quiz: null,
        quizTake: null,
        quizQuestions: [],
        sessions: [],
        messages: [],
        examQuestions: []
      };
    }

    // 获取口述核心知识点信息
    const quiz = await getDoc(COLLECTION_NAMES.QUIZ, quizTake.quizId);

    // 获取该口述核心知识点参与记录下的所有题目记录
    const quizQuestions = await allDocs({
      c: COLLECTION_NAMES.QUIZ_QUESTION,
      match: {
        takeId
      },
      sort: {
        created: 1
      }
    });

    // 获取所有会话记录
    const sessions = await allDocs({
      c: COLLECTION_NAMES.QUIZ_SESSION,
      match: {
        takeId
      },
      sort: {
        created: 1
      }
    });

    // 获取所有消息记录
    const sessionIds = sessions.map(session => session._id);
    const messages = sessionIds.length > 0 ? await allDocs({
      c: COLLECTION_NAMES.QUIZ_SESSION_MESSAGE,
      match: {
        sessionId: {
          $in: sessionIds
        }
      },
      sort: {
        created: 1
      }
    }) : [];

    // 获取题目详细信息
    const questionIds = quiz?.questionIds || [];
    const examQuestions = questionIds.length > 0 ? await allDocs({
      c: COLLECTION_NAMES.EXAM_QUESTION,
      match: {
        _id: {
          $in: questionIds
        }
      }
    }) : [];
    return {
      quiz,
      quizTake,
      quizQuestions,
      sessions,
      messages,
      examQuestions
    };
  } catch (error) {
    console.error("获取口述核心知识点记录数据失败:", error);
    return {
      quiz: null,
      quizTake: null,
      quizQuestions: [],
      sessions: [],
      messages: [],
      examQuestions: []
    };
  }
}
