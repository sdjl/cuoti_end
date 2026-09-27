"use server";

import { generateState } from "../../../lib/common/wxOAuth2.js";
import { DOMAIN } from "../../../lib/config/constants.js";


export async function getWxLoginConfig() {
  const appId = process.env.TENCENT_OPEN_APPID;
  const appSecret = process.env.TENCENT_OPEN_APP_SECRET;
  let redirectUri = process.env.NEXTAUTH_URL;
  if (!appId || !appSecret) {
    throw new Error("微信登录配置不完整，请检查环境变量");
  }
  if (!redirectUri) {
    throw new Error("NEXTAUTH_URL环境变量未设置");
  }

  // 生成防CSRF攻击的state参数
  const state = generateState();

  // 判断是否为本地开发环境
  const isLocalDev = redirectUri.includes(DOMAIN.LOCALHOST);

  // 线上网站的原始域名
  const webSiteOrigin = process.env.NEXT_PUBLIC_WEB_SITE_ORIGIN;
  if (isLocalDev) {
    // 本地开发时，回调到线上的重定向页面
    redirectUri = `${webSiteOrigin}/login/redirect-local`;
  } else {
    // 线上环境，直接回调到logged页面
    redirectUri = `${redirectUri}/logged`;
  }
  return {
    appId,
    redirectUri: encodeURIComponent(redirectUri),
    state,
    scope: "snsapi_login",
    lang: "cn"
  };
}
