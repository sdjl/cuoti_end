"use server";

import { addDoc, allDocs, command, count, docs, getDoc, updateDoc } from "../../../../../../lib/common/database.js";
import { timestamp } from "../../../../../../lib/common/time.js";

/** 手动积分记录集合名称 */
const MANUAL_SCORE_RECORD_COLLECTION = "manual_score_record";

/** 学生成长记录集合名称 */
const STUDENT_GROWTH_COLLECTION = "student_growth";

/** 学生集合名称 */
const STUDENT_COLLECTION = "student";

/** 班级集合名称 */
const CLASSROOM_COLLECTION = "classroom";

/** 学生班级关系集合名称 */
const STUDENT_CLASS_COLLECTION = "student_class";

/**
 * 构建查询条件
 */
async function buildQueryConditions({
  classIds,
  selectedClassId = "all",
  searchText = "",
  studentSearch = ""
}) {
  const _ = command();
  let where = {};

  // 按班级过滤
  if (selectedClassId !== "all") {
    // 选择了特定班级
    where.classroomId = selectedClassId;
  } else {
    // 未选择班级时，使用用户拥有的所有班级
    if (classIds.length > 0) {
      where.classroomId = _.in(classIds);
    } else {
      // 如果用户没有任何班级，返回空结果
      where.classroomId = _.in([]);
    }
  }

  // 搜索修改原因
  if (searchText.trim()) {
    where = _.and(where, {
      reason: new RegExp(searchText.trim(), "i")
    });
  }

  // 学生搜索条件
  if (studentSearch.trim()) {
    const currentClassIds = selectedClassId === "all" ? classIds : [selectedClassId];
    const studentIds = await getStudentIdsBySearch(currentClassIds, studentSearch);
    if (studentIds.length > 0) {
      where = _.and(where, {
        studentId: _.in(studentIds)
      });
    } else {
      // 如果没有找到符合条件的学生，设置一个不可能匹配的条件
      where = _.and(where, {
        studentId: "no-match"
      });
    }
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

  // 先从学生班级关系表中获取指定班级的学生ID列表
  const studentClassList = await allDocs({
    c: STUDENT_CLASS_COLLECTION,
    match: {
      classRoomId: _.in(classIds)
    },
    project: {
      studentId: 1
    }
  });
  const studentIds = studentClassList.map(sc => sc.studentId);
  if (studentIds.length === 0) {
    return [];
  }

  // 然后在这些学生中搜索符合条件的学生
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
 * 获取手动积分记录列表（分页）
 */
export async function getManualRecords({
  classIds,
  pageNum = 0,
  pageSize = 20,
  selectedClassId = "all",
  searchText = "",
  studentSearch = ""
}) {
  // 不允许classIds为空
  if (!classIds || classIds.length === 0) {
    throw new Error("classIds 不能为空");
  }
  const where = await buildQueryConditions({
    classIds,
    selectedClassId,
    searchText,
    studentSearch
  });
  try {
    const records = await docs({
      c: MANUAL_SCORE_RECORD_COLLECTION,
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
    const classroomIds = [...new Set(recordsWithData.map(record => record.classroomId))];

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
      student: students.find(s => s._id === record.studentId) || null,
      classroom: classrooms.find(c => c._id === record.classroomId) || null
    }));
    return enrichedRecords;
  } catch (error) {
    console.error("获取手动积分记录失败:", error);
    throw new Error("获取手动积分记录失败");
  }
}

/**
 * 获取手动积分记录总数（用于分页）
 */
export async function getManualRecordsCount({
  classIds,
  selectedClassId = "all",
  searchText = "",
  studentSearch = ""
}) {
  // 不允许classIds为空
  if (!classIds || classIds.length === 0) {
    throw new Error("classIds 不能为空");
  }
  const where = await buildQueryConditions({
    classIds,
    selectedClassId,
    searchText,
    studentSearch
  });
  try {
    const totalCount = await count(MANUAL_SCORE_RECORD_COLLECTION, where);
    return totalCount;
  } catch (error) {
    console.error("获取手动积分记录数量失败:", error);
    throw new Error("获取手动积分记录数量失败");
  }
}

/**
 * 根据ID获取单个手动积分记录
 */
export async function getManualRecordById(recordId) {
  try {
    const record = await getDoc(MANUAL_SCORE_RECORD_COLLECTION, recordId);
    if (!record) {
      return null;
    }
    return record;
  } catch (error) {
    console.error("获取手动积分记录详情失败:", error);
    throw new Error("获取手动积分记录详情失败");
  }
}

/**
 * 获取学生当前积分
 */
export async function getStudentCurrentScore(studentId) {
  try {
    const student = await getDoc(STUDENT_COLLECTION, studentId, {
      only: "growthData"
    });
    if (!student) {
      throw new Error("学生不存在");
    }
    const studentData = student;
    return studentData?.growthData?.score || 0;
  } catch (error) {
    console.error("获取学生当前积分失败:", error);
    throw new Error("获取学生当前积分失败");
  }
}

/**
 * 更新学生积分
 */
export async function updateStudentScore(studentId, newScore) {
  try {
    const success = await updateDoc(STUDENT_COLLECTION, studentId, {
      "growthData.score": newScore
    });
    return success;
  } catch (error) {
    console.error("更新学生积分失败:", error);
    throw new Error("更新学生积分失败");
  }
}

/**
 * 创建手动积分记录
 */
export async function createManualRecord({
  schoolId,
  classroomId,
  studentId,
  points,
  reason,
  operatorUserId
}) {
  try {
    const now = timestamp();

    // 获取学生当前积分
    const currentScore = await getStudentCurrentScore(studentId);
    const newScore = currentScore + points;

    // 检查积分是否为负数
    if (newScore < 0) {
      return {
        success: false,
        error: "积分不能为负数"
      };
    }

    // 创建手动积分记录
    const manualRecord = {
      schoolId,
      classroomId,
      studentId,
      operatorUserId,
      points,
      reason,
      created: now
    };
    const recordId = await addDoc(MANUAL_SCORE_RECORD_COLLECTION, manualRecord);

    // 更新学生积分
    const updateSuccess = await updateStudentScore(studentId, newScore);
    if (!updateSuccess) {
      return {
        success: false,
        error: "更新学生积分失败"
      };
    }

    // 创建学生成长记录
    const growthRecord = {
      schoolId,
      classId: classroomId,
      studentId,
      description: `老师手动调整积分：${reason}`,
      type: "手动调整积分",
      isShowInGrowthPath: false,
      // 手动调整积分不显示在成长路径中
      data: {
        operatorUserId,
        operationType: points > 0 ? "add" : "deduct",
        reason,
        manualScoreRecordId: recordId
      },
      score: {
        time: now,
        reason,
        score: points,
        afterScore: newScore
      },
      created: now
    };
    await addDoc(STUDENT_GROWTH_COLLECTION, growthRecord);
    return {
      success: true,
      recordId
    };
  } catch (error) {
    console.error("创建手动积分记录失败:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "创建手动积分记录失败"
    };
  }
}

/**
 * 更新手动积分记录的原因
 */
export async function updateManualRecordReason({
  recordId,
  reason
}) {
  try {
    // 更新手动积分记录
    const updateRecordSuccess = await updateDoc(MANUAL_SCORE_RECORD_COLLECTION, recordId, {
      reason
    });
    if (!updateRecordSuccess) {
      return {
        success: false,
        error: "更新手动积分记录失败"
      };
    }

    // 同时更新对应的StudentGrowthDoc中的reason
    // 查找对应的StudentGrowthDoc
    const growthRecords = await allDocs({
      c: STUDENT_GROWTH_COLLECTION,
      match: {
        type: "手动调整积分",
        "data.manualScoreRecordId": recordId
      },
      limit: 1
    });
    if (growthRecords.length > 0) {
      const growthRecord = growthRecords[0];

      // 更新StudentGrowthDoc中的数据
      const updateGrowthSuccess = await updateDoc(STUDENT_GROWTH_COLLECTION, growthRecord._id, {
        "data.reason": reason,
        "score.reason": reason
      });
      if (!updateGrowthSuccess) {
        console.warn(`更新StudentGrowthDoc ${growthRecord._id} 的reason失败`);
      }
    } else {
      console.warn(`未找到manualScoreRecordId为 ${recordId} 的StudentGrowthDoc记录`);
    }
    return {
      success: true
    };
  } catch (error) {
    console.error("更新手动积分记录原因失败:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "更新修改原因失败"
    };
  }
}

/**
 * 根据学生编号或姓名搜索学生（支持模糊搜索）
 */
export async function searchStudentsInClass(classId, searchText) {
  try {
    if (!searchText.trim() || !classId) {
      return [];
    }
    const _ = command();

    // 先从学生班级关系表中获取指定班级的学生ID列表
    const studentClassList = await allDocs({
      c: STUDENT_CLASS_COLLECTION,
      match: {
        classRoomId: classId
      },
      project: {
        studentId: 1
      }
    });
    const studentIds = studentClassList.map(sc => sc.studentId);
    if (studentIds.length === 0) {
      return [];
    }

    // 然后在这些学生中搜索符合条件的学生
    const students = await allDocs({
      c: STUDENT_COLLECTION,
      match: _.and({
        _id: _.in(studentIds)
      }, _.or({
        name: new RegExp(searchText.trim(), "i")
      }, {
        studentCode: new RegExp(searchText.trim(), "i")
      })),
      project: {
        _id: 1,
        name: 1,
        studentCode: 1
      },
      limit: 10 // 限制返回数量
    });
    return students;
  } catch (error) {
    console.error("搜索班级学生失败:", error);
    return [];
  }
}
