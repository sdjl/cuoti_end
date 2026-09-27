import { allDocs, updateDoc } from "../../../../../../../../lib/common/database.js";
import { DISPLAY_TEXT } from "../../../../../../../../lib/config/constants.js";
export async function getAIQuestionDetails(schoolId, sessionId) {
  try {
    // 获取自主上传错题会话记录
    const problemSession = await allDocs({
      c: "problem_session",
      match: {
        _id: sessionId
      }
    });
    if (problemSession.length === 0) {
      return null;
    }
    const session = problemSession[0];

    // 获取自主上传错题题目
    const problemQuestion = await allDocs({
      c: "problem_question",
      match: {
        _id: session.problemQuestionId
      }
    });
    if (problemQuestion.length === 0) {
      return null;
    }
    const question = problemQuestion[0];

    // 获取学生信息
    const student = await allDocs({
      c: "student",
      match: {
        _id: question.studentId,
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
        studentId: question.studentId
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

    // 获取会话的所有消息
    const sessionMessages = await allDocs({
      c: "problem_session_message",
      match: {
        sessionId: session._id
      },
      sort: {
        created: 1
      } // 按创建时间正序
    });
    const messages = sessionMessages;
    return {
      problemSession: session,
      problemQuestion: question,
      student: studentDoc,
      classroom: classroomDoc,
      sessionMessages: messages
    };
  } catch (error) {
    console.error(`获取${DISPLAY_TEXT.SELF_UPLOAD_MISTAKE}详情失败:`, error);
    throw new Error(`获取${DISPLAY_TEXT.SELF_UPLOAD_MISTAKE}详情失败`);
  }
}

/**
 * 更新自主上传错题会话的老师评语
 */
export async function updateProblemSessionTeacherComment(sessionId, teacherComment) {
  try {
    await updateDoc("problem_session", sessionId, {
      teacherComment
    });
  } catch (error) {
    console.error(`更新${DISPLAY_TEXT.SELF_UPLOAD_MISTAKE}会话老师评语失败:`, error);
    throw new Error(`更新${DISPLAY_TEXT.SELF_UPLOAD_MISTAKE}会话老师评语失败`);
  }
}
