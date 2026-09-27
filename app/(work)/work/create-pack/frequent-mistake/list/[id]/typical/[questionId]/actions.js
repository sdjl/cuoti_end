"use server";

import { addTypicalErrors, deleteTypicalError, getAddedTypicalErrors, getAvailableTypicalErrors, updateTypicalErrorsSort } from "./datas.js";
/** 获取可添加的典型错题列表 */
export async function fetchAvailableTypicalErrors(questionId) {
  return await getAvailableTypicalErrors(questionId);
}

/** 获取已添加的典型错题列表 */
export async function fetchAddedTypicalErrors(frequentMistakeId, questionId) {
  return await getAddedTypicalErrors(frequentMistakeId, questionId);
}

/** 添加典型错题 */
export async function addTypicalErrorsAction(frequentMistakeId, questionId, studentAnswerItemIds) {
  try {
    await addTypicalErrors(frequentMistakeId, questionId, studentAnswerItemIds);
    return {
      success: true
    };
  } catch (error) {
    console.error("添加典型错题失败:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "添加失败"
    };
  }
}

/** 删除典型错题 */
export async function deleteTypicalErrorAction(typicalErrorId) {
  try {
    await deleteTypicalError(typicalErrorId);
    return {
      success: true
    };
  } catch (error) {
    console.error("删除典型错题失败:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "删除失败"
    };
  }
}

/** 更新典型错题排序 */
export async function updateTypicalErrorsSortAction(items) {
  try {
    await updateTypicalErrorsSort(items);
    return {
      success: true
    };
  } catch (error) {
    console.error("更新排序失败:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "更新排序失败"
    };
  }
}
