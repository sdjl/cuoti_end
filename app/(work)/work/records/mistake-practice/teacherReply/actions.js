"use server";

import { getTeacherAllClassRooms } from "../../../../../../lib/work/teacher/myClassroom.js";
import { getCurrentSchoolId } from "../../../../../../lib/work/teacher/mySchool.js";
import { getSessionAiMessages, getTeacherReplyCount, getTeacherReplyList, replyTeacherMessage } from "./datas.js";
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
export async function replyTeacherMessageAction(sessionId, content) {
  const ok = await replyTeacherMessage(sessionId, content);
  return {
    success: ok
  };
}
export async function getSessionAiMessagesAction(sessionId) {
  return getSessionAiMessages(sessionId);
}
