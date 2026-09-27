"use server";

import { allDocs, command, count, docs } from "../../../../../../lib/common/database.js";

/** 邀请成功记录集合名称 */
const INVITATION_SUCCESS_COLLECTION = "invitation_success";

/** 学生集合名称 */
const STUDENT_COLLECTION = "student";

/** 班级集合名称 */
const CLASSROOM_COLLECTION = "classroom";

/**
 * 构建查询条件
 */
function buildQueryConditions({
  schoolId,
  searchText = "",
  type = "all"
}) {
  let where = {
    schoolId
  };

  // 按邀请码类型过滤
  if (type !== "all") {
    where.type = type;
  }

  // 模糊搜索：邀请码、被邀请者姓名、被邀请者电话、备注
  if (searchText.trim()) {
    const _ = command();
    const orWhere = _.or({
      invitationCode: new RegExp(searchText.trim(), "i")
    }, {
      inviteeName: new RegExp(searchText.trim(), "i")
    }, {
      inviteePhone: new RegExp(searchText.trim(), "i")
    }, {
      remark: new RegExp(searchText.trim(), "i")
    });
    where = _.and(where, orWhere);
  }
  return where;
}

/**
 * 获取邀请使用记录列表（分页）
 */
export async function getInvitationUsageRecords({
  schoolId,
  pageNum = 0,
  pageSize = 20,
  searchText = "",
  type = "all"
}) {
  const where = buildQueryConditions({
    schoolId,
    searchText,
    type
  });
  try {
    const records = await docs({
      c: INVITATION_SUCCESS_COLLECTION,
      w: where,
      pageNum,
      pageSize,
      orderBy: {
        created: -1
      }
    });
    const recordsWithData = records;

    // 获取所有关联的学生ID和班级ID
    const studentIds = recordsWithData.map(record => record.creatorStudentId).filter(id => id);
    const classroomIds = recordsWithData.map(record => record.classroomId).filter(id => id);

    // 批量获取学生信息
    let students = [];
    if (studentIds.length > 0) {
      const _ = command();
      students = await allDocs({
        c: STUDENT_COLLECTION,
        match: {
          _id: _.in(studentIds)
        },
        project: {
          _id: 1,
          name: 1,
          studentCode: 1
        }
      });
    }

    // 批量获取班级信息
    let classrooms = [];
    if (classroomIds.length > 0) {
      const _ = command();
      classrooms = await allDocs({
        c: CLASSROOM_COLLECTION,
        match: {
          _id: _.in(classroomIds)
        },
        project: {
          _id: 1,
          name: 1
        }
      });
    }

    // 组装数据
    const enrichedRecords = recordsWithData.map(record => ({
      ...record,
      student: students.find(s => s._id === record.creatorStudentId) || null,
      classroom: classrooms.find(c => c._id === record.classroomId) || null
    }));
    return enrichedRecords;
  } catch (error) {
    console.error("获取邀请使用记录失败:", error);
    throw new Error("获取邀请使用记录失败");
  }
}

/**
 * 获取邀请使用记录总数（用于分页）
 */
export async function getInvitationUsageRecordsCount({
  schoolId,
  searchText = "",
  type = "all"
}) {
  const where = buildQueryConditions({
    schoolId,
    searchText,
    type
  });
  try {
    const totalCount = await count(INVITATION_SUCCESS_COLLECTION, where);
    return totalCount;
  } catch (error) {
    console.error("获取邀请使用记录数量失败:", error);
    throw new Error("获取邀请使用记录数量失败");
  }
}
