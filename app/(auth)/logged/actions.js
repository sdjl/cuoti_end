"use server";

import { createJWTPayloadFromWxUser, generateJWT, setJWTCookie } from "../../../lib/common/jwt.js";
import { getAccessToken, getUserInfo } from "../../../lib/common/wxOAuth2.js";
import { JWT_CONFIG } from "../../../lib/config/constants.js";
import { createOrUpdateWxUser, refreshUserCurrentSchool } from "../../../lib/utils/wxUser.js";

/**
 * 处理微信登录回调的Server Action
 */
export async function handleWxLoginCallback(code, _state) {
  try {
    if (!code) {
      console.error("未收到授权码");
      return {
        success: false,
        error: "授权失败：未收到授权码"
      };
    }

    // 获取环境变量配置
    const appId = process.env.TENCENT_OPEN_APPID;
    const appSecret = process.env.TENCENT_OPEN_APP_SECRET;
    if (!appId || !appSecret) {
      console.error("微信登录配置不完整");
      return {
        success: false,
        error: "服务器配置错误"
      };
    }

    // 检查JWT配置
    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET环境变量未配置");
      return {
        success: false,
        error: "服务器配置错误"
      };
    }

    // 配置OAuth2参数
    const wxConfig = {
      appId,
      appSecret,
      redirectUri: `${process.env.NEXTAUTH_URL}/logged`
    };

    // 第一步：用code换取access_token
    const tokenResponse = await getAccessToken(wxConfig, code);

    // 第二步：获取用户信息
    const userInfo = await getUserInfo(tokenResponse.access_token, tokenResponse.openid);

    // 第三步：将用户数据写入或更新到wx_user集合
    let wxUserDoc = await createOrUpdateWxUser(tokenResponse, userInfo);

    // 第四步：检查用户状态是否被禁用
    if (wxUserDoc.status === "banned") {
      console.log(`用户 ${wxUserDoc.userWxInfo.nickname} (${wxUserDoc.openid}) 尝试登录但账户已被禁用`);
      return {
        success: false,
        error: "您的账户已被禁用，无法登录。如有疑问请联系管理员。"
      };
    }

    // 第五步：重新计算用户的当前学校数据（确保使用最新的学校关联关系）
    // 无论用户之前是否有currentSchool，都重新查询数据库以确保数据正确
    wxUserDoc = await refreshUserCurrentSchool(wxUserDoc);

    // 第六步：生成JWT令牌
    const baseJwtPayload = createJWTPayloadFromWxUser(wxUserDoc);

    // 处理workSetting字段，确保包含currentSchool信息
    let workSetting;
    if (wxUserDoc.workSetting?.currentSchool) {
      // 检查用户是否是该校园的校长（使用刷新后的最新数据）
      // 必须同时满足两个条件：
      // 1. 用户的roles中包含"principal"角色
      // 2. 学校的adminOpenids中包含当前用户的openid
      const hasPrincipalRole = wxUserDoc.roles?.includes("principal") || false;
      const isInAdminOpenids = wxUserDoc.workSetting.currentSchool.adminOpenids?.includes(wxUserDoc.openid) || false;
      const isPrincipal = hasPrincipalRole && isInAdminOpenids;

      // 创建不包含敏感字段的校园对象
      const {
        adminOpenids: _,
        teacherOpenids: __,
        config: ___,
        ...currentSchoolForJWT
      } = wxUserDoc.workSetting.currentSchool;
      workSetting = {
        currentSchool: currentSchoolForJWT,
        isPrincipal
      };
    }

    // 合并基础载荷和workSetting
    const jwtPayload = {
      ...baseJwtPayload,
      workSetting
    };
    const jwtToken = await generateJWT(jwtPayload, JWT_CONFIG);

    // 第七步：将JWT存储到Cookie中
    await setJWTCookie(jwtToken, {
      maxAge: 7 * 24 * 60 * 60 // 7天
    });
    return {
      success: true,
      user: {
        id: wxUserDoc._id,
        nickname: wxUserDoc.userWxInfo.nickname,
        avatar: wxUserDoc.userWxInfo.headimgurl
      }
    };
  } catch (error) {
    console.error("微信登录Server Action处理失败:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "未知错误"
    };
  }
}
