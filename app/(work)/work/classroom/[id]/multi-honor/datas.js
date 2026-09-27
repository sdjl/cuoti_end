"use server";

import { addDocList, allDocs, command } from "../../../../../../lib/common/database.js";
import { timestamp } from "../../../../../../lib/common/time.js";


export async function getClassStudents(classRoomId) {
  try {
    // 第一步：使用 allDocs 读取 student_class 中某个班级的所有关系
    const studentClassList = await allDocs({
      c: "student_class",
      match: {
        classRoomId: classRoomId
      }
    });

    // 如果没有学生关系，直接返回空数组
    if (studentClassList.length === 0) {
      return [];
    }

    // 第二步：得到所有学生的 ID
    const studentIds = studentClassList.map(sc => sc.studentId);

    // 第三步：使用 allDocs 和 _.in() 去 student 读取所有学生的数据
    const _ = command();
    const students = await allDocs({
      c: "student",
      match: {
        _id: _.in(studentIds)
      }
    });

    // 第四步：把学生数据和关系关联在一起
    const studentsWithClass = students.map(student => {
      const studentClass = studentClassList.find(sc => sc.studentId === student._id);
      return {
        ...student,
        studentClass: studentClass
      };
    });

    // 按学号排序
    studentsWithClass.sort((a, b) => {
      const codeA = a.studentCode || "";
      const codeB = b.studentCode || "";
      return codeA.localeCompare(codeB);
    });
    return studentsWithClass;
  } catch (error) {
    console.error("获取班级学生失败:", error);
    throw error;
  }
}


export async function getClassRoomInfo(classRoomId) {
  try {
    const classRooms = await allDocs({
      c: "classroom",
      match: {
        _id: classRoomId
      }
    });
    if (classRooms.length === 0) {
      return null;
    }
    return classRooms[0];
  } catch (error) {
    console.error("获取班级信息失败:", error);
    throw error;
  }
}


export async function batchCreateHonors(honorRecords) {
  try {
    const now = timestamp();
    const _ = command();

    // 创建 HonorApplicationDoc 记录
    const honorApplications = honorRecords.map(record => ({
      schoolId: record.schoolId,
      classroomId: record.classroomId,
      studentId: record.studentId,
      openid: "",
      // 老师申请，openid 为空
      honorName: record.honorName,
      teacherRemark: record.teacherRemark,
      status: "completed",
      showInSchoolHonorBoard: record.showInSchoolHonorBoard,
      examScore: record.examScore,
      subject: record.subject,
      examName: record.examName,
      created: now
    }));
    const honorApplicationResult = await addDocList("honor_application", honorApplications);

    // 创建 StudentGrowthDoc 记录
    const studentGrowths = honorRecords.map((record, index) => {
      // 构建描述信息：包含荣誉名称、考试名称（如果有）、分数（如果有）
      let description = `获得荣誉：${record.honorName}`;
      if (record.examName) {
        description += `（${record.examName}）`;
      }
      if (record.examScore !== null) {
        description += ` 考试分数：${record.examScore}分`;
      }
      return {
        schoolId: record.schoolId,
        classId: record.classroomId,
        studentId: record.studentId,
        description,
        type: "获得荣誉",
        isShowInGrowthPath: true,
        data: {
          honorName: record.honorName,
          honorApplicationId: honorApplicationResult.ids[index]
        },
        score: {
          time: now,
          reason: description,
          score: record.points,
          afterScore: record.afterScore // 从外部传入的计算好的积分
        },
        created: now
      };
    });
    const studentGrowthResult = await addDocList("student_growth", studentGrowths);

    // 批量更新学生积分
    // 获取所有唯一学生ID
    const studentIds = [...new Set(honorRecords.map(r => r.studentId))];

    // 读取所有学生当前数据
    const students = await allDocs({
      c: "student",
      match: {
        _id: _.in(studentIds)
      }
    });

    // 创建学生ID到学生数据的映射
    const studentMap = new Map(students.map(s => [s._id, s]));

    // 计算每个学生的总积分增加（按学生分组）
    const studentPointsMap = new Map();
    for (const record of honorRecords) {
      const currentPoints = studentPointsMap.get(record.studentId) || 0;
      studentPointsMap.set(record.studentId, currentPoints + record.points);
    }

    // 顺序更新每个学生的积分（避免并发更新同一学生导致数据不一致）
    const {
      updateDoc
    } = await import("../../../../../../lib/common/database");
    for (const [studentId, totalPoints] of studentPointsMap.entries()) {
      const student = studentMap.get(studentId);
      if (student) {
        const currentScore = student.growthData?.score || 0;
        const newScore = currentScore + totalPoints;
        await updateDoc("student", studentId, {
          growthData: {
            score: newScore
          }
        });
      }
    }
    return {
      success: true,
      honorApplicationIds: honorApplicationResult.ids,
      studentGrowthIds: studentGrowthResult.ids
    };
  } catch (error) {
    console.error("批量创建荣誉失败:", error);
    throw error;
  }
}
