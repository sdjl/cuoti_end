"use server";

/**
 * 班级选择器 Server Action
 *
 * 用于 app/(work)/work/dashboard/knowledge/components/ClassSelector.tsx 组件
 */
import { getClassroomsWithGrades } from "../datas.js";
/**
 * 获取当前校园的所有班级和年级列表
 */
export async function getClassroomsWithGradesAction() {
  try {
    const data = await getClassroomsWithGrades();
    return data;
  } catch (error) {
    console.error("获取班级和年级列表失败:", error);
    return {
      classrooms: [],
      grades: []
    };
  }
}
