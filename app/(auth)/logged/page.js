"use client";

/** 登录成功后的回调页面，需使用空的layout.tsx */
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { handleWxLoginCallback } from "./actions.js";
export default function LoggedPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isProcessing, setIsProcessing] = useState(true);
  useEffect(() => {
    const processLogin = async () => {
      try {
        const code = searchParams.get("code");
        const state = searchParams.get("state");
        if (!code) {
          throw new Error("授权失败：未收到授权码");
        }

        // 调用Server Action处理微信登录
        const result = await handleWxLoginCallback(code, state || "");
        if (!result.success) {
          // 抛出错误，在catch块中使用错误消息
          const error = new Error(result.error || "登录失败");
          throw error;
        }

        // 登录成功，停止处理状态
        setIsProcessing(false);

        // 立即跳转，不等待
        // 检查是否在iframe中
        if (window.top !== window.self) {
          // 在iframe中，控制父页面跳转
          try {
            window.top.location.href = "/work";
          } catch {
            // 如果跨域限制，使用postMessage
            window.top.postMessage({
              type: "wx_login_success",
              redirectUrl: "/work"
            }, "*");
          }
        } else {
          // 不在iframe中，直接跳转
          router.push("/work");
        }
      } catch (error) {
        console.error("微信登录处理失败:", error);
        const errorMessage = error instanceof Error ? error.message : "未知错误";

        // 如果在iframe中，通知父页面登录失败
        if (window.top !== window.self) {
          try {
            window.top.location.href = `/error?message=${encodeURIComponent(errorMessage)}`;
          } catch {
            window.top.postMessage({
              type: "wx_login_error",
              error: errorMessage,
              redirectUrl: `/error?message=${encodeURIComponent(errorMessage)}`
            }, "*");
          }
        } else {
          // 如果不在iframe中，直接跳转到错误页面
          router.push(`/error?message=${encodeURIComponent(errorMessage)}`);
        }
      }
    };
    processLogin();
  }, [router, searchParams]);
  return <div style={{
    width: "100%",
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  }}>
      <div style={{
      textAlign: "center"
    }}>
        {isProcessing ? <div style={{
        fontSize: "18px",
        fontWeight: "500",
        color: "#666666"
      }}>
            处理中...
          </div> : <div style={{
        fontSize: "20px",
        fontWeight: "bold",
        color: "#16a34a"
      }}>
            登录成功
          </div>}
      </div>
    </div>;
}
