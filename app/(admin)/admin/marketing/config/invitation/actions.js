"use server";

import { getMarketingConfigFromDB, saveMarketingConfigToDB, updateMarketingConfigField } from "./datas.js";
import { DEFAULT_MARKETING_CONFIG } from "./types.js";


export async function getMarketingConfig() {
  try {
    const config = await getMarketingConfigFromDB();
    if (config) {
      return {
        success: true,
        data: config
      };
    } else {
      // 如果没有配置，返回默认值
      return {
        success: true,
        data: DEFAULT_MARKETING_CONFIG
      };
    }
  } catch (error) {
    console.error("获取营销配置失败:", error);
    return {
      success: false,
      message: `获取失败: ${error.message}`
    };
  }
}


export async function updateMarketingConfig(config) {
  try {
    const result = await saveMarketingConfigToDB(config);
    return {
      success: result.success,
      message: result.success ? "营销配置更新成功" : result.message
    };
  } catch (error) {
    console.error("更新营销配置失败:", error);
    return {
      success: false,
      message: `更新失败: ${error.message}`
    };
  }
}


export async function updateStudentInvitationConfig(studentInvitationData) {
  try {
    const result = await updateMarketingConfigField("invitationCode.student", studentInvitationData);
    return {
      success: result.success,
      message: result.success ? "学生邀请码配置保存成功" : result.message
    };
  } catch (error) {
    console.error("更新学生邀请码配置失败:", error);
    return {
      success: false,
      message: `保存失败: ${error.message}`
    };
  }
}


export async function updatePartnerInvitationConfig(partnerInvitationData) {
  try {
    const result = await updateMarketingConfigField("invitationCode.partner", partnerInvitationData);
    return {
      success: result.success,
      message: result.success ? "合作伙伴邀请码配置保存成功" : result.message
    };
  } catch (error) {
    console.error("更新合作伙伴邀请码配置失败:", error);
    return {
      success: false,
      message: `保存失败: ${error.message}`
    };
  }
}


export async function updateOnetimeInvitationConfig(onetimeInvitationData) {
  try {
    const result = await updateMarketingConfigField("invitationCode.onetime", onetimeInvitationData);
    return {
      success: result.success,
      message: result.success ? "一次性邀请码配置保存成功" : result.message
    };
  } catch (error) {
    console.error("更新一次性邀请码配置失败:", error);
    return {
      success: false,
      message: `保存失败: ${error.message}`
    };
  }
}
