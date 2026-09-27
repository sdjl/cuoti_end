"use server";

import { getQuestionPacksByIds } from "../../../../lib/collection/course.js";
import { getTeacherAllClassRooms } from "../../../../lib/work/teacher/myClassroom.js";
import { getCurrentSchoolId } from "../../../../lib/work/teacher/mySchool.js";
import { searchClassIdsByStudentFromDB } from "../classroom/datas.js";
import { getClassCoursesFromDB, getCoursesFromDB } from "./datas.js";

/**
 * 一次性加载所有班级、课程和题集数据（优化版：只做3次数据库查询）
 */
export async function loadAllAnswerDataAction() {
  try {
    // 第1次查询：获取所有班级
    const classrooms = await getTeacherAllClassRooms({
      status: "正常"
    });
    if (classrooms.length === 0) {
      return {
        success: true,
        data: []
      };
    }

    // 收集所有班级ID
    const classIds = classrooms.map(classroom => classroom._id);

    // 第2次查询：一次性获取所有班级的课程关联关系和课程详情

    // 查询班级-课程关联关系，过滤掉已完成的课程
    const classCourseRelations = await getClassCoursesFromDB(classIds);

    // 收集所有唯一的课程ID
    const uniqueCourseIds = [...new Set(classCourseRelations.map(relation => relation.courseId))];
    if (uniqueCourseIds.length === 0) {
      // 如果没有课程，直接返回只有班级的数据
      const classroomsWithCourses = classrooms.map(classroom => ({
        ...classroom,
        courses: []
      }));
      return {
        success: true,
        data: classroomsWithCourses
      };
    }

    // 一次性获取所有课程详情
    const allCourses = await getCoursesFromDB(uniqueCourseIds);

    // 第3次查询：一次性获取所有题集
    // 收集所有课程的题集ID
    const allQuestionPackIds = allCourses.reduce((acc, course) => {
      if (course.questionPackIds && course.questionPackIds.length > 0) {
        acc.push(...course.questionPackIds);
      }
      return acc;
    }, []);
    const uniqueQuestionPackIds = [...new Set(allQuestionPackIds)];
    let allQuestionPacks = [];
    if (uniqueQuestionPackIds.length > 0) {
      allQuestionPacks = await getQuestionPacksByIds(uniqueQuestionPackIds);
    }

    // 数据组装：构建课程到题集的映射
    const questionPacksMap = new Map();
    allQuestionPacks.forEach(pack => {
      questionPacksMap.set(pack._id, pack);
    });

    // 为每个课程添加题集数据
    const coursesWithQuestionPacks = allCourses.map(course => ({
      ...course,
      questionPacks: (course.questionPackIds || []).map(id => questionPacksMap.get(id)).filter(pack => pack !== undefined)
    }));

    // 构建课程映射
    const coursesMap = new Map();
    coursesWithQuestionPacks.forEach(course => {
      coursesMap.set(course._id, course);
    });

    // 构建班级到课程的映射
    const classCoursesMap = new Map();
    classCourseRelations.forEach(relation => {
      const course = coursesMap.get(relation.courseId);
      if (course) {
        // 过滤掉已完成的题集
        const availableQuestionPacks = course.questionPacks.filter(pack => !relation.completedQuestionPackIds.includes(pack._id));

        // 只有当课程还有未完成的题集时才添加到映射中
        if (availableQuestionPacks.length > 0) {
          const courseWithFilteredPacks = {
            ...course,
            questionPacks: availableQuestionPacks
          };
          if (!classCoursesMap.has(relation.classId)) {
            classCoursesMap.set(relation.classId, []);
          }
          classCoursesMap.get(relation.classId).push(courseWithFilteredPacks);
        }
      }
    });

    // 最终组装数据
    const classroomsWithCourses = classrooms.map(classroom => ({
      ...classroom,
      courses: classCoursesMap.get(classroom._id) || []
    }));
    return {
      success: true,
      data: classroomsWithCourses
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "加载数据失败"
    };
  }
}

/**
 * 根据学生姓名或编号搜索班级ID列表
 */
export async function searchClassIdsByStudentAction(studentKeyword) {
  try {
    const schoolId = await getCurrentSchoolId();
    return await searchClassIdsByStudentFromDB(schoolId, studentKeyword);
  } catch (error) {
    console.error("根据学生搜索班级失败:", error);
    return [];
  }
}
