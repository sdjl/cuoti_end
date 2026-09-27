"use server";

import { CONFIG_KEYS } from "../../../../../../lib/config/constants.js";
import { getSetting, setSetting, updateSetting } from "../../../../../../lib/utils/setting.js";
import { DEFAULT_MARKETING_CONFIG } from "./types.js";


export async function getMarketingConfigFromDB() {
  try {
    const settings = await getSetting(CONFIG_KEYS.MARKETING_CONFIG);
    return settings[CONFIG_KEYS.MARKETING_CONFIG] || null;
  } catch (error) {
    console.error("从数据库获取营销配置失败:", error);
    return null;
  }
}


export async function saveMarketingConfigToDB(config) {
  try {
    const result = await setSetting(CONFIG_KEYS.MARKETING_CONFIG, config);
    return {
      success: result.success,
      message: result.message
    };
  } catch (error) {
    console.error("保存营销配置到数据库失败:", error);
    return {
      success: false,
      message: `保存失败: ${error.message}`
    };
  }
}


export async function updateMarketingConfigField(path, value) {
  try {
    // 先查询数据库，检查配置是否存在
    const existingConfig = await getMarketingConfigFromDB();
    if (existingConfig) {
      // 配置已存在，使用 updateSetting 进行局部更新
      const result = await updateSetting(CONFIG_KEYS.MARKETING_CONFIG, path, value);
      return result;
    } else {
      // 配置不存在，创建默认配置并设置对应字段
      const configToSave = {
        ...DEFAULT_MARKETING_CONFIG
      };

      // 根据路径设置对应的值
      if (path === "invitationCode.student") {
        if (configToSave.invitationCode) {
          configToSave.invitationCode.student = {
            ...configToSave.invitationCode.student,
            ...value
          };
        }
      } else if (path === "invitationCode.partner") {
        if (configToSave.invitationCode) {
          configToSave.invitationCode.partner = {
            ...configToSave.invitationCode.partner,
            ...value
          };
        }
      } else if (path === "invitationCode.onetime") {
        if (configToSave.invitationCode) {
          configToSave.invitationCode.onetime = {
            ...configToSave.invitationCode.onetime,
            ...value
          };
        }
      }

      // 创建新的配置
      const createResult = await setSetting(CONFIG_KEYS.MARKETING_CONFIG, configToSave);
      if (createResult.success) {
        return {
          success: true,
          message: `营销配置创建成功并更新了 ${path} 字段`
        };
      } else {
        return {
          success: false,
          message: `创建营销配置失败: ${createResult.message}`
        };
      }
    }
  } catch (error) {
    console.error("局部更新营销配置失败:", error);
    return {
      success: false,
      message: `更新失败: ${error.message}`
    };
  }
}
