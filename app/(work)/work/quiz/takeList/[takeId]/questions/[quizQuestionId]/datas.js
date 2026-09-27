"use server";

import { allDocs, command, getDoc, removeDoc, updateDoc } from "../../../../../../../../lib/common/database.js";
import { deleteFile } from "../../../../../../../../lib/common/file.js";

// 数据库集合名称常量
const QUIZ_QUESTION_COLLECTION = "quiz_question";
const QUIZ_SESSION_COLLECTION = "quiz_session";
const QUIZ_SESSION_MESSAGE_COLLECTION = "quiz_session_message";
const EXAM_QUESTION_COLLECTION = "exam_question";


export async function getQuizQuestionDetail(quizQuestionId) {
  try {
    // 1. 获取题目记录
    const quizQuestion = await getDoc(QUIZ_QUESTION_COLLECTION, quizQuestionId);
    if (!quizQuestion) {
      throw new Error("题目记录不存在");
    }

    // 2. 获取题目详情
    const examQuestion = await getDoc(EXAM_QUESTION_COLLECTION, quizQuestion.questionId);

    // 3. 获取会话记录
    const sessions = await allDocs({
      c: QUIZ_SESSION_COLLECTION,
      match: {
        quizQuestionId
      },
      sort: {
        created: 1
      }
    });

    // 4. 获取所有会话消息
    const sessionIds = sessions.map(session => session._id);
    const messages = sessionIds.length > 0 ? await allDocs({
      c: QUIZ_SESSION_MESSAGE_COLLECTION,
      match: {
        sessionId: command().in(sessionIds)
      },
      sort: {
        created: 1
      }
    }) : [];

    // 5. 分类消息
    const audioMessages = messages.filter(msg => msg.audioFile);
    const imageMessages = messages.filter(msg => msg.imageFile);
    return {
      quizQuestion,
      examQuestion,
      sessions,
      messages,
      audioMessages,
      imageMessages
    };
  } catch (error) {
    console.error("获取题目详情失败:", error);
    throw error;
  }
}


export async function deleteQuizQuestion(quizQuestionId, schoolId) {
  try {
    // 1. 验证权限 - 获取要删除的 QuizQuestionDoc
    const quizQuestion = await getDoc(QUIZ_QUESTION_COLLECTION, quizQuestionId);
    if (!quizQuestion || quizQuestion.schoolId !== schoolId) {
      throw new Error("题目记录不存在或无权限删除");
    }

    // 2. 获取所有关联的 QuizSessionDoc
    const sessions = await allDocs({
      c: QUIZ_SESSION_COLLECTION,
      match: {
        quizQuestionId
      }
    });
    if (sessions.length > 0) {
      const sessionIds = sessions.map(session => session._id);

      // 3. 获取所有关联的 QuizSessionMessageDoc
      const messages = await allDocs({
        c: QUIZ_SESSION_MESSAGE_COLLECTION,
        match: {
          sessionId: command().in(sessionIds)
        }
      });

      // 4. 收集所有需要删除的文件ID
      const fileIds = [];
      messages.forEach(message => {
        if (message.audioFile?.fileId) {
          fileIds.push(message.audioFile.fileId);
        }
        if (message.imageFile?.fileId) {
          fileIds.push(message.imageFile.fileId);
        }
      });

      // 5. 删除文件
      if (fileIds.length > 0) {
        try {
          await deleteFile(fileIds);
        } catch (error) {
          console.error("删除文件失败:", error);
          // 文件删除失败不阻止数据删除，继续执行
        }
      }

      // 6. 删除 QuizSessionMessageDoc
      for (const message of messages) {
        await removeDoc(QUIZ_SESSION_MESSAGE_COLLECTION, message._id);
      }

      // 7. 删除 QuizSessionDoc
      for (const session of sessions) {
        await removeDoc(QUIZ_SESSION_COLLECTION, session._id);
      }
    }

    // 8. 最后删除 QuizQuestionDoc
    await removeDoc(QUIZ_QUESTION_COLLECTION, quizQuestionId);
  } catch (error) {
    console.error("删除题目记录失败:", error);
    throw error;
  }
}


export async function deleteQuizSessionMessage(messageId, schoolId) {
  try {
    // 1. 获取消息记录
    const message = await getDoc(QUIZ_SESSION_MESSAGE_COLLECTION, messageId);
    if (!message) {
      throw new Error("消息记录不存在");
    }

    // 2. 验证权限 - 通过会话验证是否属于当前学校
    const session = await getDoc(QUIZ_SESSION_COLLECTION, message.sessionId);
    if (!session) {
      throw new Error("会话记录不存在");
    }
    const quizQuestion = await getDoc(QUIZ_QUESTION_COLLECTION, session.quizQuestionId);
    if (!quizQuestion || quizQuestion.schoolId !== schoolId) {
      throw new Error("无权限删除此消息");
    }

    // 3. 删除文件
    const fileIds = [];
    if (message.audioFile?.fileId) {
      fileIds.push(message.audioFile.fileId);
    }
    if (message.imageFile?.fileId) {
      fileIds.push(message.imageFile.fileId);
    }
    if (fileIds.length > 0) {
      try {
        await deleteFile(fileIds);
      } catch (error) {
        console.error("删除文件失败:", error);
        // 文件删除失败不阻止数据删除
      }
    }

    // 4. 删除消息记录
    await removeDoc(QUIZ_SESSION_MESSAGE_COLLECTION, messageId);
  } catch (error) {
    console.error("删除消息失败:", error);
    throw error;
  }
}


export async function updateQuizSessionMessageContent(messageId, content, schoolId) {
  try {
    // 1. 验证权限
    const message = await getDoc(QUIZ_SESSION_MESSAGE_COLLECTION, messageId);
    if (!message) {
      throw new Error("消息记录不存在");
    }
    const session = await getDoc(QUIZ_SESSION_COLLECTION, message.sessionId);
    if (!session) {
      throw new Error("会话记录不存在");
    }
    const quizQuestion = await getDoc(QUIZ_QUESTION_COLLECTION, session.quizQuestionId);
    if (!quizQuestion || quizQuestion.schoolId !== schoolId) {
      throw new Error("无权限编辑此消息");
    }

    // 2. 更新消息内容
    await updateDoc(QUIZ_SESSION_MESSAGE_COLLECTION, messageId, {
      content,
      updated: Date.now()
    });
  } catch (error) {
    console.error("更新消息内容失败:", error);
    throw error;
  }
}


export async function updateQuizQuestionFields(quizQuestionId, updates, schoolId) {
  try {
    // 1. 验证权限
    const quizQuestion = await getDoc(QUIZ_QUESTION_COLLECTION, quizQuestionId);
    if (!quizQuestion || quizQuestion.schoolId !== schoolId) {
      throw new Error("题目记录不存在或无权限编辑");
    }

    // 2. 更新字段
    await updateDoc(QUIZ_QUESTION_COLLECTION, quizQuestionId, {
      ...updates,
      updated: Date.now()
    });
  } catch (error) {
    console.error("更新题目字段失败:", error);
    throw error;
  }
}
