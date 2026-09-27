"use server";

import { addDoc, allDocs, command, count, docs, getOne, removeDoc, updateDoc } from "../../../../../lib/common/database.js";
import { timestamp } from "../../../../../lib/common/time.js";
import { getPrincipalClassRooms } from "../../../../../lib/work/principal/myClassroom.js";
import { getCurrentSchoolId } from "../../../../../lib/work/teacher/mySchool.js";

/**
 * 构建学生分组查询条件
 */
async function buildStudentGroupWhereCondition(keyword = "") {
  const currentSchoolId = await getCurrentSchoolId();

  // 构建查询条件
  let whereCondition = {
    schoolId: currentSchoolId
  };

  // 添加关键词搜索条件
  if (keyword.trim()) {
    const _ = command();
    whereCondition = _.and([{
      schoolId: currentSchoolId
    }, _.or([{
      name: new RegExp(keyword, "i")
    }, {
      teacherName: new RegExp(keyword, "i")
    }, {
      notes: new RegExp(keyword, "i")
    }])]);
  }
  return whereCondition;
}

/**
 * 获取学生分组列表
 */
export async function getMyStudentGroups({
  pageNum = 0,
  pageSize = 20,
  keyword = ""
}) {
  const whereCondition = await buildStudentGroupWhereCondition(keyword);
  const result = await docs({
    c: "student_group",
    w: whereCondition,
    pageNum,
    pageSize,
    orderBy: "created"
  });
  return result;
}

/**
 * 获取学生分组总数
 */
export async function getMyStudentGroupsCount({
  keyword = ""
}) {
  const whereCondition = await buildStudentGroupWhereCondition(keyword);
  return await count("student_group", whereCondition);
}

/**
 * 获取当前学校的所有班级
 */
export async function getSchoolClassrooms() {
  return await getPrincipalClassRooms({
    pageSize: 10000,
    status: "正常"
  });
}

/**
 * 获取班级的所有学生
 */
export async function getStudentsInClass(classId) {
  const currentSchoolId = await getCurrentSchoolId();

  // 首先获取班级信息
  const classroomDoc = await getOne("classroom", {
    _id: classId,
    schoolId: currentSchoolId
  });
  if (!classroomDoc) {
    throw new Error("班级不存在");
  }
  const classroom = classroomDoc;

  // 查询学生与班级关系表，获取该班级的学生ID列表
  const studentClasses = await allDocs({
    c: "student_class",
    match: {
      classRoomId: classId,
      status: "在读"
    }
  });
  if (studentClasses.length === 0) {
    return [];
  }
  const studentIds = studentClasses.map(sc => {
    const relation = sc;
    return relation.studentId;
  });

  // 查询学生信息
  const _ = command();
  const whereCondition = {
    _id: _.in(studentIds),
    schoolId: currentSchoolId
  };
  const students = await allDocs({
    c: "student",
    match: whereCondition,
    sort: {
      name: 1
    }
  });
  return students.map(student => {
    const s = student;
    return {
      studentId: s._id,
      name: s.name,
      studentCode: s.studentCode,
      className: classroom.name
    };
  });
}

/**
 * 创建学生分组
 */
export async function createStudentGroup({
  name,
  teacherName,
  notes,
  students
}) {
  const currentSchoolId = await getCurrentSchoolId();
  const now = timestamp();
  const studentGroupData = {
    schoolId: currentSchoolId,
    name: name.trim(),
    teacherName: teacherName.trim(),
    notes: notes?.trim() || "",
    students: students || [],
    created: now,
    updated: now
  };
  return await addDoc("student_group", studentGroupData);
}

/**
 * 更新学生分组
 */
export async function updateStudentGroup(studentGroupId, {
  name,
  teacherName,
  notes,
  students
}) {
  const currentSchoolId = await getCurrentSchoolId();

  // 验证学生分组是否属于当前学校
  const existingGroup = await docs({
    c: "student_group",
    w: {
      _id: studentGroupId,
      schoolId: currentSchoolId
    },
    pageSize: 1
  });
  if (!existingGroup || existingGroup.length === 0) {
    throw new Error("学生分组不存在或无权限修改");
  }
  const updateData = {
    name: name.trim(),
    teacherName: teacherName.trim(),
    notes: notes?.trim() || "",
    students: students || [],
    updated: timestamp()
  };
  return await updateDoc("student_group", studentGroupId, updateData);
}

/**
 * 删除学生分组
 */
export async function deleteStudentGroup(studentGroupId) {
  const currentSchoolId = await getCurrentSchoolId();

  // 验证学生分组是否属于当前学校
  const existingGroup = await docs({
    c: "student_group",
    w: {
      _id: studentGroupId,
      schoolId: currentSchoolId
    },
    pageSize: 1
  });
  if (!existingGroup || existingGroup.length === 0) {
    throw new Error("学生分组不存在或无权限删除");
  }
  return await removeDoc("student_group", studentGroupId);
}

/**
 * 获取学生分组总数（所有分组）
 */
export async function getStudentGroupTotalCount() {
  return await count("student_group");
}
