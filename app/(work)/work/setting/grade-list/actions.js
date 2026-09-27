"use server";

import { getGradeList, renameGradeData, updateGradeList } from "./datas.js";


export async function getGradeListAction() {
  try {
    const grades = await getGradeList();
    return {
      grades
    };
  } catch (error) {
    console.error("获取年级列表失败:", error);
    return {
      grades: [],
      error: error instanceof Error ? error.message : "获取年级列表失败"
    };
  }
}


export async function updateGradeListAction(grades) {
  try {
    // 验证年级列表
    if (!Array.isArray(grades)) {
      return {
        success: false,
        error: "年级列表格式不正确"
      };
    }

    // 过滤掉空字符串
    const validGrades = grades.filter(grade => grade.trim() !== "");

    // 检查是否有重复的年级
    const uniqueGrades = [...new Set(validGrades)];
    if (uniqueGrades.length !== validGrades.length) {
      return {
        success: false,
        error: "年级列表中不能有重复项"
      };
    }

    // 再次检查空字符串和重复项
    for (const grade of validGrades) {
      if (!grade || grade.trim() === "") {
        return {
          success: false,
          error: "年级名称不能为空"
        };
      }
    }
    const success = await updateGradeList(validGrades);
    if (success) {
      return {
        success: true
      };
    } else {
      return {
        success: false,
        error: "更新年级列表失败"
      };
    }
  } catch (error) {
    console.error("更新年级列表失败:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "更新年级列表失败"
    };
  }
}


export async function renameGradeAction(oldGradeName, newGradeName, allGrades) {
  try {
    // 基本验证
    if (!oldGradeName || !newGradeName) {
      return {
        success: false,
        error: "年级名称不能为空"
      };
    }
    if (oldGradeName === newGradeName) {
      return {
        success: false,
        error: "新年级名称与原年级名称相同"
      };
    }

    // 检查新年级名称是否已存在
    const otherGrades = allGrades.filter(grade => grade !== oldGradeName);
    if (otherGrades.includes(newGradeName)) {
      return {
        success: false,
        error: "年级名称已存在"
      };
    }
    const result = await renameGradeData(oldGradeName, newGradeName, allGrades);
    return result;
  } catch (error) {
    console.error("重命名年级失败:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "重命名年级失败"
    };
  }
}
