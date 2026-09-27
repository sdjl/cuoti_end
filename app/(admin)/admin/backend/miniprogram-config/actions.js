"use server";

import { deleteFile, getFileURL, uploadFile } from "../../../../../lib/common/file.js";
import { DISPLAY_TEXT } from "../../../../../lib/config/constants.js";
import { getMiniprogramConfigFromDB, saveMiniprogramConfigToDB, updateMiniprogramConfigField } from "./datas.js";
import { DEFAULT_MINIPROGRAM_CONFIG } from "./types.js";


async function validateImageFile(file, validationConfig) {
  if (!file) {
    return {
      success: false,
      message: "未选择文件"
    };
  }

  // 验证文件类型
  const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
  if (!allowedTypes.includes(file.type)) {
    return {
      success: false,
      message: "不支持的文件类型，请上传 JPEG、PNG 或 WebP 格式的图片"
    };
  }

  // 验证文件大小（根据配置）
  const maxSize = validationConfig.maxSizeKB * 1024; // 转换为字节
  if (file.size > maxSize) {
    return {
      success: false,
      message: `文件大小不能超过${validationConfig.maxSizeKB}KB`
    };
  }
  return {
    success: true
  };
}


async function uploadFileToCloud(file, cloudPath) {
  try {
    // 将文件转换为Buffer
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    // 上传文件到云存储
    const uploadResult = await uploadFile(cloudPath, fileBuffer);
    if (!uploadResult.fileID) {
      return {
        success: false,
        message: "文件上传失败"
      };
    }

    // 获取文件访问URL
    const fileURL = await getFileURL(uploadResult.fileID, true);
    if (!fileURL) {
      return {
        success: false,
        message: "获取文件URL失败"
      };
    }
    return {
      success: true,
      fileID: uploadResult.fileID,
      fileURL: fileURL
    };
  } catch (error) {
    return {
      success: false,
      message: `文件上传失败: ${error.message}`
    };
  }
}


async function uploadImageFile(formData, config) {
  try {
    const file = formData.get("file");

    // 验证文件
    const validation = await validateImageFile(file, config.validation);
    if (!validation.success) {
      return {
        success: false,
        message: validation.message
      };
    }

    // 获取当前配置，确定新版本号
    const currentConfig = await getMiniprogramConfigFromDB();
    let currentVersion = 0;
    let currentFileId;
    if (config.configKey === "contacts") {
      currentVersion = currentConfig?.contacts?.qrcodeVersion || 0;
      currentFileId = currentConfig?.contacts?.qrcodeFileId;
    } else if (config.configKey === "systemLogo") {
      currentVersion = currentConfig?.systemLogo?.logoVersion || 0;
      currentFileId = currentConfig?.systemLogo?.logoFileId;
    }
    const newVersion = currentVersion + 1;

    // 获取文件扩展名
    const fileExtension = file.name.split(".").pop() || "jpg";

    // 生产环境需要在文件名前加prod-前缀
    const isProduction = process.env.NODE_ENV === "production";
    const prodPrefix = isProduction ? "prod-" : "";

    // 构建云存储路径
    const cloudPath = `cuoti/miniprogram/config/${prodPrefix}${config.pathPrefix}-${newVersion}.${fileExtension}`;

    // 上传文件到云存储
    const uploadResult = await uploadFileToCloud(file, cloudPath);
    if (!uploadResult.success) {
      return {
        success: false,
        message: uploadResult.message
      };
    }

    // 删除旧版本图片（如果存在）
    if (currentVersion > 0 && currentFileId) {
      await deleteFile([currentFileId]);
    }

    // 更新配置到数据库 - 使用局部更新，只更新对应的字段
    let updateResult;

    // 根据配置类型构建要更新的字段值
    if (config.configKey === "contacts") {
      const contactsData = {
        qrcodeUrl: uploadResult.fileURL,
        qrcodeVersion: newVersion,
        qrcodeFileId: uploadResult.fileID
      };
      updateResult = await updateMiniprogramConfigField("contacts", contactsData);
    } else if (config.configKey === "systemLogo") {
      const systemLogoData = {
        logoUrl: uploadResult.fileURL,
        logoVersion: newVersion,
        logoFileId: uploadResult.fileID
      };
      updateResult = await updateMiniprogramConfigField("systemLogo", systemLogoData);
    } else {
      return {
        success: false,
        message: "未知的配置类型"
      };
    }
    if (!updateResult.success) {
      return {
        success: false,
        message: `保存配置失败: ${updateResult.message}`
      };
    }
    return {
      success: true,
      data: {
        url: uploadResult.fileURL,
        version: newVersion,
        cloudPath: cloudPath
      },
      message: config.successMessage
    };
  } catch (error) {
    console.error(`上传${config.logPrefix}失败:`, error);
    return {
      success: false,
      message: `上传失败: ${error.message}`
    };
  }
}


export async function getMiniprogramConfig() {
  try {
    const config = await getMiniprogramConfigFromDB();
    if (config) {
      return {
        success: true,
        data: config
      };
    } else {
      // 如果没有配置，返回默认值
      return {
        success: true,
        data: DEFAULT_MINIPROGRAM_CONFIG
      };
    }
  } catch (error) {
    console.error("获取小程序配置失败:", error);
    return {
      success: false,
      message: `获取失败: ${error.message}`
    };
  }
}

/**
 * 验证AI模板中的参数
 */
function validateTemplateParameters(template, requiredParameters) {
  const missingParameters = requiredParameters.filter(param => !template.includes(`\${${param}}`));
  return {
    valid: missingParameters.length === 0,
    missingParameters
  };
}


export async function updateMiniprogramConfig(config) {
  try {
    // 验证新生口述核心知识点中的解题思路对比AI提示词模板
    if (config.newbieQuiz?.solutionComparisonPromptTemplate) {
      const requiredParams = ["parseText", "studentContents"];
      const validation = validateTemplateParameters(config.newbieQuiz.solutionComparisonPromptTemplate, requiredParams);
      if (!validation.valid) {
        return {
          success: false,
          message: `解题思路对比AI提示词模板缺少必要参数：${validation.missingParameters.map(p => `\${${p}}`).join("、")}`
        };
      }
    }
    const result = await saveMiniprogramConfigToDB(config);
    return {
      success: result.success,
      message: result.success ? "小程序配置更新成功" : result.message
    };
  } catch (error) {
    console.error("更新小程序配置失败:", error);
    return {
      success: false,
      message: `更新失败: ${error.message}`
    };
  }
}


export async function updateCopywritingConfig(copywritingData) {
  try {
    const result = await updateMiniprogramConfigField("copywriting", copywritingData);
    return {
      success: result.success,
      message: result.success ? "文案配置保存成功" : result.message
    };
  } catch (error) {
    console.error("更新文案配置失败:", error);
    return {
      success: false,
      message: `保存失败: ${error.message}`
    };
  }
}


export async function updateAiMistakePracticeConfig(aiMistakePracticeData) {
  try {
    const result = await updateMiniprogramConfigField("aiMistakePractice", aiMistakePracticeData);
    return {
      success: result.success,
      message: result.success ? `AI${DISPLAY_TEXT.COURSE_MISTAKE}配置保存成功` : result.message
    };
  } catch (error) {
    console.error(`更新AI${DISPLAY_TEXT.COURSE_MISTAKE}配置失败:`, error);
    return {
      success: false,
      message: `保存失败: ${error.message}`
    };
  }
}


export async function updateAiProblemConfig(aiProblemData) {
  try {
    const result = await updateMiniprogramConfigField("aiProblem", aiProblemData);
    return {
      success: result.success,
      message: result.success ? `${DISPLAY_TEXT.SELF_UPLOAD_MISTAKE}配置保存成功` : result.message
    };
  } catch (error) {
    console.error(`更新${DISPLAY_TEXT.SELF_UPLOAD_MISTAKE}配置失败:`, error);
    return {
      success: false,
      message: `保存失败: ${error.message}`
    };
  }
}


export async function uploadContactQRCode(formData) {
  const result = await uploadImageFile(formData, {
    configKey: "contacts",
    pathPrefix: "contact-qrcode",
    logPrefix: "图片",
    successMessage: "图片上传成功",
    validation: {
      maxSizeKB: 100 // 联系方式二维码最大100KB
    }
  });
  if (!result.success) {
    return {
      success: false,
      message: result.message
    };
  }
  return {
    success: true,
    data: {
      qrcodeUrl: result.data.url,
      qrcodeVersion: result.data.version,
      cloudPath: result.data.cloudPath
    },
    message: result.message
  };
}


export async function updateUnloggedIntroductionConfig(unloggedIntroductionData) {
  try {
    const result = await updateMiniprogramConfigField("unloggedIntroduction", unloggedIntroductionData);
    return {
      success: result.success,
      message: result.success ? "未登录介绍配置保存成功" : result.message
    };
  } catch (error) {
    console.error("更新未登录介绍配置失败:", error);
    return {
      success: false,
      message: `保存失败: ${error.message}`
    };
  }
}


export async function updateLoggedIntroductionConfig(loggedIntroductionData) {
  try {
    const result = await updateMiniprogramConfigField("loggedIntroduction", loggedIntroductionData);
    return {
      success: result.success,
      message: result.success ? "已登录介绍配置保存成功" : result.message
    };
  } catch (error) {
    console.error("更新已登录介绍配置失败:", error);
    return {
      success: false,
      message: `保存失败: ${error.message}`
    };
  }
}


export async function uploadSystemLogo(formData) {
  const result = await uploadImageFile(formData, {
    configKey: "systemLogo",
    pathPrefix: "system-logo",
    logPrefix: "Logo",
    successMessage: "Logo上传成功",
    validation: {
      maxSizeKB: 200 // 系统Logo最大200KB
    }
  });
  if (!result.success) {
    return {
      success: false,
      message: result.message
    };
  }
  return {
    success: true,
    data: {
      logoUrl: result.data.url,
      logoVersion: result.data.version,
      cloudPath: result.data.cloudPath
    },
    message: result.message
  };
}

/**
 * 获取解题思路对比AI提示词模板默认值
 */
export async function getSolutionComparisonTemplateDefault() {
  return `下面这个是已知的题目解题思路：\${parseText}

下面是学生发送的解题思路描述：\${studentContents}

请你判断两个解题思路是否大概一致。

注意，已知解题思路是我们已知的正确答案，不是学生给出的答案，你的目的是比较学生给出的答案与我们已知的答案是否相同。

这里说的相同，并不是要求内容完全相同，而是解题思路相同，不需要细节相同，只要解题思路大方向上相同就可以回复"解题思路相同"，否则请回复"不相同"。

下面这个规则是优先级最高、最重要，绝对不可以打破的规则：你的回复内容必须是"解题思路相同"或"不相同"这两种情况中的一种，你不可以回复其他任何内容。`;
}
