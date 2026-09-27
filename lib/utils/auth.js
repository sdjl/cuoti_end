"use server";

import { generateJWT, getJWTFromCookie, setJWTCookie, verifyJWT } from "../common/jwt.js";
import { JWT_CONFIG } from "../config/constants.js";

// JWT标准字段不允许修改
const STANDARD_FIELDS = ["iat", "exp", "jti", "iss", "aud", "sub"];

// 这些字段不允许删除
const PROTECTED_FIELDS = ["iat", "exp", "jti", "iss", "aud", "sub",
// JWT标准字段
"wxUserId", "openid", "unionid", "userWxInfo", "userInfo", "roles", "status", "lastActiveAt" // 必需字段
];


export async function getCurrentUser() {
  try {
    const token = await getJWTFromCookie();
    if (!token) {
      return null;
    }
    const result = await verifyJWT(token, JWT_CONFIG);
    if (!result.valid || !result.payload) {
      return null;
    }
    return result.payload;
  } catch (error) {
    console.error("获取当前用户信息失败:", error);
    return null;
  }
}


export async function isSuperAdmin() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return false;
    }
    return user.roles.includes("super_admin");
  } catch (error) {
    console.error("检查超级管理员权限失败:", error);
    return false;
  }
}


export async function isAdmin() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return false;
    }
    return user.roles.includes("admin") || user.roles.includes("super_admin");
  } catch (error) {
    console.error("检查管理员权限失败:", error);
    return false;
  }
}


export async function hasRole(roles) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return false;
    }
    return roles.some(role => user.roles.includes(role));
  } catch (error) {
    console.error("检查用户角色失败:", error);
    return false;
  }
}


export async function isPrincipal() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return false;
    }
    return user.workSetting?.isPrincipal || false;
  } catch (error) {
    console.error("检查校长权限失败:", error);
    return false;
  }
}


export async function addJWTField(key, value) {
  try {
    if (STANDARD_FIELDS.includes(key)) {
      console.error(`不能修改JWT标准字段: ${key}`);
      return false;
    }
    const user = await getCurrentUser();
    if (!user) {
      console.error("无法获取当前用户信息");
      return false;
    }

    // 创建新的载荷，添加自定义字段
    const newPayload = {
      ...user,
      [key]: value
    };

    // 提取非标准字段用于生成新JWT
    const payloadData = Object.fromEntries(Object.entries(newPayload).filter(([k]) => !STANDARD_FIELDS.includes(k)));

    // 生成新的JWT
    const newToken = await generateJWT(payloadData, JWT_CONFIG);

    // 设置到Cookie
    await setJWTCookie(newToken);
    return true;
  } catch (error) {
    console.error("添加JWT字段失败:", error);
    return false;
  }
}


export async function removeJWTField(key) {
  try {
    if (PROTECTED_FIELDS.includes(key)) {
      console.error(`不能删除受保护的字段: ${key}`);
      return false;
    }
    const user = await getCurrentUser();
    if (!user) {
      console.error("无法获取当前用户信息");
      return false;
    }

    // 创建新的载荷，删除指定字段
    const newPayload = {
      ...user
    };
    delete newPayload[key];

    // 提取非标准字段用于生成新JWT
    const payloadData = Object.fromEntries(Object.entries(newPayload).filter(([k]) => !STANDARD_FIELDS.includes(k)));

    // 生成新的JWT
    const newToken = await generateJWT(payloadData, JWT_CONFIG);

    // 设置到Cookie
    await setJWTCookie(newToken);
    return true;
  } catch (error) {
    console.error("删除JWT字段失败:", error);
    return false;
  }
}


export async function getJWTField(key, defaultValue) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return defaultValue;
    }

    // 如果字段存在则返回，否则返回默认值
    return key in user ? user[key] : defaultValue;
  } catch (error) {
    console.error("获取JWT字段失败:", error);
    return defaultValue;
  }
}


export async function hasValidJWT() {
  try {
    const user = await getCurrentUser();
    return user !== null;
  } catch (error) {
    console.error("检查JWT有效性失败:", error);
    return false;
  }
}


export async function getCurrentUserOpenid() {
  return getJWTField("openid", undefined);
}
