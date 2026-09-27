"use server";

import { timestamp } from "../../../../../lib/common/time.js";
import { getCurrentUserOpenid, removeJWTField } from "../../../../../lib/utils/auth.js";
import { deleteAllExamQuestionsFromDB, deleteExamPaperQuestionPacksFromDB, getAllExamQuestionsFromDB, getWxUserByOpenidFromDB, removeCurrentSchoolFromWxUserInDB, unlockAllExamPapersInDB } from "./datas.js";

/**
 * 解除所有试卷的锁定
 * 1. 删除exam_question集合的所有数据
 * 2. 设置exam_paper集合的所有数据的isLocked为false
 * 3. 删除question_pack集合中类型为"试卷"的题集数据
 */
export async function unlockAllExamPapers() {
  try {
    // 1. 删除exam_question集合的所有数据
    // 先获取文档数量
    const examQuestions = await getAllExamQuestionsFromDB();
    let deletedQuestionCount = 0;
    if (examQuestions.length > 0) {
      // 使用removeMatch删除所有文档，使用_id存在作为匹配条件
      deletedQuestionCount = await deleteAllExamQuestionsFromDB();
    }

    // 2. 设置exam_paper集合的所有数据的isLocked为false
    const updatedPaperCount = await unlockAllExamPapersInDB();

    // 3. 删除question_pack集合中类型为"试卷"的题集数据
    let deletedQuestionPackCount = 0;
    try {
      deletedQuestionPackCount = await deleteExamPaperQuestionPacksFromDB();
    } catch (error) {
      console.error("删除题集数据失败:", error);
      // 不阻断整个流程，仅记录错误
    }
    return {
      success: true,
      message: `已成功解除所有试卷的锁定，删除了${deletedQuestionCount}条题目数据，更新了${updatedPaperCount}个试卷状态，删除了${deletedQuestionPackCount}个题集数据`,
      deletedQuestions: deletedQuestionCount,
      updatedPapers: updatedPaperCount,
      deletedQuestionPacks: deletedQuestionPackCount
    };
  } catch (error) {
    console.error("解除试卷锁定失败:", error);
    return {
      success: false,
      message: `解除试卷锁定失败: ${error instanceof Error ? error.message : "未知错误"}`
    };
  }
}

/**
 * 删除当前校园数据
 * 1. 删除JWT中的workSetting字段
 * 2. 删除数据库中用户的workSetting.currentSchool字段
 */
export async function deleteCurrentSchool() {
  try {
    const openid = await getCurrentUserOpenid();
    if (!openid) {
      return {
        success: false,
        message: "用户未登录"
      };
    }

    // 1. 删除JWT中的workSetting字段
    const jwtDeleteSuccess = await removeJWTField("workSetting");
    if (!jwtDeleteSuccess) {
      return {
        success: false,
        message: "删除JWT中的校园设置失败"
      };
    }

    // 2. 删除数据库中用户的workSetting.currentSchool字段
    try {
      // 先根据openid查找用户文档
      const userDoc = await getWxUserByOpenidFromDB(openid);
      if (userDoc.length === 0) {
        return {
          success: false,
          message: "用户信息不存在"
        };
      }
      const userId = userDoc[0]._id;

      // 删除workSetting.currentSchool字段
      await removeCurrentSchoolFromWxUserInDB(userId, timestamp());
    } catch (dbError) {
      console.error("删除数据库用户设置失败:", dbError);
      return {
        success: false,
        message: "删除数据库用户设置失败"
      };
    }
    return {
      success: true,
      message: "当前校园数据已成功删除"
    };
  } catch (error) {
    console.error("删除当前校园失败:", error);
    return {
      success: false,
      message: `删除当前校园失败: ${error instanceof Error ? error.message : "未知错误"}`
    };
  }
}
