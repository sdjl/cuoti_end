"use server";

import { createStudentGroup, deleteStudentGroup, getMyStudentGroups, getMyStudentGroupsCount, getSchoolClassrooms, getStudentGroupTotalCount, getStudentsInClass, updateStudentGroup } from "./datas.js";

/**
 * 获取学生分组总数
 */
export async function getStudentGroupCount() {
  try {
    return await getStudentGroupTotalCount();
  } catch (error) {
    console.error("获取学生分组数量失败:", error);
    return 0;
  }
}


export async function getStudentGroupsAction({
  pageNum = 0,
  pageSize = 20,
  keyword = ""
} = {}) {
  try {
    return await getMyStudentGroups({
      pageNum,
      pageSize,
      keyword
    });
  } catch (error) {
    console.error("获取学生分组列表失败:", error);
    return [];
  }
}


export async function getStudentGroupsCountAction({
  keyword = ""
} = {}) {
  try {
    return await getMyStudentGroupsCount({
      keyword
    });
  } catch (error) {
    console.error("获取学生分组总数失败:", error);
    return 0;
  }
}

/**
 * 获取学校的所有班级
 */
export async function getSchoolClassroomsAction() {
  try {
    return await getSchoolClassrooms();
  } catch (error) {
    console.error("获取学校班级列表失败:", error);
    return [];
  }
}

/**
 * 获取班级的所有学生
 */
export async function getStudentsInClassAction(classId) {
  try {
    return await getStudentsInClass(classId);
  } catch (error) {
    console.error("获取班级学生失败:", error);
    return [];
  }
}

/**
 * 创建学生分组
 */
export async function createStudentGroupAction({
  name,
  teacherName,
  notes,
  students
}) {
  try {
    const studentGroupId = await createStudentGroup({
      name,
      teacherName,
      notes,
      students
    });
    return {
      success: true,
      studentGroupId
    };
  } catch (error) {
    console.error("创建学生分组失败:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "创建学生分组失败"
    };
  }
}

/**
 * 更新学生分组
 */
export async function updateStudentGroupAction(studentGroupId, {
  name,
  teacherName,
  notes,
  students
}) {
  try {
    if (!studentGroupId.trim()) {
      return {
        success: false,
        error: "学生分组ID不能为空"
      };
    }
    await updateStudentGroup(studentGroupId, {
      name,
      teacherName,
      notes,
      students
    });
    return {
      success: true
    };
  } catch (error) {
    console.error("更新学生分组失败:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "更新学生分组失败"
    };
  }
}

/**
 * 删除学生分组
 */
export async function deleteStudentGroupAction(studentGroupId) {
  try {
    if (!studentGroupId.trim()) {
      return {
        success: false,
        error: "学生分组ID不能为空"
      };
    }
    await deleteStudentGroup(studentGroupId);
    return {
      success: true
    };
  } catch (error) {
    console.error("删除学生分组失败:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "删除学生分组失败"
    };
  }
}
