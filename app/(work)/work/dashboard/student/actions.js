"use server";

/**
 * 文件职责说明：
 * - 如果某个 Server Action 函数会用于 components 目录中的多个组件（一个以上），
 *   那么这个函数应该写到 actions.ts 文件中
 * - 如果这个函数在 page.tsx 文件中被使用，那么这个函数应该写到 actions.ts 文件中
 * - 如果这个函数没有在 page.tsx 文件中被使用，并且只会用于单个组件，那么这个函数应该写到 componentsServerActions
 *   目录下和这个组件对应的文件中
 *
 * 此文件用于处理学生学情看板页面的业务逻辑。
 */
import { getStudentClassrooms } from "./datas.js";

export async function getStudentKnowledgeStats(studentId, subject) {
  try {
    // 使用专门的知识树 action 获取真实数据
    const {
      getStudentKnowledgeTreeData
    } = await import("./componentsServerActions/knowledgeTreeActions");
    const result = await getStudentKnowledgeTreeData(studentId, subject);

    // 如果获取真实数据失败或没有数据，返回空数组
    if (!result.success || result.data.length === 0) {
      return {
        success: true,
        data: []
      };
    }
    return result;
  } catch (error) {
    console.error("获取学生知识点统计失败:", error);
    return {
      success: false,
      data: []
    };
  }
}


export async function getStudentMistakePoints(studentId, subject) {
  try {
    // 使用专门的错误归因统计 action 获取真实数据
    const {
      getMistakePointsDataAction
    } = await import("./componentsServerActions/mistakePointsActions");
    const result = await getMistakePointsDataAction(studentId, subject);
    return result;
  } catch (error) {
    console.error("获取学生错误归因统计失败:", error);
    return {
      success: false,
      data: []
    };
  }
}


export async function getStudentKnowledgeCategories(studentId, subject) {
  try {
    // 使用专门的知识点分类 action 获取真实数据
    const {
      getKnowledgeCategoryDataAction
    } = await import("./componentsServerActions/knowledgeCategoryActions");
    const result = await getKnowledgeCategoryDataAction(studentId, subject);
    return result;
  } catch (error) {
    console.error("获取学生知识点分类掌握情况失败:", error);
    return {
      success: false,
      data: null
    };
  }
}


export async function getStudentClassroomsAction(studentId) {
  try {
    const classrooms = await getStudentClassrooms(studentId);
    return classrooms.map(classroom => ({
      _id: classroom._id,
      name: classroom.name,
      grade: classroom.grade,
      status: classroom.status
    }));
  } catch (error) {
    console.error("获取学生班级列表失败:", error);
    return [];
  }
}
