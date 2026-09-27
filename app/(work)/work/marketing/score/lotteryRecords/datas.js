"use server";

import { addDoc, allDocs, command, count, docs, getDoc, updateDoc } from "../../../../../../lib/common/database.js";
import { timestamp } from "../../../../../../lib/common/time.js";

/** 积分抽奖记录集合名称 */
const LOTTERY_RECORD_COLLECTION = "lottery_record";

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
  redeemStatus = "all",
  isPublicFilter = "all",
  targetStudentId = null
}) {
  const _ = command();
  let where = {
    schoolId,
    isWin: true // 只查询中奖记录
  };

  // 如果指定了目标学生ID，直接使用它（优先级最高）
  if (targetStudentId) {
    where.studentId = targetStudentId;
  }

  // 按兑换状态过滤
  if (redeemStatus !== "all") {
    where.redeemStatus = redeemStatus;
  }

  // 按公示状态过滤
  if (isPublicFilter === "public") {
    where.isPublic = true;
  } else if (isPublicFilter === "private") {
    where = _.and(where, _.or({
      isPublic: false
    }, {
      isPublic: _.exists(false)
    }));
  }

  // 模糊搜索：奖品名称、老师备注
  if (searchText.trim()) {
    where = _.and(where, _.or({
      prizeName: new RegExp(searchText.trim(), "i")
    }, {
      teacherRemark: new RegExp(searchText.trim(), "i")
    }));
  }
  return where;
}

/**
 * 获取积分抽奖记录列表（分页）
 */
export async function getLotteryRecords({
  schoolId,
  pageNum = 0,
  pageSize = 20,
  searchText = "",
  redeemStatus = "all",
  isPublicFilter = "all",
  targetStudentId = null
}) {
  // 不允许schoolId为空
  if (!schoolId) {
    throw new Error("schoolId 不能为空");
  }
  const where = buildQueryConditions({
    schoolId,
    searchText,
    redeemStatus,
    isPublicFilter,
    targetStudentId
  });
  try {
    const records = await docs({
      c: LOTTERY_RECORD_COLLECTION,
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
    console.error("获取积分抽奖记录失败:", error);
    throw new Error("获取积分抽奖记录失败");
  }
}

/**
 * 获取积分抽奖记录总数（用于分页）
 */
export async function getLotteryRecordsCount({
  schoolId,
  searchText = "",
  redeemStatus = "all",
  isPublicFilter = "all",
  targetStudentId = null
}) {
  // 不允许schoolId为空
  if (!schoolId) {
    throw new Error("schoolId 不能为空");
  }
  const where = buildQueryConditions({
    schoolId,
    searchText,
    redeemStatus,
    isPublicFilter,
    targetStudentId
  });
  try {
    const totalCount = await count(LOTTERY_RECORD_COLLECTION, where);
    return totalCount;
  } catch (error) {
    console.error("获取积分抽奖记录数量失败:", error);
    throw new Error("获取积分抽奖记录数量失败");
  }
}

/**
 * 根据ID获取单个积分抽奖记录
 */
export async function getLotteryRecordById(lotteryId) {
  try {
    const lotteryRecord = await getDoc(LOTTERY_RECORD_COLLECTION, lotteryId);
    if (!lotteryRecord) {
      return null;
    }
    return lotteryRecord;
  } catch (error) {
    console.error("获取积分抽奖记录详情失败:", error);
    throw new Error("获取积分抽奖记录详情失败");
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
 * 处理积分抽奖记录状态
 */
export async function processLotteryRecord({
  lotteryId,
  newStatus,
  teacherRemark,
  isPublic
}) {
  try {
    // 获取抽奖记录
    const lotteryRecord = await getLotteryRecordById(lotteryId);
    if (!lotteryRecord) {
      return {
        success: false,
        error: "抽奖记录不存在"
      };
    }

    // 检查当前状态
    if (lotteryRecord.redeemStatus !== "pending") {
      return {
        success: false,
        error: "只能处理待处理状态的抽奖记录"
      };
    }

    // 如果是取消状态，需要返还积分
    if (newStatus === "cancelled") {
      // 获取学生当前积分
      const currentScore = await getStudentCurrentScore(lotteryRecord.studentId);
      const newScore = currentScore + lotteryRecord.pointsUsed;

      // 更新学生积分
      const updateSuccess = await updateStudentScore(lotteryRecord.studentId, newScore);
      if (!updateSuccess) {
        return {
          success: false,
          error: "返还积分失败"
        };
      }

      // 创建积分返还成长记录
      await createReturnScoreGrowthRecord({
        schoolId: lotteryRecord.schoolId,
        classId: lotteryRecord.classroomId,
        studentId: lotteryRecord.studentId,
        pointsReturned: lotteryRecord.pointsUsed,
        reason: `抽奖取消：${lotteryRecord.prizeName}`,
        afterScore: newScore
      });
    }

    // 更新抽奖记录状态
    const updateData = {
      redeemStatus: newStatus
    };
    if (teacherRemark) {
      updateData.teacherRemark = teacherRemark;
    }
    if (isPublic !== undefined) {
      updateData.isPublic = isPublic;
    }
    const success = await updateDoc(LOTTERY_RECORD_COLLECTION, lotteryId, updateData);
    if (!success) {
      return {
        success: false,
        error: "更新抽奖记录状态失败"
      };
    }
    return {
      success: true
    };
  } catch (error) {
    console.error("处理积分抽奖记录失败:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "处理积分抽奖记录失败"
    };
  }
}

/**
 * 更新抽奖记录的老师备注和公示状态
 */
export async function updateLotteryRecordRemark({
  lotteryId,
  teacherRemark,
  isPublic
}) {
  try {
    const updateData = {
      teacherRemark
    };
    if (isPublic !== undefined) {
      updateData.isPublic = isPublic;
    }
    const success = await updateDoc(LOTTERY_RECORD_COLLECTION, lotteryId, updateData);
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
    console.error("更新抽奖记录老师备注失败:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "更新老师备注失败"
    };
  }
}
