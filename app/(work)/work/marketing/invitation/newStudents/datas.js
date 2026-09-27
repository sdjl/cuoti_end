import { addDoc, addDocList, allDocs, command, count, docs, getDoc, removeMatch, updateDoc, updateMatch } from "../../../../../../lib/common/database.js";
/**
 * 构建查询条件
 */
function buildGuestStudentQueryConditions({
  searchText = "",
  isContactedByTeacher = "all",
  isConvertedToStudent = "all"
}) {
  const _ = command();

  // 构建所有条件
  const andConditions = [];

  // 按搜索文本过滤（新生姓名、电话、邀请码、邀请人姓名）
  if (searchText.trim()) {
    const searchRegex = new RegExp(searchText.trim(), "i");
    const searchCondition = _.or({
      "studentInfo.studentName": searchRegex
    }, {
      "studentInfo.studentPhone": searchRegex
    }, {
      "inviterInfo.invitationCode": searchRegex
    }, {
      "inviterInfo.inviterStudentName": searchRegex
    }, {
      "inviterInfo.inviterStudentCode": searchRegex
    });
    andConditions.push(searchCondition);
  }

  // 按老师是否联系过筛选
  if (isContactedByTeacher !== "all") {
    andConditions.push({
      isContactedByTeacher: isContactedByTeacher === "contacted"
    });
  }

  // 按是否已转为在校生筛选
  if (isConvertedToStudent !== "all") {
    if (isConvertedToStudent === "converted") {
      andConditions.push({
        studentInfoAfterBecomeStudent: _.exists(true)
      });
    } else {
      andConditions.push({
        studentInfoAfterBecomeStudent: _.exists(false)
      });
    }
  }

  // 如果有多个条件，使用 and 组合；如果只有一个条件，直接返回；如果没有条件，返回空对象
  if (andConditions.length === 0) {
    return {};
  } else if (andConditions.length === 1) {
    return andConditions[0];
  } else {
    return _.and(...andConditions);
  }
}

/**
 * 获取新生列表（分页）
 */
export async function fetchGuestStudents({
  pageNum = 1,
  pageSize = 20,
  filters
}) {
  const where = buildGuestStudentQueryConditions(filters);
  try {
    // 获取总数
    const totalCount = await count("guest_student_info", where);

    // 获取分页数据
    const students = await docs({
      c: "guest_student_info",
      w: where,
      pageNum: pageNum - 1,
      // docs函数的pageNum从0开始
      pageSize,
      orderBy: {
        created: -1
      } // 按创建时间倒序
    });
    const totalPages = Math.ceil(totalCount / pageSize);
    return {
      students,
      totalCount,
      totalPages
    };
  } catch (error) {
    console.error("获取新生列表失败:", error);
    return {
      students: [],
      totalCount: 0,
      totalPages: 0
    };
  }
}

/**
 * 更新新生信息
 */
export async function updateGuestStudent(id, studentInfo) {
  try {
    const updateData = {
      updated: Date.now()
    };

    // 构建嵌套字段更新
    if (studentInfo.studentName !== undefined) {
      updateData["studentInfo.studentName"] = studentInfo.studentName;
    }
    if (studentInfo.studentPhone !== undefined) {
      updateData["studentInfo.studentPhone"] = studentInfo.studentPhone;
    }
    if (studentInfo.schoolName !== undefined) {
      updateData["studentInfo.schoolName"] = studentInfo.schoolName;
    }
    if (studentInfo.grade !== undefined) {
      updateData["studentInfo.grade"] = studentInfo.grade;
    }
    if (studentInfo.personalNote !== undefined) {
      updateData["studentInfo.personalNote"] = studentInfo.personalNote;
    }
    return await updateDoc("guest_student_info", id, updateData);
  } catch (error) {
    console.error("更新新生信息失败:", error);
    return false;
  }
}

/**
 * 更新老师联系状态
 */
export async function updateTeacherContactStatus(id, isContacted) {
  try {
    const updateData = {
      isContactedByTeacher: isContacted,
      updated: Date.now()
    };
    if (isContacted) {
      updateData.teacherContactTime = Date.now();
    }
    return await updateDoc("guest_student_info", id, updateData);
  } catch (error) {
    console.error("更新老师联系状态失败:", error);
    return false;
  }
}


export async function checkStudentCodeExists(schoolId, studentCode) {
  try {
    const existingStudents = await docs({
      c: "student",
      w: {
        schoolId,
        studentCode
      },
      pageSize: 1
    });
    return existingStudents.length > 0;
  } catch (error) {
    console.error("检查学生编号是否存在失败:", error);
    return false;
  }
}


export async function createStudentRecord(studentData) {
  try {
    return await addDoc("student", studentData);
  } catch (error) {
    console.error("创建学生记录失败:", error);
    return null;
  }
}


export async function createStudentClassRecord(studentClassData) {
  try {
    return await addDoc("student_class", studentClassData);
  } catch (error) {
    console.error("创建学生班级关系记录失败:", error);
    return null;
  }
}


export async function getGuestStudentById(guestStudentId) {
  try {
    return await getDoc("guest_student_info", guestStudentId);
  } catch (error) {
    console.error("获取新生信息失败:", error);
    return null;
  }
}


export async function getGuestProblemQuestions(openid) {
  try {
    return await allDocs({
      c: "guest_problem_question",
      match: {
        openid
      }
    });
  } catch (error) {
    console.error("获取新生题目数据失败:", error);
    return [];
  }
}


export async function getGuestProblemSessions(openid) {
  try {
    return await allDocs({
      c: "guest_problem_session",
      match: {
        openid
      }
    });
  } catch (error) {
    console.error("获取新生会话数据失败:", error);
    return [];
  }
}


export async function getGuestProblemMessages(openid) {
  try {
    return await allDocs({
      c: "guest_problem_session_message",
      match: {
        openid
      }
    });
  } catch (error) {
    console.error("获取新生消息数据失败:", error);
    return [];
  }
}


export async function addProblemQuestions(questions) {
  try {
    return await addDocList("problem_question", questions);
  } catch (error) {
    console.error("批量添加题目记录失败:", error);
    return {
      ids: [],
      len: 0
    };
  }
}


export async function addProblemSessions(sessions) {
  try {
    return await addDocList("problem_session", sessions);
  } catch (error) {
    console.error("批量添加会话记录失败:", error);
    return {
      ids: [],
      len: 0
    };
  }
}


export async function addProblemMessages(messages) {
  try {
    return await addDocList("problem_session_message", messages);
  } catch (error) {
    console.error("批量添加消息记录失败:", error);
    return {
      ids: [],
      len: 0
    };
  }
}


export async function deleteGuestProblemData(openid) {
  try {
    const deletedQuestions = await removeMatch("guest_problem_question", {
      openid
    });
    const deletedSessions = await removeMatch("guest_problem_session", {
      openid
    });
    const deletedMessages = await removeMatch("guest_problem_session_message", {
      openid
    });
    return {
      deletedQuestions,
      deletedSessions,
      deletedMessages
    };
  } catch (error) {
    console.error("删除新生错题数据失败:", error);
    return {
      deletedQuestions: 0,
      deletedSessions: 0,
      deletedMessages: 0
    };
  }
}


export async function deactivateOtherUserStudents(openid) {
  try {
    return await updateMatch("user_student", {
      _openid: openid,
      isActive: true
    }, {
      isActive: false
    });
  } catch (error) {
    console.error("取消其他学生激活状态失败:", error);
    return 0;
  }
}


export async function createUserStudentRecord(userStudentData) {
  try {
    return await addDoc("user_student", userStudentData);
  } catch (error) {
    console.error("创建用户学生绑定记录失败:", error);
    return null;
  }
}


export async function updateGuestStudentAfterConversion(guestStudentId, studentInfo, isContactedByTeacher) {
  try {
    const currentTime = Date.now();
    const updateData = {
      studentInfoAfterBecomeStudent: studentInfo,
      updated: currentTime
    };

    // 如果当前未被老师联系，则更新联系状态
    if (!isContactedByTeacher) {
      updateData.isContactedByTeacher = true;
      updateData.teacherContactTime = currentTime;
    }
    return await updateDoc("guest_student_info", guestStudentId, updateData);
  } catch (error) {
    console.error("更新新生记录失败:", error);
    return false;
  }
}
