"use server";

import { addDocList, allDocs, command, getDoc, getOne, removeMatch, updateDoc } from "../common/database.js";

/**
 * 题目集合名
 */
const EXAM_QUESTION_COLL = "exam_question";


export async function batchInsertExamQuestions(examPaperId, examPaper) {
  try {
    // 先删除该试卷的所有题目数据（如果存在）
    await removeMatch(EXAM_QUESTION_COLL, {
      examPaperId: examPaperId
    });

    // 构建要插入的题目数据列表
    const questionsToInsert = [];

    // 遍历试卷的每一页
    for (const page of examPaper.pages) {
      // 遍历页面中的每个题目
      for (const question of page.questions) {
        const questionDoc = {
          examPaperId: examPaperId,
          pageNumber: page.pageNumber,
          questionNumber: question.questionNumber,
          leftTop: question.leftTop,
          rightBottom: question.rightBottom,
          questionType: question.questionType,
          questionText: question.questionText,
          answer: question.answer,
          answerImage: question.answerImage,
          parse: question.parse,
          parseImage: question.parseImage,
          knowledgePoints: question.knowledgePoints,
          imagePath: question.imagePath,
          imageUrl: question.imageUrl,
          imageFileID: question.imageFileID,
          imageHeight: question.imageHeight,
          imageWidth: question.imageWidth,
          imageVersion: question.imageVersion,
          difficulty: question.difficulty,
          easyToMistakeDetail: question.easyToMistakeDetail
        };
        questionsToInsert.push(questionDoc);
      }
    }

    // 如果有题目数据，则批量插入
    if (questionsToInsert.length > 0) {
      const insertResult = await addDocList(EXAM_QUESTION_COLL, questionsToInsert);
      return {
        success: true,
        questionIds: insertResult.ids
      };
    }
    return {
      success: true,
      questionIds: []
    };
  } catch (error) {
    console.error("批量写入题目数据失败:", error);
    return {
      success: false,
      questionIds: []
    };
  }
}


export async function updateExamQuestion(updateData, identifiers) {
  try {
    let questionId = null;

    // 根据不同的标识符类型获取题目ID
    if ("questionId" in identifiers) {
      questionId = identifiers.questionId;
    } else {
      // 通过试卷id+页码+问题号码查找题目
      const {
        examPaperId,
        pageNumber,
        questionNumber
      } = identifiers;
      const questionDoc = await getOne(EXAM_QUESTION_COLL, {
        examPaperId,
        pageNumber,
        questionNumber
      });
      if (!questionDoc) {
        return false; // 找不到数据，忽略更新
      }
      questionId = questionDoc._id;
    }

    // 检查题目是否存在
    const existingQuestion = await getDoc(EXAM_QUESTION_COLL, questionId);
    if (!existingQuestion) {
      console.warn(`题目不存在：${questionId}`);
      return false; // 找不到数据，忽略更新
    }

    // 执行更新
    const updateSuccess = await updateDoc(EXAM_QUESTION_COLL, questionId, updateData);
    return updateSuccess;
  } catch (error) {
    console.error("更新题目数据失败:", error);
    return false;
  }
}


export async function getExamQuestionsByIds(questionIds) {
  if (questionIds.length === 0) {
    return [];
  }
  const _ = command();
  const result = await allDocs({
    c: EXAM_QUESTION_COLL,
    match: {
      _id: _.in(questionIds)
    }
  });
  return result;
}
