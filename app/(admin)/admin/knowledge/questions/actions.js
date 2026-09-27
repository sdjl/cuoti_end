"use server";

import { getKnowledgeTreeConfig } from "../../../../../lib/config/knowledgeTree.js";
import { getSetting } from "../../../../../lib/utils/setting.js";
import { getQuestionsByKnowledgePointFromDB, getQuestionsCountByKnowledgePointFromDB } from "./datas.js";

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

    // 初始化结果
    const configs = {};

    // 处理配置数据
    subjects.forEach(subject => {
      const key = `${KNOWLEDGE_TREE_KEY_PREFIX}${subject}`;
      configs[subject] = settings[key] || null;
    });
    return {
      configs
    };
  } catch (error) {
    console.error("获取所有知识树配置失败:", error);
    return {
      configs: {}
    };
  }
}


export async function getQuestionsByKnowledgePoint(knowledgePoint, pageNum = 1, pageSize = 20) {
  try {
    // 获取题目列表
    const questionList = await getQuestionsByKnowledgePointFromDB(knowledgePoint, pageNum, pageSize);

    // 获取总数
    const total = await getQuestionsCountByKnowledgePointFromDB(knowledgePoint);
    return {
      questions: questionList,
      total
    };
  } catch (error) {
    console.error(`查询知识点 ${knowledgePoint || "所有"} 的题目失败:`, error);
    return {
      questions: [],
      total: 0
    };
  }
}
