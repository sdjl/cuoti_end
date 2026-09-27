import { allDocs, command } from "../../../../../../lib/common/database.js";

/** 分享统计筛选条件 */

/** 班级分享统计数据 */

/** 学生分享统计数据 */

/** 分享访问日志详情 */

/**
 * 构建时间筛选条件
 */
function buildTimeFilterCondition(filter) {
  const matchConditions = {};
  const _ = command();
  if (filter?.timeRange && filter.timeRange !== "all") {
    if (filter.timeRange === "custom" && filter.startDate && filter.endDate) {
      // 自定义时间区间，按查看时间（created）筛选
      const startTimestamp = filter.startDate.getTime();
      const endTimestamp = filter.endDate.getTime() + 24 * 60 * 60 * 1000 - 1;
      matchConditions.created = _.gte(startTimestamp).and(_.lte(endTimestamp));
    } else if (filter.startDate && filter.endDate) {
      // 预设时间范围，按查看时间（created）筛选
      const startTimestamp = filter.startDate.getTime();
      const endTimestamp = filter.endDate.getTime() + 24 * 60 * 60 * 1000 - 1;
      matchConditions.created = _.gte(startTimestamp).and(_.lte(endTimestamp));
    }
  }
  return matchConditions;
}

/**
 * 获取班级分享统计数据
 */
export async function getClassroomShareStatistics(filter, schoolId, students) {
  try {
    if (!filter.classRoomId) {
      return {
        totalShareCount: 0,
        totalClickCount: 0,
        totalScoreAmount: 0,
        shareToNonStudentCount: 0,
        shareToStudentCount: 0,
        uniqueViewersCount: 0,
        studentStats: []
      };
    }
    if (students.length === 0) {
      return {
        totalShareCount: 0,
        totalClickCount: 0,
        totalScoreAmount: 0,
        shareToNonStudentCount: 0,
        shareToStudentCount: 0,
        uniqueViewersCount: 0,
        studentStats: []
      };
    }
    const studentIds = students.map(s => s._id);

    // 构建查询条件
    const matchConditions = buildTimeFilterCondition(filter);
    matchConditions.schoolId = schoolId;
    matchConditions.classroomId = filter.classRoomId;
    matchConditions.sharerStudentId = {
      $in: studentIds
    };

    // 获取分享访问日志
    const shareViewLogs = await allDocs({
      c: "share_view_log",
      match: matchConditions
    });

    // 计算班级总体统计
    const totalClickCount = shareViewLogs.length; // 点击次数 = 记录总数

    // 计算分享次数：按 (学生ID + 分享时间) 去重
    const shareKeys = new Set(shareViewLogs.map(log => `${log.sharerStudentId}_${log.shareTime}`));
    const totalShareCount = shareKeys.size; // 分享次数 = 去重后的数量

    const totalScoreAmount = shareViewLogs.reduce((sum, log) => sum + log.scoreAmount, 0);
    const shareToNonStudentCount = shareViewLogs.filter(log => !log.viewerIsStudent).length;
    const shareToStudentCount = shareViewLogs.filter(log => log.viewerIsStudent).length;
    const uniqueViewers = new Set(shareViewLogs.map(log => log.viewerOpenid));
    const uniqueViewersCount = uniqueViewers.size;

    // 按学生分组统计
    const studentStatsMap = new Map();
    shareViewLogs.forEach(log => {
      const studentId = log.sharerStudentId;
      if (!studentStatsMap.has(studentId)) {
        studentStatsMap.set(studentId, {
          shareCount: 0,
          clickCount: 0,
          scoreAmount: 0,
          shareToNonStudentCount: 0,
          shareToStudentCount: 0,
          viewerOpenids: new Set(),
          shareKeys: new Set()
        });
      }
      const stats = studentStatsMap.get(studentId);

      // 点击次数：每条记录算一次点击
      stats.clickCount++;

      // 分享次数：按 (学生ID + 分享时间) 去重
      const shareKey = `${log.sharerStudentId}_${log.shareTime}`;
      stats.shareKeys.add(shareKey);
      stats.shareCount = stats.shareKeys.size;
      stats.scoreAmount += log.scoreAmount;
      if (log.viewerIsStudent) {
        stats.shareToStudentCount++;
      } else {
        stats.shareToNonStudentCount++;
      }
      stats.viewerOpenids.add(log.viewerOpenid);
    });

    // 生成学生统计结果
    const studentStats = students.map(student => {
      const stats = studentStatsMap.get(student._id);
      return {
        studentId: student._id,
        studentName: student.name,
        studentCode: student.studentCode,
        shareCount: stats?.shareCount || 0,
        clickCount: stats?.clickCount || 0,
        scoreAmount: stats?.scoreAmount || 0,
        shareToNonStudentCount: stats?.shareToNonStudentCount || 0,
        shareToStudentCount: stats?.shareToStudentCount || 0,
        uniqueViewersCount: stats?.viewerOpenids.size || 0
      };
    });

    // 按点击次数从高到低排序
    studentStats.sort((a, b) => b.clickCount - a.clickCount);
    return {
      totalShareCount,
      totalClickCount,
      totalScoreAmount,
      shareToNonStudentCount,
      shareToStudentCount,
      uniqueViewersCount,
      studentStats
    };
  } catch (error) {
    console.error("获取班级分享统计失败:", error);
    throw new Error("获取班级分享统计数据失败");
  }
}

/**
 * 获取学生个人分享统计数据
 */
export async function getStudentShareStatistics(filter, schoolId, student) {
  try {
    if (!filter.studentId || !filter.classRoomId) {
      throw new Error("学生ID和班级ID不能为空");
    }

    // 构建查询条件
    const matchConditions = buildTimeFilterCondition(filter);
    matchConditions.schoolId = schoolId;
    matchConditions.classroomId = filter.classRoomId;
    matchConditions.sharerStudentId = filter.studentId;

    // 获取分享访问日志
    const shareViewLogs = await allDocs({
      c: "share_view_log",
      match: matchConditions,
      sort: {
        created: -1
      } // 按查看时间倒序
    });

    // 计算统计数据
    const clickCount = shareViewLogs.length; // 点击次数 = 记录总数

    // 计算分享次数：按 (学生ID + 分享时间) 去重
    const shareKeys = new Set(shareViewLogs.map(log => `${log.sharerStudentId}_${log.shareTime}`));
    const shareCount = shareKeys.size; // 分享次数 = 去重后的数量

    const scoreAmount = shareViewLogs.reduce((sum, log) => sum + log.scoreAmount, 0);
    const shareToNonStudentCount = shareViewLogs.filter(log => !log.viewerIsStudent).length;
    const shareToStudentCount = shareViewLogs.filter(log => log.viewerIsStudent).length;
    const uniqueViewers = new Set(shareViewLogs.map(log => log.viewerOpenid));
    const uniqueViewersCount = uniqueViewers.size;
    const statistics = {
      studentId: student._id,
      studentName: student.name,
      studentCode: student.studentCode,
      shareCount,
      clickCount,
      scoreAmount,
      shareToNonStudentCount,
      shareToStudentCount,
      uniqueViewersCount
    };

    // 转换日志详情
    const logs = shareViewLogs.map(log => ({
      viewerOpenid: log.viewerOpenid,
      shareUrl: log.shareUrl,
      viewerIsStudent: log.viewerIsStudent,
      viewerStudentId: log.viewerStudentId,
      scoreAmount: log.scoreAmount,
      shareTime: log.shareTime,
      created: log.created
    }));
    return {
      statistics,
      logs
    };
  } catch (error) {
    console.error("获取学生分享统计失败:", error);
    throw new Error("获取学生分享统计数据失败");
  }
}
