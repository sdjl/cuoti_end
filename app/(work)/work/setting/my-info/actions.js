"use server";

import { timestamp } from "../../../../../lib/common/time.js";
import { addJWTField, getCurrentUserOpenid, getJWTField } from "../../../../../lib/utils/auth.js";
import { getUserByOpenidFromDB, updateUserInfoInDB } from "./datas.js";

/**
 * 获取当前用户的个人信息
 */
export async function getCurrentUserInfo() {
  try {
    const userInfo = await getJWTField("userInfo");
    const userWxInfo = await getJWTField("userWxInfo");
    if (!userInfo || !userWxInfo) {
      return null;
    }
    return {
      userInfo,
      userWxInfo
    };
  } catch (error) {
    console.error("获取用户信息失败:", error);
    return null;
  }
}

/**
 * 更新用户个人信息
 */
export async function updateUserInfo(userInfo) {
  try {
    const openid = await getCurrentUserOpenid();
    if (!openid) {
      return {
        success: false,
        message: "用户未登录"
      };
    }

    // 根据openid查找用户文档
    const userDoc = await getUserByOpenidFromDB(openid);
    if (!userDoc) {
      return {
        success: false,
        message: "找不到用户信息"
      };
    }
    const userId = userDoc._id;

    // 构建更新数据
    const updateData = {
      updated: timestamp()
    };

    // 更新userInfo字段
    Object.keys(userInfo).forEach(key => {
      const value = userInfo[key];
      updateData[`userInfo.${key}`] = value;
    });

    // 更新数据库中的用户信息
    const updateResult = await updateUserInfoInDB(userId, updateData);
    if (!updateResult) {
      return {
        success: false,
        message: "更新数据库失败"
      };
    }

    // 获取当前JWT中的userInfo
    const currentUserInfo = await getJWTField("userInfo");

    // 合并新的userInfo
    const newUserInfo = {
      ...currentUserInfo,
      ...userInfo
    };

    // 更新JWT中的userInfo
    const jwtUpdateSuccess = await addJWTField("userInfo", newUserInfo);
    if (!jwtUpdateSuccess) {
      return {
        success: false,
        message: "更新JWT失败"
      };
    }
    return {
      success: true,
      message: "个人信息更新成功"
    };
  } catch (error) {
    console.error("更新用户信息失败:", error);
    return {
      success: false,
      message: "更新失败，请稍后重试"
    };
  }
}
