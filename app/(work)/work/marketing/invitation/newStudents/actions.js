"use server";

import { getTeacherAllClassRooms } from "../../../../../../lib/work/teacher/myClassroom.js";
import { addProblemMessages, addProblemQuestions, addProblemSessions, checkStudentCodeExists, createStudentClassRecord, createStudentRecord, createUserStudentRecord, deactivateOtherUserStudents, deleteGuestProblemData, fetchGuestStudents as fetchGuestStudentsFromDatas, getGuestProblemMessages, getGuestProblemQuestions, getGuestProblemSessions, getGuestStudentById, updateGuestStudent, updateGuestStudentAfterConversion, updateTeacherContactStatus } from "./datas.js";

/**
 * 获取新生列表
 */
export async function fetchGuestStudents({
  pageNum = 1,
  pageSize = 20,
  filters
}) {
  try {
    return await fetchGuestStudentsFromDatas({
      pageNum,
      pageSize,
      filters
    });
  } catch (error) {
    console.error("获取新生列表失败:", error);
    throw new Error("获取新生列表失败");
  }
}

/**
 * 更新新生信息
 */
export async function updateGuestStudentInfo(id, studentInfo) {
  try {
    const success = await updateGuestStudent(id, studentInfo);
    if (!success) {
      throw new Error("更新失败");
    }
    return {
      success: true
    };
  } catch (error) {
    console.error("更新新生信息失败:", error);
    throw new Error("更新新生信息失败");
  }
}

/**
 * 更新老师联系状态
 */
export async function updateContactStatus(id, isContacted) {
  try {
    const success = await updateTeacherContactStatus(id, isContacted);
    if (!success) {
      throw new Error("更新失败");
    }
    return {
      success: true
    };
  } catch (error) {
    console.error("更新联系状态失败:", error);
    throw new Error("更新联系状态失败");
  }
}

/**
 * 获取当前用户的班级列表
 */
export async function fetchMyClassRooms() {
  try {
    const result = await getTeacherAllClassRooms({
      status: "正常"
    });
    return {
      success: true,
      data: result
    };
  } catch (error) {
    console.error("获取班级列表失败:", error);
    throw new Error("获取班级列表失败");
  }
}


async function migrateGuestProblemDataToStudent(openid, studentId, classId, schoolId) {
  console.log("开始执行新生错题数据迁移流程...", {
    openid,
    studentId,
    classId,
    schoolId
  });
  try {
    // 获取新生的题目数据（自主上传错题）
    const guestQuestions = await getGuestProblemQuestions(openid);

    // 获取新生的会话数据（AI学习会话）
    const guestSessions = await getGuestProblemSessions(openid);

    // 获取新生的消息数据（会话中的对话消息）
    const guestMessages = await getGuestProblemMessages(openid);

    // 迁移题目数据

    if (guestQuestions.length > 0) {
      // 将新生题目数据转换为正式学生题目数据格式，保持 _id 不变
      const newQuestions = guestQuestions.map(guestQuestion => ({
        // 保持原有的 _id 不变
        _id: guestQuestion._id,
        // 新增正式学生的必需字段
        schoolId,
        // 校园ID
        classId,
        // 班级ID
        studentId,
        // 学生ID
        // 保持原有的题目数据字段（删除 openid 字段）
        subject: guestQuestion.subject,
        // 科目
        knowledgePoints: guestQuestion.knowledgePoints,
        // 知识点
        imagePath: guestQuestion.imagePath,
        // 题目图片路径
        imageUrl: guestQuestion.imageUrl,
        // 题目图片URL
        imageFileID: guestQuestion.imageFileID,
        // 题目图片文件ID
        imageHeight: guestQuestion.imageHeight,
        // 图片高度
        imageWidth: guestQuestion.imageWidth,
        // 图片宽度
        difficulty: guestQuestion.difficulty,
        // 难度等级
        isStudentMaster: guestQuestion.isStudentMaster,
        // 是否已掌握
        masteredTime: guestQuestion.masteredTime,
        // 掌握时间
        created: guestQuestion.created,
        // 保持原创建时间
        // 转换师生对话消息格式
        teacherStudentMessages: guestQuestion.teacherStudentMessages?.map(msg => ({
          created: msg.created,
          role: msg.role,
          content: msg.content
        })),
        isNeedTeacherReply: guestQuestion.isNeedTeacherReply // 是否需要老师回复
      }));

      // 批量插入新的题目记录到正式学生集合（保持原 _id）
      await addProblemQuestions(newQuestions);
    }

    // 迁移会话数据

    if (guestSessions.length > 0) {
      // 将新生会话数据转换为正式学生会话数据格式，保持 _id 不变
      const newSessions = guestSessions.map(guestSession => ({
        // 保持原有的 _id 不变
        _id: guestSession._id,
        // 将 guestProblemQuestionId 改为 problemQuestionId（ID值保持不变，因为题目_id也保持不变）
        problemQuestionId: guestSession.guestProblemQuestionId,
        // 保持原有的会话数据字段（删除 openid 字段）
        status: guestSession.status,
        // 会话状态（active/completed）
        isStudentMaster: guestSession.isStudentMaster,
        // AI认为学生是否已掌握
        created: guestSession.created,
        // 保持原创建时间
        learningAssessment: guestSession.learningAssessment,
        // 学习效果评价
        userUploadedImages: guestSession.userUploadedImages // 用户上传的图片
      }));

      // 批量插入新的会话记录到正式学生集合（保持原 _id）
      await addProblemSessions(newSessions);
    }

    // 迁移消息数据

    if (guestMessages.length > 0) {
      // 将新生消息数据转换为正式学生消息数据格式，保持 _id 不变
      const newMessages = guestMessages.map(guestMessage => ({
        // 保持原有的 _id 不变
        _id: guestMessage._id,
        // sessionId 保持不变（因为会话的_id也保持不变了）
        sessionId: guestMessage.sessionId,
        // 保持原有的消息数据字段（删除 openid 字段）
        role: guestMessage.role,
        // 消息发送者角色（user/assistant/system）
        content: guestMessage.content,
        // 消息内容
        image: guestMessage.image,
        // 学生发送的图片信息
        created: guestMessage.created // 保持原创建时间
      }));

      // 批量插入新的消息记录到正式学生集合（保持原 _id）
      await addProblemMessages(newMessages);
    }

    // 清理原始数据
    // 删除guest_*集合中该用户的所有错题相关数据（但保留guest_student_info记录）
    await deleteGuestProblemData(openid);
  } catch (error) {
    console.error("❌ 新生错题数据迁移过程中发生错误:", error);
    throw new Error(`数据迁移失败: ${error}`);
  }
}


export async function convertToStudent(guestStudentId, studentData) {
  try {
    // 获取新生信息
    const guestStudent = await getGuestStudentById(guestStudentId);
    if (!guestStudent) {
      throw new Error("找不到指定的新生记录，请检查新生ID是否正确");
    }

    // 检查学生编号是否重复
    const isCodeExists = await checkStudentCodeExists(studentData.schoolId, studentData.studentCode);
    if (isCodeExists) {
      throw new Error(`学生编号 "${studentData.studentCode}" 在该校园中已存在，请使用其他编号`);
    }

    // 创建正式学生记录
    const currentTime = Date.now();
    const studentDoc = {
      schoolId: studentData.schoolId,
      // 所属校园
      studentCode: studentData.studentCode,
      // 学生编号
      name: studentData.name,
      // 学生姓名
      birthDate: "",
      // 出生日期（使用空字符串作为默认值）
      ethnicity: "汉族",
      // 民族（使用默认值）
      homeAddress: "",
      // 家庭住址（使用空字符串作为默认值）
      gender: studentData.gender,
      // 性别
      notes: "",
      // 备注信息（使用空字符串作为默认值）
      created: currentTime,
      // 记录创建时间
      updated: currentTime // 记录更新时间
    };
    const studentId = await createStudentRecord(studentDoc);
    if (!studentId) {
      throw new Error("创建学生记录失败，请重试");
    }

    // 建立学生与班级的关系
    const studentClassDoc = {
      studentId,
      // 学生ID
      classRoomId: studentData.classRoomId,
      // 班级ID
      status: "在读" // 学生状态：在读
    };
    const studentClassId = await createStudentClassRecord(studentClassDoc);
    if (!studentClassId) {
      throw new Error("创建学生班级关系失败，请重试");
    }

    // 迁移新生的错题数据
    await migrateGuestProblemDataToStudent(guestStudent.openid,
    // 新生的微信openid
    studentId,
    // 新创建的学生ID
    studentData.classRoomId,
    // 班级ID
    studentData.schoolId // 校园ID
    );

    // 将该openid的其他UserStudentDoc记录的isActive设置为false
    await deactivateOtherUserStudents(guestStudent.openid);

    // 创建UserStudentDoc记录
    const userStudentDoc = {
      _openid: guestStudent.openid,
      // 新生的微信openid
      schoolId: studentData.schoolId,
      // 绑定的学生校园ID
      studentId,
      // 绑定的学生ID
      classRoomId: studentData.classRoomId,
      // 当前切换到的班级ID
      isActive: true,
      // 设为激活状态
      created: currentTime // 创建时间
      // isTeacher 和 teacherWebOpenid 不填写
    };
    const userStudentId = await createUserStudentRecord(userStudentDoc);
    if (!userStudentId) {
      throw new Error("创建用户学生绑定关系失败，请重试");
    }

    // 更新新生记录状态
    const studentInfoAfterConversion = {
      studentId,
      // 转换后的学生ID
      classId: studentData.classRoomId,
      // 所在班级ID
      schoolId: studentData.schoolId // 所在校园ID
    };
    await updateGuestStudentAfterConversion(guestStudentId, studentInfoAfterConversion, guestStudent.isContactedByTeacher);
    return {
      success: true,
      studentId,
      message: "新生已成功转为正式学生，错题数据已完整迁移"
    };
  } catch (error) {
    console.error("❌ 新生转为正式学生过程中发生错误:", error);

    // 根据错误类型提供更具体的错误信息
    let errorMessage = "转为在校生失败";
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    throw new Error(errorMessage);
  }
}
