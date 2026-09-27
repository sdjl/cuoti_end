"use server";

import { getWxUsersCount, getWxUsersList, updateUserStatus as updateWxUserStatus } from "../../../../lib/utils/wxUser.js";

// 用户筛选参数接口

// 获取用户列表
export async function getUsers(params) {
  try {
    return await getWxUsersList(params);
  } catch (error) {
    console.error("获取用户列表失败:", error);
    throw new Error("获取用户列表失败");
  }
}

// 获取用户总数
export async function getUsersCount(params) {
  try {
    return await getWxUsersCount(params);
  } catch (error) {
    console.error("获取用户总数失败:", error);
    throw new Error("获取用户总数失败");
  }
}

// 更新用户状态
export async function updateUserStatus(userId, newStatus) {
  try {
    return await updateWxUserStatus(userId, newStatus);
  } catch (error) {
    console.error("更新用户状态失败:", error);
    throw new Error("更新用户状态失败");
  }
}
