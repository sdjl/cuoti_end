"use client";

import { useEffect } from "react";
import { logoutAndRedirect } from "./actions.js";
export default function LogoutPage() {
  useEffect(() => {
    const processLogout = async () => {
      try {
        // 执行登出操作（这会自动重定向到首页）
        await logoutAndRedirect();
      } catch (error) {
        console.error("登出过程中发生错误:", error);
        // 延迟后手动跳转到首页
        setTimeout(() => {
          window.location.href = "/";
        }, 1000);
      }
    };
    processLogout();
  }, []);

  // 不显示任何内容
  return null;
}
