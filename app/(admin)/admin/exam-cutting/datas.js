"use server";

import { command, docs } from "../../../../lib/common/database.js";

/**
 * 试卷集合名
 */
const EXAM_PAPER_COLL = "exam_paper";

/**
 * 从数据库获取需要切题的试卷列表（cuttingStatus不等于done且isLocked为false的试卷）
 */
export async function getExamPapersForCuttingFromDB() {
  const _ = command();

  // 查询条件：cuttingStatus不等于done
  const queryCondition = {
    cuttingStatus: _.neq("done"),
    isLocked: false
  };

  // 按创建时间降序排序
  return await docs({
    c: EXAM_PAPER_COLL,
    w: queryCondition,
    orderBy: {
      created: -1
    }
  });
}
