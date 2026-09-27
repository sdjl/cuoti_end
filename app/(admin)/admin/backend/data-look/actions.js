"use server";

import { getAdminWxUsersFromDB, getClassCoursesByCourseIdFromDB, getClassCoursesFromDB, getClassroomDocFromDB, getClassroomsBySchoolIdFromDB, getCourseDocFromDB, getExamPaperDocFromDB, getMistakePointDocFromDB, getQuestionDocFromDB, getQuestionPackDocFromDB, getQuestionsFromDB, getSchoolDocFromDB, getStudentClassesFromDB, getStudentDocFromDB, getUserDocFromDB, getWxUserDocFromDB } from "./datas.js";

/**
 * 查询试卷数据
 */
export async function getExamPaperById(id) {
  try {
    const data = await getExamPaperDocFromDB(id);
    return {
      success: true,
      data: data
    };
  } catch (error) {
    console.error("获取试卷数据失败:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "未知错误"
    };
  }
}

/**
 * 查询班级数据及关联信息
 */
export async function getClassroomById(id) {
  try {
    const classroom = await getClassroomDocFromDB(id);
    if (!classroom) {
      return {
        success: true,
        data: null
      };
    }

    // 查询关联的校园信息
    const school = await getSchoolDocFromDB(classroom.schoolId);

    // 查询班级使用的课程
    const classCourses = await getClassCoursesFromDB(id);

    // 查询课程详情
    const courseIds = classCourses.map(cc => cc.courseId);
    const courses = [];
    for (const courseId of courseIds) {
      const course = await getCourseDocFromDB(courseId);
      if (course) {
        courses.push(course);
      }
    }
    return {
      success: true,
      data: {
        classroom: classroom,
        school: school,
        courses: courses,
        classCourses: classCourses
      }
    };
  } catch (error) {
    console.error("获取班级数据失败:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "未知错误"
    };
  }
}

/**
 * 查询学生数据及关联信息
 */
export async function getStudentById(id) {
  try {
    const student = await getStudentDocFromDB(id);
    if (!student) {
      return {
        success: true,
        data: null
      };
    }

    // 查询关联的校园信息
    const school = await getSchoolDocFromDB(student.schoolId);

    // 查询学生的班级关系
    const studentClasses = await getStudentClassesFromDB(id);

    // 查询班级详情
    const classIds = studentClasses.map(sc => sc.classRoomId);
    const classrooms = [];
    for (const classId of classIds) {
      const classroom = await getClassroomDocFromDB(classId);
      if (classroom) {
        classrooms.push(classroom);
      }
    }
    return {
      success: true,
      data: {
        student: student,
        school: school,
        classrooms: classrooms,
        studentClasses: studentClasses
      }
    };
  } catch (error) {
    console.error("获取学生数据失败:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "未知错误"
    };
  }
}

/**
 * 查询题目数据及关联信息
 */
export async function getQuestionById(id) {
  try {
    const question = await getQuestionDocFromDB(id);
    if (!question) {
      return {
        success: true,
        data: null
      };
    }

    // 查询关联的试卷信息
    const examPaper = await getExamPaperDocFromDB(question.examPaperId);
    return {
      success: true,
      data: {
        question: question,
        examPaper: examPaper
      }
    };
  } catch (error) {
    console.error("获取题目数据失败:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "未知错误"
    };
  }
}

/**
 * 查询课程数据及关联信息
 */
export async function getCourseById(id) {
  try {
    const course = await getCourseDocFromDB(id);
    if (!course) {
      return {
        success: true,
        data: null
      };
    }

    // 查询关联的校园信息
    const school = await getSchoolDocFromDB(course.schoolId);

    // 查询使用该课程的班级
    const classCourses = await getClassCoursesByCourseIdFromDB(id);

    // 查询班级详情
    const classIds = classCourses.map(cc => cc.classId);
    const classrooms = [];
    for (const classId of classIds) {
      const classroom = await getClassroomDocFromDB(classId);
      if (classroom) {
        classrooms.push(classroom);
      }
    }
    return {
      success: true,
      data: {
        course: course,
        school: school,
        classrooms: classrooms,
        classCourses: classCourses
      }
    };
  } catch (error) {
    console.error("获取课程数据失败:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "未知错误"
    };
  }
}

/**
 * 查询错误归因数据
 */
export async function getMistakePointById(id) {
  try {
    const data = await getMistakePointDocFromDB(id);
    return {
      success: true,
      data: data
    };
  } catch (error) {
    console.error("获取错误归因数据失败:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "未知错误"
    };
  }
}

/**
 * 查询题集数据及关联信息
 */
export async function getQuestionPackById(id) {
  try {
    const questionPack = await getQuestionPackDocFromDB(id);
    if (!questionPack) {
      return {
        success: true,
        data: null
      };
    }

    // 查询关联的校园信息（如果schoolId不为null）
    let school = null;
    const schoolId = questionPack.schoolId;
    if (schoolId) {
      school = await getSchoolDocFromDB(schoolId);
    }

    // 查询题集中的题目信息
    const questionIds = questionPack.questionIds || [];
    const questions = await getQuestionsFromDB(questionIds);
    return {
      success: true,
      data: {
        questionPack: questionPack,
        school: school,
        questions: questions
      }
    };
  } catch (error) {
    console.error("获取题集数据失败:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "未知错误"
    };
  }
}

/**
 * 查询校园数据及关联信息
 */
export async function getSchoolById(id) {
  try {
    const school = await getSchoolDocFromDB(id);
    if (!school) {
      return {
        success: true,
        data: null
      };
    }

    // 查询校园的班级
    const classrooms = await getClassroomsBySchoolIdFromDB(id);

    // 查询校长用户信息（从wx_user集合，使用openid字段匹配）
    const adminOpenids = school.adminOpenids || [];
    const adminUsers = await getAdminWxUsersFromDB(adminOpenids);
    return {
      success: true,
      data: {
        school: school,
        classrooms: classrooms,
        adminUsers: adminUsers
      }
    };
  } catch (error) {
    console.error("获取校园数据失败:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "未知错误"
    };
  }
}

/**
 * 查询用户数据
 */
export async function getUserById(id) {
  try {
    const data = await getUserDocFromDB(id);
    return {
      success: true,
      data: data
    };
  } catch (error) {
    console.error("获取用户数据失败:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "未知错误"
    };
  }
}

/**
 * 查询微信用户数据
 */
export async function getWxUserById(id) {
  try {
    const data = await getWxUserDocFromDB(id);
    return {
      success: true,
      data: data
    };
  } catch (error) {
    console.error("获取微信用户数据失败:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "未知错误"
    };
  }
}
