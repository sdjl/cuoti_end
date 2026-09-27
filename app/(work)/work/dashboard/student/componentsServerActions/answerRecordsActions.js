"use server";

/**
 * 答卷记录列表组件的 Server Actions
 *
 * 用于 app/(work)/work/dashboard/student/components/AnswerRecordsList.tsx 组件
 *
 * 此文件专门用于处理 AnswerRecordsList 组件所需的数据
 * 获取学生的最近答卷记录，按类型分类
 */
import { getClassroomsByIds, getCoursesByIds, getQuestionPacksByIds, getStudentRecentAnswersByType } from "../datas.js";

/**
 * 答卷记录数据（包含关联信息）
 */


export async function getStudentRecentAnswersByTypeAction(studentId, type, limit = 5) {
  try {
    // 1. 获取学生的最近答卷记录
    const answers = await getStudentRecentAnswersByType(studentId, type, limit);
    if (answers.length === 0) {
      return {
        success: true,
        data: []
      };
    }

    // 2. 提取所有需要查询的ID
    const questionPackIds = [...new Set(answers.map(a => a.questionPackId).filter(id => !!id))];
    const classIds = [...new Set(answers.map(a => a.classId).filter(id => !!id))];
    const courseIds = [...new Set(answers.map(a => a.courseId).filter(id => !!id))];

    // 3. 并行查询所有关联数据
    const [questionPacks, classrooms, courses] = await Promise.all([questionPackIds.length > 0 ? getQuestionPacksByIds(questionPackIds) : Promise.resolve([]), classIds.length > 0 ? getClassroomsByIds(classIds) : Promise.resolve([]), courseIds.length > 0 ? getCoursesByIds(courseIds) : Promise.resolve([])]);

    // 4. 创建映射表
    const questionPackMap = new Map(questionPacks.map(pack => [pack._id, pack]));
    const classroomMap = new Map(classrooms.map(cls => [cls._id, cls]));
    const courseMap = new Map(courses.map(course => [course._id, course]));

    // 5. 组装数据
    const result = answers.map(answer => {
      const questionPack = questionPackMap.get(answer.questionPackId);
      const classroom = classroomMap.get(answer.classId);
      const course = answer.courseId ? courseMap.get(answer.courseId) : null;
      return {
        ...answer,
        questionCount: answer.questionCount || 0,
        questionPackName: questionPack?.name,
        className: classroom?.name,
        courseName: course?.name
      };
    });
    return {
      success: true,
      data: result
    };
  } catch {
    return {
      success: false,
      data: []
    };
  }
}
