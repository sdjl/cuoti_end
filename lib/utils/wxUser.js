/**
 * 微信用户数据库操作模块
 * 负责处理wx_user集合的所有读写操作
 */

import { addDoc, allDocs, command, count, docs, getOne, updateDoc } from "../common/database.js";

/** 数据库表名 */
const USER_COLLECTION_NAME = "wx_user";


export function isSuperAdmin(openid) {
  const superAdminUsers = process.env.TENCENT_OPEN_SUPER_ADMIN_USERS;
  if (!superAdminUsers) {
    return false;
  }

  // 支持单个或多个openid，用英文逗号分割
  const adminOpenids = superAdminUsers.split(",").map(id => id.trim());
  return adminOpenids.includes(openid);
}


function calculateUserRoles(openid, existingRoles) {
  const isEnvSuperAdmin = isSuperAdmin(openid);

  // 如果是新用户
  if (!existingRoles) {
    if (isEnvSuperAdmin) {
      return ["super_admin"];
    } else {
      return ["student"]; // 新用户默认为学生
    }
  }

  // 如果是现有用户，保留现有角色
  let roles = [...existingRoles];

  // 根据环境变量处理超级管理员权限
  if (isEnvSuperAdmin) {
    // 如果环境变量显示用户是超级管理员
    if (!roles.includes("super_admin")) {
      // 添加超级管理员角色
      roles.push("super_admin");
    }
    // 移除普通管理员角色（因为不能同时有超级管理员和管理员）
    roles = roles.filter(role => role !== "admin");
  }
  // 注意：如果环境变量显示用户不是超级管理员，我们不会自动移除super_admin角色
  // 这是为了防止误操作，超级管理员权限一旦获得就应该保持（除非手动移除）

  return roles;
}


export async function createOrUpdateWxUser(tokenResponse, userInfo) {
  const now = Date.now();

  // 构建用户的微信基本信息
  const userWxInfo = {
    nickname: userInfo.nickname,
    headimgurl: userInfo.headimgurl,
    sex: userInfo.sex,
    province: userInfo.province,
    city: userInfo.city,
    country: userInfo.country
  };

  // 计算accessToken和refreshToken的过期时间
  const accessTokenExpiresAt = now + tokenResponse.expires_in * 1000;
  const refreshTokenExpiresAt = now + 30 * 24 * 60 * 60 * 1000; // 30天

  // 先尝试根据unionid和openid查找现有用户
  const existingUser = await getOne(USER_COLLECTION_NAME, {
    unionid: tokenResponse.unionid,
    openid: tokenResponse.openid
  });
  const _ = command();
  if (existingUser) {
    // 用户已存在，计算角色（保留现有角色并根据环境变量调整）
    const updatedRoles = calculateUserRoles(tokenResponse.openid, existingUser.roles);
    const updateData = {
      accessToken: tokenResponse.access_token,
      expiresIn: tokenResponse.expires_in,
      accessTokenExpiresAt,
      refreshToken: tokenResponse.refresh_token,
      refreshTokenExpiresAt,
      scope: tokenResponse.scope,
      userWxInfo,
      roles: updatedRoles,
      // 使用计算后的角色
      lastLoginAt: now,
      loginCount: _.inc(1),
      // 登录次数自增
      updated: now
    };
    await updateDoc(USER_COLLECTION_NAME, existingUser._id, updateData);

    // 返回更新后的用户文档
    return {
      ...existingUser,
      ...updateData,
      loginCount: existingUser.loginCount + 1
    };
  } else {
    // 用户不存在，创建新用户
    const newUserRoles = calculateUserRoles(tokenResponse.openid);
    const newUserDoc = {
      openid: tokenResponse.openid,
      unionid: tokenResponse.unionid,
      accessToken: tokenResponse.access_token,
      expiresIn: tokenResponse.expires_in,
      accessTokenExpiresAt,
      refreshToken: tokenResponse.refresh_token,
      refreshTokenExpiresAt,
      scope: tokenResponse.scope,
      userWxInfo,
      userInfo: {},
      // 初始为空，后续由管理员填写
      roles: newUserRoles,
      // 使用计算后的角色
      status: "active",
      // 默认状态为活跃
      lastLoginAt: now,
      loginCount: 1,
      created: now,
      updated: now
    };
    const userId = await addDoc(USER_COLLECTION_NAME, newUserDoc);
    return {
      _id: userId,
      ...newUserDoc
    };
  }
}


export async function getWxUserByUnionid(unionid) {
  return await getOne(USER_COLLECTION_NAME, {
    unionid
  });
}


export async function getWxUserByOpenid(openid) {
  return await getOne(USER_COLLECTION_NAME, {
    openid
  });
}


export async function getWxUserById(userId) {
  return await getOne(USER_COLLECTION_NAME, {
    _id: userId
  });
}


export async function updateUserStatus(userId, status) {
  return await updateDoc(USER_COLLECTION_NAME, userId, {
    status,
    updated: Date.now()
  });
}


export async function updateUserRoles(userId, roles) {
  return await updateDoc(USER_COLLECTION_NAME, userId, {
    roles,
    updated: Date.now()
  });
}


export async function getWxUsersList(params) {
  const {
    pageNum,
    pageSize,
    keyword,
    role,
    status
  } = params;
  const _ = command();

  // 构建查询条件
  let whereCondition = {};
  const andConditions = [];

  // 关键词搜索 - 支持openid、昵称、姓名、手机号、邮箱
  if (keyword?.trim()) {
    const searchTerm = keyword.trim();
    andConditions.push(_.or([{
      openid: new RegExp(searchTerm, "i")
    }, {
      "userWxInfo.nickname": new RegExp(searchTerm, "i")
    }, {
      "userInfo.name": new RegExp(searchTerm, "i")
    }, {
      "userInfo.phone": new RegExp(searchTerm, "i")
    }, {
      "userInfo.email": new RegExp(searchTerm, "i")
    }]));
  }

  // 角色筛选
  if (role && role !== "all") {
    andConditions.push({
      roles: _.in([role])
    });
  }

  // 状态筛选
  if (status && status !== "all") {
    andConditions.push({
      status
    });
  }

  // 构建最终查询条件
  if (andConditions.length === 1) {
    whereCondition = andConditions[0];
  } else if (andConditions.length > 1) {
    whereCondition = _.and(...andConditions);
  }
  const result = await docs({
    c: USER_COLLECTION_NAME,
    w: whereCondition,
    pageNum,
    pageSize,
    orderBy: "created" // 按创建时间倒序
  });
  return result;
}


export async function getWxUsersCount(params) {
  const {
    keyword,
    role,
    status
  } = params;
  const _ = command();

  // 构建查询条件（与getWxUsersList保持一致）
  let whereCondition = {};
  const andConditions = [];

  // 关键词搜索
  if (keyword?.trim()) {
    const searchTerm = keyword.trim();
    andConditions.push(_.or([{
      openid: new RegExp(searchTerm, "i")
    }, {
      "userWxInfo.nickname": new RegExp(searchTerm, "i")
    }, {
      "userInfo.name": new RegExp(searchTerm, "i")
    }, {
      "userInfo.phone": new RegExp(searchTerm, "i")
    }, {
      "userInfo.email": new RegExp(searchTerm, "i")
    }]));
  }

  // 角色筛选
  if (role && role !== "all") {
    andConditions.push({
      roles: _.in([role])
    });
  }

  // 状态筛选
  if (status && status !== "all") {
    andConditions.push({
      status
    });
  }

  // 构建最终查询条件
  if (andConditions.length === 1) {
    whereCondition = andConditions[0];
  } else if (andConditions.length > 1) {
    whereCondition = _.and(...andConditions);
  }
  return await count(USER_COLLECTION_NAME, whereCondition);
}


export async function updateUserInfo(userId, userInfo) {
  return await updateDoc(USER_COLLECTION_NAME, userId, {
    userInfo,
    updated: Date.now()
  });
}


export async function getWxUsersByOpenids(openids) {
  if (openids.length === 0) {
    return [];
  }
  const _ = command();
  const users = await allDocs({
    c: USER_COLLECTION_NAME,
    match: {
      openid: _.in(openids)
    }
  });
  return users;
}


export async function updateUserSpecialFlags(userId, flags) {
  const updateData = {
    updated: Date.now()
  };
  if (flags.isAdminEditor !== undefined) {
    updateData.isAdminEditor = flags.isAdminEditor;
  }
  if (flags.isWorkAssistant !== undefined) {
    updateData.isWorkAssistant = flags.isWorkAssistant;
  }
  return await updateDoc(USER_COLLECTION_NAME, userId, updateData);
}


export async function refreshUserCurrentSchool(wxUserDoc) {
  try {
    // 根据用户的openid重新查询用户所属的学校
    const {
      getSchoolByUserOpenid
    } = await import("../collection/school");
    const userSchool = await getSchoolByUserOpenid(wxUserDoc.openid);
    if (!userSchool) {
      // 用户不属于任何学校，清空workSetting.currentSchool
      console.log(`用户 ${wxUserDoc._id} (${wxUserDoc.openid}) 不属于任何学校，清空currentSchool`);

      // 如果之前有学校数据，需要清空
      if (wxUserDoc.workSetting?.currentSchool) {
        await updateDoc(USER_COLLECTION_NAME, wxUserDoc._id, {
          "workSetting.currentSchool": command().remove(),
          updated: Date.now()
        });
        return {
          ...wxUserDoc,
          workSetting: {
            ...wxUserDoc.workSetting,
            currentSchool: undefined
          },
          updated: Date.now()
        };
      }

      // 本来就没有学校数据，直接返回
      return wxUserDoc;
    }

    // 用户属于某个学校，更新workSetting.currentSchool
    console.log(`用户 ${wxUserDoc._id} (${wxUserDoc.openid}) 属于学校: ${userSchool.name} (${userSchool._id})`);
    await updateDoc(USER_COLLECTION_NAME, wxUserDoc._id, {
      "workSetting.currentSchool": userSchool,
      updated: Date.now()
    });

    // 返回更新后的用户数据
    return {
      ...wxUserDoc,
      workSetting: {
        ...wxUserDoc.workSetting,
        currentSchool: userSchool
      },
      updated: Date.now()
    };
  } catch (error) {
    console.error(`刷新用户 ${wxUserDoc._id} 的当前学校数据失败:`, error);
    // 发生错误时返回原数据
    return wxUserDoc;
  }
}
