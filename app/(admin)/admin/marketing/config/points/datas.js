"use server";

import { command } from "../../../../../../lib/common/database.js";
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



export async function updateMarketingConfigFieldWithRemove(path, value, shouldRemove = false) {
  try {
    const _ = command();

    // 如果需要删除字段，使用 _.remove()
    const actualValue = shouldRemove ? _.remove() : value;

    // 先查询数据库，检查配置是否存在
    const existingConfig = await getMarketingConfigFromDB();
    if (existingConfig) {
      // 配置已存在，使用 updateSetting 进行局部更新
      const result = await updateSetting(CONFIG_KEYS.MARKETING_CONFIG, path, actualValue);
      return result;
    } else {
      // 配置不存在时，不允许删除操作
      if (shouldRemove) {
        return {
          success: false,
          message: "配置不存在，无法删除字段"
        };
      }

      // 配置不存在，创建默认配置并设置对应字段
      const configToSave = {
        ...DEFAULT_MARKETING_CONFIG
      };

      // 根据路径设置对应的值
      if (path === "pointsSystem.invitation") {
        if (configToSave.pointsSystem) {
          configToSave.pointsSystem.invitation = {
            ...configToSave.pointsSystem.invitation,
            ...value
          };
        }
      } else if (path === "pointsSystem.sharing") {
        if (configToSave.pointsSystem) {
          configToSave.pointsSystem.sharing = {
            ...configToSave.pointsSystem.sharing,
            ...value
          };
        }
      } else if (path === "pointsSystem.personalMistake") {
        if (configToSave.pointsSystem) {
          configToSave.pointsSystem.personalMistake = {
            ...configToSave.pointsSystem.personalMistake,
            ...value
          };
        }
      } else if (path === "pointsSystem.lottery") {
        if (configToSave.pointsSystem) {
          configToSave.pointsSystem.lottery = {
            ...configToSave.pointsSystem.lottery,
            ...value
          };
        }
      } else if (path === "pointsSystem.exchange") {
        if (configToSave.pointsSystem) {
          configToSave.pointsSystem.exchange = {
            ...configToSave.pointsSystem.exchange,
            ...value
          };
        }
      } else if (path === "pointsSystem.honor") {
        if (configToSave.pointsSystem) {
          configToSave.pointsSystem.honor = {
            ...configToSave.pointsSystem.honor,
            ...value
          };
        }
      } else if (path === "pointsSystem") {
        configToSave.pointsSystem = {
          invitation: configToSave.pointsSystem?.invitation || {
            pointsPerUse: 10
          },
          sharing: configToSave.pointsSystem?.sharing || {
            pointsPerShare: 5,
            dailyLimit: 50,
            cooldownDays: 1,
            sameWechatLimit: 100,
            shareDays: 7
          },
          personalMistake: configToSave.pointsSystem?.personalMistake || {
            pointsPerUpload: 2,
            dailyLimit: 20
          },
          lottery: configToSave.pointsSystem?.lottery || {
            enabled: false,
            pointsPerDraw: 10,
            prizes: []
          },
          exchange: configToSave.pointsSystem?.exchange || {
            enabled: false,
            items: []
          },
          honor: configToSave.pointsSystem?.honor || {
            enabled: false,
            honors: []
          },
          ...value
        };
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
      if (path === "pointsSystem.invitation") {
        if (configToSave.pointsSystem) {
          configToSave.pointsSystem.invitation = {
            ...configToSave.pointsSystem.invitation,
            ...value
          };
        }
      } else if (path === "pointsSystem.sharing") {
        if (configToSave.pointsSystem) {
          configToSave.pointsSystem.sharing = {
            ...configToSave.pointsSystem.sharing,
            ...value
          };
        }
      } else if (path === "pointsSystem.personalMistake") {
        if (configToSave.pointsSystem) {
          configToSave.pointsSystem.personalMistake = {
            ...configToSave.pointsSystem.personalMistake,
            ...value
          };
        }
      } else if (path === "pointsSystem.lottery") {
        if (configToSave.pointsSystem) {
          configToSave.pointsSystem.lottery = {
            ...configToSave.pointsSystem.lottery,
            ...value
          };
        }
      } else if (path === "pointsSystem.exchange") {
        if (configToSave.pointsSystem) {
          configToSave.pointsSystem.exchange = {
            ...configToSave.pointsSystem.exchange,
            ...value
          };
        }
      } else if (path === "pointsSystem.honor") {
        if (configToSave.pointsSystem) {
          configToSave.pointsSystem.honor = {
            ...configToSave.pointsSystem.honor,
            ...value
          };
        }
      } else if (path === "pointsSystem") {
        configToSave.pointsSystem = {
          invitation: configToSave.pointsSystem?.invitation || {
            pointsPerUse: 10
          },
          sharing: configToSave.pointsSystem?.sharing || {
            pointsPerShare: 5,
            dailyLimit: 50,
            cooldownDays: 1,
            sameWechatLimit: 100,
            shareDays: 7
          },
          personalMistake: configToSave.pointsSystem?.personalMistake || {
            pointsPerUpload: 2,
            dailyLimit: 20
          },
          lottery: configToSave.pointsSystem?.lottery || {
            enabled: false,
            pointsPerDraw: 10,
            prizes: []
          },
          exchange: configToSave.pointsSystem?.exchange || {
            enabled: false,
            items: []
          },
          honor: configToSave.pointsSystem?.honor || {
            enabled: false,
            honors: []
          },
          ...value
        };
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
