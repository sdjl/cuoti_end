"use server";

import { allDocs } from "../../../../../../lib/common/database.js";
import { getCurrentSchoolId } from "../../../../../../lib/work/teacher/mySchool.js";

/**
 * 获取当前校园的所有班级列表
 */
export async function getSchoolClassroomsAction() {
  try {
    const schoolId = await getCurrentSchoolId();
    const classrooms = await allDocs({
      c: "classroom",
      match: {
        schoolId
      },
      sort: {
        grade: 1,
        name: 1
      }
    });
    return classrooms;
  } catch (error) {
    console.error("获取班级列表失败:", error);
    return [];
  }
}
