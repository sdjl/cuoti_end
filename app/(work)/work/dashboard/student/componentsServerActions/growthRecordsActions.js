"use server";

/**
 * 成长记录相关的 Server Actions
 *
 * 此文件用于处理学生成长记录的业务逻辑，包括：
 * - 学情记录
 * - 积分变化
 * - 荣誉申请
 * - 积分兑换
 * - 积分抽奖
 *
 * 配合组件使用：
 * - app/(work)/work/dashboard/student/components/QuizRecordsList.tsx
 *
 * 数据来源：
 * - StudyRecordDoc: 学情记录
 * - StudentGrowthDoc: 积分变化记录
 * - HonorApplicationDoc: 荣誉申请记录
 * - PointsExchangeDoc: 积分兑换记录
 * - LotteryRecordDoc: 积分抽奖记录
 */
import { getClassroomsByIds, getStudentExchangeRecords, getStudentHonorApplications, getStudentLotteryRecords, getStudentPointsHistory, getStudentStudyRecords, getWxUsersByIds } from "../datas.js";

/**
 * 学情记录信息
 */

/**
 * 积分变化记录信息
 */

/**
 * 荣誉申请信息
 */

/**
 * 积分兑换记录信息
 */

/**
 * 积分抽奖记录信息
 */


export async function getHonorApplicationsAction(studentId, limit) {
  try {
    // 1. 获取学生的荣誉申请记录
    const applications = await getStudentHonorApplications(studentId, limit);
    if (applications.length === 0) {
      return {
        success: true,
        data: []
      };
    }

    // 2. 获取所有班级信息
    const classroomIds = [...new Set(applications.map(app => app.classroomId))];
    const classrooms = await getClassroomsByIds(classroomIds);
    const classroomsMap = new Map(classrooms.map(classroom => [classroom._id, classroom]));

    // 3. 组装数据
    const applicationInfoList = applications.map(app => {
      const classroom = classroomsMap.get(app.classroomId);
      return {
        _id: app._id,
        classroomId: app.classroomId,
        className: classroom?.name || "未知班级",
        honorName: app.honorName,
        status: app.status,
        showInSchoolHonorBoard: app.showInSchoolHonorBoard,
        subject: app.subject,
        examScore: app.examScore,
        examName: app.examName,
        created: app.created
      };
    });
    return {
      success: true,
      data: applicationInfoList
    };
  } catch (error) {
    console.error("获取荣誉申请记录失败:", error);
    return {
      success: false,
      data: []
    };
  }
}


export async function getLotteryRecordsAction(studentId, limit) {
  try {
    // 1. 获取学生的积分抽奖记录（仅中奖记录）
    const records = await getStudentLotteryRecords(studentId, limit);
    if (records.length === 0) {
      return {
        success: true,
        data: []
      };
    }

    // 2. 获取所有班级信息
    const classroomIds = [...new Set(records.map(rec => rec.classroomId))];
    const classrooms = await getClassroomsByIds(classroomIds);
    const classroomsMap = new Map(classrooms.map(classroom => [classroom._id, classroom]));

    // 3. 组装数据
    const recordInfoList = records.map(rec => {
      const classroom = classroomsMap.get(rec.classroomId);
      return {
        _id: rec._id,
        classroomId: rec.classroomId,
        className: classroom?.name || "未知班级",
        prizeName: rec.prizeName,
        redeemStatus: rec.redeemStatus,
        teacherRemark: rec.teacherRemark,
        created: rec.created
      };
    });
    return {
      success: true,
      data: recordInfoList
    };
  } catch (error) {
    console.error("获取积分抽奖记录失败:", error);
    return {
      success: false,
      data: []
    };
  }
}


export async function getStudyRecordsAction(studentId, limit) {
  try {
    // 1. 获取学生的学情记录
    const records = await getStudentStudyRecords(studentId, limit);
    if (records.length === 0) {
      return {
        success: true,
        data: []
      };
    }

    // 2. 获取所有班级信息
    const classroomIds = [...new Set(records.map(rec => rec.classroomId))];
    const classrooms = await getClassroomsByIds(classroomIds);
    const classroomsMap = new Map(classrooms.map(classroom => [classroom._id, classroom]));

    // 3. 获取所有操作老师信息
    const operatorUserIds = [...new Set(records.map(rec => rec.operatorUserId))];
    const wxUsers = await getWxUsersByIds(operatorUserIds);
    const wxUsersMap = new Map(wxUsers.map(user => [user._id, user]));

    // 4. 组装数据
    const recordInfoList = records.map(rec => {
      const classroom = classroomsMap.get(rec.classroomId);
      const operatorUser = wxUsersMap.get(rec.operatorUserId);
      return {
        _id: rec._id,
        classroomId: rec.classroomId,
        className: classroom?.name || "未知班级",
        content: rec.content,
        points: rec.points,
        operatorName: operatorUser?.userInfo?.name || "未知老师",
        imageCount: rec.images?.length || 0,
        created: rec.created
      };
    });
    return {
      success: true,
      data: recordInfoList
    };
  } catch (error) {
    console.error("获取学情记录失败:", error);
    return {
      success: false,
      data: []
    };
  }
}


export async function getPointsHistoryAction(studentId, limit) {
  try {
    // 1. 获取学生的积分变化记录
    const records = await getStudentPointsHistory(studentId, limit);
    if (records.length === 0) {
      return {
        success: true,
        data: []
      };
    }

    // 2. 获取所有班级信息
    const classroomIds = [...new Set(records.map(rec => rec.classId))];
    const classrooms = await getClassroomsByIds(classroomIds);
    const classroomsMap = new Map(classrooms.map(classroom => [classroom._id, classroom]));

    // 3. 组装数据
    const recordInfoList = records.map(rec => {
      const classroom = classroomsMap.get(rec.classId);
      return {
        _id: rec._id,
        classroomId: rec.classId,
        className: classroom?.name || "未知班级",
        type: rec.type,
        isShowInGrowthPath: rec.isShowInGrowthPath,
        scoreChange: rec.score.score,
        reason: rec.score.reason,
        changeTime: rec.score.time,
        created: rec.created
      };
    });
    return {
      success: true,
      data: recordInfoList
    };
  } catch (error) {
    console.error("获取积分变化记录失败:", error);
    return {
      success: false,
      data: []
    };
  }
}


export async function getExchangeRecordsAction(studentId, limit) {
  try {
    // 1. 获取学生的积分兑换记录
    const records = await getStudentExchangeRecords(studentId, limit);
    if (records.length === 0) {
      return {
        success: true,
        data: []
      };
    }

    // 2. 获取所有班级信息
    const classroomIds = [...new Set(records.map(rec => rec.classroomId))];
    const classrooms = await getClassroomsByIds(classroomIds);
    const classroomsMap = new Map(classrooms.map(classroom => [classroom._id, classroom]));

    // 3. 组装数据
    const recordInfoList = records.map(rec => {
      const classroom = classroomsMap.get(rec.classroomId);
      return {
        _id: rec._id,
        classroomId: rec.classroomId,
        className: classroom?.name || "未知班级",
        itemName: rec.itemName,
        pointsUsed: rec.pointsUsed,
        status: rec.status,
        teacherRemark: rec.teacherRemark,
        created: rec.created
      };
    });
    return {
      success: true,
      data: recordInfoList
    };
  } catch (error) {
    console.error("获取积分兑换记录失败:", error);
    return {
      success: false,
      data: []
    };
  }
}
