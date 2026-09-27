"use server";

import { allDocs, command } from "../../../../../../lib/common/database.js";

/**
 * 从数据库获取多个题目信息（只获取指定字段）
 */
export async function getQuestionsFromDB(questionIds) {
  const _ = command();
  return await allDocs({
    c: "exam_question",
    match: {
      _id: _.in(questionIds)
    },
    only: "_id,imageUrl,imageFileID,imageHeight,imageWidth,questionText"
  });
}
