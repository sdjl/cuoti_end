"use server";

import { getCurrentSchoolFromDB } from "../../../../../lib/work/teacher/mySchool.js";
import { deleteQuizTake, getQuizTakes, getQuizTakesCount, getSchoolQuizGrades, getSchoolQuizSubjects } from "./datas.js";

/**
 * 获取口述核心知识点参与记录列表
 */
export async function getQuizTakesAction({
  pageNum = 0,
  pageSize = 20,
  keyword = "",
  subject = "all",
  grade = "all",
  teamId = null
} = {}) {
  try {
    // 获取当前学校信息
    const currentSchool = await getCurrentSchoolFromDB();
    if (!currentSchool) {
      throw new Error("未找到当前学校信息");
    }
    return await getQuizTakes({
      pageNum,
      pageSize,
      keyword,
      subject,
      grade,
      schoolId: currentSchool._id,
      teamId
    });
  } catch (error) {
    console.error("获取口述核心知识点参与记录失败:", error);
    return [];
  }
}

/**
 * 获取口述核心知识点参与记录总数
 */
export async function getQuizTakesCountAction({
  keyword = "",
  subject = "all",
  grade = "all",
  teamId = null
} = {}) {
  try {
    // 获取当前学校信息
    const currentSchool = await getCurrentSchoolFromDB();
    if (!currentSchool) {
      throw new Error("未找到当前学校信息");
    }
    return await getQuizTakesCount({
      keyword,
      subject,
      grade,
      schoolId: currentSchool._id,
      teamId
    });
  } catch (error) {
    console.error("获取口述核心知识点参与记录总数失败:", error);
    return 0;
  }
}

/**
 * 获取当前学校口述核心知识点的科目列表
 */
export async function getSchoolQuizSubjectsAction() {
  try {
    // 获取当前学校信息
    const currentSchool = await getCurrentSchoolFromDB();
    if (!currentSchool) {
      throw new Error("未找到当前学校信息");
    }
    return await getSchoolQuizSubjects(currentSchool._id);
  } catch (error) {
    console.error("获取口述核心知识点科目列表失败:", error);
    return [];
  }
}

/**
 * 获取当前学校口述核心知识点的年级列表
 */
export async function getSchoolQuizGradesAction() {
  try {
    // 获取当前学校信息
    const currentSchool = await getCurrentSchoolFromDB();
    if (!currentSchool) {
      throw new Error("未找到当前学校信息");
    }
    return await getSchoolQuizGrades(currentSchool._id);
  } catch (error) {
    console.error("获取口述核心知识点年级列表失败:", error);
    return [];
  }
}

/**
 * 删除口述核心知识点参与记录及所有关联数据
 */
export async function deleteQuizTakeAction(takeId) {
  try {
    const currentSchool = await getCurrentSchoolFromDB();
    if (!currentSchool) {
      throw new Error("未找到当前学校信息");
    }
    await deleteQuizTake(takeId, currentSchool._id);
    return {
      success: true,
      message: "删除成功"
    };
  } catch (error) {
    console.error("删除口述核心知识点记录失败:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "删除失败"
    };
  }
}
