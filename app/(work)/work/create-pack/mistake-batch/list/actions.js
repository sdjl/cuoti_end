"use server";

import { deleteTaskData, getMistakeBatchTasks, getSchoolSubjects, markTaskForCleaning } from "./datas.js";
/**
 * 获取错题批量生成任务列表
 */
export async function getMistakeBatchTasksAction({
  keyword = "",
  status = "all",
  subject = "all"
}) {
  try {
    const tasks = await getMistakeBatchTasks({
      keyword,
      status,
      subject
    });
    return tasks;
  } catch (error) {
    console.error("获取错题批量生成任务列表失败:", error);
    throw new Error("获取任务列表失败");
  }
}

/**
 * 获取学校的科目列表
 */
export async function getSchoolSubjectsAction() {
  try {
    const subjects = await getSchoolSubjects();
    return subjects;
  } catch (error) {
    console.error("获取科目列表失败:", error);
    return [];
  }
}

/**
 * 清理任务所有文件（将所有数据标记为等待清理状态）
 */
export async function cleanTaskFilesAction(taskId) {
  try {
    await markTaskForCleaning(taskId);
    return {
      success: true
    };
  } catch (error) {
    console.error("清理任务文件失败:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "清理任务文件失败"
    };
  }
}

/**
 * 批量清理任务文件
 */
export async function batchCleanTaskFilesAction(taskIds) {
  try {
    let successCount = 0;
    for (const taskId of taskIds) {
      try {
        await markTaskForCleaning(taskId);
        successCount++;
      } catch (error) {
        console.error(`清理任务 ${taskId} 失败:`, error);
      }
    }
    return {
      success: true,
      count: successCount
    };
  } catch (error) {
    console.error("批量清理任务失败:", error);
    return {
      success: false,
      count: 0,
      error: error instanceof Error ? error.message : "批量清理任务失败"
    };
  }
}

/**
 * 获取指定时间之前创建的任务
 */
export async function getTasksBeforeDateAction(monthsAgo) {
  try {
    const targetDate = new Date();
    targetDate.setMonth(targetDate.getMonth() - monthsAgo);
    const targetTimestamp = targetDate.getTime();
    const allTasks = await getMistakeBatchTasks({
      keyword: "",
      status: "all",
      subject: "all"
    });
    return allTasks.filter(task => task.created < targetTimestamp);
  } catch (error) {
    console.error("获取历史任务失败:", error);
    return [];
  }
}

/**
 * 删除错题批量生成任务
 */
export async function deleteMistakeBatchTaskAction(taskId) {
  try {
    // 删除数据库记录（包括所有关联数据）
    await deleteTaskData(taskId);
    return {
      success: true
    };
  } catch (error) {
    console.error("删除任务失败:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "删除任务失败"
    };
  }
}

/**
 * 更新错题批量生成任务
 */
export async function updateMistakeBatchTaskAction(taskId, data) {
  try {
    const {
      updateMistakeBatchTask
    } = await import("./datas");
    await updateMistakeBatchTask(taskId, data);
    return {
      success: true
    };
  } catch (error) {
    console.error("更新任务失败:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "更新任务失败"
    };
  }
}
