"use server";

/**
 * 知识点树组件的 Server Actions
 *
 * 用于 app/(work)/work/dashboard/student/components/KnowledgePointTree.tsx 组件
 *
 * 此文件专门用于处理 KnowledgePointTree 组件所需的数据
 * 计算学生在某个科目下的知识点错题情况
 * 注意，此页面不计算知识点的掌握率，只计算错题统计情况，进度条表示有多少错题已经过关
 *
 * 重要说明：
 * - 此页面不统计个人自主上传错题的数据，只统计课程错题
 * - 因为跳转后的页面只显示课程错题，所以这里只能统计课程错题
 *
 * 计算规则：
 * 1. 裁剪知识树，只显示有错题的节点（totalCount > 0）
 * 2. 计算每个节点的错题数量（totalCount，不包含自主上传错题 ProblemQuestion）
 * 3. 计算已过关数量（masteredCount，isCorrectedByMistakeAgain=true）
 * 4. 计算未过关数量（notMasteredCount = totalCount - masteredCount）
 * 5. 计算顽固错题数量（stubbornCount，hasResubmittedAnswer=true 且 isCorrectedByMistakeAgain=false）
 * 6. 只有叶子节点才是真正的知识点
 * 7. 非叶子节点的统计数据是其所有子节点的累加
 */
import { getKnowledgeTreeConfig } from "../../../../../../lib/config/knowledgeTree.js";
import { getQuestionPacksByIds, getQuestionsByIds, getStudentAllAnswers, getStudentAnswerItemsByAnswerIds } from "../datas.js";

export async function getStudentKnowledgeTreeData(studentId, subject) {
  try {
    // 1. 获取知识树配置
    const knowledgeTreeConfig = await getKnowledgeTreeConfig(subject);
    if (!knowledgeTreeConfig || !knowledgeTreeConfig.nodes || knowledgeTreeConfig.nodes.length === 0) {
      return {
        success: true,
        data: []
      };
    }
    const knowledgeTree = knowledgeTreeConfig.nodes;

    // 2. 获取学生的所有答卷记录
    const allStudentAnswers = await getStudentAllAnswers(studentId);
    if (allStudentAnswers.length === 0) {
      // 没有答卷记录，返回空数组（裁剪后没有任何节点）
      return {
        success: true,
        data: []
      };
    }

    // 3. 获取所有题目集合的ID
    const questionPackIds = [...new Set(allStudentAnswers.map(answer => answer.questionPackId))];

    // 4. 一次性查询所有题目集合
    const questionPacks = await getQuestionPacksByIds(questionPackIds);

    // 5. 创建题目集合映射，方便查找
    const questionPacksMap = new Map(questionPacks.map(pack => [pack._id, pack]));

    // 6. 过滤出该科目的答卷
    const studentAnswers = allStudentAnswers.filter(answer => {
      const pack = questionPacksMap.get(answer.questionPackId);
      return pack && pack.subject === subject;
    });
    if (studentAnswers.length === 0) {
      // 没有该科目的答卷记录，返回空数组（裁剪后没有任何节点）
      return {
        success: true,
        data: []
      };
    }

    // 7. 获取所有答卷的错题记录（StudentAnswerItemDoc）
    // 注意：这里只包含课程答卷的错题，不包含 ProblemQuestion（自主上传错题）
    const answerIds = studentAnswers.map(answer => answer._id);
    const wrongItems = await getStudentAnswerItemsByAnswerIds(answerIds);

    // 8. 获取所有相关题目的信息
    const allQuestionIds = new Set();
    // 从错题记录中获取题目ID
    for (const item of wrongItems) {
      allQuestionIds.add(item.questionId);
    }
    const questions = await getQuestionsByIds(Array.from(allQuestionIds));

    // 9. 构建知识点统计数据映射
    // 只统计叶子节点（真正的知识点）的数据
    const knowledgePointStatsMap = new Map();

    // 10. 统计每个知识点的错题情况
    for (const item of wrongItems) {
      const question = questions.find(q => q._id === item.questionId);
      if (!question || !question.knowledgePoints) continue;

      // 判断是否已过关：isCorrectedByMistakeAgain=true 表示通过错题本练习做对了
      const isMastered = item.isCorrectedByMistakeAgain === true;

      // 判断是否是顽固错题：已经重新提交过答案，但还是错的
      // 注意：isCorrectedByMistakeAgain 是可选字段，undefined 表示没有对这道题进行课程错题，
      // false 表示开启了课程错题但还没有做对，true 表示做对了。
      // 所以只要 hasResubmittedAnswer=true 且 isCorrectedByMistakeAgain 不为 true，就是顽固错题
      const isStubborn = item.hasResubmittedAnswer === true && item.isCorrectedByMistakeAgain !== true;

      // 为每个知识点累加统计
      for (const kp of question.knowledgePoints) {
        if (!kp) continue;
        if (!knowledgePointStatsMap.has(kp)) {
          knowledgePointStatsMap.set(kp, {
            totalCount: 0,
            masteredCount: 0,
            stubbornCount: 0
          });
        }
        const stats = knowledgePointStatsMap.get(kp);
        stats.totalCount++; // 总错题数+1

        if (isMastered) {
          stats.masteredCount++; // 已过关数+1
        }
        if (isStubborn) {
          stats.stubbornCount++; // 顽固错题数+1
        }
      }
    }

    // 11. 将知识树转换为组件所需的数据结构
    // 递归处理，从叶子节点向上累加统计数据
    // 裁剪：只保留 totalCount > 0 的节点
    const convertTreeToStats = (nodes, level) => {
      const result = [];
      for (const node of nodes) {
        const isLeaf = !node.children || node.children.length === 0;
        if (isLeaf) {
          // 叶子节点：这是真正的知识点
          const stats = knowledgePointStatsMap.get(node.name);

          // 裁剪：只保留有错题的知识点（totalCount > 0）
          if (!stats || stats.totalCount === 0) {
            continue; // 跳过没有错题的知识点
          }

          // 有数据的知识点
          result.push({
            name: node.name,
            level,
            totalCount: stats.totalCount,
            masteredCount: stats.masteredCount,
            notMasteredCount: stats.totalCount - stats.masteredCount,
            stubbornCount: stats.stubbornCount
          });
        } else {
          // 非叶子节点：这是分类节点，需要累加所有子节点的数据
          const children = convertTreeToStats(node.children || [], level + 1);

          // 裁剪：如果所有子节点都被裁剪了，这个父节点也不显示
          if (children.length === 0) {
            continue;
          }

          // 统计子节点的数据（累加）
          const totalCount = children.reduce((sum, child) => sum + child.totalCount, 0);
          const masteredCount = children.reduce((sum, child) => sum + child.masteredCount, 0);
          const notMasteredCount = children.reduce((sum, child) => sum + child.notMasteredCount, 0);
          const stubbornCount = children.reduce((sum, child) => sum + child.stubbornCount, 0);
          result.push({
            name: node.name,
            level,
            totalCount,
            masteredCount,
            notMasteredCount,
            stubbornCount,
            children
          });
        }
      }
      return result;
    };
    const result = convertTreeToStats(knowledgeTree, 0);
    return {
      success: true,
      data: result
    };
  } catch {
    return {
      success: false,
      data: []
    };
  }
}
