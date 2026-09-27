"use server";

import { command, docs } from "../../../../../lib/common/database.js";
import { CONFIG_KEYS } from "../../../../../lib/config/constants.js";

/**
 * 配置文档类型
 */


export async function getConfigDocs() {
  const _ = command();
  const settingDocs = await docs({
    c: "setting",
    w: {
      key: _.in([CONFIG_KEYS.SUBJECTS, CONFIG_KEYS.QUESTION_TYPES, CONFIG_KEYS.REGIONS])
    }
  });
  return settingDocs;
}
