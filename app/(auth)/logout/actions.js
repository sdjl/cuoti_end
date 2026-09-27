"use server";

import { redirect } from "next/navigation";
import { clearJWTCookie } from "../../../lib/common/jwt.js";

/**
 * 处理用户登出的Server Action
 */
export async function handleLogout() {
  try {
    // 清除JWT Cookie
    await clearJWTCookie();

    // 可以在这里添加其他登出逻辑，比如：
    // - 记录登出日志
    // - 清除其他相关的session数据
    // - 通知其他系统用户已登出

    return {
      success: true,
      message: "登出成功"
    };
  } catch (error) {
    console.error("用户登出失败:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "登出失败"
    };
  }
}

/**
 * 登出并重定向到首页
 */
export async function logoutAndRedirect() {
  try {
    // 执行登出逻辑
    const result = await handleLogout();
    if (!result.success) {
      console.error("登出失败，但仍然重定向到首页");
    }
  } catch (error) {
    console.error("登出过程中发生错误:", error);
    // 即使出错也要重定向，确保用户能够重新登录
  } finally {
    // 无论成功还是失败，都重定向到首页
    redirect("/");
  }
}
