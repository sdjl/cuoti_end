"use server";

import { addDoc, addDocList, agg, aggregate, allDocs, command, count, docs, getOne, removeDoc, removeMatch, updateDoc } from "../common/database.js";
import { timestamp } from "../common/time.js";

/**
 * 错误归因集合名
 */
const MISTAKE_POINT_COLLECTION = "mistake_point";

/**
 * 错误归因题目关联集合名
 */
const MISTAKE_POINT_QUESTION_COLLECTION = "mistake_point_question";


function buildMistakePointQuery(subject, keyword = "") {
  const where = {
    subject
  };

  // 添加关键词搜索
  if (keyword) {
    const searchRegex = new RegExp(keyword.trim(), "i");
    where._or = [{
      name: searchRegex
    }, {
      description: searchRegex
    }];
  }
  return where;
}


async function checkMistakePointNameExists(subject, name, excludeId) {
  const where = {
    subject,
    name: name.trim()
  };

  // 如果是编辑操作，排除当前记录
  if (excludeId) {
    const _ = command();
    where._id = _.neq(excludeId);
  }
  const existingPoint = await getOne(MISTAKE_POINT_COLLECTION, where);
  return existingPoint !== null;
}


async function getMistakePointErrorStats(mistakePointIds) {
  if (mistakePointIds.length === 0) return {};
  try {
    const $ = aggregate(); // 获取聚合命令
    const _ = command(); // 获取查询命令

    // 新的数据结构：每条记录代表一个学生在特定班级特定课程中对某个题目的某个错误归因的统计
    // 我们需要统计每个错误归因出现的次数（即有多少条记录）
    const pipeline = agg("mistake_point_question").match({
      mistakePointId: _.in(mistakePointIds)
    }).group({
      _id: "$mistakePointId",
      totalErrors: $.sum(1) // 计算记录数量，每条记录代表一次错误
    }).limit(100000);
    const result = await pipeline.end();

    // 转换结果为 Record<string, number> 格式
    const stats = {};
    for (const item of result.data || []) {
      stats[item._id] = item.totalErrors || 0;
    }
    return stats;
  } catch (error) {
    console.error("获取错误统计失败:", error);
    return {};
  }
}

// 扩展的错误归因数据类型，包含错误统计

// 操作结果类型


export async function getMistakePointsBySubject(subject) {
  const result = await allDocs({
    c: MISTAKE_POINT_COLLECTION,
    match: {
      subject
    },
    sort: {
      created: -1
    }
  });
  return result;
}


export async function getMistakePoints({
  subject,
  pageNum = 0,
  pageSize = 50,
  keyword = ""
}) {
  try {
    const where = buildMistakePointQuery(subject, keyword);
    const points = await docs({
      c: MISTAKE_POINT_COLLECTION,
      w: where,
      pageNum,
      pageSize,
      orderBy: {
        created: -1
      }
    });

    // 获取这些错误归因的错误统计
    const mistakePointIds = points.map(p => p._id);
    const errorStats = await getMistakePointErrorStats(mistakePointIds);

    // 将错误统计合并到结果中
    const pointsWithStats = points.map(point => ({
      ...point,
      errorCount: errorStats[point._id] || 0
    }));
    return {
      success: true,
      data: pointsWithStats
    };
  } catch (error) {
    console.error("获取错误归因列表失败:", error);
    return {
      success: false,
      error: `获取错误归因列表失败: ${error instanceof Error ? error.message : "未知错误"}`
    };
  }
}


export async function getMistakePointsCount({
  subject,
  keyword = ""
}) {
  try {
    const where = buildMistakePointQuery(subject, keyword);
    const total = await count(MISTAKE_POINT_COLLECTION, where);
    return {
      success: true,
      data: total
    };
  } catch (error) {
    console.error("获取错误归因总数失败:", error);
    return {
      success: false,
      error: `获取错误归因总数失败: ${error instanceof Error ? error.message : "未知错误"}`
    };
  }
}


export async function createMistakePoint({
  subject,
  name,
  description
}) {
  try {
    const trimmedName = name.trim();

    // 检查名称是否重复
    const nameExists = await checkMistakePointNameExists(subject, trimmedName);
    if (nameExists) {
      return {
        success: false,
        error: "该科目下已存在相同名称的错误归因"
      };
    }
    const mistakePoint = {
      subject,
      name: trimmedName,
      description: description.trim(),
      created: timestamp()
    };
    const id = await addDoc(MISTAKE_POINT_COLLECTION, mistakePoint);

    // 返回创建的错误归因数据
    const createdPoint = {
      ...mistakePoint,
      _id: id
    };
    return {
      success: true,
      data: createdPoint
    };
  } catch (error) {
    console.error("创建错误归因失败:", error);
    return {
      success: false,
      error: `创建错误归因失败: ${error instanceof Error ? error.message : "未知错误"}`
    };
  }
}


export async function updateMistakePoint(id, data) {
  try {
    const updateData = {};
    if (data.name !== undefined) {
      const trimmedName = data.name.trim();

      // 获取当前错误归因信息以检查科目
      const currentPoint = await getOne(MISTAKE_POINT_COLLECTION, {
        _id: id
      });
      if (!currentPoint) {
        return {
          success: false,
          error: "错误归因不存在"
        };
      }

      // 检查名称是否重复（排除当前记录）
      const nameExists = await checkMistakePointNameExists(currentPoint.subject, trimmedName, currentPoint._id);
      if (nameExists) {
        return {
          success: false,
          error: "该科目下已存在相同名称的错误归因"
        };
      }
      updateData.name = trimmedName;
    }
    if (data.description !== undefined) {
      updateData.description = data.description.trim();
    }
    await updateDoc(MISTAKE_POINT_COLLECTION, id, updateData);
    return {
      success: true,
      data: true
    };
  } catch (error) {
    console.error("更新错误归因失败:", error);
    return {
      success: false,
      error: `更新错误归因失败: ${error instanceof Error ? error.message : "未知错误"}`
    };
  }
}


export async function deleteMistakePoint(id) {
  try {
    // 直接删除关联的 MistakePointQuestionDoc 数据
    await removeMatch(MISTAKE_POINT_QUESTION_COLLECTION, {
      mistakePointId: id
    });

    // 删除错误归因
    await removeDoc(MISTAKE_POINT_COLLECTION, id);
    return {
      success: true,
      data: true
    };
  } catch (error) {
    console.error("删除错误归因失败:", error);
    return {
      success: false,
      error: `删除错误归因失败: ${error instanceof Error ? error.message : "未知错误"}`
    };
  }
}


export async function createMistakePointQuestions({
  mistakePointIds,
  questionId,
  studentId,
  classId,
  courseId,
  questionPackId,
  type
}) {
  try {
    if (mistakePointIds.length === 0) {
      return {
        success: true,
        data: []
      };
    }
    const currentTime = timestamp();

    // 构建要插入的记录数组
    const records = mistakePointIds.map(mistakePointId => ({
      mistakePointId,
      questionId,
      studentId,
      classId,
      courseId,
      questionPackId,
      type,
      created: currentTime
    }));

    // 批量插入记录
    const result = await addDocList(MISTAKE_POINT_QUESTION_COLLECTION, records);
    return {
      success: true,
      data: result.ids
    };
  } catch (error) {
    console.error("创建错误归因题目关联记录失败:", error);
    return {
      success: false,
      error: `创建错误归因题目关联记录失败: ${error instanceof Error ? error.message : "未知错误"}`
    };
  }
}


export async function deleteMistakePointQuestions({
  questionId,
  studentId,
  classId,
  courseId,
  questionPackId
}) {
  try {
    const where = {
      questionId,
      studentId,
      classId,
      questionPackId
    };

    // 处理courseId为null的情况
    if (courseId === null) {
      const _ = command();
      where.courseId = _.eq(null);
    } else {
      where.courseId = courseId;
    }
    const deletedCount = await removeMatch(MISTAKE_POINT_QUESTION_COLLECTION, where);
    return {
      success: true,
      data: deletedCount
    };
  } catch (error) {
    console.error("删除错误归因题目关联记录失败:", error);
    return {
      success: false,
      error: `删除错误归因题目关联记录失败: ${error instanceof Error ? error.message : "未知错误"}`
    };
  }
}


export async function updateMistakePointQuestions({
  mistakePointIds,
  questionId,
  studentId,
  classId,
  courseId,
  questionPackId,
  type
}) {
  try {
    // 先删除原有记录
    await deleteMistakePointQuestions({
      questionId,
      studentId,
      classId,
      courseId,
      questionPackId
    });

    // 创建新记录
    const createResult = await createMistakePointQuestions({
      mistakePointIds,
      questionId,
      studentId,
      classId,
      courseId,
      questionPackId,
      type
    });
    return createResult;
  } catch (error) {
    console.error("更新错误归因题目关联记录失败:", error);
    return {
      success: false,
      error: `更新错误归因题目关联记录失败: ${error instanceof Error ? error.message : "未知错误"}`
    };
  }
}


export async function getStudentMistakePoints({
  studentId,
  classId,
  courseId,
  questionPackId
}) {
  try {
    const where = {
      studentId,
      classId,
      questionPackId
    };

    // 处理courseId为null的情况
    if (courseId === null) {
      const _ = command();
      where.courseId = _.eq(null);
    } else {
      where.courseId = courseId;
    }
    const records = await allDocs({
      c: MISTAKE_POINT_QUESTION_COLLECTION,
      match: where
    });

    // 按题目ID分组错误归因
    const questionMistakePoints = {};
    for (const record of records) {
      if (!questionMistakePoints[record.questionId]) {
        questionMistakePoints[record.questionId] = [];
      }
      questionMistakePoints[record.questionId].push(record.mistakePointId);
    }
    return {
      success: true,
      data: questionMistakePoints
    };
  } catch (error) {
    console.error("获取学生错误归因数据失败:", error);
    return {
      success: false,
      error: `获取学生错误归因数据失败: ${error instanceof Error ? error.message : "未知错误"}`
    };
  }
}


export async function getMultiStudentMistakePoints({
  studentIds,
  classId,
  courseId,
  questionPackId
}) {
  try {
    if (studentIds.length === 0) {
      return {
        success: true,
        data: {}
      };
    }
    const _ = command();
    const where = {
      studentId: _.in(studentIds),
      classId,
      questionPackId
    };

    // 处理courseId为null的情况
    if (courseId === null) {
      where.courseId = _.eq(null);
    } else {
      where.courseId = courseId;
    }
    const records = await allDocs({
      c: MISTAKE_POINT_QUESTION_COLLECTION,
      match: where
    });

    // 按学生ID和题目ID分组错误归因
    const studentMistakePoints = {};
    for (const record of records) {
      if (!studentMistakePoints[record.studentId]) {
        studentMistakePoints[record.studentId] = {};
      }
      if (!studentMistakePoints[record.studentId][record.questionId]) {
        studentMistakePoints[record.studentId][record.questionId] = [];
      }
      studentMistakePoints[record.studentId][record.questionId].push(record.mistakePointId);
    }
    return {
      success: true,
      data: studentMistakePoints
    };
  } catch (error) {
    console.error("批量获取学生错误归因数据失败:", error);
    return {
      success: false,
      error: `批量获取学生错误归因数据失败: ${error instanceof Error ? error.message : "未知错误"}`
    };
  }
}
