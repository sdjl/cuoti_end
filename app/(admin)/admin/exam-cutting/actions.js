"use server";

import { getExamPapersForCuttingFromDB } from "./datas.js";


export async function getExamPapersForCutting() {
  const result = await getExamPapersForCuttingFromDB();
  return result;
}
