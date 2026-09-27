"use client";

/**
 * ===============================================================
 * 【useAuth 客户端钩子使用说明】
 *
 * 功能简介：
 * 该钩子用于在客户端组件中获取当前登录用户的信息和权限，支持权限检查功能。
 * 它通过解析存储在浏览器Cookie中的JWT令牌来获取用户信息，无需额外的API请求。
 * 本功能依赖于 lib/common/jwt.ts 中的 DEFAULT_COOKIE_OPTIONS.httpOnly 设置为 false，
 * 否则客户端JavaScript无法访问JWT cookie。
 *
 * 主要功能：
 * 1. 获取当前登录用户的基本信息（用户ID、昵称、头像等）
 * 2. 提供权限检查方法（isAdmin, isSuperAdmin, hasRole, isPrincipal, isAdminEditor, isWorkAssistant）
 * 3. 提供加载状态和错误信息
 *
 * 使用示例：
 * ```tsx
 * import { useAuth } from "./useAuth.js";
 *
 * function MyComponent() {
 *   const { user, loading, error, isAdmin, isSuperAdmin, hasRole, isPrincipal } = useAuth();
 *
 *   if (loading) return <div>加载中...</div>;
 *   if (error) return <div>发生错误: {error}</div>;
 *   if (!user) return <div>未登录</div>;
 *
 *   return (
 *     <div>
 *       <h1>欢迎, {user.userWxInfo.nickname}</h1>
 *       {isAdmin() && <div>管理员功能</div>}
 *       {isPrincipal() && <div>校长功能</div>}
 *       {hasRole(["teacher"]) && <div>教师功能</div>}
 *     </div>
 *   );
 * }
 * ```
 *
 * 注意事项：
 * 1. 该钩子仅用于客户端组件，确保在使用时添加 "use client" 指令
 * 2. 不提供登录/登出功能，仅用于获取当前已登录用户的信息
 * 3. 为保证安全性，敏感操作仍需在服务端进行权限验证
 * ===============================================================
 */
import jsCookie from "js-cookie";
import { useEffect, useState } from "react";

/**
 * 用户认证Hook
 * 用于客户端获取当前用户的JWT信息
 */
export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    try {
      // 从Cookie中获取JWT令牌
      const token = jsCookie.get("wx_auth_token");
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      // 在客户端解析JWT（不验证签名）
      const decoded = parseJWT(token);
      if (decoded) {
        setUser(decoded);
      } else {
        setError("无法解析用户令牌");
      }
    } catch (err) {
      setError("获取用户信息失败");
      console.error("获取用户信息失败:", err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * 解析JWT令牌（仅客户端使用，不验证签名）
   */
  function parseJWT(token) {
    try {
      // 分割JWT并解析
      const base64Payload = token.split(".")[1];
      if (!base64Payload) return null;

      // 标准化Base64字符串（处理URL-safe Base64）
      const normalizedBase64 = base64Payload.replace(/-/g, "+").replace(/_/g, "/");

      // 使用atob解码Base64，然后正确处理UTF-8编码
      const binaryString = atob(normalizedBase64);

      // 将二进制字符串转换为字节数组，再解码为UTF-8字符串
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // 使用TextDecoder正确解码UTF-8
      const decodedPayload = new TextDecoder("utf-8").decode(bytes);
      const payload = JSON.parse(decodedPayload);
      return payload;
    } catch (e) {
      console.error("解析JWT失败:", e instanceof Error ? e.message : String(e));
      return null;
    }
  }

  
  function isAdmin() {
    if (!user) return false;
    return user.roles.includes("admin") || user.roles.includes("super_admin");
  }

  
  function isSuperAdmin() {
    if (!user) return false;
    return user.roles.includes("super_admin");
  }

  
  function isPrincipal() {
    if (!user) return false;
    return user.workSetting?.isPrincipal || false;
  }

  
  function hasRole(requiredRoles) {
    if (!user) return false;
    return requiredRoles.some(role => user.roles.includes(role));
  }

  
  function getOpenid() {
    if (!user) return null;
    return user.openid || null;
  }

  
  function isAdminEditor() {
    if (!user) return false;
    return user.isAdminEditor || false;
  }

  
  function isWorkAssistant() {
    if (!user) return false;
    return user.isWorkAssistant || false;
  }
  return {
    user,
    loading,
    error,
    isAdmin,
    isSuperAdmin,
    isPrincipal,
    hasRole,
    getOpenid,
    isAdminEditor,
    isWorkAssistant
  };
}
