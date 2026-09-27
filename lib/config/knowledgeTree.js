"use server";

import { getSetting } from "../utils/setting.js";

// 知识树配置的键名前缀
const KNOWLEDGE_TREE_KEY_PREFIX = "knowledge_tree_";

// 知识点统计配置的键名
const KNOWLEDGE_STATS_CONFIG_KEY = "knowledge_stats_config";


export async function getKnowledgeTreeConfig(subject) {
  try {
    const key = `${KNOWLEDGE_TREE_KEY_PREFIX}${subject}`;
    const settings = await getSetting(key);
    return settings[key] || null;
  } catch (error) {
    console.error(`获取${subject}知识树配置失败:`, error);
    return null;
  }
}


function getAllKnowledgePointNames(nodes, onlyLeaves = true) {
  const result = [];

  // 递归遍历知识点树
  const traverse = node => {
    // 如果节点没有子节点，或者不仅返回叶子节点，则添加当前节点
    if (!node.children || !node.children.length || !onlyLeaves) {
      result.push(node.name);
    }

    // 递归遍历子节点
    if (node.children && node.children.length > 0) {
      node.children.forEach(traverse);
    }
  };

  // 遍历所有根节点
  nodes.forEach(traverse);
  return result;
}


export async function getSubjectKnowledgePoints(subject, includeNonLeaves = false) {
  try {
    // 获取知识树配置
    const config = await getKnowledgeTreeConfig(subject);

    // 如果配置不存在，返回空数组
    if (!config) {
      console.warn(`未找到学科 ${subject} 的知识树配置`);
      return [];
    }

    // 获取所有知识点名称
    const knowledgePoints = getAllKnowledgePointNames(config.nodes, !includeNonLeaves);
    return knowledgePoints;
  } catch (error) {
    console.error(`获取学科 ${subject} 知识点失败:`, error);
    return [];
  }
}


export async function getKnowledgeStatsConfig() {
  // 设置默认配置
  const defaultConfig = {
    masteryThreshold: 90,
    partialMasteryThreshold: 70
  };
  try {
    // 尝试从系统设置中获取知识点统计配置
    const settings = await getSetting(KNOWLEDGE_STATS_CONFIG_KEY);
    const config = settings[KNOWLEDGE_STATS_CONFIG_KEY];

    // 如果配置存在且为对象类型，则使用配置中的阈值
    if (config && typeof config === "object") {
      const statsConfig = config;
      return {
        masteryThreshold: statsConfig.masteryThreshold || defaultConfig.masteryThreshold,
        partialMasteryThreshold: statsConfig.partialMasteryThreshold || defaultConfig.partialMasteryThreshold
      };
    }
  } catch (error) {
    // 如果获取配置失败，记录警告并使用默认值
    console.warn("获取知识点统计配置失败，使用默认值:", error);
  }
  return defaultConfig;
}


export async function getDifficultyValue(difficulty) {
  switch (difficulty) {
    case "容易":
      return 1;
    case "中等":
      return 2;
    case "困难":
      return 3;
    case "超难":
      return 4;
    default:
      return 2;
    // 未知难度默认为中等难度
  }
}
