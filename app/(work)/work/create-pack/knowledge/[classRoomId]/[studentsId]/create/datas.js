"use server";

import { getClassRoomById } from "../../../../../../../../lib/collection/classroom.js";
import { getStudentById } from "../../../../../../../../lib/collection/student.js";
import { addDoc, agg, allDocs, command } from "../../../../../../../../lib/common/database.js";
import { timestamp } from "../../../../../../../../lib/common/time.js";

/** 题目数量上限 */
const QUESTION_QUANTITY_LIMIT = 50;


export async function getStudentAndClassroomInfo(studentId, classRoomId) {
  try {
    const [student, classroom] = await Promise.all([getStudentById(studentId), getClassRoomById(classRoomId)]);
    if (!student) {
      return {
        success: false,
        error: "学生不存在"
      };
    }
    if (!classroom) {
      return {
        success: false,
        error: "班级不存在"
      };
    }
    return {
      success: true,
      data: {
        student,
        classroom
      }
    };
  } catch (error) {
    console.error("获取学生和班级信息失败:", error);
    return {
      success: false,
      error: "获取学生和班级信息失败"
    };
  }
}


export async function queryWeakKnowledgePoints(params) {
  try {
    const {
      studentId,
      classId,
      subject,
      startTime,
      endTime
    } = params;
    const _ = command();

    // 第一步：查询学生答卷数据（只要试卷类型的）
    const answerQuery = {
      studentId,
      classId,
      type: "试卷"
    };

    // 如果提供了时间范围，添加时间筛选
    if (startTime && endTime) {
      const start = new Date(startTime).getTime();
      const end = new Date(endTime).getTime();
      answerQuery.created = _.gte(start).and(_.lt(end));
    }
    const studentAnswers = await allDocs({
      c: "student_answer",
      match: answerQuery,
      only: "_id"
    });
    if (studentAnswers.length === 0) {
      return {
        success: true,
        data: []
      };
    }

    // 第二步：查询所有错题记录
    const answerIds = studentAnswers.map(answer => answer._id);
    const studentAnswerItems = await allDocs({
      c: "student_answer_item",
      match: {
        studentAnswerId: _.in(answerIds)
      },
      only: "questionId"
    });
    if (studentAnswerItems.length === 0) {
      return {
        success: true,
        data: []
      };
    }

    // 第三步：查询所有相关题目，获取试卷ID和知识点
    const questionIds = studentAnswerItems.map(item => item.questionId);
    const examQuestionsWithPaper = await allDocs({
      c: "exam_question",
      match: {
        _id: _.in(questionIds)
      },
      only: "examPaperId,knowledgePoints"
    });

    // 获取所有相关试卷信息
    const paperIds = [...new Set(examQuestionsWithPaper.map(q => q.examPaperId))];
    const examPapers = await allDocs({
      c: "exam_paper",
      match: {
        _id: _.in(paperIds),
        subject: subject // 筛选指定科目
      },
      only: "_id"
    });
    const validPaperIds = new Set(examPapers.map(p => p._id));

    // 第五步：统计知识点错误次数
    const knowledgePointCounts = {};
    examQuestionsWithPaper.forEach(question => {
      // 只统计属于指定科目试卷的题目
      if (validPaperIds.has(question.examPaperId) && question.knowledgePoints) {
        question.knowledgePoints.forEach(point => {
          if (point?.trim()) {
            knowledgePointCounts[point] = (knowledgePointCounts[point] || 0) + 1;
          }
        });
      }
    });

    // 转换为数组格式并排序
    const result = Object.entries(knowledgePointCounts).map(([knowledgePoint, mistakeCount]) => ({
      knowledgePoint,
      mistakeCount
    })).sort((a, b) => b.mistakeCount - a.mistakeCount); // 按错误次数降序排列

    return {
      success: true,
      data: result
    };
  } catch (error) {
    console.error("查询薄弱知识点失败:", error);
    return {
      success: false,
      error: "查询薄弱知识点失败"
    };
  }
}


export async function queryQuestions(params) {
  try {
    const {
      studentId,
      classRoomId,
      knowledgePoints,
      filters,
      questionTypes,
      difficultyLevels
    } = params;
    const _ = command();

    // 1. 获取需要过滤的题目ID集合
    const filteredQuestionIds = new Set();

    // 1.1 过滤学生已做过的题目
    if (filters.filterCompletedQuestions) {
      // 查询学生提交过的所有答卷
      const studentAnswers = await allDocs({
        c: "student_answer",
        match: {
          classId: classRoomId,
          studentId: studentId
        },
        only: "questionPackId"
      });
      if (studentAnswers.length > 0) {
        // 获取所有题集ID
        const questionPackIds = studentAnswers.map(answer => answer.questionPackId);

        // 查询关联的题集，获取题目ID
        const questionPacks = await allDocs({
          c: "question_pack",
          match: {
            _id: _.in(questionPackIds)
          },
          only: "questionIds"
        });

        // 收集所有题目ID
        questionPacks.forEach(pack => {
          if (pack.questionIds) {
            pack.questionIds.forEach(questionId => {
              filteredQuestionIds.add(questionId);
            });
          }
        });
      }
    }

    // 1.2 过滤本学期课程题目
    if (filters.filterSemesterCourseQuestions) {
      // 根据班级ID获取所有班级课程
      const classCourses = await allDocs({
        c: "class_course",
        match: {
          classId: classRoomId
        },
        only: "courseId"
      });
      if (classCourses.length > 0) {
        // 获取所有课程ID
        const courseIds = classCourses.map(cc => cc.courseId);

        // 查询关联的课程，获取题集ID
        const courses = await allDocs({
          c: "course",
          match: {
            _id: _.in(courseIds)
          },
          only: "questionPackIds"
        });

        // 获取所有题集ID
        const allQuestionPackIds = [];
        courses.forEach(course => {
          if (course.questionPackIds) {
            allQuestionPackIds.push(...course.questionPackIds);
          }
        });
        if (allQuestionPackIds.length > 0) {
          // 查询关联的题集，获取题目ID
          const questionPacks = await allDocs({
            c: "question_pack",
            match: {
              _id: _.in(allQuestionPackIds)
            },
            only: "questionIds"
          });

          // 收集所有题目ID
          questionPacks.forEach(pack => {
            if (pack.questionIds) {
              pack.questionIds.forEach(questionId => {
                filteredQuestionIds.add(questionId);
              });
            }
          });
        }
      }
    }

    // 1.3 过滤已生成题集中题目
    if (filters.filterGeneratedPackQuestions) {
      // 获取班级信息来获取schoolId
      const classroom = await getClassRoomById(classRoomId);
      if (classroom?.schoolId) {
        // 查询该学生在该学校该班级该科目的知识点类型题集
        const generatedPacks = await allDocs({
          c: "question_pack",
          match: {
            schoolId: classroom.schoolId,
            classId: classRoomId,
            studentId: studentId,
            subject: params.subject,
            type: "知识点"
          },
          only: "questionIds"
        });

        // 收集所有已生成题集中的题目ID
        generatedPacks.forEach(pack => {
          if (pack.questionIds) {
            pack.questionIds.forEach(questionId => {
              filteredQuestionIds.add(questionId);
            });
          }
        });
      }
    }

    // 2. 使用aggregate查询题目(aggregate支持随机获取)
    const result = await agg("exam_question").match({
      // 排除已过滤的题目
      _id: _.nin(Array.from(filteredQuestionIds)),
      // 知识点条件
      knowledgePoints: _.in(knowledgePoints.map(kp => kp.knowledgePoint)),
      // 题目类型条件
      questionType: _.in(questionTypes),
      // 题目难度条件
      difficulty: _.in(difficultyLevels)
    }).project({
      _id: 1,
      examPaperId: 1,
      questionType: 1,
      // 题目类型
      difficulty: 1,
      // 题目难度
      imageUrl: 1,
      // 图片URL
      knowledgePoints: 1 // 知识点
    }).sample({
      size: 500
    }) // 随机获取500道题目
    .end();

    // 获得了最多500道符合条件的随机题目
    const questions = result.data;

    // 3. 根据每一个知识点对题目数量的上限进行限制
    const knowledgePointLimits = new Map(knowledgePoints.map(kp => [kp.knowledgePoint, kp.questionQuantity]));
    const knowledgePointCounts = new Map();
    const filteredQuestions = [];

    // 遍历题目，按知识点数量限制进行筛选
    for (const question of questions) {
      // 检查总数限制
      if (filteredQuestions.length >= QUESTION_QUANTITY_LIMIT) {
        break;
      }
      if (!question.knowledgePoints || question.knowledgePoints.length === 0) {
        continue;
      }

      // 检查题目的每个知识点是否都还有剩余配额
      let canAddQuestion = false;
      for (const kp of question.knowledgePoints) {
        const limit = knowledgePointLimits.get(kp);
        const currentCount = knowledgePointCounts.get(kp) || 0;
        if (limit && currentCount < limit) {
          canAddQuestion = true;
          break;
        }
      }
      if (canAddQuestion) {
        filteredQuestions.push(question);

        // 更新相关知识点的计数
        for (const kp of question.knowledgePoints) {
          if (knowledgePointLimits.has(kp)) {
            knowledgePointCounts.set(kp, (knowledgePointCounts.get(kp) || 0) + 1);
          }
        }
      }
    }

    // 4. 按题目类型和难度排序：选择题、算术题、填空题、解答题
    const typeOrder = ["选择题", "算术题", "填空题", "解答题"];
    const difficultyOrder = ["容易", "未知", "中等", "困难", "超难"];
    const sortedQuestions = filteredQuestions.sort((a, b) => {
      const aTypeIndex = typeOrder.indexOf(a.questionType || "");
      const bTypeIndex = typeOrder.indexOf(b.questionType || "");

      // 首先按题型排序
      // 如果题目类型不在预定义列表中，放到最后
      if (aTypeIndex === -1 && bTypeIndex === -1) {
        // 两个都不在列表中，按难度排序
        const aDiffIndex = difficultyOrder.indexOf(a.difficulty || "");
        const bDiffIndex = difficultyOrder.indexOf(b.difficulty || "");
        if (aDiffIndex === -1 && bDiffIndex === -1) return 0;
        if (aDiffIndex === -1) return 1;
        if (bDiffIndex === -1) return -1;
        return aDiffIndex - bDiffIndex;
      }
      if (aTypeIndex === -1) return 1;
      if (bTypeIndex === -1) return -1;

      // 题型不同，按题型排序
      if (aTypeIndex !== bTypeIndex) {
        return aTypeIndex - bTypeIndex;
      }

      // 题型相同，按难度排序
      const aDiffIndex = difficultyOrder.indexOf(a.difficulty || "");
      const bDiffIndex = difficultyOrder.indexOf(b.difficulty || "");
      if (aDiffIndex === -1 && bDiffIndex === -1) return 0;
      if (aDiffIndex === -1) return 1;
      if (bDiffIndex === -1) return -1;
      return aDiffIndex - bDiffIndex;
    });
    return {
      success: true,
      data: sortedQuestions
    };
  } catch (error) {
    console.error("查询题目失败:", error);
    return {
      success: false,
      error: "查询题目失败"
    };
  }
}


export async function createCustomQuestionPackData(params) {
  try {
    const {
      studentId,
      classRoomId,
      questionIds,
      subject,
      knowledgePointsCount
    } = params;
    if (!questionIds || questionIds.length === 0) {
      return {
        success: false,
        error: "请选择至少一道题目"
      };
    }

    // 获取学生和班级信息
    const [student, classroom] = await Promise.all([getStudentById(studentId), getClassRoomById(classRoomId)]);
    if (!student) {
      return {
        success: false,
        error: "学生信息不存在"
      };
    }
    if (!classroom) {
      return {
        success: false,
        error: "班级信息不存在"
      };
    }

    // 构建题集数据
    const questionPackData = {
      schoolId: classroom.schoolId,
      classId: classRoomId,
      subject: subject,
      studentId: studentId,
      type: "知识点",
      name: `${student.name}-定制题集`,
      description: `${questionIds.length}题；${knowledgePointsCount}个知识点；涉及知识点：${params.knowledgePoints?.map(kp => kp.knowledgePoint).join("、") || "无"}${params.timeRangeDescription ? `；统计日期：${params.timeRangeDescription}` : ""}`,
      questionIds: questionIds,
      created: timestamp()
    };

    // 创建题集
    const questionPackId = await addDoc("question_pack", questionPackData);
    return {
      success: true,
      data: questionPackId
    };
  } catch (error) {
    console.error("创建定制题集失败:", error);
    return {
      success: false,
      error: "创建定制题集失败"
    };
  }
}
