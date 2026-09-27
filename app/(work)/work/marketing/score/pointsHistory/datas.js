"use server";

import { allDocs, command, count, docs } from "../../../../../../lib/common/database.js";

/**
 * 由于部分成长数据没有校园ID，因此这里需要使用班级ID查询。
 */

/** 学生成长记录集合名称 */
const STUDENT_GROWTH_COLLECTION = "student_growth";

/** 学生集合名称 */
const STUDENT_COLLECTION = "student";

/** 班级与学生关联集合名称 */
const STUDENT_CLASS_COLLECTION = "student_class";

/** 班级集合名称 */
const CLASSROOM_COLLECTION = "classroom";

/**
 * 构建查询条件
 */
function buildQueryConditions({
  classIds,
  selectedClassId = "all",
  growthType = "all",
  isShowInGrowthPath = "all",
  targetStudentId = null
}) {
  const _ = command();
  let where = {};

  // 如果指定了目标学生ID，直接使用它（优先级最高）
  if (targetStudentId) {
    where.studentId = targetStudentId;
  }

  // 按班级过滤
  if (selectedClassId !== "all") {
    // 选择了特定班级
    where.classId = selectedClassId;
  } else {
    // 未选择班级时，使用用户拥有的所有班级
    if (classIds.length > 0) {
      where.classId = _.in(classIds);
    } else {
      // 如果用户没有任何班级，返回空结果
      where.classId = _.in([]);
    }
  }

  // 按成长类型过滤
  if (growthType !== "all") {
    where.type = growthType;
  }

  // 按是否显示在成长路径过滤
  if (isShowInGrowthPath === "show") {
    // 显示：不存在该字段或值为true
    where = _.and(where, _.or({
      isShowInGrowthPath: _.exists(false)
    }, {
      isShowInGrowthPath: true
    }));
  } else if (isShowInGrowthPath === "hide") {
    // 不显示：值为false
    where.isShowInGrowthPath = false;
  }
  return where;
}

/**
 * 根据学生搜索条件获取学生ID列表
 */
async function getStudentIdsBySearch(classIds, studentSearch) {
  if (!studentSearch.trim() || classIds.length === 0) {
    return [];
  }
  const _ = command();

  // 先获得班级与学生关联列表
  const studentClassList = await allDocs({
    c: STUDENT_CLASS_COLLECTION,
    match: {
      classRoomId: _.in(classIds)
    },
    project: {
      studentId: 1
    }
  });
  const studentIds = studentClassList.map(studentClass => studentClass.studentId);
  const students = await allDocs({
    c: STUDENT_COLLECTION,
    match: _.and({
      _id: _.in(studentIds)
    }, _.or({
      name: new RegExp(studentSearch.trim(), "i")
    }, {
      studentCode: new RegExp(studentSearch.trim(), "i")
    })),
    project: {
      _id: 1
    }
  });
  return students.map(student => student._id);
}

/**
 * 获取积分变动记录列表（分页）
 */
export async function getPointsHistoryRecords({
  classIds,
  pageNum = 0,
  pageSize = 20,
  selectedClassId = "all",
  studentSearch = "",
  growthType = "all",
  isShowInGrowthPath = "all",
  targetStudentId = null
}) {
  // 不允许classIds为空
  if (!classIds || classIds.length === 0) {
    throw new Error("classIds 不能为空");
  }
  let where = buildQueryConditions({
    classIds,
    selectedClassId,
    growthType,
    isShowInGrowthPath,
    targetStudentId
  });

  // 如果有学生搜索条件，先获取学生ID列表
  if (studentSearch.trim()) {
    const availableClassIds = selectedClassId !== "all" ? [selectedClassId] : classIds;
    const studentIds = await getStudentIdsBySearch(availableClassIds, studentSearch);
    if (studentIds.length === 0) {
      // 没有找到符合条件的学生，返回空数据
      return [];
    }
    const _ = command();
    where = _.and(where, {
      studentId: _.in(studentIds)
    });
  }
  try {
    const records = await docs({
      c: STUDENT_GROWTH_COLLECTION,
      w: where,
      pageNum,
      pageSize,
      orderBy: {
        created: -1
      }
    });
    const recordsWithData = records;

    // 获取所有关联的学生ID和班级ID
    const studentIds = [...new Set(recordsWithData.map(record => record.studentId))];
    const classIds = [...new Set(recordsWithData.map(record => record.classId))];

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
    if (classIds.length > 0) {
      const _ = command();
      classrooms = await allDocs({
        c: CLASSROOM_COLLECTION,
        match: {
          _id: _.in(classIds)
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
      student: students.find(s => s._id === record.studentId) || null,
      classroom: classrooms.find(c => c._id === record.classId) || null
    }));
    return enrichedRecords;
  } catch (error) {
    console.error("获取积分变动记录失败:", error);
    throw new Error("获取积分变动记录失败");
  }
}

/**
 * 获取积分变动记录总数（用于分页）
 */
export async function getPointsHistoryRecordsCount({
  classIds,
  selectedClassId = "all",
  studentSearch = "",
  growthType = "all",
  isShowInGrowthPath = "all",
  targetStudentId = null
}) {
  // 不允许classIds为空
  if (!classIds || classIds.length === 0) {
    throw new Error("classIds 不能为空");
  }
  let where = buildQueryConditions({
    classIds,
    selectedClassId,
    growthType,
    isShowInGrowthPath,
    targetStudentId
  });

  // 如果有学生搜索条件，先获取学生ID列表
  if (studentSearch.trim()) {
    const availableClassIds = selectedClassId !== "all" ? [selectedClassId] : classIds;
    const studentIds = await getStudentIdsBySearch(availableClassIds, studentSearch);
    if (studentIds.length === 0) {
      return 0;
    }
    const _ = command();
    where = _.and(where, {
      studentId: _.in(studentIds)
    });
  }
  try {
    const totalCount = await count(STUDENT_GROWTH_COLLECTION, where);
    return totalCount;
  } catch (error) {
    console.error("获取积分变动记录数量失败:", error);
    throw new Error("获取积分变动记录数量失败");
  }
}
