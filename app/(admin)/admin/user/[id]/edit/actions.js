"use server";

import { getJWTFromCookie, verifyJWT } from "../../../../../../lib/common/jwt.js";
import { JWT_CONFIG } from "../../../../../../lib/config/constants.js";
import { getWxUserById, isSuperAdmin, updateUserInfo as updateWxUserInfo, updateUserRoles as updateWxUserRoles, updateUserSpecialFlags as updateWxUserSpecialFlags } from "../../../../../../lib/utils/wxUser.js";

/**
 * 获取当前登录用户的openid
 */
async function getCurrentUserOpenid() {
  try {
    const token = await getJWTFromCookie();
    if (!token) {
      return null;
    }
    const result = await verifyJWT(token, JWT_CONFIG);
    if (!result.valid || !result.payload) {
      return null;
    }
    return result.payload.openid;
  } catch (error) {
    console.error("获取当前用户openid失败:", error);
    return null;
  }
}

/**
 * 获取用户详细信息
 */
export async function getUserInfo(userId) {
  try {
    const user = await getWxUserById(userId);
    if (!user) {
      throw new Error("用户不存在");
    }
    return {
      success: true,
      data: user
    };
  } catch (error) {
    console.error("获取用户信息失败:", error);
    return {
      success: false,
      error: "获取用户信息失败"
    };
  }
}

/**
 * 更新用户基本信息
 */
export async function updateUserInfo(userId, userInfo) {
  try {
    const success = await updateWxUserInfo(userId, userInfo);
    if (!success) {
      throw new Error("更新用户信息失败");
    }
    return {
      success: true
    };
  } catch (error) {
    console.error("更新用户信息失败:", error);
    return {
      success: false,
      error: "更新用户信息失败"
    };
  }
}

/**
 * 更新用户角色
 */
export async function updateUserRoles(userId, roles) {
  try {
    // 获取当前登录用户的openid
    const currentUserOpenid = await getCurrentUserOpenid();
    if (!currentUserOpenid) {
      return {
        success: false,
        error: "未登录或登录已过期"
      };
    }

    // 验证角色的合法性
    const validRoles = ["super_admin", "admin", "teacher", "student", "assistant", "principal"];
    const invalidRoles = roles.filter(role => !validRoles.includes(role));
    if (invalidRoles.length > 0) {
      return {
        success: false,
        error: `无效的角色: ${invalidRoles.join(", ")}`
      };
    }

    // 检查超级管理员和管理员角色的限制
    const hasSuper = roles.includes("super_admin");
    const hasAdmin = roles.includes("admin");
    if (hasSuper && hasAdmin) {
      return {
        success: false,
        error: "用户不能同时拥有超级管理员和管理员角色"
      };
    }

    // 获取目标用户的原始角色
    const targetUser = await getWxUserById(userId);
    if (!targetUser) {
      return {
        success: false,
        error: "目标用户不存在"
      };
    }
    const originalRoles = targetUser.roles;
    const hasOriginalAdmin = originalRoles.includes("admin");
    const hasOriginalSuper = originalRoles.includes("super_admin");

    // 检查是否试图修改管理员角色
    const isModifyingAdminRoles = hasAdmin !== hasOriginalAdmin || hasSuper !== hasOriginalSuper;

    // 如果试图修改管理员角色，验证当前用户是否为超级管理员
    if (isModifyingAdminRoles) {
      const isCurrentUserSuperAdmin = isSuperAdmin(currentUserOpenid);
      if (!isCurrentUserSuperAdmin) {
        return {
          success: false,
          error: "只有超级管理员才能修改管理员角色权限"
        };
      }
    }
    const success = await updateWxUserRoles(userId, roles);
    if (!success) {
      throw new Error("更新用户角色失败");
    }
    return {
      success: true
    };
  } catch (error) {
    console.error("更新用户角色失败:", error);
    return {
      success: false,
      error: "更新用户角色失败"
    };
  }
}

/**
 * 更新用户的特殊身份标识（isAdminEditor）
 */
export async function updateUserSpecialFlags(userId, flags) {
  try {
    const success = await updateWxUserSpecialFlags(userId, flags);
    if (!success) {
      throw new Error("更新用户特殊标识失败");
    }
    return {
      success: true
    };
  } catch (error) {
    console.error("更新用户特殊标识失败:", error);
    return {
      success: false,
      error: "更新用户特殊标识失败"
    };
  }
}
