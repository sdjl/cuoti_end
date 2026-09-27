"use server";

import { CONFIG_KEYS } from "../../../../../lib/config/constants.js";
import { getSetting, setSetting } from "../../../../../lib/utils/setting.js";
import { getConfigDocs } from "./datas.js";


export async function getAllSystemConfigs() {
  try {
    // 使用getSetting函数一次性获取所有配置
    const settings = await getSetting([CONFIG_KEYS.SUBJECTS, CONFIG_KEYS.QUESTION_TYPES, CONFIG_KEYS.REGIONS]);

    // 直接从数据库获取带有_id的配置文档
    const settingDocs = await getConfigDocs();

    // 验证文档数量是否正确
    if (settingDocs.length !== 3) {
      // 找出哪些配置存在，哪些缺失
      const availableKeys = settingDocs.map(doc => doc.key);
      const missingKeys = [CONFIG_KEYS.SUBJECTS, CONFIG_KEYS.QUESTION_TYPES, CONFIG_KEYS.REGIONS].filter(key => !availableKeys.includes(key));

      // 收集可用的配置ID
      const availableConfigIds = {};
      for (const doc of settingDocs) {
        if (typeof doc.key === "string" && doc._id) {
          availableConfigIds[doc.key] = doc._id;
        }
      }
      return {
        success: false,
        errorMessage: `获取的配置文档数量不正确，预期为3个，实际为${settingDocs.length}个`,
        errorDetails: {
          missingConfigs: missingKeys,
          availableConfigIds,
          retrievedDocsCount: settingDocs.length,
          expectedDocsCount: 3
        }
      };
    }

    // 初始化结果
    const result = {
      subjects: settings[CONFIG_KEYS.SUBJECTS] || [],
      questionTypes: settings[CONFIG_KEYS.QUESTION_TYPES] || [],
      regions: settings[CONFIG_KEYS.REGIONS] || [],
      configIds: {}
    };

    // 构建configIds映射
    for (const doc of settingDocs) {
      if (typeof doc.key === "string") {
        result.configIds[doc.key] = doc._id;
      }
    }
    return {
      success: true,
      data: result
    };
  } catch (error) {
    console.error("获取系统配置失败:", error);
    // 出错时返回错误信息
    return {
      success: false,
      errorMessage: `获取系统配置失败: ${error instanceof Error ? error.message : String(error)}`,
      errorDetails: {
        // 没有详细信息，因为捕获到的是一般性错误
      }
    };
  }
}


export async function updateSubjects(subjects, docId) {
  try {
    if (!docId) {
      return {
        success: false,
        message: "无法更新科目配置：未找到配置文档ID"
      };
    }

    // 使用setSetting更新配置
    const result = await setSetting(CONFIG_KEYS.SUBJECTS, subjects, docId);
    return {
      success: result.success,
      message: result.success ? "科目配置更新成功" : result.message
    };
  } catch (error) {
    console.error("更新科目配置失败:", error);
    return {
      success: false,
      message: `更新失败: ${error.message}`
    };
  }
}


export async function updateQuestionTypes(questionTypes, docId) {
  try {
    if (!docId) {
      return {
        success: false,
        message: "无法更新题型配置：未找到配置文档ID"
      };
    }

    // 使用setSetting更新配置
    const result = await setSetting(CONFIG_KEYS.QUESTION_TYPES, questionTypes, docId);
    return {
      success: result.success,
      message: result.success ? "题型配置更新成功" : result.message
    };
  } catch (error) {
    console.error("更新题型配置失败:", error);
    return {
      success: false,
      message: `更新失败: ${error.message}`
    };
  }
}


export async function updateRegions(regions, docId) {
  try {
    if (!docId) {
      return {
        success: false,
        message: "无法更新区域配置：未找到配置文档ID"
      };
    }

    // 使用setSetting更新配置
    const result = await setSetting(CONFIG_KEYS.REGIONS, regions, docId);
    return {
      success: result.success,
      message: result.success ? "区域配置已更新" : result.message
    };
  } catch (error) {
    console.error("更新区域配置失败:", error);
    return {
      success: false,
      message: `更新失败: ${error.message}`
    };
  }
}
