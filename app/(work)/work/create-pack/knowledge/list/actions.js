"use server";

import { getRecentStudentsWithKnowledgePacks } from "./datas.js";
/**
 * 获取最近创建定制题集的学生列表
 */
export async function getRecentStudentsAction() {
  try {
    const students = await getRecentStudentsWithKnowledgePacks();
    return students;
  } catch (error) {
    console.error("获取最近创建定制题集的学生列表失败:", error);
    throw new Error("获取学生列表失败");
  }
}
