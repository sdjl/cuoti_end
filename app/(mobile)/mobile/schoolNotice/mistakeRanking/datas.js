"use server";

import { allDocs, command } from "../../../../../lib/common/database.js";
import { firstDayOfMonth, firstDayOfWeek } from "../../../../../lib/common/time.js";
import { DISPLAY_TEXT } from "../../../../../lib/config/constants.js";

// 数据库集合名称常量
const COLLECTION_NAMES = {
  STUDENT: "student",
  CLASS_ROOM: "classroom",
  STUDENT_CLASS: "student_class",
  STUDENT_ANSWER: "student_answer",
  STUDENT_ANSWER_ITEM: "student_answer_item"
};

export async function getMistakeRankingData(schoolId, grade, timeRange = "month") {
  // 计算时间范围
  const startDateStr = timeRange === "month" ? firstDayOfMonth() : firstDayOfWeek();
  const startTimestamp = new Date(`${startDateStr} 00:00:00`).getTime();
  const _ = command();
  try {
    // 1. 根据校园ID和年级获得所有符合条件的班级 ClassRoomDoc 数据
    const classRooms = await allDocs({
      c: COLLECTION_NAMES.CLASS_ROOM,
      match: {
        schoolId,
        grade,
        status: "正常"
      },
      only: "_id"
    });
    if (classRooms.length === 0) {
      return [];
    }
    const classIds = classRooms.map(cls => cls._id);

    // 2. 根据班级ID获得所有 StudentClassDoc数据，拿到所有学生的ID
    const studentClassRels = await allDocs({
      c: COLLECTION_NAMES.STUDENT_CLASS,
      match: {
        classRoomId: _.in(classIds),
        status: "在读"
      },
      only: "studentId"
    });
    if (studentClassRels.length === 0) {
      return [];
    }
    const studentIds = studentClassRels.map(rel => rel.studentId);

    // 3. 根据学生ID列表和时间区间获得所有 StudentAnswerDoc 数据
    const studentAnswers = await allDocs({
      c: COLLECTION_NAMES.STUDENT_ANSWER,
      match: {
        studentId: _.in(studentIds),
        created: _.gte(startTimestamp)
      },
      only: "_id,studentId"
    });
    if (studentAnswers.length === 0) {
      return [];
    }
    const studentAnswerIds = studentAnswers.map(answer => answer._id);

    // 4. 根据所有的StudentAnswerDoc._id列表，读取所有isCorrectedByMistakeAgain=true的 StudentAnswerItemDoc数据
    const studentAnswerItems = await allDocs({
      c: COLLECTION_NAMES.STUDENT_ANSWER_ITEM,
      match: {
        studentAnswerId: _.in(studentAnswerIds),
        isCorrectedByMistakeAgain: true
      },
      only: "studentAnswerId"
    });

    // 5. 统计每一个学生在这个时间区间内完成了多少个课程错题（即isCorrectedByMistakeAgain=true）的数据
    const studentAnswerIdToStudentId = new Map();
    studentAnswers.forEach(answer => {
      const answerDoc = answer;
      studentAnswerIdToStudentId.set(answerDoc._id, answerDoc.studentId);
    });
    const studentCorrectedCountMap = new Map();
    studentAnswerItems.forEach(item => {
      const itemDoc = item;
      const studentId = studentAnswerIdToStudentId.get(itemDoc.studentAnswerId);
      if (studentId) {
        const count = studentCorrectedCountMap.get(studentId) || 0;
        studentCorrectedCountMap.set(studentId, count + 1);
      }
    });

    // 获取学生信息，包括积分数据
    const students = await allDocs({
      c: COLLECTION_NAMES.STUDENT,
      match: {
        _id: _.in(studentIds)
      },
      only: "_id,name,growthData"
    });

    // 6. 构建完整的排行榜数据
    const rankingData = students.map(student => {
      const studentDoc = student;
      const correctedCount = studentCorrectedCountMap.get(studentDoc._id) || 0;
      const score = studentDoc.growthData?.score || 0;
      return {
        studentId: studentDoc._id,
        studentName: studentDoc.name,
        correctedCount,
        score,
        rank: 0 // 稍后设置排名
      };
    });

    // 7. 排序：首先用课程错题通过的题目数量排序，如果题目数量一样，就使用积分排序
    rankingData.sort((a, b) => {
      if (b.correctedCount !== a.correctedCount) {
        return b.correctedCount - a.correctedCount;
      }
      // 如果错题数量相同，按积分降序
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      // 如果积分也相同，按学生ID排序保证稳定性
      return a.studentId.localeCompare(b.studentId);
    });

    // 设置排名
    rankingData.forEach((item, index) => {
      item.rank = index + 1;
    });
    return rankingData;
  } catch (error) {
    console.error(`获取年级${DISPLAY_TEXT.COURSE_MISTAKE}排行榜数据失败:`, error);
    throw error;
  }
}
