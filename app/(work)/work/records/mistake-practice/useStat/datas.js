import { getStudentsByClassRoom } from "../../../../../../lib/collection/student.js";
import { allDocs, command } from "../../../../../../lib/common/database.js";

/** 不要在此页面中查询整个校园的数据，以免影响性能 */

export async function getMistakePracticeStatistics(filter) {
  try {
    // 构建查询条件
    const matchConditions = {};
    const _ = command();

    // 添加时间过滤条件
    if (filter?.timeRange && filter.timeRange !== "all") {
      if (filter.timeRange === "custom" && filter.startDate && filter.endDate) {
        // 自定义时间区间
        const startTimestamp = filter.startDate.getTime();
        const endTimestamp = filter.endDate.getTime() + 24 * 60 * 60 * 1000 - 1; // 包含结束日期的整天
        matchConditions.created = _.gte(startTimestamp).and(_.lte(endTimestamp));
      } else if (filter.startDate && filter.endDate) {
        // 预设时间范围
        const startTimestamp = filter.startDate.getTime();
        const endTimestamp = filter.endDate.getTime() + 24 * 60 * 60 * 1000 - 1; // 包含结束日期的整天
        matchConditions.created = _.gte(startTimestamp).and(_.lte(endTimestamp));
      }
    }
    if (filter) {
      switch (filter.scope) {
        case "classroom":
          if (filter.classRoomId) {
            // 获取该班级的所有学生ID（包括所有状态的学生）
            const students = await getStudentsByClassRoom(filter.classRoomId);
            const studentIds = students.map(s => s._id);
            if (studentIds.length > 0) {
              // 查询这些学生的错题记录，需要先获取这些学生的studentAnswerId
              const studentAnswers = await allDocs({
                c: "student_answer",
                match: {
                  classId: filter.classRoomId,
                  studentId: {
                    $in: studentIds
                  }
                }
              });
              const studentAnswerIds = studentAnswers.map(sa => sa._id);
              if (studentAnswerIds.length > 0) {
                matchConditions.studentAnswerId = {
                  $in: studentAnswerIds
                };
              } else {
                // 如果没有答卷记录，返回空统计
                return {
                  totalQuestions: 0,
                  correctedCount: 0,
                  uncorrectedCount: 0
                };
              }
            } else {
              // 如果班级没有学生，返回空统计
              return {
                totalQuestions: 0,
                correctedCount: 0,
                uncorrectedCount: 0
              };
            }
          } else {
            // 如果没有选择班级，返回空统计
            return {
              totalQuestions: 0,
              correctedCount: 0,
              uncorrectedCount: 0
            };
          }
          break;
        case "student":
          if (filter.studentId && filter.classRoomId) {
            // 查询特定学生在特定班级的错题记录
            const studentAnswers = await allDocs({
              c: "student_answer",
              match: {
                classId: filter.classRoomId,
                studentId: filter.studentId
              }
            });
            const studentAnswerIds = studentAnswers.map(sa => sa._id);
            if (studentAnswerIds.length > 0) {
              matchConditions.studentAnswerId = {
                $in: studentAnswerIds
              };
            } else {
              // 如果没有答卷记录，返回空统计
              return {
                totalQuestions: 0,
                correctedCount: 0,
                uncorrectedCount: 0
              };
            }
          } else {
            // 如果没有选择学生或班级，返回空统计
            return {
              totalQuestions: 0,
              correctedCount: 0,
              uncorrectedCount: 0
            };
          }
          break;
      }
    }

    // 获取StudentAnswerItemDoc文档
    const studentAnswerItems = await allDocs({
      c: "student_answer_item",
      match: matchConditions
    });
    const totalQuestions = studentAnswerItems.length;

    // 统计通过课程错题的题目数量
    const correctedCount = studentAnswerItems.filter(item => item.isCorrectedByMistakeAgain === true).length;

    // 统计未通过的题目数量
    const uncorrectedCount = totalQuestions - correctedCount;
    return {
      totalQuestions,
      correctedCount,
      uncorrectedCount
    };
  } catch (error) {
    console.error("获取错题统计数据失败:", error);
    throw new Error("获取错题统计数据失败");
  }
}

/**
 * 获取班级学生统计数据
 */
export async function getStudentStatistics(classRoomId, filter) {
  try {
    // 获取班级所有学生
    const students = await getStudentsByClassRoom(classRoomId);
    if (students.length === 0) {
      return [];
    }
    const studentIds = students.map(s => s._id);

    // 一次性获取所有学生的答卷记录
    const studentAnswers = await allDocs({
      c: "student_answer",
      match: {
        classId: classRoomId,
        studentId: {
          $in: studentIds
        }
      }
    });
    const studentAnswerIds = studentAnswers.map(sa => sa._id);
    if (studentAnswerIds.length === 0) {
      // 如果没有答卷记录，返回所有学生的空统计
      return students.map(student => ({
        studentId: student._id,
        studentName: student.name,
        studentCode: student.studentCode,
        totalQuestions: 0,
        correctedCount: 0,
        uncorrectedCount: 0
      }));
    }

    // 构建时间过滤条件
    const matchConditions = {
      studentAnswerId: {
        $in: studentAnswerIds
      }
    };

    // 添加时间过滤条件
    if (filter?.timeRange && filter.timeRange !== "all") {
      const _ = command();
      if (filter.timeRange === "custom" && filter.startDate && filter.endDate) {
        // 自定义时间区间
        const startTimestamp = filter.startDate.getTime();
        const endTimestamp = filter.endDate.getTime() + 24 * 60 * 60 * 1000 - 1;
        matchConditions.created = _.gte(startTimestamp).and(_.lte(endTimestamp));
      } else if (filter.startDate && filter.endDate) {
        // 预设时间范围
        const startTimestamp = filter.startDate.getTime();
        const endTimestamp = filter.endDate.getTime() + 24 * 60 * 60 * 1000 - 1;
        matchConditions.created = _.gte(startTimestamp).and(_.lte(endTimestamp));
      }
    }

    // 一次性获取所有错题练习记录
    const studentAnswerItems = await allDocs({
      c: "student_answer_item",
      match: matchConditions
    });

    // 创建学生答卷ID到学生ID的映射
    const answerToStudentMap = new Map();
    studentAnswers.forEach(sa => {
      answerToStudentMap.set(sa._id, sa.studentId);
    });

    // 按学生ID分组统计错题数据
    const studentStatsMap = new Map();
    studentAnswerItems.forEach(item => {
      const studentId = answerToStudentMap.get(item.studentAnswerId);
      if (studentId) {
        if (!studentStatsMap.has(studentId)) {
          studentStatsMap.set(studentId, {
            total: 0,
            corrected: 0
          });
        }
        const stats = studentStatsMap.get(studentId);
        stats.total++;
        if (item.isCorrectedByMistakeAgain === true) {
          stats.corrected++;
        }
      }
    });

    // 生成最终结果，按错题总数从高到低排序
    const result = students.map(student => {
      const stats = studentStatsMap.get(student._id) || {
        total: 0,
        corrected: 0
      };
      return {
        studentId: student._id,
        studentName: student.name,
        studentCode: student.studentCode,
        totalQuestions: stats.total,
        correctedCount: stats.corrected,
        uncorrectedCount: stats.total - stats.corrected
      };
    });

    // 按错题总数从高到低排序
    result.sort((a, b) => b.totalQuestions - a.totalQuestions);
    return result;
  } catch (error) {
    console.error("获取学生统计数据失败:", error);
    throw new Error("获取学生统计数据失败");
  }
}
