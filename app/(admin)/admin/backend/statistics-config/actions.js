"use server";

import { CONFIG_KEYS } from "../../../../../lib/config/constants.js";
import { getSetting, setSetting } from "../../../../../lib/utils/setting.js";


export async function getKnowledgeStatsConfig() {
  try {
    const settings = await getSetting(CONFIG_KEYS.KNOWLEDGE_STATS);
    const config = settings[CONFIG_KEYS.KNOWLEDGE_STATS];
    if (config) {
      return {
        success: true,
        data: config
      };
    } else {
      // 如果没有配置，返回默认值
      return {
        success: true,
        data: {
          masteryThreshold: 90,
          partialMasteryThreshold: 70
        }
      };
    }
  } catch (error) {
    console.error("获取知识点统计配置失败:", error);
    return {
      success: false,
      message: `获取失败: ${error.message}`
    };
  }
}


export async function updateKnowledgeStatsConfig(config) {
  try {
    // 验证数据
    if (config.masteryThreshold <= 0 || config.masteryThreshold > 100 || config.partialMasteryThreshold <= 0 || config.partialMasteryThreshold > 100) {
      return {
        success: false,
        message: "阈值必须在1-100之间"
      };
    }
    if (config.partialMasteryThreshold >= config.masteryThreshold) {
      return {
        success: false,
        message: "部分掌握阈值必须小于完全掌握阈值"
      };
    }
    const result = await setSetting(CONFIG_KEYS.KNOWLEDGE_STATS, config);
    return {
      success: result.success,
      message: result.success ? "知识点统计配置更新成功" : result.message
    };
  } catch (error) {
    console.error("更新知识点统计配置失败:", error);
    return {
      success: false,
      message: `更新失败: ${error.message}`
    };
  }
}
