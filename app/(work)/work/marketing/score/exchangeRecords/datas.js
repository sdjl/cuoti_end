"use server";

import { addDoc, allDocs, command, count, docs, getDoc, updateDoc } from "../../../../../../lib/common/database.js";
import { timestamp } from "../../../../../../lib/common/time.js";

/** 积分兑换申请集合名称 */
const POINTS_EXCHANGE_COLLECTION = "points_exchange";

/** 学生成长记录集合名称 */
const STUDENT_GROWTH_COLLECTION = "student_growth";

/** 学生集合名称 */
const STUDENT_COLLECTION = "student";

/** 班级集合名称 */
const CLASSROOM_COLLECTION = "classroom";

/**
 * 构建查询条件
 */
function buildQueryConditions({
  schoolId,
  searchText = "",
  status = "all",
  targetStudentId = null
}) {
  const _ = command();
  let where = {
    schoolId
  };

  // 如果指定了目标学生ID，直接使用它（优先级最高）
  if (targetStudentId) {
    where.studentId = targetStudentId;
  }

  // 按状态过滤
  if (status !== "all") {
    where.status = status;
  }

  // 模糊搜索：商品名称、老师备注
  if (searchText.trim()) {
    where = _.and(where, _.or({
      itemName: new RegExp(searchText.trim(), "i")
    }, {
      teacherRemark: new RegExp(searchText.trim(), "i")
    }));
  }
  return where;
}

/**
 * 获取积分兑换记录列表（分页）
 */
export async function getExchangeRecords({
  schoolId,
  pageNum = 0,
  pageSize = 20,
  searchText = "",
  status = "all",
  targetStudentId = null
}) {
  // 不允许schoolId为空
  if (!schoolId) {
    throw new Error("schoolId 不能为空");
  }
  const where = buildQueryConditions({
    schoolId,
    searchText,
    status,
    targetStudentId
  });
  try {
    const records = await docs({
      c: POINTS_EXCHANGE_COLLECTION,
      w: where,
      pageNum,
      pageSize,
      orderBy: {
        created: -1
      }
    });
    const recordsWithData = records;

    // 获取所有关联的学生ID和班级ID
    const studentIds = [...new Set(recordsWithData.map(record => record.studentId))];
    const classroomIds = [...new Set(recordsWithData.map(record => record.classroomId))];

    // 批量获取学生信息
    let students = [];
    if (studentIds.length > 0) {
      const _ = command();
      students = await allDocs({
        c: STUDENT_COLLECTION,
        match: {
          _id: _.in(studentIds)
        },
        project: {
          _id: 1,
          name: 1,
          studentCode: 1
        }
      });
    }

    // 批量获取班级信息
    let classrooms = [];
    if (classroomIds.length > 0) {
      const _ = command();
      classrooms = await allDocs({
        c: CLASSROOM_COLLECTION,
        match: {
          _id: _.in(classroomIds)
        },
        project: {
          _id: 1,
          name: 1
        }
      });
    }

    // 组装数据
    const enrichedRecords = recordsWithData.map(record => ({
      ...record,
      student: students.find(s => s._id === record.studentId) || null,
      classroom: classrooms.find(c => c._id === record.classroomId) || null
    }));
    return enrichedRecords;
  } catch (error) {
    console.error("获取积分兑换记录失败:", error);
    throw new Error("获取积分兑换记录失败");
  }
}

/**
 * 获取积分兑换记录总数（用于分页）
 */
export async function getExchangeRecordsCount({
  schoolId,
  searchText = "",
  status = "all",
  targetStudentId = null
}) {
  // 不允许schoolId为空
  if (!schoolId) {
    throw new Error("schoolId 不能为空");
  }
  const where = buildQueryConditions({
    schoolId,
    searchText,
    status,
    targetStudentId
  });
  try {
    const totalCount = await count(POINTS_EXCHANGE_COLLECTION, where);
    return totalCount;
  } catch (error) {
    console.error("获取积分兑换记录数量失败:", error);
    throw new Error("获取积分兑换记录数量失败");
  }
}

/**
 * 根据ID获取单个积分兑换记录
 */
export async function getExchangeRecordById(exchangeId) {
  try {
    const exchangeRecord = await getDoc(POINTS_EXCHANGE_COLLECTION, exchangeId);
    if (!exchangeRecord) {
      return null;
    }
    return exchangeRecord;
  } catch (error) {
    console.error("获取积分兑换记录详情失败:", error);
    throw new Error("获取积分兑换记录详情失败");
  }
}

/**
 * 获取学生当前积分
 */
export async function getStudentCurrentScore(studentId) {
  try {
    const student = await getDoc(STUDENT_COLLECTION, studentId, {
      only: "growthData"
    });
    if (!student) {
      throw new Error("学生不存在");
    }
    const studentData = student;
    return studentData?.growthData?.score || 0;
  } catch (error) {
    console.error("获取学生当前积分失败:", error);
    throw new Error("获取学生当前积分失败");
  }
}

/**
 * 更新学生积分
 */
export async function updateStudentScore(studentId, newScore) {
  try {
    const success = await updateDoc(STUDENT_COLLECTION, studentId, {
      "growthData.score": newScore
    });
    return success;
  } catch (error) {
    console.error("更新学生积分失败:", error);
    throw new Error("更新学生积分失败");
  }
}

/**
 * 创建积分返还成长记录
 */
export async function createReturnScoreGrowthRecord({
  schoolId,
  classId,
  studentId,
  pointsReturned,
  reason,
  afterScore
}) {
  try {
    const now = timestamp();
    const growthRecord = {
      schoolId,
      classId,
      studentId,
      description: `积分返还：${reason}`,
      type: "积分返还",
      isShowInGrowthPath: false,
      // 积分返还不显示在成长路径中
      data: {
        reason
      },
      score: {
        time: now,
        reason,
        score: pointsReturned,
        afterScore
      },
      created: now
    };
    const recordId = await addDoc(STUDENT_GROWTH_COLLECTION, growthRecord);
    return recordId;
  } catch (error) {
    console.error("创建积分返还成长记录失败:", error);
    throw new Error("创建积分返还成长记录失败");
  }
}

/**
 * 处理积分兑换记录状态
 */
export async function processExchangeRecord({
  exchangeId,
  newStatus,
  teacherRemark
}) {
  try {
    // 获取兑换记录
    const exchangeRecord = await getExchangeRecordById(exchangeId);
    if (!exchangeRecord) {
      return {
        success: false,
        error: "兑换记录不存在"
      };
    }

    // 检查当前状态
    if (exchangeRecord.status !== "pending") {
      return {
        success: false,
        error: "只能处理待处理状态的兑换记录"
      };
    }

    // 如果是取消状态，需要返还积分
    if (newStatus === "cancelled") {
      // 获取学生当前积分
      const currentScore = await getStudentCurrentScore(exchangeRecord.studentId);
      const newScore = currentScore + exchangeRecord.pointsUsed;

      // 更新学生积分
      const updateSuccess = await updateStudentScore(exchangeRecord.studentId, newScore);
      if (!updateSuccess) {
        return {
          success: false,
          error: "返还积分失败"
        };
      }

      // 创建积分返还成长记录
      await createReturnScoreGrowthRecord({
        schoolId: exchangeRecord.schoolId,
        classId: exchangeRecord.classroomId,
        studentId: exchangeRecord.studentId,
        pointsReturned: exchangeRecord.pointsUsed,
        reason: `兑换取消：${exchangeRecord.itemName}`,
        afterScore: newScore
      });
    }

    // 更新兑换记录状态
    const updateData = {
      status: newStatus
    };
    if (teacherRemark) {
      updateData.teacherRemark = teacherRemark;
    }
    const success = await updateDoc(POINTS_EXCHANGE_COLLECTION, exchangeId, updateData);
    if (!success) {
      return {
        success: false,
        error: "更新兑换记录状态失败"
      };
    }
    return {
      success: true
    };
  } catch (error) {
    console.error("处理积分兑换记录失败:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "处理积分兑换记录失败"
    };
  }
}

/**
 * 更新兑换记录的老师备注
 */
export async function updateExchangeRecordRemark({
  exchangeId,
  teacherRemark
}) {
  try {
    const success = await updateDoc(POINTS_EXCHANGE_COLLECTION, exchangeId, {
      teacherRemark
    });
    if (!success) {
      return {
        success: false,
        error: "更新老师备注失败"
      };
    }
    return {
      success: true
    };
  } catch (error) {
    console.error("更新兑换记录老师备注失败:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "更新老师备注失败"
    };
  }
}
