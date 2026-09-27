"use server";

import { allDocs, command, getDoc, updateDoc } from "../../../../../../../lib/common/database.js";

// 数据库集合名称常量
const QUIZ_TAKE_COLLECTION = "quiz_take";
const QUIZ_COLLECTION = "quiz";
const QUIZ_QUESTION_COLLECTION = "quiz_question";
const EXAM_QUESTION_COLLECTION = "exam_question";
const QUIZ_SESSION_COLLECTION = "quiz_session";
const QUIZ_SESSION_MESSAGE_COLLECTION = "quiz_session_message";


export async function getQuizTakeQuestions(takeId) {
  try {
    // 1. 获取口述核心知识点参与记录
    const quizTake = await getDoc(QUIZ_TAKE_COLLECTION, takeId);
    if (!quizTake) {
      throw new Error("口述核心知识点参与记录不存在");
    }

    // 2. 获取口述核心知识点信息
    const quiz = await getDoc(QUIZ_COLLECTION, quizTake.quizId);
    if (!quiz) {
      throw new Error("口述核心知识点信息不存在");
    }

    // 3. 获取该口述核心知识点参与记录下的所有题目记录
    const quizQuestions = await allDocs({
      c: QUIZ_QUESTION_COLLECTION,
      match: {
        takeId
      },
      sort: {
        created: 1
      } // 按创建时间排序
    });
    if (quizQuestions.length === 0) {
      return {
        quizTake,
        quiz,
        questions: []
      };
    }

    // 4. 获取题目详情
    const questionIds = quizQuestions.map(q => q.questionId);
    const examQuestions = await allDocs({
      c: EXAM_QUESTION_COLLECTION,
      match: {
        _id: command().in(questionIds)
      }
    });

    // 5. 构建题目映射
    const examQuestionMap = new Map(examQuestions.map(eq => [eq._id, eq]));

    // 6. 获取会话信息
    const quizQuestionIds = quizQuestions.map(qq => qq._id);
    const sessions = quizQuestionIds.length > 0 ? await allDocs({
      c: QUIZ_SESSION_COLLECTION,
      match: {
        quizQuestionId: command().in(quizQuestionIds)
      }
    }) : [];

    // 7. 获取会话消息
    const sessionIds = sessions.map(session => session._id);
    const messages = sessionIds.length > 0 ? await allDocs({
      c: QUIZ_SESSION_MESSAGE_COLLECTION,
      match: {
        sessionId: command().in(sessionIds)
      }
    }) : [];

    // 8. 构建消息映射（按quizQuestionId分组）
    const sessionMap = new Map();
    sessions.forEach(session => {
      const existing = sessionMap.get(session.quizQuestionId) || [];
      sessionMap.set(session.quizQuestionId, [...existing, session]);
    });
    const messageMap = new Map();
    sessions.forEach(session => {
      const sessionMessages = messages.filter(msg => msg.sessionId === session._id);
      const existing = messageMap.get(session.quizQuestionId) || [];
      messageMap.set(session.quizQuestionId, [...existing, ...sessionMessages]);
    });

    // 9. 根据quiz.questionIds的顺序排序，并添加统计信息
    const orderedQuestions = quiz.questionIds.map(questionId => {
      const quizQuestion = quizQuestions.find(qq => qq.questionId === questionId);
      if (!quizQuestion) return null;
      const questionMessages = messageMap.get(quizQuestion._id) || [];
      const audioCount = questionMessages.filter(msg => msg.audioFile).length;
      const imageCount = questionMessages.filter(msg => msg.imageFile).length;
      return {
        ...quizQuestion,
        examQuestion: examQuestionMap.get(questionId),
        audioCount,
        imageCount,
        sessions: sessionMap.get(quizQuestion._id) || [],
        messages: questionMessages
      };
    }).filter(Boolean);
    return {
      quizTake,
      quiz,
      questions: orderedQuestions
    };
  } catch (error) {
    console.error("获取口述核心知识点题目详情失败:", error);
    throw error;
  }
}


export async function updateQuizTakeOverallComment(takeId, teacherOverallComment, schoolId) {
  try {
    // 1. 验证权限
    const quizTake = await getDoc(QUIZ_TAKE_COLLECTION, takeId);
    if (!quizTake || quizTake.schoolId !== schoolId) {
      throw new Error("口述核心知识点记录不存在或无权限编辑");
    }

    // 2. 更新整体评语
    await updateDoc(QUIZ_TAKE_COLLECTION, takeId, {
      teacherOverallComment,
      updated: Date.now()
    });
  } catch (error) {
    console.error("更新整体评语失败:", error);
    throw error;
  }
}


export async function getQuizTakeAllComments(takeId, schoolId) {
  try {
    // 1. 验证权限并获取基本信息
    const data = await getQuizTakeQuestions(takeId);
    if (!data.quizTake || data.quizTake.schoolId !== schoolId) {
      throw new Error("口述核心知识点记录不存在或无权限访问");
    }

    // 2. 提取所有题目的老师评语
    const questionComments = data.questions.map((question, index) => ({
      questionNumber: index + 1,
      teacherComment: question.teacherComment || ""
    })).filter(item => item.teacherComment.trim()); // 只保留有评语的题目

    return {
      quizTake: data.quizTake,
      quiz: data.quiz,
      questionComments
    };
  } catch (error) {
    console.error("获取题目评语失败:", error);
    throw error;
  }
}
