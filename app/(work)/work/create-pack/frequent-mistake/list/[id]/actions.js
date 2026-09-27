"use server";

import { getCurrentSchoolId } from "../../../../../../../lib/work/teacher/mySchool.js";
import { getFrequentMistakePackById, getQuestionDetailsByIds, getTypicalErrorCounts, updateQuestionOrder } from "./datas.js";

export async function getFrequentMistakePackDetail(frequentMistakeId) {
  // 1. 获取当前校园ID
  const schoolId = await getCurrentSchoolId();

  // 2. 获取高频错题集详情
  const pack = await getFrequentMistakePackById(frequentMistakeId);
  if (!pack) {
    return null;
  }

  // 3. 验证该错题集是否属于当前校园
  if (pack.schoolId !== schoolId) {
    throw new Error("无权访问该高频错题集");
  }

  // 4. 获取题目详情和典型错题数量
  const [questions, typicalErrorCounts] = await Promise.all([getQuestionDetailsByIds(pack.questionIds), getTypicalErrorCounts(frequentMistakeId)]);
  return {
    pack,
    questions,
    typicalErrorCounts
  };
}

/**
 * 更新题目顺序
 */
export async function updateQuestionOrderAction(frequentMistakeId, questionIds) {
  try {
    await updateQuestionOrder(frequentMistakeId, questionIds);
    return {
      success: true
    };
  } catch (error) {
    console.error("更新题目顺序失败:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "更新顺序失败"
    };
  }
}
