"use server";

/**
 * 时间范围计算规则说明：
 *
 * 1. 时间显示格式：显示给用户的时间是一个包含两端日期的期间
 *    例如：2025年7月14日 - 2025年7月21日 表示从14日0点到21日23:59:59
 *
 * 2. 一周计算规则：按中国习惯，一周是周一到周日
 *    - 上周：从上周一0点到上周日23:59:59
 *    - 本周：从本周一0点到本周日23:59:59
 *
 * 3. 查询时间范围：
 *    - 开始时间：选定日期的00:00:00
 *    - 结束时间：选定结束日期的次日00:00:00（不包含）
 *    - 这样确保包含结束日期的整天数据
 *
 * 4. 时间范围选项：
 *    - 整个学期：查询整个学期的数据（具体日期根据学校设置）
 *    - 上月：上个自然月的1号到最后一天
 *    - 上周：上周周一到周日（按中国习惯）
 *    - 自定义：用户选择的开始日期到结束日期
 */
import { createCustomQuestionPackData, getStudentAndClassroomInfo, queryQuestions, queryWeakKnowledgePoints } from "./datas.js";


export async function getStudentInfo(studentId, classRoomId) {
  try {
    return await getStudentAndClassroomInfo(studentId, classRoomId);
  } catch (error) {
    console.error("获取学生信息失败:", error);
    return {
      success: false,
      error: "获取学生信息失败"
    };
  }
}


export async function queryStudentWeakKnowledgePoints(params) {
  try {
    const {
      studentId,
      classRoomId,
      subject,
      timeRange,
      startTime,
      endTime
    } = params;

    // 构建查询参数
    const queryParams = {
      studentId,
      classId: classRoomId,
      subject
    };

    // 如果不是整个学期，则添加时间范围
    if (timeRange !== "整个学期") {
      if (!startTime || !endTime) {
        return {
          success: false,
          error: "时间范围参数不完整"
        };
      }
      queryParams.startTime = startTime;
      queryParams.endTime = endTime;
    }
    return await queryWeakKnowledgePoints(queryParams);
  } catch (error) {
    console.error("查询薄弱知识点失败:", error);
    return {
      success: false,
      error: "查询薄弱知识点失败"
    };
  }
}


export async function queryQuestionsByConditions(params) {
  try {
    console.log("查询题目参数 - 每个知识点题目数量上限:", params.knowledgePoints.map(kp => ({
      knowledgePoint: kp.knowledgePoint,
      quantity: kp.questionQuantity
    })));
    return await queryQuestions(params);
  } catch (error) {
    console.error("查询题目失败:", error);
    return {
      success: false,
      error: "查询题目失败"
    };
  }
}

/**
 * 创建定制题集
 */
export async function createCustomQuestionPack(params) {
  return await createCustomQuestionPackData(params);
}
