"use server";

import { deleteFile, getFileURL, uploadFile } from "../../../../../../lib/common/file.js";
import { DISPLAY_TEXT } from "../../../../../../lib/config/constants.js";
import { getMarketingConfigFromDB, saveMarketingConfigToDB, updateMarketingConfigField, updateMarketingConfigFieldWithRemove } from "./datas.js";
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


export async function updateInvitationPointsConfig(invitationPointsData) {
  try {
    const result = await updateMarketingConfigField("pointsSystem.invitation", invitationPointsData);
    return {
      success: result.success,
      message: result.success ? "邀请积分配置保存成功" : result.message
    };
  } catch (error) {
    console.error("更新邀请积分配置失败:", error);
    return {
      success: false,
      message: `保存失败: ${error.message}`
    };
  }
}


export async function updateSharingPointsConfig(sharingPointsData) {
  try {
    const result = await updateMarketingConfigField("pointsSystem.sharing", sharingPointsData);
    return {
      success: result.success,
      message: result.success ? "分享积分配置保存成功" : result.message
    };
  } catch (error) {
    console.error("更新分享积分配置失败:", error);
    return {
      success: false,
      message: `保存失败: ${error.message}`
    };
  }
}


export async function updatePersonalMistakePointsConfig(personalMistakePointsData) {
  try {
    const result = await updateMarketingConfigField("pointsSystem.personalMistake", personalMistakePointsData);
    return {
      success: result.success,
      message: result.success ? `${DISPLAY_TEXT.SELF_UPLOAD_MISTAKE}积分配置保存成功` : result.message
    };
  } catch (error) {
    console.error(`更新${DISPLAY_TEXT.SELF_UPLOAD_MISTAKE}积分配置失败:`, error);
    return {
      success: false,
      message: `保存失败: ${error.message}`
    };
  }
}


export async function updateLotteryPointsConfig(lotteryPointsData) {
  try {
    const result = await updateMarketingConfigField("pointsSystem.lottery", lotteryPointsData);
    return {
      success: result.success,
      message: result.success ? "积分抽奖配置保存成功" : result.message
    };
  } catch (error) {
    console.error("更新积分抽奖配置失败:", error);
    return {
      success: false,
      message: `保存失败: ${error.message}`
    };
  }
}


export async function updateExchangePointsConfig(exchangePointsData) {
  try {
    const result = await updateMarketingConfigField("pointsSystem.exchange", exchangePointsData);
    return {
      success: result.success,
      message: result.success ? "积分兑换配置保存成功" : result.message
    };
  } catch (error) {
    console.error("更新积分兑换配置失败:", error);
    return {
      success: false,
      message: `保存失败: ${error.message}`
    };
  }
}


export async function updateHonorPointsConfig(honorPointsData) {
  try {
    const result = await updateMarketingConfigField("pointsSystem.honor", honorPointsData);
    return {
      success: result.success,
      message: result.success ? "荣誉积分配置保存成功" : result.message
    };
  } catch (error) {
    console.error("更新荣誉积分配置失败:", error);
    return {
      success: false,
      message: `保存失败: ${error.message}`
    };
  }
}


function getFileExtension(filename) {
  return filename.slice(filename.lastIndexOf("."));
}


function validateImageFile(file) {
  // 检查文件类型
  const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      message: "只支持 JPEG、PNG、WebP 格式的图片"
    };
  }

  // 检查文件大小（限制为2MB）
  const maxSize = 2 * 1024 * 1024; // 2MB
  if (file.size > maxSize) {
    return {
      valid: false,
      message: "图片文件大小不能超过2MB"
    };
  }
  return {
    valid: true
  };
}


export async function uploadImage(formData) {
  try {
    const file = formData.get("file");
    if (!file) {
      return {
        success: false,
        message: "没有找到要上传的文件"
      };
    }

    // 验证文件
    const validation = validateImageFile(file);
    if (!validation.valid) {
      return {
        success: false,
        message: validation.message
      };
    }

    // 生成文件路径
    const timestamp = Date.now();
    const extension = getFileExtension(file.name);
    const cloudPath = `cuoti/config/${timestamp}${extension}`;

    // 上传文件
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const uploadResult = await uploadFile(cloudPath, fileBuffer);

    // 获取文件URL
    const imageUrl = await getFileURL(uploadResult.fileID);
    return {
      success: true,
      data: {
        imageFileId: uploadResult.fileID,
        imageUrl: imageUrl,
        imagePath: cloudPath
      },
      message: "图片上传成功"
    };
  } catch (error) {
    console.error("图片上传失败:", error);
    return {
      success: false,
      message: `上传失败: ${error.message}`
    };
  }
}


export async function deleteImage(fileId) {
  try {
    if (!fileId) {
      return {
        success: false,
        message: "文件ID不能为空"
      };
    }
    await deleteFile([fileId]);
    return {
      success: true,
      message: "图片删除成功"
    };
  } catch (error) {
    console.error("图片删除失败:", error);
    return {
      success: false,
      message: `删除失败: ${error.message}`
    };
  }
}


export async function updateLotteryPrizeImage(prizeIndex, imageData) {
  try {
    // 构建更新路径
    const updatePath = `pointsSystem.lottery.prizes.${prizeIndex}.image`;

    // 如果imageData为null，则删除图片字段，否则设置图片数据
    const result = await updateMarketingConfigFieldWithRemove(updatePath, imageData, imageData === null);
    return {
      success: result.success,
      message: result.success ? imageData ? "图片更新成功" : "图片删除成功" : result.message
    };
  } catch (error) {
    console.error("更新奖品图片失败:", error);
    return {
      success: false,
      message: `更新失败: ${error.message}`
    };
  }
}


export async function updateExchangeItemImage(itemIndex, imageData) {
  try {
    // 构建更新路径
    const updatePath = `pointsSystem.exchange.items.${itemIndex}.image`;

    // 如果imageData为null，则删除图片字段，否则设置图片数据
    const result = await updateMarketingConfigFieldWithRemove(updatePath, imageData, imageData === null);
    return {
      success: result.success,
      message: result.success ? imageData ? "图片更新成功" : "图片删除成功" : result.message
    };
  } catch (error) {
    console.error("更新商品图片失败:", error);
    return {
      success: false,
      message: `更新失败: ${error.message}`
    };
  }
}
