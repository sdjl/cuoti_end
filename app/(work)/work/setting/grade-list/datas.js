"use server";

import { renameGrade, setCurrentSchoolGrades } from "../../../../../lib/work/principal/mySchool.js";
import { getCurrentSchoolGrades } from "../../../../../lib/work/teacher/mySchool.js";


export async function getGradeList() {
  return await getCurrentSchoolGrades();
}


export async function updateGradeList(grades) {
  return await setCurrentSchoolGrades(grades);
}


export async function renameGradeData(oldGradeName, newGradeName, allGrades) {
  return await renameGrade(oldGradeName, newGradeName, allGrades);
}
