"use server";

import { getGuestProblemAiMessages, getGuestTeacherReplyCount, getGuestTeacherReplyList, replyGuestTeacherMessage } from "./datas.js";
export async function getGuestTeacherReplyCountAction(params) {
  return getGuestTeacherReplyCount(params);
}
export async function getGuestTeacherReplyListAction(params) {
  return getGuestTeacherReplyList(params);
}
export async function replyGuestTeacherMessageAction(guestProblemQuestionId, content) {
  const ok = await replyGuestTeacherMessage(guestProblemQuestionId, content);
  return {
    success: ok
  };
}
export async function getGuestProblemAiMessagesAction(guestProblemQuestionId) {
  return getGuestProblemAiMessages(guestProblemQuestionId);
}
