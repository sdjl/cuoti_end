"use server";

/**
 * 错误归因统计组件的 Server Actions
 *
 * 用于组件：
 * - app/(work)/work/dashboard/student/components/MistakePointsChart.tsx
 *
 * 功能：
 * - 统计学生某个科目的错误归因分布情况
 * - 计算每个错误归因的出现次数和占比
 * - 按次数降序排列
 *
 * 数据来源：
 * - MistakePointQuestionDoc: 错误归因与题目、学生关联统计
 * - MistakePointDoc: 错误归因基础信息（名称、描述等）
 */
import { getMistakePointsByIds, getStudentMistakePointQuestions } from "../datas.js";

export async function getMistakePointsDataAction(studentId, subject) {
  try {
    // 1. 获取学生在该科目下的所有错误归因关联记录
    const mistakePointQuestions = await getStudentMistakePointQuestions(studentId, subject);
    if (mistakePointQuestions.length === 0) {
      return {
        success: true,
        data: []
      };
    }

    // 2. 统计每个错误归因的出现次数
    const mistakePointCountMap = new Map();
    for (const mpq of mistakePointQuestions) {
      const count = mistakePointCountMap.get(mpq.mistakePointId) || 0;
      mistakePointCountMap.set(mpq.mistakePointId, count + 1);
    }

    // 3. 获取所有错误归因的详细信息
    const mistakePointIds = Array.from(mistakePointCountMap.keys());
    const mistakePoints = await getMistakePointsByIds(mistakePointIds);

    // 创建错误归因映射
    const mistakePointsMap = new Map(mistakePoints.map(mp => [mp._id, mp]));

    // 4. 计算总次数
    const totalCount = mistakePointQuestions.length;

    // 5. 生成统计数据
    const mistakePointStats = [];
    for (const [mistakePointId, count] of mistakePointCountMap.entries()) {
      const mistakePoint = mistakePointsMap.get(mistakePointId);
      if (!mistakePoint) continue;
      const percentage = Math.round(count / totalCount * 100);
      mistakePointStats.push({
        name: mistakePoint.name,
        count,
        percentage
      });
    }

    // 6. 按次数降序排列
    mistakePointStats.sort((a, b) => b.count - a.count);
    return {
      success: true,
      data: mistakePointStats
    };
  } catch (error) {
    console.error("获取错误归因统计数据失败:", error);
    return {
      success: false,
      data: []
    };
  }
}
