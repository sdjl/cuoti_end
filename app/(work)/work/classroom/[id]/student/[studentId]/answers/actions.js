"use server";

import { assertClassRoomOwnership } from "../../../../../../../../lib/work/teacher/myClassroom.js";
import { getClassCourses } from "../../../../../../../../lib/work/teacher/myCourse.js";
import { deleteStudentAnswerComplete, getMyStudentById, getStudentClasses } from "../../../../../../../../lib/work/teacher/myStudent.js";
import { getAnswerItemsByAnswerIdsFromDB, getClassesByIdsFromDB, getCoursesByIdsFromDB, getQuestionPacksByIdsFromDB, getStudentAnswersFromDB } from "./datas.js";


function buildStudentAnswersWhereCondition(studentId, currentClassId, courseId) {
  const whereCondition = {
    studentId,
    // 关键：必须过滤当前班级的答卷数据
    classId: currentClassId
  };

  // 处理课程ID过滤
  if (courseId !== undefined) {
    if (courseId === null) {
      // 查询没有课程关联的答卷
      whereCondition.$or = [{
        courseId: null
      }, {
        courseId: ""
      }, {
        courseId: {
          $exists: false
        }
      }];
    } else {
      // 查询指定课程的答卷
      whereCondition.courseId = courseId;
    }
  }
  return whereCondition;
}

/**
 * 获取学生答卷列表（所有数据）
 */
export async function getStudentAnswersAction(classId, studentId, {
  courseId
}) {
  try {
    // 验证班级权限
    await assertClassRoomOwnership(classId);

    // 验证学生是否属于该班级
    const student = await getMyStudentById(studentId);
    if (!student) {
      throw new Error("学生不存在");
    }

    // 构建查询条件
    // 注意：始终使用当前页面的 classId 进行过滤，确保只显示当前班级的答卷
    const whereCondition = buildStudentAnswersWhereCondition(studentId, classId,
    // 使用页面的 classId，而不是 filterClassId
    courseId);

    // 获取所有答卷列表，按创建时间倒序排列
    const answers = await getStudentAnswersFromDB(whereCondition);

    // 一次性获取所有答卷对应的错题数量
    const answerIds = answers.map(answer => answer._id);
    const allAnswerItems = await getAnswerItemsByAnswerIdsFromDB(answerIds);

    // 统计每个答卷的错题数量
    const answerItemCounts = allAnswerItems.reduce((acc, item) => {
      acc[item.studentAnswerId] = (acc[item.studentAnswerId] || 0) + 1;
      return acc;
    }, {});

    // 获取所有相关的课程、题集和班级信息
    const courseIds = answers.filter(a => a.courseId).map(a => a.courseId);
    const questionPackIds = answers.map(a => a.questionPackId);
    const classIds = [...new Set(answers.map(a => a.classId))];
    const [courses, questionPacks, classes] = await Promise.all([getCoursesByIdsFromDB(courseIds), getQuestionPacksByIdsFromDB(questionPackIds), getClassesByIdsFromDB(classIds)]);

    // 创建查找映射
    const courseMap = courses.reduce((acc, course) => {
      acc[course._id] = course.name;
      return acc;
    }, {});
    const questionPackMap = questionPacks.reduce((acc, pack) => {
      acc[pack._id] = pack.name;
      return acc;
    }, {});
    const classMap = classes.reduce((acc, cls) => {
      acc[cls._id] = cls.name;
      return acc;
    }, {});

    // 组装最终数据
    const answersWithCount = answers.map(answer => ({
      ...answer,
      questionCount: answerItemCounts[answer._id] || 0,
      courseName: answer.courseId ? courseMap[answer.courseId] : undefined,
      questionPackName: questionPackMap[answer.questionPackId] || undefined,
      className: classMap[answer.classId] || undefined
    }));
    return answersWithCount;
  } catch (error) {
    console.error("获取学生答卷列表失败:", error);
    throw error;
  }
}

/**
 * 删除学生答卷
 */
export async function deleteStudentAnswerAction(classId, studentAnswerId) {
  try {
    // 验证班级权限
    await assertClassRoomOwnership(classId);
    const result = await deleteStudentAnswerComplete(studentAnswerId);
    return result;
  } catch (error) {
    console.error("删除学生答卷失败:", error);
    return {
      success: false,
      deletedItemCount: 0,
      deletedImageCount: 0,
      error: error instanceof Error ? error.message : "删除答卷失败"
    };
  }
}

/**
 * 获取班级课程列表（用于过滤器）
 */
export async function getClassCoursesAction(classId) {
  try {
    // 验证班级权限
    await assertClassRoomOwnership(classId);
    const courses = await getClassCourses(classId);
    return courses;
  } catch (error) {
    console.error("获取班级课程列表失败:", error);
    return [];
  }
}

/**
 * 获取学生信息
 */
export async function getStudentInfoAction(classId, studentId) {
  try {
    // 验证班级权限
    await assertClassRoomOwnership(classId);

    // 获取学生信息
    const student = await getMyStudentById(studentId);
    return {
      student
    };
  } catch (error) {
    console.error("获取学生信息失败:", error);
    return {
      student: null,
      error: error instanceof Error ? error.message : "获取学生信息失败"
    };
  }
}

/**
 * 获取学生班级列表
 */
export async function getStudentClassesAction(classId, studentId) {
  try {
    // 验证班级权限
    await assertClassRoomOwnership(classId);

    // 验证学生是否属于该班级
    const student = await getMyStudentById(studentId);
    if (!student) {
      throw new Error("学生不存在");
    }

    // 获取学生所在的所有班级
    const classes = await getStudentClasses(studentId);
    return {
      classes
    };
  } catch (error) {
    console.error("获取学生班级列表失败:", error);
    return {
      classes: [],
      error: error instanceof Error ? error.message : "获取学生班级列表失败"
    };
  }
}
