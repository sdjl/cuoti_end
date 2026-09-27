"use server";

import { allDocs, command, count, docs } from "../../../../../lib/common/database.js";

// 数据库集合名称常量
const QUIZ_TEAM_COLLECTION = "quiz_team";
const QUIZ_COLLECTION = "quiz";

/**
 * 构建队伍查询条件
 */
function buildTeamWhereCondition({
  keyword = "",
  quizId = "all",
  schoolId = ""
} = {}) {
  const _ = command();
  const andList = [];

  // 学校ID筛选（必须条件）
  andList.push({
    schoolId
  });

  // 按口述核心知识点筛选
  if (quizId !== "all" && quizId) {
    andList.push({
      quizId
    });
  }

  // 关键词搜索
  if (keyword.trim()) {
    const searchRegex = new RegExp(keyword.trim(), "i");
    andList.push(_.or({
      teamName: searchRegex
    }, {
      teamDescription: searchRegex
    }));
  }

  // 构建最终的查询条件
  if (andList.length === 1) {
    return andList[0];
  } else if (andList.length > 1) {
    return _.and(...andList);
  } else {
    return {};
  }
}

/**
 * 获取队伍列表
 */
export async function getQuizTeams({
  pageNum = 0,
  pageSize = 20,
  keyword = "",
  quizId = "all",
  schoolId
}) {
  try {
    // 构建查询条件
    const where = buildTeamWhereCondition({
      keyword,
      quizId,
      schoolId
    });

    // 使用docs函数进行分页查询
    const teams = await docs({
      c: QUIZ_TEAM_COLLECTION,
      w: where,
      pageNum,
      pageSize,
      orderBy: {
        created: -1
      }
    });
    return teams;
  } catch (error) {
    console.error("获取队伍列表失败:", error);
    return [];
  }
}

/**
 * 获取队伍总数
 */
export async function getQuizTeamsCount({
  keyword = "",
  quizId = "all",
  schoolId
}) {
  try {
    // 构建查询条件
    const where = buildTeamWhereCondition({
      keyword,
      quizId,
      schoolId
    });
    return await count(QUIZ_TEAM_COLLECTION, where);
  } catch (error) {
    console.error("获取队伍总数失败:", error);
    return 0;
  }
}

/**
 * 获取口述核心知识点列表（用于筛选）
 */
export async function getQuizzesForFilter({
  schoolId
}) {
  try {
    const quizzes = await allDocs({
      c: QUIZ_COLLECTION,
      match: {
        schoolId,
        teamEnabled: true
      },
      sort: {
        created: -1
      },
      project: {
        _id: 1,
        title: 1,
        subject: 1,
        grade: 1
      }
    });
    return quizzes;
  } catch (error) {
    console.error("获取口述核心知识点列表失败:", error);
    return [];
  }
}

/**
 * 获取队伍成员统计信息
 */
export async function getTeamsStats({
  teamIds
}) {
  try {
    if (teamIds.length === 0) {
      return {};
    }

    // 这里我们先返回空的统计结构
    // 在实际实现中，需要根据具体的数据库查询来获取成员的QuizTakeDoc信息

    const result = {};
    teamIds.forEach(teamId => {
      result[teamId] = {
        memberStats: []
      };
    });
    return result;
  } catch (error) {
    console.error("获取队伍统计信息失败:", error);
    return {};
  }
}
