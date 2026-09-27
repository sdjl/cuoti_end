"use server";

import { getCourseById, getQuestionPacksByIds } from "../../../../../lib/collection/course.js";
import { getTeacherClassRoomById } from "../../../../../lib/work/teacher/myClassroom.js";
import { deleteStudentAnswer, getClassStudents } from "../../../../../lib/work/teacher/myStudent.js";
import { addStudentGrowthInDB, getAnswerItemsByAnswerIdsFromDB, getStudentAnswersFromDB, getStudentFromDB, updateStudentAnswerInDB, updateStudentInDB } from "./datas.js";

/**
 * 获取题集信息
 */
export async function getQuestionPackInfoAction(packId) {
  try {
    const questionPacks = await getQuestionPacksByIds([packId]);
    const questionPack = questionPacks.length > 0 ? questionPacks[0] : null;
    if (!questionPack) {
      return {
        questionPack: null,
        error: "题集不存在"
      };
    }
    return {
      questionPack
    };
  } catch (error) {
    console.error("获取题集信息失败:", error);
    return {
      questionPack: null,
      error: error instanceof Error ? error.message : "获取题集信息失败"
    };
  }
}

/**
 * 获取课程信息
 */
export async function getCourseInfoAction(courseId) {
  try {
    const course = await getCourseById(courseId);
    if (!course) {
      return {
        course: null,
        error: "课程不存在"
      };
    }
    return {
      course
    };
  } catch (error) {
    console.error("获取课程信息失败:", error);
    return {
      course: null,
      error: error instanceof Error ? error.message : "获取课程信息失败"
    };
  }
}

/**
 * 获取班级信息
 */
export async function getClassRoomInfoAction(classId) {
  try {
    const classRoom = await getTeacherClassRoomById(classId);
    if (!classRoom) {
      return {
        classRoom: null,
        error: "班级不存在"
      };
    }
    return {
      classRoom
    };
  } catch (error) {
    console.error("获取班级信息失败:", error);
    return {
      classRoom: null,
      error: error instanceof Error ? error.message : "获取班级信息失败"
    };
  }
}

/**
 * 获取指定班级的所有学生列表
 */
export async function getClassStudentsAction(classRoomId) {
  try {
    // 获取班级学生列表
    return await getClassStudents(classRoomId);
  } catch (error) {
    console.error("获取班级学生列表失败:", error);
    return [];
  }
}

/**
 * 获取学生答卷提交情况
 */
export async function getStudentAnswersAction(classId, courseId, questionPackId) {
  try {
    const studentAnswers = await getStudentAnswersFromDB(classId, courseId, questionPackId);
    return studentAnswers;
  } catch (error) {
    console.error("获取学生答卷失败:", error);
    return [];
  }
}

/**
 * 获取学生答卷的错题统计信息
 */
export async function getStudentAnswerStatsAction(classId, courseId, questionPackId) {
  try {
    // 获取所有学生答卷
    const studentAnswers = await getStudentAnswersAction(classId, courseId, questionPackId);
    if (studentAnswers.length === 0) {
      return {};
    }

    // 获取题集信息以获取总题数
    const questionPackResult = await getQuestionPackInfoAction(questionPackId);
    const totalCount = questionPackResult.questionPack?.questionIds.length || 0;

    // 获取所有答卷ID
    const answerIds = studentAnswers.map(answer => answer._id);

    // 获取所有错题记录
    const answerItems = await getAnswerItemsByAnswerIdsFromDB(answerIds);

    // 按学生ID统计错题信息
    const statsMap = {};

    // 创建答卷ID到学生ID的映射
    const answerToStudentMap = new Map();
    studentAnswers.forEach(answer => {
      answerToStudentMap.set(answer._id, answer.studentId);
    });

    // 初始化每个学生的统计数据
    studentAnswers.forEach(answer => {
      if (!statsMap[answer.studentId]) {
        statsMap[answer.studentId] = {
          wrongCount: 0,
          totalCount: totalCount,
          correctRate: 100,
          missingImageCount: 0
        };
      }
    });

    // 统计每个学生的错题数和缺失图片数
    answerItems.forEach(item => {
      const studentId = answerToStudentMap.get(item.studentAnswerId);
      if (studentId && statsMap[studentId]) {
        statsMap[studentId].wrongCount++;

        // 检查是否缺少图片
        if (!item.imageFileID) {
          statsMap[studentId].missingImageCount++;
        }
      }
    });

    // 计算正确率
    Object.keys(statsMap).forEach(studentId => {
      const stats = statsMap[studentId];
      if (stats.totalCount > 0) {
        const correctCount = stats.totalCount - stats.wrongCount;
        stats.correctRate = Math.round(correctCount / stats.totalCount * 100);
      }
    });
    return statsMap;
  } catch (error) {
    console.error("获取学生答卷统计失败:", error);
    return {};
  }
}

/**
 * 获取未给积分的学生数量
 */
export async function getUnpaidStudentCountAction(classId, courseId, questionPackId) {
  try {
    const studentAnswers = await getStudentAnswersAction(classId, courseId, questionPackId);
    const unpaidCount = studentAnswers.filter(answer => !answer.hasGivenScoreByCorrectCount).length;
    return unpaidCount;
  } catch (error) {
    console.error("获取未给积分学生数量失败:", error);
    return 0;
  }
}

/**
 * 根据正确题数给积分
 */
export async function giveScoreByCorrectCountAction(classId, courseId, questionPackId) {
  try {
    // 获取所有答卷
    const studentAnswers = await getStudentAnswersAction(classId, courseId, questionPackId);

    // 过滤出还没有给过积分的答卷
    const unpaidAnswers = studentAnswers.filter(answer => !answer.hasGivenScoreByCorrectCount);
    if (unpaidAnswers.length === 0) {
      return {
        success: false,
        message: "所有学生都已经给过积分了"
      };
    }

    // 获取题集信息
    const questionPackResult = await getQuestionPackInfoAction(questionPackId);
    const totalCount = questionPackResult.questionPack?.questionIds.length || 0;

    // 获取所有答卷ID
    const answerIds = unpaidAnswers.map(answer => answer._id);

    // 获取所有错题记录
    const answerItems = await getAnswerItemsByAnswerIdsFromDB(answerIds);

    // 统计每个学生的错题数
    const wrongCountMap = new Map();
    answerItems.forEach(item => {
      const count = wrongCountMap.get(item.studentAnswerId) || 0;
      wrongCountMap.set(item.studentAnswerId, count + 1);
    });
    const now = Date.now();
    let totalScoreChange = 0;
    let processedCount = 0;

    // 为每个学生计算积分并创建成长记录
    for (const answer of unpaidAnswers) {
      try {
        const wrongCount = wrongCountMap.get(answer._id) || 0;
        const correctCount = totalCount - wrongCount;
        const scoreChange = correctCount - wrongCount;

        // 获取学生信息以更新积分
        const student = await getStudentFromDB(answer.studentId);
        if (!student) {
          console.error(`学生不存在: ${answer.studentId}`);
          continue;
        }

        // 计算新积分
        const currentScore = student.growthData?.score || 0;
        const newScore = currentScore + scoreChange;

        // 更新学生积分
        await updateStudentInDB(answer.studentId, {
          growthData: {
            score: newScore
          }
        });

        // 创建成长记录
        const growthDoc = {
          schoolId: student.schoolId,
          classId: answer.classId,
          studentId: answer.studentId,
          description: `课程练习：${correctCount}题正确，${wrongCount}题错误`,
          type: "课程练习",
          isShowInGrowthPath: true,
          data: {
            studentAnswerId: answer._id,
            courseId: answer.courseId || "",
            questionPackId: answer.questionPackId,
            correctCount,
            wrongCount,
            totalCount
          },
          score: {
            time: now,
            reason: "课程练习完成",
            score: scoreChange,
            afterScore: newScore
          },
          created: now
        };
        await addStudentGrowthInDB(growthDoc);

        // 标记答卷已给过积分
        await updateStudentAnswerInDB(answer._id, {
          hasGivenScoreByCorrectCount: true,
          scoreGivenAt: now
        });
        totalScoreChange += scoreChange;
        processedCount++;
      } catch (error) {
        console.error(`处理学生 ${answer.studentId} 失败:`, error);
      }
    }
    return {
      success: true,
      message: `成功为 ${processedCount} 个学生发放积分`,
      processedCount,
      totalScoreChange
    };
  } catch (error) {
    console.error("根据正确题数给积分失败:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "给积分失败"
    };
  }
}

/**
 * 删除学生答卷
 */
export async function deleteStudentAnswerAction(studentId, classId, courseId, questionPackId) {
  try {
    const result = await deleteStudentAnswer(studentId, classId, courseId, questionPackId);
    if (result.answerCount === 0) {
      return {
        success: false,
        message: "未找到该学生的答卷数据"
      };
    }
    return {
      success: true,
      message: `已删除 ${result.answerCount} 份答卷和 ${result.itemCount} 个答案条目`,
      deletedCounts: result
    };
  } catch (error) {
    console.error("删除学生答卷失败:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "删除答卷失败"
    };
  }
}
