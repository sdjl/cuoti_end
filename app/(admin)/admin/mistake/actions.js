"use server";

import { createMistakePoint, deleteMistakePoint, getMistakePoints, getMistakePointsCount, updateMistakePoint } from "../../../../lib/collection/mistake.js";

// 重新导出类型和函数，保持对外接口不变

// 导出原有的接口函数
export { getMistakePoints, getMistakePointsCount, createMistakePoint, updateMistakePoint, deleteMistakePoint };
