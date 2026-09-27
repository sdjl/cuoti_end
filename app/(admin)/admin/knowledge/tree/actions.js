"use server";

import { getKnowledgeTreeConfig } from "../../../../../lib/config/knowledgeTree.js";
import { getSetting, setSetting } from "../../../../../lib/utils/setting.js";

// 知识树配置的键名前缀
const KNOWLEDGE_TREE_KEY_PREFIX = "knowledge_tree_";

// 导出统一的 getKnowledgeTreeConfig 函数
export { getKnowledgeTreeConfig };


export async function getAllKnowledgeTreeConfigs(subjects) {
  try {
    // 构建所有学科的知识树配置键名
    const keys = subjects.map(subject => `${KNOWLEDGE_TREE_KEY_PREFIX}${subject}`);

    // 查询所有学科的知识树配置
    const settings = await getSetting(keys);

    // 查询文档ID
    const {
      docs
    } = await import("../../../../../lib/common/database");
    const {
      command
    } = await import("../../../../../lib/common/database");
    const _ = command();
    const settingDocs = await docs({
      c: "setting",
      w: {
        key: _.in(keys)
      }
    });

    // 初始化结果
    const configs = {};
    const docIds = {};

    // 处理配置数据
    subjects.forEach(subject => {
      const key = `${KNOWLEDGE_TREE_KEY_PREFIX}${subject}`;
      configs[subject] = settings[key] || null;
    });

    // 处理文档ID
    settingDocs.forEach(doc => {
      if (typeof doc.key === "string" && doc.key.startsWith(KNOWLEDGE_TREE_KEY_PREFIX)) {
        const subject = doc.key.replace(KNOWLEDGE_TREE_KEY_PREFIX, "");
        docIds[subject] = doc._id;
      }
    });
    return {
      configs,
      docIds
    };
  } catch (error) {
    console.error("获取所有知识树配置失败:", error);
    return {
      configs: {},
      docIds: {}
    };
  }
}


export async function updateKnowledgeTreeConfig(subject, config, docId) {
  try {
    const key = `${KNOWLEDGE_TREE_KEY_PREFIX}${subject}`;

    // 更新配置
    const result = await setSetting(key, config, docId);
    return {
      success: result.success,
      message: result.success ? `${subject}知识树配置更新成功` : result.message
    };
  } catch (error) {
    console.error(`更新${subject}知识树配置失败:`, error);
    return {
      success: false,
      message: `更新失败: ${error.message}`
    };
  }
}


export async function validateImportFormat(text) {
  try {
    const lines = text.split("\n").filter(line => line.trim());

    // 检查是否有内容
    if (lines.length === 0) {
      return {
        success: false,
        message: "导入文件为空，请检查文件内容"
      };
    }

    // 检查每行的缩进是否为2个空格的倍数
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      let spaces = 0;
      while (line[spaces] === " ") {
        spaces++;
      }
      if (spaces % 2 !== 0) {
        return {
          success: false,
          message: `缩进格式错误，请确保每个缩进级别都是2个空格。错误行内容：${line}`,
          errorLine: line
        };
      }

      // 计算当前行的层级（缩进空格数/2 + 1）
      const level = spaces / 2 + 1;

      // 检查是否超过4层
      if (level > 4) {
        return {
          success: false,
          message: `层级超过限制，知识树最多支持4个层级。错误行内容：${line}`,
          errorLine: line
        };
      }
    }
    return {
      success: true,
      message: "验证通过"
    };
  } catch (error) {
    console.error("验证导入格式失败:", error);
    return {
      success: false,
      message: `验证失败: ${error.message}`
    };
  }
}


export async function parseImportedText(text, subject) {
  try {
    // 先验证格式
    const validation = await validateImportFormat(text);
    if (!validation.success) {
      return {
        success: false,
        message: validation.message,
        errorLine: validation.errorLine
      };
    }
    const lines = text.split("\n").filter(line => line.trim());
    const root = [];
    const stack = [];
    lines.forEach(line => {
      // 计算缩进级别（每个缩进是2个空格）
      let indent = 0;
      while (line.startsWith("  ", indent * 2)) {
        indent++;
      }
      const trimmedLine = line.trim();
      if (!trimmedLine) return;
      const newNode = {
        name: trimmedLine,
        level: indent + 1,
        subject,
        children: []
      };
      if (indent === 0) {
        // 顶级节点
        root.push(newNode);
        stack[0] = {
          node: newNode,
          level: 0
        };
      } else {
        // 找到父节点
        while (stack.length > 0 && stack[stack.length - 1].level >= indent) {
          stack.pop();
        }
        if (stack.length > 0) {
          const parent = stack[stack.length - 1].node;
          parent.children = parent.children || [];
          parent.children.push(newNode);
          stack.push({
            node: newNode,
            level: indent
          });
        }
      }
    });
    return {
      success: true,
      message: "解析成功",
      data: root
    };
  } catch (error) {
    console.error("解析导入文本失败:", error);
    return {
      success: false,
      message: `解析失败: ${error.message}`
    };
  }
}

// 知识点节点类型定义
