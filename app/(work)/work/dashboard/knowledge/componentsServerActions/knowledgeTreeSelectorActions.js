"use server";

/**
 * 知识树选择器 Server Action
 *
 * 用于 app/(work)/work/dashboard/knowledge/components/KnowledgeTreeSelector.tsx 组件
 */
import { getKnowledgeTreeForDashboard } from "../datas.js";
/**
 * 获取指定科目的知识树结构
 */
export async function getKnowledgeTreeAction(subject) {
  try {
    const tree = await getKnowledgeTreeForDashboard(subject);
    return tree;
  } catch (error) {
    console.error("获取知识树失败:", error);
    return [];
  }
}
