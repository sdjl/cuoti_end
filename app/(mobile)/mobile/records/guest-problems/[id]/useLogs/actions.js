"use server";

import { getContactsQrcodeUrlFromSetting, sendStudentMessageToDB } from "./datas.js";
export async function sendStudentMessage(data) {
  return await sendStudentMessageToDB(data);
}
export async function getContactsQrcodeUrl() {
  return await getContactsQrcodeUrlFromSetting();
}
