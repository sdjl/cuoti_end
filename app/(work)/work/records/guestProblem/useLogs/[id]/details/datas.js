import { allDocs } from "../../../../../../../../lib/common/database.js";
import { DISPLAY_TEXT } from "../../../../../../../../lib/config/constants.js";
import { getCurrentSchoolId } from "../../../../../../../../lib/work/teacher/mySchool.js";
export async function getGuestAIQuestionDetails(guestProblemQuestionId) {
  try {
    // 获取非登录用户自主上传错题题目
    const guestProblemQuestion = await allDocs({
      c: "guest_problem_question",
      match: {
        _id: guestProblemQuestionId
      }
    });
    if (guestProblemQuestion.length === 0) {
      return null;
    }
    const question = guestProblemQuestion[0];

    // 获取学生信息（可能不存在）
    const currentSchoolId = await getCurrentSchoolId();
    const guestStudentInfos = await allDocs({
      c: "guest_student_info",
      match: {
        openid: question.openid,
        schoolId: currentSchoolId // 只查询当前校园的数据
      }
    });

    // 如果没有学生信息，创建默认的
    const guestStudentInfo = guestStudentInfos.length > 0 ? guestStudentInfos[0] : {
      _id: "unknown",
      openid: question.openid,
      schoolId: currentSchoolId,
      // 使用当前校园ID
      studentInfo: {
        studentName: "未知学生",
        schoolName: "未填写",
        grade: "未填写"
      },
      isContactedByTeacher: false,
      created: Date.now()
    };

    // 获取自主上传错题会话记录（可能不存在）
    const guestProblemSession = await allDocs({
      c: "guest_problem_session",
      match: {
        guestProblemQuestionId: question._id
      }
    });
    const session = guestProblemSession.length > 0 ? guestProblemSession[0] : undefined;

    // 获取会话的所有消息（如果有会话的话）
    let sessionMessages = [];
    if (session) {
      const messages = await allDocs({
        c: "guest_problem_session_message",
        match: {
          sessionId: session._id
        },
        sort: {
          created: 1
        } // 按创建时间正序
      });
      sessionMessages = messages;
    }
    return {
      guestProblemSession: session,
      guestProblemQuestion: question,
      guestStudentInfo,
      sessionMessages
    };
  } catch (error) {
    console.error(`获取非登录用户${DISPLAY_TEXT.SELF_UPLOAD_MISTAKE}详情失败:`, error);
    throw new Error(`获取非登录用户${DISPLAY_TEXT.SELF_UPLOAD_MISTAKE}详情失败`);
  }
}
