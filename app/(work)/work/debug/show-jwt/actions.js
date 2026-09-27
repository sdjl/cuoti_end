"use server";

import { decodeJWT, getJWTFromCookie, getJWTRemainingTime, verifyJWT } from "../../../../../lib/common/jwt.js";
import { JWT_CONFIG } from "../../../../../lib/config/constants.js";


export async function getJWTDebugInfo() {
  try {
    // 从Cookie中获取JWT
    const token = await getJWTFromCookie();
    if (!token) {
      return {
        success: false,
        error: "未找到JWT令牌"
      };
    }

    // 解码JWT（不验证签名）
    const decoded = decodeJWT(token);

    // 验证JWT
    const verified = await verifyJWT(token, JWT_CONFIG);

    // 计算剩余时间
    let remainingTime;
    if (decoded?.payload?.exp) {
      remainingTime = getJWTRemainingTime(decoded.payload.exp);
    }
    return {
      success: true,
      data: {
        rawToken: token,
        decoded: decoded?.payload || null,
        verified: {
          valid: verified.valid,
          error: verified.error,
          needRefresh: verified.needRefresh
        },
        remainingTime,
        cookieName: "wx_auth_token"
      }
    };
  } catch (error) {
    console.error("获取JWT调试信息失败:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "未知错误"
    };
  }
}


export async function getFormattedJWTData() {
  try {
    const debugInfo = await getJWTDebugInfo();
    if (!debugInfo.success || !debugInfo.data) {
      return {
        success: false,
        error: debugInfo.error || "无法获取JWT数据"
      };
    }
    const {
      rawToken,
      decoded,
      verified,
      remainingTime,
      cookieName
    } = debugInfo.data;
    const formattedData = {
      调试时间: new Date().toLocaleString("zh-CN", {
        timeZone: "Asia/Shanghai"
      }),
      Cookie名称: cookieName,
      JWT原始令牌: rawToken,
      JWT验证状态: {
        有效性: verified.valid ? "有效" : "无效",
        错误信息: verified.error || "无",
        需要刷新: verified.needRefresh ? "是" : "否"
      },
      JWT载荷数据: decoded,
      令牌剩余时间: remainingTime ? `${Math.floor(remainingTime / 60)}分钟${remainingTime % 60}秒` : "未知"
    };
    return {
      success: true,
      data: JSON.stringify(formattedData, null, 2)
    };
  } catch (error) {
    console.error("生成格式化数据失败:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "未知错误"
    };
  }
}
