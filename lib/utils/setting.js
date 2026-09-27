"use server";

import { addDoc, allDocs, command, getOne, setDoc, updateDoc } from "../common/database.js";

// 系统配置的集合名称
const COLLECTION_NAME = "setting";


export async function getSetting(keys) {
  try {
    const _ = command();
    const keyArray = Array.isArray(keys) ? keys : [keys];

    // 查询指定键的设置数据
    const settingDocs = await allDocs({
      c: COLLECTION_NAME,
      match: {
        key: _.in(keyArray)
      }
    });

    // 构建结果对象
    const result = {};

    // 处理查询结果
    for (const doc of settingDocs) {
      result[doc.key] = doc.value;
    }
    return result;
  } catch (error) {
    console.error("获取设置失败:", error);
    return {};
  }
}


export async function addSetting(key, value) {
  try {
    // 检查设置是否已存在
    const existingSettings = await getSetting(key);
    if (existingSettings[key]) {
      return {
        success: false,
        message: `设置 ${key} 已存在，请使用 setSetting 更新`
      };
    }

    // 添加新设置
    const docId = await addDoc(COLLECTION_NAME, {
      key,
      value
    });
    return {
      success: true,
      message: `设置 ${key} 添加成功`,
      docId
    };
  } catch (error) {
    console.error(`添加设置 ${key} 失败:`, error);
    return {
      success: false,
      message: `添加失败: ${error.message}`
    };
  }
}


export async function setSetting(key, value, docId) {
  try {
    let settingDocId = docId;

    // 如果没有提供文档ID，则尝试查找
    if (!settingDocId) {
      const existingDoc = await getOne(COLLECTION_NAME, {
        key
      });
      if (existingDoc) {
        settingDocId = existingDoc._id;
      }
    }

    // 如果找到了文档，则完全替换
    if (settingDocId) {
      await setDoc(COLLECTION_NAME, settingDocId, {
        key,
        value
      });
      return {
        success: true,
        message: `设置 ${key} 更新成功`,
        docId: settingDocId
      };
    } else {
      // 如果没有找到文档，则添加
      return addSetting(key, value);
    }
  } catch (error) {
    console.error(`更新设置 ${key} 失败:`, error);
    return {
      success: false,
      message: `更新失败: ${error.message}`
    };
  }
}


export async function updateSetting(key, path, value) {
  try {
    // 查找现有文档
    const existingDoc = await getOne(COLLECTION_NAME, {
      key
    });
    if (!existingDoc) {
      return {
        success: false,
        message: `设置 ${key} 不存在，请先使用 setSetting 创建`
      };
    }
    const settingDocId = existingDoc._id;

    // 使用 updateDoc 进行局部更新
    const updateSuccess = await updateDoc(COLLECTION_NAME, settingDocId, {
      [`value.${path}`]: value
    });
    if (updateSuccess) {
      return {
        success: true,
        message: `设置 ${key}.${path} 更新成功`,
        docId: settingDocId
      };
    } else {
      return {
        success: false,
        message: `设置 ${key}.${path} 更新失败`
      };
    }
  } catch (error) {
    console.error(`局部更新设置 ${key}.${path} 失败:`, error);
    return {
      success: false,
      message: `更新失败: ${error.message}`
    };
  }
}
