"use server";

import { addDoc, command, count, docs, getDoc, removeDoc, updateDoc } from "../common/database.js";
import { timestamp } from "../common/time.js";

// 数据库集合名称常量
const QUIZ_COLLECTION = "quiz";


export async function buildQuizWhereCondition({
  keyword = "",
  schoolId = "",
  subject = "all",
  grade = "all",
  status = "all",
  teamEnabled = "all",
  activityStatus = "all"
} = {}) {
  const _ = command();
  const orList = [];
  const andList = [];

  // 关键词搜索（口述核心知识点标题、描述）
  if (keyword.trim()) {
    const searchRegex = new RegExp(keyword.trim(), "i");
    orList.push({
      title: searchRegex
    }, {
      description: searchRegex
    });
  }

  // 学校ID筛选
  if (schoolId) {
    andList.push({
      schoolId
    });
  }

  // 科目筛选
  if (subject && subject !== "all") {
    andList.push({
      subject
    });
  }

  // 年级筛选
  if (grade && grade !== "all") {
    andList.push({
      grade
    });
  }

  // 状态筛选
  if (status && status !== "all") {
    andList.push({
      status
    });
  }

  // 组队功能筛选
  if (teamEnabled && teamEnabled !== "all") {
    if (teamEnabled === "enabled") {
      andList.push({
        teamEnabled: true
      });
    } else if (teamEnabled === "disabled") {
      andList.push({
        teamEnabled: _.neq(true)
      });
    }
  }

  // 活动状态筛选
  if (activityStatus && activityStatus !== "all") {
    const now = Date.now();
    if (activityStatus === "ongoing") {
      // 进行中：组队功能开启且(没有结束时间或结束时间在未来)
      andList.push({
        teamEnabled: true,
        $or: [{
          teamEndTime: {
            $exists: false
          }
        }, {
          teamEndTime: null
        }, {
          teamEndTime: _.gt(now)
        }]
      });
    } else if (activityStatus === "ended") {
      // 已结束：组队功能开启且有结束时间且结束时间在过去
      andList.push({
        teamEnabled: true,
        teamEndTime: {
          $exists: true,
          $ne: null,
          $lte: now
        }
      });
    } else if (activityStatus === "no-time") {
      // 无时间限制：组队功能开启但没有设置结束时间
      andList.push({
        teamEnabled: true,
        $or: [{
          teamEndTime: {
            $exists: false
          }
        }, {
          teamEndTime: null
        }]
      });
    }
  }

  // 构建最终的查询条件
  let where = {};
  if (orList.length > 0 && andList.length > 0) {
    where = _.and(_.or(...orList), ...andList);
  } else if (orList.length > 0) {
    where = _.or(...orList);
  } else if (andList.length > 0) {
    where = _.and(...andList);
  }
  return where;
}


export async function getQuizzes({
  pageNum = 0,
  pageSize = 20,
  keyword = "",
  schoolId = "",
  subject = "all",
  grade = "all",
  status = "all",
  teamEnabled = "all",
  activityStatus = "all"
} = {}) {
  const where = await buildQuizWhereCondition({
    keyword,
    schoolId,
    subject,
    grade,
    status,
    teamEnabled,
    activityStatus
  });
  return docs({
    c: QUIZ_COLLECTION,
    w: where,
    pageNum,
    pageSize,
    orderBy: {
      created: -1
    }
  });
}


export async function getQuizzesCount({
  keyword = "",
  schoolId = "",
  subject = "all",
  grade = "all",
  status = "all",
  teamEnabled = "all",
  activityStatus = "all"
} = {}) {
  const where = await buildQuizWhereCondition({
    keyword,
    schoolId,
    subject,
    grade,
    status,
    teamEnabled,
    activityStatus
  });
  return count(QUIZ_COLLECTION, where);
}


export async function getQuizById(quizId) {
  const quiz = await getDoc(QUIZ_COLLECTION, quizId);
  return quiz;
}


export async function createQuiz(quizData) {
  const now = timestamp();
  const data = {
    ...quizData,
    created: now,
    updated: now
  };
  return addDoc(QUIZ_COLLECTION, data);
}


export async function updateQuiz(quizId, quizData) {
  const data = {
    ...quizData,
    updated: timestamp()
  };
  return updateDoc(QUIZ_COLLECTION, quizId, data);
}


export async function deleteQuiz(quizId) {
  return removeDoc(QUIZ_COLLECTION, quizId);
}
