"use server";

import { getTeacherAllClassRooms } from "../../../../../../lib/work/teacher/myClassroom.js";
import { getCurrentSchoolId } from "../../../../../../lib/work/teacher/mySchool.js";
import { getProblemAiMessages, getTeacherReplyCount, getTeacherReplyList, replyTeacherMessage } from "./datas.js";
export async function getTeacherReplyCountAction(params) {
  const schoolId = await getCurrentSchoolId();
  return getTeacherReplyCount(schoolId, params);
}
export async function getMyClassOptionsAction() {
  const rooms = await getTeacherAllClassRooms();
  return rooms.map(r => ({
    label: r.name,
    value: r._id
  }));
}
export async function getTeacherReplyListAction(params) {
  const schoolId = await getCurrentSchoolId();
  return getTeacherReplyList(schoolId, params);
}
export async function replyTeacherMessageAction(problemQuestionId, content) {
  const ok = await replyTeacherMessage(problemQuestionId, content);
  return {
    success: ok
  };
}
export async function getProblemAiMessagesAction(problemQuestionId) {
  return getProblemAiMessages(problemQuestionId);
}
