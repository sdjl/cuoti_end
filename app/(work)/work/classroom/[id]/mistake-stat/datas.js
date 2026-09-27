"use server";

import { allDocs, command, getDoc } from "../../../../../../lib/common/database.js";
/**
 * 获取班级信息
 */
export async function getClassRoomById(classId) {
  return await getDoc("classroom", classId);
}

/**
 * 获取班级的课程错题统计数据
 *
 * 查询逻辑：
 * 1. 通过班级ID查询所有 StudentClassDoc 数据，拿到所有学生ID
 * 2. 用 _.in 查询所有学生的 StudentAnswerDoc 数据
 * 3. 拿所有 StudentAnswerDoc._id 去查询所有 StudentAnswerItemDoc 数据
 * 4. 组装统计数据
 */
export async function getClassCourseMistakeStats(classId) {
  try {
    const _ = command();

    // 步骤1：查询班级中的所有学生
    const studentClasses = await allDocs({
      c: "student_class",
      match: {
        classRoomId: classId,
        status: "在读" // 只统计在读学生
      }
    });
    if (studentClasses.length === 0) {
      return [];
    }

    // 提取学生ID列表
    const studentIds = studentClasses.map(sc => sc.studentId);

    // 步骤2：查询所有学生的答卷数据（课程错题）
    const studentAnswers = await allDocs({
      c: "student_answer",
      match: {
        classId: classId,
        studentId: _.in(studentIds)
      },
      only: "_id,studentId"
    });
    if (studentAnswers.length === 0) {
      // 如果没有答卷数据，返回学生列表但统计为0
      const students = await allDocs({
        c: "student",
        match: {
          _id: _.in(studentIds)
        },
        only: "_id,name"
      });
      return students.map(student => ({
        studentId: student._id,
        studentName: student.name,
        mistakeCount: 0,
        correctedCount: 0,
        passRate: 0,
        remainingCount: 0,
        stubbornCount: 0
      }));
    }

    // 提取所有答卷ID
    const answerIds = studentAnswers.map(sa => sa._id);

    // 步骤3：查询所有错题记录
    const mistakeItems = await allDocs({
      c: "student_answer_item",
      match: {
        studentAnswerId: _.in(answerIds)
      },
      only: "_id,studentAnswerId,isCorrectedByMistakeAgain,hasResubmittedAnswer"
    });

    // 步骤4：构建答卷ID到学生ID的映射
    const answerToStudentMap = new Map();
    studentAnswers.forEach(sa => {
      answerToStudentMap.set(sa._id, sa.studentId);
    });

    // 步骤5：统计每个学生的错题数据
    const studentStatsMap = new Map();

    // 初始化所有学生的统计数据
    studentIds.forEach(studentId => {
      studentStatsMap.set(studentId, {
        mistakeCount: 0,
        correctedCount: 0,
        remainingCount: 0,
        stubbornCount: 0
      });
    });

    // 遍历错题记录进行统计
    mistakeItems.forEach(item => {
      const studentId = answerToStudentMap.get(item.studentAnswerId);
      if (!studentId) return;
      const stats = studentStatsMap.get(studentId);
      if (!stats) return;

      // 错题数量
      stats.mistakeCount++;

      // 判断是否重做通过
      if (item.isCorrectedByMistakeAgain === true) {
        stats.correctedCount++;
      } else {
        // 剩余错题
        stats.remainingCount++;

        // 顽固错题：isCorrectedByMistakeAgain=false 且 hasResubmittedAnswer=true
        if (item.hasResubmittedAnswer === true) {
          stats.stubbornCount++;
        }
      }
    });

    // 步骤6：查询学生信息
    const students = await allDocs({
      c: "student",
      match: {
        _id: _.in(studentIds)
      },
      only: "_id,name"
    });

    // 步骤7：组装最终结果
    const result = students.map(student => {
      const stats = studentStatsMap.get(student._id);
      const mistakeCount = stats?.mistakeCount || 0;
      const correctedCount = stats?.correctedCount || 0;
      const passRate = mistakeCount > 0 ? correctedCount / mistakeCount * 100 : 0;
      return {
        studentId: student._id,
        studentName: student.name,
        mistakeCount,
        correctedCount,
        passRate: Math.round(passRate * 10) / 10,
        // 保留一位小数
        remainingCount: stats?.remainingCount || 0,
        stubbornCount: stats?.stubbornCount || 0
      };
    });

    // 按剩余错题数逆序排序
    result.sort((a, b) => b.remainingCount - a.remainingCount);
    return result;
  } catch (error) {
    console.error("获取班级课程错题统计失败:", error);
    throw error;
  }
}

/**
 * 获取班级的自主上传错题统计数据
 *
 * 查询逻辑：
 * 1. 通过班级ID查询所有 StudentClassDoc 数据，拿到所有学生ID
 * 2. 用 _.in 查询所有学生的 ProblemQuestionDoc 数据
 * 3. 根据 ProblemQuestionDoc.isStudentMaster 判断是否已掌握
 * 4. 组装统计数据
 */
export async function getClassSelfUploadMistakeStats(classId) {
  try {
    const _ = command();

    // 步骤1：查询班级中的所有学生
    const studentClasses = await allDocs({
      c: "student_class",
      match: {
        classRoomId: classId,
        status: "在读" // 只统计在读学生
      }
    });
    if (studentClasses.length === 0) {
      return [];
    }

    // 提取学生ID列表
    const studentIds = studentClasses.map(sc => sc.studentId);

    // 步骤2：查询所有学生的自主上传错题
    const problemQuestions = await allDocs({
      c: "problem_question",
      match: {
        classId: classId,
        studentId: _.in(studentIds)
      },
      only: "_id,studentId,isStudentMaster"
    });

    // 步骤3：查询学生信息
    const students = await allDocs({
      c: "student",
      match: {
        _id: _.in(studentIds)
      },
      only: "_id,name"
    });

    // 步骤4：统计每个学生的错题数据
    const studentStatsMap = new Map();

    // 初始化所有学生的统计数据
    studentIds.forEach(studentId => {
      studentStatsMap.set(studentId, {
        mistakeCount: 0,
        masteredCount: 0
      });
    });

    // 遍历自主上传错题进行统计
    problemQuestions.forEach(question => {
      const stats = studentStatsMap.get(question.studentId);
      if (!stats) return;

      // 错题数量
      stats.mistakeCount++;

      // 判断是否已掌握
      if (question.isStudentMaster === true) {
        stats.masteredCount++;
      }
    });

    // 步骤5：组装最终结果
    const result = students.map(student => {
      const stats = studentStatsMap.get(student._id);
      const mistakeCount = stats?.mistakeCount || 0;
      const masteredCount = stats?.masteredCount || 0;
      const masteredRate = mistakeCount > 0 ? masteredCount / mistakeCount * 100 : 0;
      const unmasteredCount = mistakeCount - masteredCount;
      const unmasteredRate = mistakeCount > 0 ? unmasteredCount / mistakeCount * 100 : 0;
      return {
        studentId: student._id,
        studentName: student.name,
        mistakeCount,
        masteredCount,
        masteredRate: Math.round(masteredRate * 10) / 10,
        // 保留一位小数
        unmasteredCount,
        unmasteredRate: Math.round(unmasteredRate * 10) / 10 // 保留一位小数
      };
    });

    // 按未掌握数量逆序排序
    result.sort((a, b) => b.unmasteredCount - a.unmasteredCount);
    return result;
  } catch (error) {
    console.error("获取班级自主上传错题统计失败:", error);
    throw error;
  }
}
