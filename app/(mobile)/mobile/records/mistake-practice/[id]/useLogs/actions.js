"use server";

import { getContactsQrcodeUrlFromSetting, sendStudentMessageToDB } from "./datas.js";

// 重新导出类型以保持向后兼容

/**
 * 发送学生消息给老师
 */
export async function sendStudentMessage(data) {
  // 调用 datas.ts 中的数据库操作函数（包含密码校验）
  return await sendStudentMessageToDB(data);
}

/**
 * 读取联系老师二维码 URL（服务器端）
 */
export async function getContactsQrcodeUrl() {
  return await getContactsQrcodeUrlFromSetting();
}
