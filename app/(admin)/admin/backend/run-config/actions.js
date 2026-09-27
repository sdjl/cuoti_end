"use server";

import { getSetting, setSetting } from "../../../../../lib/utils/setting.js";

/**
 * 功能配置数据接口
 */

/**
 * 获取功能配置
 */
export async function getRunConfig() {
  try {
    const settings = await getSetting("cutting_service_config");
    const config = {
      cuttingServiceProvider: settings.cutting_service_config?.provider || "tencent" // 默认使用腾讯
    };
    return {
      success: true,
      data: config
    };
  } catch (error) {
    console.error("获取功能配置失败:", error);
    return {
      success: false,
      message: `获取失败: ${error.message}`
    };
  }
}

/**
 * 更新功能配置
 */
export async function updateRunConfig(config) {
  try {
    const cuttingServiceConfig = {
      provider: config.cuttingServiceProvider
    };
    const result = await setSetting("cutting_service_config", cuttingServiceConfig);
    if (!result.success) {
      return {
        success: false,
        message: `配置更新失败: ${result.message}`
      };
    }
    return {
      success: true,
      message: "功能配置更新成功"
    };
  } catch (error) {
    console.error("更新功能配置失败:", error);
    return {
      success: false,
      message: `更新失败: ${error.message}`
    };
  }
}
