import { allDocs, command } from "../../../../../../lib/common/database.js";

/** 邀请码统计筛选条件 */

/** 班级邀请码统计数据 */

/** 学生邀请码统计数据 */

/** 邀请成功记录详情 */

/**
 * 构建时间筛选条件
 */
function buildTimeFilterCondition(filter) {
  const matchConditions = {};
  const _ = command();
  if (filter?.timeRange && filter.timeRange !== "all") {
    if (filter.timeRange === "custom" && filter.startDate && filter.endDate) {
      // 自定义时间区间，按创建时间（created）筛选
      const startTimestamp = filter.startDate.getTime();
      const endTimestamp = filter.endDate.getTime() + 24 * 60 * 60 * 1000 - 1;
      matchConditions.created = _.gte(startTimestamp).and(_.lte(endTimestamp));
    } else if (filter.startDate && filter.endDate) {
      // 预设时间范围，按创建时间（created）筛选
      const startTimestamp = filter.startDate.getTime();
      const endTimestamp = filter.endDate.getTime() + 24 * 60 * 60 * 1000 - 1;
      matchConditions.created = _.gte(startTimestamp).and(_.lte(endTimestamp));
    }
  }
  return matchConditions;
}

/**
 * 获取班级邀请码统计数据
 */
export async function getClassroomInvitationStatistics(filter, schoolId, students) {
  try {
    if (!filter.classRoomId) {
      return {
        totalCreatedCodes: 0,
        totalUsedCodes: 0,
        totalUsedCount: 0,
        totalUnusedCodes: 0,
        studentStats: []
      };
    }
    if (students.length === 0) {
      return {
        totalCreatedCodes: 0,
        totalUsedCodes: 0,
        totalUsedCount: 0,
        totalUnusedCodes: 0,
        studentStats: []
      };
    }
    const studentIds = students.map(s => s._id);

    // 构建查询条件 - 邀请码创建记录
    const codeMatchConditions = buildTimeFilterCondition(filter);
    codeMatchConditions.schoolId = schoolId;
    codeMatchConditions.classroomId = filter.classRoomId;
    codeMatchConditions.type = "student"; // 只统计学生邀请码
    codeMatchConditions.creatorStudentId = {
      $in: studentIds
    };

    // 获取邀请码创建记录
    const invitationCodes = await allDocs({
      c: "invitation_code",
      match: codeMatchConditions
    });

    // 构建查询条件 - 邀请成功记录
    const successMatchConditions = buildTimeFilterCondition(filter);
    successMatchConditions.schoolId = schoolId;
    successMatchConditions.classroomId = filter.classRoomId;
    successMatchConditions.creatorStudentId = {
      $in: studentIds
    };

    // 获取邀请成功记录
    const invitationSuccesses = await allDocs({
      c: "invitation_success",
      match: successMatchConditions
    });

    // 计算班级总体统计
    const totalCreatedCodes = invitationCodes.length;
    const totalUsedCount = invitationSuccesses.length; // 被使用的次数（总邀请人数）

    // 计算被使用的邀请码数量（去重）
    const usedInvitationCodes = new Set(invitationSuccesses.map(success => success.invitationCode));
    const totalUsedCodes = usedInvitationCodes.size;

    // 计算未被使用的邀请码数量
    const totalUnusedCodes = totalCreatedCodes - totalUsedCodes;

    // 按学生分组统计
    const studentStatsMap = new Map();

    // 统计邀请码创建情况
    invitationCodes.forEach(code => {
      const studentId = code.creatorStudentId;
      if (studentId && !studentStatsMap.has(studentId)) {
        studentStatsMap.set(studentId, {
          createdCodes: 0,
          usedCount: 0,
          usedCodeSet: new Set()
        });
      }
      if (studentId) {
        const stats = studentStatsMap.get(studentId);
        stats.createdCodes++;
      }
    });

    // 统计邀请成功情况
    invitationSuccesses.forEach(success => {
      const studentId = success.creatorStudentId;
      if (studentId && !studentStatsMap.has(studentId)) {
        studentStatsMap.set(studentId, {
          createdCodes: 0,
          usedCount: 0,
          usedCodeSet: new Set()
        });
      }
      if (studentId) {
        const stats = studentStatsMap.get(studentId);
        stats.usedCount++; // 被使用的次数
        stats.usedCodeSet.add(success.invitationCode); // 被使用的邀请码（去重）
      }
    });

    // 生成学生统计结果
    const studentStats = students.map(student => {
      const stats = studentStatsMap.get(student._id);
      const createdCodes = stats?.createdCodes || 0;
      const usedCodes = stats?.usedCodeSet.size || 0;
      const usedCount = stats?.usedCount || 0;
      const unusedCodes = createdCodes - usedCodes;
      return {
        studentId: student._id,
        studentName: student.name,
        studentCode: student.studentCode,
        createdCodes,
        usedCodes,
        usedCount,
        unusedCodes
      };
    });

    // 按被使用次数从高到低排序
    studentStats.sort((a, b) => b.usedCount - a.usedCount);
    return {
      totalCreatedCodes,
      totalUsedCodes,
      totalUsedCount,
      totalUnusedCodes,
      studentStats
    };
  } catch (error) {
    console.error("获取班级邀请码统计失败:", error);
    throw new Error("获取班级邀请码统计数据失败");
  }
}

/**
 * 获取学生个人邀请码统计数据
 */
export async function getStudentInvitationStatistics(filter, schoolId, student) {
  try {
    if (!filter.studentId || !filter.classRoomId) {
      throw new Error("学生ID和班级ID不能为空");
    }

    // 构建查询条件 - 邀请码创建记录
    const codeMatchConditions = buildTimeFilterCondition(filter);
    codeMatchConditions.schoolId = schoolId;
    codeMatchConditions.classroomId = filter.classRoomId;
    codeMatchConditions.type = "student"; // 只统计学生邀请码
    codeMatchConditions.creatorStudentId = filter.studentId;

    // 获取邀请码创建记录
    const invitationCodes = await allDocs({
      c: "invitation_code",
      match: codeMatchConditions
    });

    // 构建查询条件 - 邀请成功记录
    const successMatchConditions = buildTimeFilterCondition(filter);
    successMatchConditions.schoolId = schoolId;
    successMatchConditions.classroomId = filter.classRoomId;
    successMatchConditions.creatorStudentId = filter.studentId;

    // 获取邀请成功记录
    const invitationSuccesses = await allDocs({
      c: "invitation_success",
      match: successMatchConditions,
      sort: {
        created: -1
      } // 按创建时间倒序
    });

    // 计算统计数据
    const createdCodes = invitationCodes.length;
    const usedCount = invitationSuccesses.length; // 被使用的次数（总邀请人数）

    // 计算被使用的邀请码数量（去重）
    const usedInvitationCodes = new Set(invitationSuccesses.map(success => success.invitationCode));
    const usedCodes = usedInvitationCodes.size;

    // 计算未被使用的邀请码数量
    const unusedCodes = createdCodes - usedCodes;
    const statistics = {
      studentId: student._id,
      studentName: student.name,
      studentCode: student.studentCode,
      createdCodes,
      usedCodes,
      usedCount,
      unusedCodes
    };

    // 转换邀请详情
    const details = invitationSuccesses.map(success => ({
      invitationCode: success.invitationCode,
      inviteeName: success.inviteeName,
      inviteePhone: success.inviteePhone,
      remark: success.remark,
      created: success.created
    }));
    return {
      statistics,
      details
    };
  } catch (error) {
    console.error("获取学生邀请码统计失败:", error);
    throw new Error("获取学生邀请码统计数据失败");
  }
}
