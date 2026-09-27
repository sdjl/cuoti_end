import { allDocs, command, count } from "../../../../lib/common/database.js";
import { DISPLAY_TEXT } from "../../../../lib/config/constants.js";
import { getTeacherAllClassRooms } from "../../../../lib/work/teacher/myClassroom.js";

/**
 * 获取课程错题中需要老师帮助的数量
 */
export async function getMistakePracticeTeacherHelpCount() {
  try {
    const _ = command();

    // 获取当前用户管理的所有班级
    const classrooms = await getTeacherAllClassRooms();
    if (classrooms.length === 0) {
      return 0;
    }
    const classIds = classrooms.map(classroom => classroom._id);

    // 获取这些班级的学生的答卷
    const studentAnswers = await allDocs({
      c: "student_answer",
      match: {
        classId: _.in(classIds)
      },
      only: "_id"
    });
    if (studentAnswers.length === 0) {
      return 0;
    }
    const studentAnswerIds = studentAnswers.map(answer => answer._id);

    // 获取这些答卷中的错题项
    const studentAnswerItems = await allDocs({
      c: "student_answer_item",
      match: {
        studentAnswerId: _.in(studentAnswerIds)
      },
      only: "_id"
    });
    if (studentAnswerItems.length === 0) {
      return 0;
    }
    const studentAnswerItemIds = studentAnswerItems.map(item => item._id);

    // 统计需要老师帮助的会话数量
    return await count("student_question_ai_chat_session", {
      studentAnswerItemId: _.in(studentAnswerItemIds),
      isNeedTeacherReply: true
    });
  } catch (error) {
    console.error(`获取${DISPLAY_TEXT.COURSE_MISTAKE}老师帮助数量失败:`, error);
    return 0;
  }
}

/**
 * 获取自主上传错题中需要老师帮助的数量
 */
export async function getProblemQuestionTeacherHelpCount() {
  try {
    const _ = command();

    // 获取当前用户管理的所有班级
    const classrooms = await getTeacherAllClassRooms();
    if (classrooms.length === 0) {
      return 0;
    }
    const classIds = classrooms.map(classroom => classroom._id);

    // 统计 problem_question 集合中需要老师帮助的数量
    return await count("problem_question", {
      classId: _.in(classIds),
      isNeedTeacherReply: true
    });
  } catch (error) {
    console.error(`获取${DISPLAY_TEXT.SELF_UPLOAD_MISTAKE}老师帮助数量失败:`, error);
    return 0;
  }
}

/**
 * 获取新生自主上传错题中需要老师帮助的数量
 */
export async function getGuestProblemQuestionTeacherHelpCount() {
  try {
    // 统计 guest_problem_question 集合中需要老师帮助的数量
    return await count("guest_problem_question", {
      isNeedTeacherReply: true
    });
  } catch (error) {
    console.error(`获取新生${DISPLAY_TEXT.SELF_UPLOAD_MISTAKE}老师帮助数量失败:`, error);
    return 0;
  }
}
