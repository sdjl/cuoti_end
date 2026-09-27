import { addDoc, allDocs, command, count, docs, getDoc, removeDoc, updateDoc } from "../../../../../../lib/common/database.js";
import { timestamp } from "../../../../../../lib/common/time.js";

/** 学情记录集合名称 */
const STUDY_RECORD_COLLECTION = "study_record";

/** 学生集合名称 */
const STUDENT_COLLECTION = "student";

/** 班级集合名称 */
const CLASSROOM_COLLECTION = "classroom";

/** 学生班级关系集合名称 */
const STUDENT_CLASS_COLLECTION = "student_class";

/** 学生成长记录集合名称 */
const STUDENT_GROWTH_COLLECTION = "student_growth";

/** 微信用户集合名称 */
const WX_USER_COLLECTION = "wx_user";

/** 学情记录类型常量 */
const STUDY_RECORD_GROWTH_TYPE = "学情记录";

/**
 * 构建查询条件
 */
async function buildQueryConditions({
  classIds,
  selectedClassId = "all",
  searchContent = "",
  studentSearch = "",
  targetStudentId = null
}) {
  const _ = command();
  let where = {};

  // 按班级过滤
  if (selectedClassId !== "all") {
    where.classroomId = selectedClassId;
  } else {
    if (classIds.length > 0) {
      where.classroomId = _.in(classIds);
    } else {
      where.classroomId = _.in([]);
    }
  }

  // 搜索记录内容
  if (searchContent.trim()) {
    where = _.and(where, {
      content: new RegExp(searchContent.trim(), "i")
    });
  }

  // 如果指定了目标学生ID，直接使用它（优先级最高）
  if (targetStudentId) {
    where = _.and(where, {
      studentId: targetStudentId
    });
  } else if (studentSearch.trim()) {
    // 学生搜索条件
    const currentClassIds = selectedClassId === "all" ? classIds : [selectedClassId];
    const studentIds = await getStudentIdsBySearch(currentClassIds, studentSearch);
    if (studentIds.length > 0) {
      where = _.and(where, {
        studentId: _.in(studentIds)
      });
    } else {
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
 * 获取学情记录列表（分页）
 */
export async function getStudyRecords({
  classIds,
  pageNum = 0,
  pageSize = 20,
  selectedClassId = "all",
  searchContent = "",
  studentSearch = "",
  targetStudentId = null
}) {
  if (!classIds || classIds.length === 0) {
    throw new Error("classIds 不能为空");
  }
  const where = await buildQueryConditions({
    classIds,
    selectedClassId,
    searchContent,
    studentSearch,
    targetStudentId
  });
  try {
    const records = await docs({
      c: STUDY_RECORD_COLLECTION,
      w: where,
      pageNum,
      pageSize,
      orderBy: {
        created: -1
      }
    });
    const recordsWithData = records;

    // 获取相关的学生、班级和微信用户数据
    const studentIds = [...new Set(recordsWithData.map(record => record.studentId))];
    const classroomIds = [...new Set(recordsWithData.map(record => record.classroomId))];
    const operatorUserIds = [...new Set(recordsWithData.map(record => record.operatorUserId))];

    // 批量查询学生数据
    const students = studentIds.length > 0 ? await allDocs({
      c: STUDENT_COLLECTION,
      match: {
        _id: command().in(studentIds)
      },
      project: {
        _id: 1,
        name: 1,
        studentCode: 1
      }
    }) : [];

    // 批量查询班级数据
    const classrooms = classroomIds.length > 0 ? await allDocs({
      c: CLASSROOM_COLLECTION,
      match: {
        _id: command().in(classroomIds)
      },
      project: {
        _id: 1,
        name: 1
      }
    }) : [];

    // 批量查询微信用户数据
    const wxUsers = operatorUserIds.length > 0 ? await allDocs({
      c: WX_USER_COLLECTION,
      match: {
        _id: command().in(operatorUserIds)
      },
      project: {
        _id: 1,
        userInfo: 1
      }
    }) : [];

    // 组装数据
    const enrichedRecords = recordsWithData.map(record => ({
      ...record,
      student: students.find(s => s._id === record.studentId) || null,
      classroom: classrooms.find(c => c._id === record.classroomId) || null,
      operatorUser: wxUsers.find(u => u._id === record.operatorUserId) || null
    }));
    return enrichedRecords;
  } catch (error) {
    console.error("获取学情记录失败:", error);
    throw new Error("获取学情记录失败");
  }
}

/**
 * 获取学情记录总数
 */
export async function getStudyRecordsCount({
  classIds,
  selectedClassId = "all",
  searchContent = "",
  studentSearch = "",
  targetStudentId = null
}) {
  if (!classIds || classIds.length === 0) {
    throw new Error("classIds 不能为空");
  }
  const where = await buildQueryConditions({
    classIds,
    selectedClassId,
    searchContent,
    studentSearch,
    targetStudentId
  });
  try {
    const totalCount = await count(STUDY_RECORD_COLLECTION, where);
    return totalCount;
  } catch (error) {
    console.error("获取学情记录总数失败:", error);
    throw new Error("获取学情记录总数失败");
  }
}

/**
 * 根据ID获取学情记录详情
 */
export async function getStudyRecordById(recordId) {
  try {
    const record = await getDoc(STUDY_RECORD_COLLECTION, recordId);
    if (!record) {
      return null;
    }
    return record;
  } catch (error) {
    console.error("获取学情记录详情失败:", error);
    return null;
  }
}

/**
 * 在指定班级中搜索学生
 */
export async function searchStudentsInClass(classId, searchText) {
  if (!searchText.trim() || !classId) {
    return [];
  }
  const _ = command();
  try {
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
      limit: 10
    });
    return students;
  } catch (error) {
    console.error("搜索班级学生失败:", error);
    return [];
  }
}

/**
 * 创建学情记录
 */
export async function createStudyRecord({
  schoolId,
  classroomId,
  studentId,
  content,
  points,
  operatorUserId
}) {
  try {
    const now = timestamp();

    // 创建学情记录
    const studyRecordData = {
      schoolId,
      classroomId,
      studentId,
      content: content.trim(),
      points,
      operatorUserId,
      created: now
    };
    const recordId = await addDoc(STUDY_RECORD_COLLECTION, studyRecordData);

    // 创建学生成长记录
    const growthData = {
      schoolId,
      classId: classroomId,
      studentId,
      description: `学情记录：${content.trim()}`,
      type: STUDY_RECORD_GROWTH_TYPE,
      isShowInGrowthPath: true,
      data: {
        studyRecordId: recordId,
        content: content.trim()
      },
      score: {
        time: now,
        reason: `学情记录：${content.trim()}`,
        score: points,
        afterScore: 0 // 这个会在更新学生积分时计算
      },
      created: now
    };
    const growthId = await addDoc(STUDENT_GROWTH_COLLECTION, growthData);

    // 更新学生当前积分
    const student = await getDoc(STUDENT_COLLECTION, studentId);
    if (student) {
      const studentData = student;
      const currentScore = studentData.growthData?.score || 0;
      const newScore = currentScore + points;

      // 更新学生积分
      await updateDoc(STUDENT_COLLECTION, studentId, {
        "growthData.score": newScore
      });

      // 更新成长记录中的afterScore
      await updateDoc(STUDENT_GROWTH_COLLECTION, growthId, {
        "score.afterScore": newScore
      });
    }
    return {
      success: true,
      recordId
    };
  } catch (error) {
    console.error("创建学情记录失败:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "创建学情记录失败"
    };
  }
}

/**
 * 更新学情记录内容
 */
export async function updateStudyRecordContent({
  recordId,
  content
}) {
  try {
    const success = await updateDoc(STUDY_RECORD_COLLECTION, recordId, {
      content: content.trim()
    });
    if (!success) {
      return {
        success: false,
        error: "更新学情记录内容失败"
      };
    }

    // 同时更新对应的StudentGrowthDoc
    const _ = command();
    const growthRecords = await allDocs({
      c: STUDENT_GROWTH_COLLECTION,
      match: _.and({
        type: STUDY_RECORD_GROWTH_TYPE
      }, {
        "data.studyRecordId": recordId
      }),
      limit: 1
    });
    if (growthRecords.length > 0) {
      const growthRecord = growthRecords[0];
      await updateDoc(STUDENT_GROWTH_COLLECTION, growthRecord._id, {
        description: `学情记录：${content.trim()}`,
        "data.content": content.trim(),
        "score.reason": `学情记录：${content.trim()}`
      });
    }
    return {
      success: true
    };
  } catch (error) {
    console.error("更新学情记录内容失败:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "更新学情记录内容失败"
    };
  }
}

/**
 * 删除学情记录
 */
export async function deleteStudyRecord(recordId) {
  try {
    // 获取学情记录
    const record = await getStudyRecordById(recordId);
    if (!record) {
      return {
        success: false,
        error: "学情记录不存在"
      };
    }

    // 查找并删除对应的StudentGrowthDoc
    const _ = command();
    const growthRecords = await allDocs({
      c: STUDENT_GROWTH_COLLECTION,
      match: _.and({
        type: STUDY_RECORD_GROWTH_TYPE
      }, {
        "data.studyRecordId": recordId
      })
    });

    // 归还学生积分
    if (growthRecords.length > 0) {
      const growthRecord = growthRecords[0];
      const studentId = record.studentId;
      const pointsToRevert = -record.points; // 相反的积分

      // 更新学生当前积分
      const student = await getDoc(STUDENT_COLLECTION, studentId);
      if (student) {
        const studentData = student;
        const currentScore = studentData.growthData?.score || 0;
        const newScore = currentScore + pointsToRevert;
        await updateDoc(STUDENT_COLLECTION, studentId, {
          "growthData.score": newScore
        });
      }

      // 删除成长记录
      await removeDoc(STUDENT_GROWTH_COLLECTION, growthRecord._id);
    }

    // 删除学情记录
    const deleteSuccess = await removeDoc(STUDY_RECORD_COLLECTION, recordId);
    if (!deleteSuccess) {
      return {
        success: false,
        error: "删除学情记录失败"
      };
    }
    return {
      success: true
    };
  } catch (error) {
    console.error("删除学情记录失败:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "删除学情记录失败"
    };
  }
}

/**
 * 更新学情记录的图片数组
 */
export async function updateStudyRecordImages({
  recordId,
  images
}) {
  try {
    const updateSuccess = await updateDoc(STUDY_RECORD_COLLECTION, recordId, {
      images
    });
    if (!updateSuccess) {
      return {
        success: false,
        error: "更新数据库失败"
      };
    }
    return {
      success: true
    };
  } catch (error) {
    console.error("更新学情记录图片失败:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "更新图片失败"
    };
  }
}

/**
 * 删除学情记录图片（只更新数据库）
 */
export async function deleteStudyRecordImage({
  recordId,
  imageFileID
}) {
  try {
    // 获取当前记录
    const record = await getStudyRecordById(recordId);
    if (!record) {
      return {
        success: false,
        error: "学情记录不存在"
      };
    }
    if (!record.images || record.images.length === 0) {
      return {
        success: false,
        error: "没有图片可删除"
      };
    }

    // 过滤掉要删除的图片
    const updatedImages = record.images.filter(image => image.imageFileID !== imageFileID);

    // 更新数据库
    const updateSuccess = await updateDoc(STUDY_RECORD_COLLECTION, recordId, {
      images: updatedImages
    });
    if (!updateSuccess) {
      return {
        success: false,
        error: "更新数据库失败"
      };
    }
    return {
      success: true
    };
  } catch (error) {
    console.error("删除学情记录图片失败:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "删除图片失败"
    };
  }
}
