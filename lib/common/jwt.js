/**
 * JWT（JSON Web Token）处理模块
 * 用于用户认证和会话管理
 * 使用 jsonwebtoken 库实现
 *
 * 使用步骤说明：
 * 1. 用户登录时：
 *    - 验证用户身份（如微信登录）
 *    - 使用 createJWTPayloadFromWxUser() 从用户数据创建JWT载荷
 *    - 使用 generateJWT() 生成JWT令牌
 *    - 使用 setJWTCookie() 将JWT存储到Cookie中
 *
 * 2. 用户访问需要认证的接口时：
 *    - 使用 getJWTFromCookie() 或 getJWTFromHeaders() 获取JWT
 *    - 使用 verifyJWT() 或 verifyJWTSync() 验证JWT的有效性
 *    - 如果验证结果中 needRefresh 为 true，使用 refreshJWT() 刷新令牌
 *    - 使用 hasPermission() 检查用户权限
 *    - 使用 isUserActive() 检查用户状态
 *
 * 3. 用户登出时：
 *    - 使用 clearJWTCookie() 清除Cookie中的JWT
 *
 * 4. JWT自动续期：
 *    - 使用 shouldAutoRenewJWT() 判断是否需要自动续期
 *    - 使用 getJWTRemainingTime() 获取JWT剩余有效时间
 *
 */

import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { v4 as uuidv4 } from "uuid";
import { JWT_CONFIG } from "../config/constants.js";

/**
 * 默认Cookie配置
 */
const DEFAULT_COOKIE_OPTIONS = {
  name: "wx_auth_token",
  httpOnly: false,
  // 前端需要显示用户信息，如果改成true，需要使用双令牌，把用户信息放在另一个cookie中
  //secure: process.env.NODE_ENV === "production",
  secure: false,
  // 暂时不使用https
  sameSite: "lax",
  path: "/"
};


export async function generateJWT(payload, config, options) {
  const expiresIn = options?.expiresIn || config.defaultExpiresIn || JWT_CONFIG.defaultExpiresIn;
  const jwtPayload = {
    ...payload,
    jti: options?.jwtid || uuidv4(),
    iss: config.issuer,
    aud: config.audience,
    sub: payload.wxUserId,
    lastActiveAt: Date.now()
    // iat 和 exp 会由 jsonwebtoken 自动添加
  };
  return new Promise((resolve, reject) => {
    jwt.sign(jwtPayload, config.secret, {
      expiresIn
    }, (err, token) => {
      if (err || !token) {
        reject(err || new Error("JWT生成失败"));
      } else {
        resolve(token);
      }
    });
  });
}


export async function verifyJWT(token, config, options) {
  return new Promise(resolve => {
    const verifyOptions = {
      issuer: options?.verifyIssuer !== false ? config.issuer : undefined,
      audience: options?.verifyAudience !== false ? config.audience : undefined,
      ignoreExpiration: options?.ignoreExpiration,
      clockTolerance: 60 // 60秒的时钟偏差容忍
    };
    jwt.verify(token, config.secret, verifyOptions, (err, decoded) => {
      if (err || !decoded) {
        let errorMessage = "JWT验证失败";
        if (err) {
          if (err.name === "TokenExpiredError") {
            errorMessage = "JWT已过期";
          } else if (err.name === "JsonWebTokenError") {
            errorMessage = "JWT无效";
          } else if (err.name === "NotBeforeError") {
            errorMessage = "JWT尚未生效";
          } else {
            errorMessage = err.message;
          }
        }
        resolve({
          valid: false,
          error: errorMessage
        });
        return;
      }
      const jwtPayload = decoded;

      // 检查账户状态
      if (jwtPayload.status === "banned") {
        resolve({
          valid: false,
          error: "账户已被禁用"
        });
        return;
      }

      // 检查是否需要刷新token（基于最后活跃时间）
      const activeThreshold = config.activeThreshold || JWT_CONFIG.activeThreshold;
      const needRefresh = Date.now() - jwtPayload.lastActiveAt > activeThreshold * 1000;
      resolve({
        valid: true,
        payload: jwtPayload,
        needRefresh
      });
    });
  });
}


export function decodeJWT(token) {
  try {
    const decoded = jwt.decode(token, {
      complete: true
    });
    if (!decoded || typeof decoded === "string") {
      return null;
    }
    return {
      payload: decoded.payload,
      header: decoded.header,
      signature: decoded.signature
    };
  } catch (error) {
    console.error("JWT解析失败:", error);
    return null;
  }
}


export function createJWTPayloadFromWxUser(wxUserDoc) {
  return {
    wxUserId: wxUserDoc._id,
    openid: wxUserDoc.openid,
    unionid: wxUserDoc.unionid,
    userWxInfo: wxUserDoc.userWxInfo,
    userInfo: wxUserDoc.userInfo,
    roles: wxUserDoc.roles,
    isAdminEditor: wxUserDoc.isAdminEditor,
    isWorkAssistant: wxUserDoc.isWorkAssistant,
    status: wxUserDoc.status,
    lastActiveAt: Date.now()
  };
}


export async function refreshJWT(currentPayload, config, options) {
  // 提取非标准声明的载荷数据，排除 JWT 标准声明
  const payloadData = Object.fromEntries(Object.entries(currentPayload).filter(([key]) => !["iat", "exp", "jti", "iss", "aud", "sub"].includes(key)));

  // 更新最后活跃时间
  const refreshedPayload = {
    ...payloadData,
    lastActiveAt: Date.now()
  };
  return generateJWT(refreshedPayload, config, options);
}


export async function setJWTCookie(token, options) {
  const cookieOptions = {
    ...DEFAULT_COOKIE_OPTIONS,
    ...options
  };
  const cookieStore = await cookies();
  cookieStore.set(cookieOptions.name, token, {
    httpOnly: cookieOptions.httpOnly,
    secure: cookieOptions.secure,
    sameSite: cookieOptions.sameSite,
    path: cookieOptions.path,
    domain: cookieOptions.domain,
    maxAge: cookieOptions.maxAge
  });
}


export async function clearJWTCookie(cookieName) {
  const cookieStore = await cookies();
  cookieStore.delete(cookieName || DEFAULT_COOKIE_OPTIONS.name);
}


export async function getJWTFromCookie(cookieName) {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(cookieName || DEFAULT_COOKIE_OPTIONS.name);
  return cookie?.value || null;
}


export function getJWTFromHeaders(headers) {
  const authorization = headers.get("Authorization");
  if (!authorization) {
    return null;
  }
  const parts = authorization.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return null;
  }
  return parts[1] || null;
}


export function getJWTRemainingTime(exp) {
  const now = Math.floor(Date.now() / 1000);
  return Math.max(exp - now, 0);
}


export function shouldAutoRenewJWT(payload, threshold) {
  const remainingTime = getJWTRemainingTime(payload.exp);
  const totalTime = payload.exp - payload.iat;
  const renewThreshold = threshold || totalTime / 3;
  return remainingTime <= renewThreshold;
}


export function verifyJWTSync(token, config, options) {
  try {
    const verifyOptions = {
      issuer: options?.verifyIssuer !== false ? config.issuer : undefined,
      audience: options?.verifyAudience !== false ? config.audience : undefined,
      ignoreExpiration: options?.ignoreExpiration,
      clockTolerance: 60
    };
    const decoded = jwt.verify(token, config.secret, verifyOptions);

    // 检查账户状态
    if (decoded.status === "banned") {
      return {
        valid: false,
        error: "账户已被禁用"
      };
    }

    // 检查是否需要刷新token
    const activeThreshold = config.activeThreshold || JWT_CONFIG.activeThreshold;
    const needRefresh = Date.now() - decoded.lastActiveAt > activeThreshold * 1000;
    return {
      valid: true,
      payload: decoded,
      needRefresh
    };
  } catch (error) {
    let errorMessage = "JWT验证失败";
    if (error instanceof jwt.TokenExpiredError) {
      errorMessage = "JWT已过期";
    } else if (error instanceof jwt.JsonWebTokenError) {
      errorMessage = "JWT无效";
    } else if (error instanceof jwt.NotBeforeError) {
      errorMessage = "JWT尚未生效";
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }
    return {
      valid: false,
      error: errorMessage
    };
  }
}
