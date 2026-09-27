"use server";

/**
 * 学生搜索组件的 Server Actions
 *
 * 用于组件：
 * - app/(work)/work/dashboard/student/components/StudentSearchBar.tsx
 *
 * 功能：
 * - 根据学生姓名或学号搜索学生
 */
import { getCurrentSchoolId } from "../../../../../../lib/work/teacher/mySchool.js";
import { searchStudents } from "../datas.js";

export async function searchStudentsAction(searchTerm) {
  try {
    // 获取当前用户所属的校园ID
    const schoolId = await getCurrentSchoolId();
    const students = await searchStudents(searchTerm, schoolId);
    return {
      success: true,
      data: students
    };
  } catch (error) {
    console.error("搜索学生失败:", error);
    return {
      success: false,
      data: []
    };
  }
}
