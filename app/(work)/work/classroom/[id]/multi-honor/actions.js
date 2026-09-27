"use server";

import { CONFIG_KEYS } from "../../../../../../lib/config/constants.js";
import { getCurrentUser } from "../../../../../../lib/utils/auth.js";
import { getSetting } from "../../../../../../lib/utils/setting.js";
import { assertClassRoomOwnership } from "../../../../../../lib/work/teacher/myClassroom.js";
import { batchCreateHonors, getClassRoomInfo, getClassStudents } from "./datas.js";

export async function getClassStudentsAction(classRoomId) {
  try {
    // 验证用户登录
    const user = await getCurrentUser();
    if (!user) {
      throw new Error("未登录");
    }

    // 验证权限：用户必须是该班级的老师或校长
    await assertClassRoomOwnership(classRoomId);

    // 获取班级信息
    const classRoom = await getClassRoomInfo(classRoomId);
    if (!classRoom) {
      throw new Error("班级不存在");
    }

    // 获取学生列表
    const students = await getClassStudents(classRoomId);
    return {
      success: true,
      students,
      classRoom
    };
  } catch (error) {
    console.error("获取班级学生失败:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "获取学生列表失败",
      students: [],
      classRoom: null
    };
  }
}


export async function getHonorConfigsAction() {
  try {
    // 验证用户登录
    const user = await getCurrentUser();
    if (!user) {
      throw new Error("未登录");
    }

    // 获取营销配置
    const settings = await getSetting(CONFIG_KEYS.MARKETING_CONFIG);
    const marketingConfig = settings[CONFIG_KEYS.MARKETING_CONFIG];

    // 获取荣誉列表
    const honors = marketingConfig?.pointsSystem?.honor?.honors || [];
    return {
      success: true,
      honors
    };
  } catch (error) {
    console.error("获取荣誉配置失败:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "获取荣誉配置失败",
      honors: []
    };
  }
}


export async function batchCreateHonorsAction(classRoomId, studentHonorData) {
  try {
    // 验证用户登录
    const user = await getCurrentUser();
    if (!user) {
      throw new Error("未登录");
    }

    // 验证权限
    await assertClassRoomOwnership(classRoomId);

    // 获取班级信息
    const classRoom = await getClassRoomInfo(classRoomId);
    if (!classRoom) {
      throw new Error("班级不存在");
    }

    // 获取荣誉配置
    const settings = await getSetting(CONFIG_KEYS.MARKETING_CONFIG);
    const marketingConfig = settings[CONFIG_KEYS.MARKETING_CONFIG];
    const honors = marketingConfig?.pointsSystem?.honor?.honors || [];

    // 过滤出已选择荣誉的学生
    const validHonors = studentHonorData.filter(data => data.honorName);
    if (validHonors.length === 0) {
      return {
        success: false,
        error: "请至少为一个学生选择荣誉"
      };
    }

    // 获取所有学生信息以计算积分
    const students = await getClassStudents(classRoomId);
    const studentsMap = new Map(students.map(student => [student._id, student]));

    // 构建荣誉记录，并计算每个学生的新积分
    const honorRecords = validHonors.map(data => {
      // 查找荣誉配置获取积分
      const honorConfig = honors.find(h => h.name === data.honorName);
      const points = honorConfig?.points || 0;

      // 解析分数
      const examScore = data.score ? parseFloat(data.score) : null;

      // 获取学生当前积分并计算新积分
      const student = studentsMap.get(data.studentId);
      const currentScore = student?.growthData?.score || 0;
      const afterScore = currentScore + points;
      return {
        schoolId: classRoom.schoolId,
        classroomId: classRoomId,
        studentId: data.studentId,
        honorName: data.honorName,
        showInSchoolHonorBoard: data.showInSchoolHonorBoard === "true",
        subject: data.subject,
        examScore,
        examName: data.examName,
        teacherRemark: data.teacherRemark,
        points,
        afterScore
      };
    });

    // 批量创建荣誉
    await batchCreateHonors(honorRecords);
    return {
      success: true,
      count: honorRecords.length
    };
  } catch (error) {
    console.error("批量创建荣誉失败:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "批量创建荣誉失败"
    };
  }
}
