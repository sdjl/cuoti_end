import { allDocs, command, updateDoc } from "../../../../../../../../lib/common/database.js";
import { DISPLAY_TEXT } from "../../../../../../../../lib/config/constants.js";
export async function getMistakePracticeDetails(schoolId, studentAnswerItemId) {
  const _ = command();
  try {
    // 获取学生答题项记录
    const studentAnswerItem = await allDocs({
      c: "student_answer_item",
      match: {
        _id: studentAnswerItemId
      }
    });
    if (studentAnswerItem.length === 0) {
      return null;
    }
    const item = studentAnswerItem[0];

    // 获取学生答卷
    const studentAnswer = await allDocs({
      c: "student_answer",
      match: {
        _id: item.studentAnswerId
      }
    });
    if (studentAnswer.length === 0) {
      return null;
    }
    const answer = studentAnswer[0];

    // 获取学生信息
    const student = await allDocs({
      c: "student",
      match: {
        _id: answer.studentId,
        schoolId
      }
    });
    if (student.length === 0) {
      return null;
    }
    const studentDoc = student[0];

    // 获取学生班级关系
    const studentClassRelations = await allDocs({
      c: "student_class",
      match: {
        studentId: answer.studentId
      }
    });
    if (studentClassRelations.length === 0) {
      return null;
    }

    // 获取班级信息
    const classroom = await allDocs({
      c: "classroom",
      match: {
        _id: studentClassRelations[0].classRoomId
      }
    });
    if (classroom.length === 0) {
      return null;
    }
    const classroomDoc = classroom[0];

    // 获取题目集合信息
    const questionPack = await allDocs({
      c: "question_pack",
      match: {
        _id: answer.questionPackId
      }
    });
    if (questionPack.length === 0) {
      return null;
    }
    const questionPackDoc = questionPack[0];

    // 获取题目信息
    const examQuestion = await allDocs({
      c: "exam_question",
      match: {
        _id: item.questionId
      }
    });
    const examQuestionDoc = examQuestion.length > 0 ? examQuestion[0] : undefined;

    // 获取AI聊天会话
    const aiChatSessions = await allDocs({
      c: "student_question_ai_chat_session",
      match: {
        studentAnswerItemId: item._id
      },
      sort: {
        created: -1
      } // 按创建时间倒序
    });
    const sessions = aiChatSessions;

    // 获取所有会话的消息
    let messages = [];
    if (sessions.length > 0) {
      const sessionIds = sessions.map(session => session._id);
      const aiChatMessages = await allDocs({
        c: "student_question_ai_chat_message",
        match: {
          sessionId: _.in(sessionIds)
        },
        sort: {
          created: 1
        } // 按创建时间正序
      });
      messages = aiChatMessages;
    }
    return {
      studentAnswerItem: item,
      student: studentDoc,
      classroom: classroomDoc,
      questionPack: questionPackDoc,
      studentAnswer: answer,
      examQuestion: examQuestionDoc,
      aiChatSessions: sessions,
      aiChatMessages: messages
    };
  } catch (error) {
    console.error(`获取${DISPLAY_TEXT.COURSE_MISTAKE}详情失败:`, error);
    throw new Error(`获取${DISPLAY_TEXT.COURSE_MISTAKE}详情失败`);
  }
}

/**
 * 更新课程错题AI聊天会话的老师评语
 */
export async function updateStudentQuestionAIChatSessionTeacherComment(sessionId, teacherComment) {
  try {
    await updateDoc("student_question_ai_chat_session", sessionId, {
      teacherComment
    });
  } catch (error) {
    console.error(`更新${DISPLAY_TEXT.COURSE_MISTAKE}AI聊天会话老师评语失败:`, error);
    throw new Error(`更新${DISPLAY_TEXT.COURSE_MISTAKE}AI聊天会话老师评语失败`);
  }
}
