"use server";

import { CONFIG_KEYS } from "../../../../../lib/config/constants.js";
import { getSetting, setSetting, updateSetting } from "../../../../../lib/utils/setting.js";
import { DEFAULT_MINIPROGRAM_CONFIG } from "./types.js";


export async function getMiniprogramConfigFromDB() {
  try {
    const settings = await getSetting(CONFIG_KEYS.MINIPROGRAM);
    return settings[CONFIG_KEYS.MINIPROGRAM] || null;
  } catch (error) {
    console.error("从数据库获取小程序配置失败:", error);
    return null;
  }
}


export async function saveMiniprogramConfigToDB(config) {
  try {
    const result = await setSetting(CONFIG_KEYS.MINIPROGRAM, config);
    return {
      success: result.success,
      message: result.message
    };
  } catch (error) {
    console.error("保存小程序配置到数据库失败:", error);
    return {
      success: false,
      message: `保存失败: ${error.message}`
    };
  }
}


export async function updateMiniprogramConfigField(path, value) {
  try {
    // 先查询数据库，检查配置是否存在
    const existingConfig = await getMiniprogramConfigFromDB();
    if (existingConfig) {
      // 配置已存在，使用 updateSetting 进行局部更新
      const result = await updateSetting(CONFIG_KEYS.MINIPROGRAM, path, value);
      return result;
    } else {
      // 配置不存在，创建默认配置并设置对应字段
      // 将要更新的字段值设置到默认配置中
      const configToSave = {
        ...DEFAULT_MINIPROGRAM_CONFIG
      };

      // 根据路径设置对应的值
      if (path === "contacts") {
        configToSave.contacts = {
          ...configToSave.contacts,
          ...value
        };
      } else if (path === "systemLogo") {
        configToSave.systemLogo = {
          ...configToSave.systemLogo,
          ...value
        };
      } else if (path === "copywriting") {
        configToSave.copywriting = {
          ...configToSave.copywriting,
          ...value
        };
      } else if (path === "aiMistakePractice") {
        configToSave.aiMistakePractice = {
          ...configToSave.aiMistakePractice,
          ...value
        };
      } else if (path === "aiProblem") {
        configToSave.aiProblem = {
          ...configToSave.aiProblem,
          ...value
        };
      } else if (path === "unloggedIntroduction") {
        configToSave.unloggedIntroduction = {
          ...configToSave.unloggedIntroduction,
          ...value
        };
      } else if (path === "loggedIntroduction") {
        configToSave.loggedIntroduction = {
          ...configToSave.loggedIntroduction,
          ...value
        };
      }

      // 创建新的配置
      const createResult = await setSetting(CONFIG_KEYS.MINIPROGRAM, configToSave);
      if (createResult.success) {
        return {
          success: true,
          message: `小程序配置创建成功并更新了 ${path} 字段`
        };
      } else {
        return {
          success: false,
          message: `创建小程序配置失败: ${createResult.message}`
        };
      }
    }
  } catch (error) {
    console.error("局部更新小程序配置失败:", error);
    return {
      success: false,
      message: `更新失败: ${error.message}`
    };
  }
}
