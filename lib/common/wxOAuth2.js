/**
 * 微信网站应用OAuth2.0授权登录模块
 * 基于微信开放平台网站应用微信登录开发指南实现
 * @module wxOAuth2
 */

import crypto from "node:crypto";

/** 微信OAuth2授权配置 */

/** 微信授权登录的授权码信息，在生成jwt之前使用 */

/** access_token验证响应 */

/**
 * 微信OAuth2 API基础URL
 */
const WX_API_BASE_URL = {
  AUTHORIZE: "https://open.weixin.qq.com/connect/qrconnect",
  ACCESS_TOKEN: "https://api.weixin.qq.com/sns/oauth2/access_token",
  REFRESH_TOKEN: "https://api.weixin.qq.com/sns/oauth2/refresh_token",
  AUTH_CHECK: "https://api.weixin.qq.com/sns/auth",
  USER_INFO: "https://api.weixin.qq.com/sns/userinfo"
};


export function generateState() {
  return crypto.randomBytes(16).toString("hex");
}


export function getAuthorizeUrl(config, state) {
  const params = new URLSearchParams({
    appid: config.appId,
    redirect_uri: config.redirectUri,
    response_type: "code",
    scope: config.scope || "snsapi_login",
    state: state || generateState(),
    lang: config.lang || "cn"
  });
  return `${WX_API_BASE_URL.AUTHORIZE}?${params.toString()}#wechat_redirect`;
}


export async function getAccessToken(config, code) {
  const params = new URLSearchParams({
    appid: config.appId,
    secret: config.appSecret,
    code: code,
    grant_type: "authorization_code"
  });
  try {
    const response = await fetch(`${WX_API_BASE_URL.ACCESS_TOKEN}?${params.toString()}`, {
      method: "GET"
    });
    const data = await response.json();

    // 检查是否有错误
    if (data.errcode) {
      throw new Error(`微信授权失败: ${data.errmsg} (错误码: ${data.errcode})`);
    }
    return data;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("获取access_token失败");
  }
}


export async function refreshAccessToken(appId, refreshToken) {
  const params = new URLSearchParams({
    appid: appId,
    grant_type: "refresh_token",
    refresh_token: refreshToken
  });
  try {
    const response = await fetch(`${WX_API_BASE_URL.REFRESH_TOKEN}?${params.toString()}`, {
      method: "GET"
    });
    const data = await response.json();

    // 检查是否有错误
    if (data.errcode) {
      throw new Error(`刷新access_token失败: ${data.errmsg} (错误码: ${data.errcode})`);
    }
    return data;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("刷新access_token失败");
  }
}


export async function checkAccessToken(accessToken, openid) {
  const params = new URLSearchParams({
    access_token: accessToken,
    openid: openid
  });
  try {
    const response = await fetch(`${WX_API_BASE_URL.AUTH_CHECK}?${params.toString()}`, {
      method: "GET"
    });
    const data = await response.json();

    // errcode为0表示access_token有效
    return data.errcode === 0;
  } catch (error) {
    console.error("检验access_token时发生错误:", error);
    return false;
  }
}


export async function getUserInfo(accessToken, openid, lang = "zh_CN") {
  const params = new URLSearchParams({
    access_token: accessToken,
    openid: openid,
    lang: lang
  });
  try {
    const response = await fetch(`${WX_API_BASE_URL.USER_INFO}?${params.toString()}`, {
      method: "GET"
    });
    const data = await response.json();

    // 检查是否有错误
    if (data.errcode) {
      throw new Error(`获取用户信息失败: ${data.errmsg} (错误码: ${data.errcode})`);
    }
    return data;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("获取用户信息失败");
  }
}


export function validateAuthCode(authCodeInfo) {
  // 检查是否已使用
  if (authCodeInfo.isUsed) {
    return false;
  }

  // 检查是否过期（10分钟有效期）
  const now = Date.now();
  const codeAge = now - authCodeInfo.codeObtainedAt;
  const tenMinutes = 10 * 60 * 1000;
  return codeAge < tenMinutes;
}


export function convertToUserWxInfo(wxUserInfo) {
  return {
    nickname: wxUserInfo.nickname,
    headimgurl: wxUserInfo.headimgurl,
    sex: wxUserInfo.sex,
    province: wxUserInfo.province,
    city: wxUserInfo.city,
    country: wxUserInfo.country
  };
}


export function getEmbedQRCodeConfig(config, containerId, state, options) {
  return {
    id: containerId,
    appid: config.appId,
    scope: config.scope || "snsapi_login",
    redirect_uri: config.redirectUri,
    state: state || generateState(),
    ...options
  };
}


export function shouldRefreshAccessToken(accessTokenExpiresAt, bufferTime = 5 * 60 * 1000) {
  return Date.now() + bufferTime >= accessTokenExpiresAt;
}


export function isRefreshTokenExpired(refreshTokenExpiresAt) {
  return Date.now() >= refreshTokenExpiresAt;
}


export function buildCallbackUrl(redirectUri, code, state) {
  const url = new URL(redirectUri);
  url.searchParams.set("code", code);
  if (state) {
    url.searchParams.set("state", state);
  }
  return url.toString();
}


export function extractAuthCodeFromUrl(url) {
  try {
    const urlObj = new URL(url);
    const code = urlObj.searchParams.get("code");
    if (!code) {
      return null;
    }
    return {
      code,
      state: urlObj.searchParams.get("state") || undefined,
      codeObtainedAt: Date.now(),
      isUsed: false
    };
  } catch (error) {
    console.error("解析URL参数失败:", error);
    return null;
  }
}


export function validateState(originalState, returnedState) {
  // 如果都是undefined，认为匹配
  if (originalState === undefined && returnedState === undefined) {
    return true;
  }
  return originalState === returnedState;
}
