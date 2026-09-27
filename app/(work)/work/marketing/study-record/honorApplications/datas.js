import { addDoc, allDocs, command, count, docs, getDoc, removeDoc, updateDoc, updateMatch } from "../../../../../../lib/common/database.js";
import { timestamp } from "../../../../../../lib/common/time.js";

/** 荣誉申请集合名称 */
const HONOR_APPLICATION_COLLECTION = "honor_application";

/** 学生集合名称 */
const STUDENT_COLLECTION = "student";

/** 班级集合名称 */
const CLASSROOM_COLLECTION = "classroom";

/** 学生班级关系集合名称 */
const STUDENT_CLASS_COLLECTION = "student_class";

/** 学生成长记录集合名称 */
const STUDENT_GROWTH_COLLECTION = "student_growth";

/**
 * 构建查询条件
 */
async function buildQueryConditions({
  schoolId,
  classIds,
  selectedClassId = "all",
  searchText = "",
  studentSearch = "",
  selectedStatus = "all",
  selectedShowInHonorBoard = "all",
  targetStudentId = null
}) {
  const _ = command();
  let where = {};

  // 必须按schoolId过滤（这是最重要的过滤条件）
  where.schoolId = schoolId;

  // 如果指定了目标学生ID，直接使用它（优先级最高）
  if (targetStudentId) {
    where.studentId = targetStudentId;
  }

  // 按班级过滤
  if (selectedClassId !== "all") {
    where.classroomId = selectedClassId;
  } else if (classIds.length > 0) {
    where.classroomId = _.in(classIds);
  }
  // 注意：如果classIds为空，则不添加classroomId条件，只用schoolId过滤

  // 按状态过滤
  if (selectedStatus !== "all") {
    where.status = selectedStatus;
  }

  // 按是否显示在荣誉榜过滤
  if (selectedShowInHonorBoard !== "all") {
    if (selectedShowInHonorBoard === "true") {
      where.showInSchoolHonorBoard = true;
    } else {
      where.showInSchoolHonorBoard = _.neq(true);
    }
  }

  // 搜索备注、荣誉名称
  if (searchText.trim()) {
    where = _.and(where, _.or({
      honorName: new RegExp(searchText.trim(), "i")
    }, {
      studentRemark: new RegExp(searchText.trim(), "i")
    }, {
      teacherRemark: new RegExp(searchText.trim(), "i")
    }));
  }

  // 学生搜索条件（仅在未指定targetStudentId时生效）
  if (!targetStudentId && studentSearch.trim()) {
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
 * 获取荣誉申请记录列表（分页）
 */
export async function getHonorApplications({
  schoolId,
  classIds,
  pageNum = 0,
  pageSize = 20,
  selectedClassId = "all",
  searchText = "",
  studentSearch = "",
  selectedStatus = "all",
  selectedShowInHonorBoard = "all",
  targetStudentId = null
}) {
  if (!schoolId) {
    throw new Error("schoolId 不能为空");
  }
  const where = await buildQueryConditions({
    schoolId,
    classIds,
    selectedClassId,
    searchText,
    studentSearch,
    selectedStatus,
    selectedShowInHonorBoard,
    targetStudentId
  });
  try {
    const applications = await docs({
      c: HONOR_APPLICATION_COLLECTION,
      w: where,
      pageNum,
      pageSize,
      orderBy: {
        created: -1
      }
    });
    const applicationsWithData = applications;

    // 获取相关的学生和班级数据
    const studentIds = [...new Set(applicationsWithData.map(app => app.studentId))];
    const classroomIds = [...new Set(applicationsWithData.map(app => app.classroomId))];

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

    // 组装数据
    const enrichedApplications = applicationsWithData.map(application => ({
      ...application,
      student: students.find(s => s._id === application.studentId) || null,
      classroom: classrooms.find(c => c._id === application.classroomId) || null
    }));
    return enrichedApplications;
  } catch (error) {
    console.error("获取荣誉申请记录失败:", error);
    throw new Error("获取荣誉申请记录失败");
  }
}

/**
 * 获取荣誉申请记录总数
 */
export async function getHonorApplicationsCount({
  schoolId,
  classIds,
  selectedClassId = "all",
  searchText = "",
  studentSearch = "",
  selectedStatus = "all",
  selectedShowInHonorBoard = "all",
  targetStudentId = null
}) {
  if (!schoolId) {
    throw new Error("schoolId 不能为空");
  }
  const where = await buildQueryConditions({
    schoolId,
    classIds,
    selectedClassId,
    searchText,
    studentSearch,
    selectedStatus,
    selectedShowInHonorBoard,
    targetStudentId
  });
  try {
    const totalCount = await count(HONOR_APPLICATION_COLLECTION, where);
    return totalCount;
  } catch (error) {
    console.error("获取荣誉申请记录总数失败:", error);
    throw new Error("获取荣誉申请记录总数失败");
  }
}

/**
 * 根据ID获取荣誉申请记录详情
 */
export async function getHonorApplicationById(applicationId) {
  try {
    const application = await getDoc(HONOR_APPLICATION_COLLECTION, applicationId);
    if (!application) {
      return null;
    }
    return application;
  } catch (error) {
    console.error("获取荣誉申请记录详情失败:", error);
    return null;
  }
}

/**
 * 更新荣誉申请的老师评语
 */
export async function updateHonorApplicationRemark({
  applicationId,
  teacherRemark
}) {
  try {
    const success = await updateDoc(HONOR_APPLICATION_COLLECTION, applicationId, {
      teacherRemark
    });
    if (!success) {
      return {
        success: false,
        error: "更新老师评语失败"
      };
    }
    return {
      success: true
    };
  } catch (error) {
    console.error("更新荣誉申请老师评语失败:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "更新老师评语失败"
    };
  }
}

/**
 * 更新荣誉申请信息
 */
export async function updateHonorApplicationInfo({
  applicationId,
  showInSchoolHonorBoard,
  subject,
  examScore,
  examName,
  teacherRemark
}) {
  try {
    const updateData = {
      showInSchoolHonorBoard,
      subject,
      examScore,
      examName,
      teacherRemark
    };
    const success = await updateDoc(HONOR_APPLICATION_COLLECTION, applicationId, updateData);
    if (!success) {
      return {
        success: false,
        error: "更新荣誉信息失败"
      };
    }
    return {
      success: true
    };
  } catch (error) {
    console.error("更新荣誉申请信息失败:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "更新荣誉信息失败"
    };
  }
}

/**
 * 获取荣誉配置信息
 */
async function getHonorConfig(honorName) {
  try {
    // 使用getSetting获取营销配置
    const {
      getSetting
    } = await import("../../../../../../lib/utils/setting");
    const settings = await getSetting("marketing_config");
    const marketingConfig = settings.marketing_config;
    if (!marketingConfig?.pointsSystem?.honor?.honors) {
      return null;
    }
    const honors = marketingConfig.pointsSystem.honor.honors;
    const honor = honors.find(h => h.name === honorName);
    return honor ? {
      points: honor.points
    } : null;
  } catch (error) {
    console.error("获取荣誉配置失败:", error);
    return null;
  }
}

/**
 * 创建学生成长记录
 */
async function createHonorGrowthRecord({
  schoolId,
  classroomId,
  studentId,
  honorName,
  points,
  applicationId,
  studentPhoto,
  examName,
  examScore
}) {
  try {
    const now = timestamp();

    // 构建描述信息：包含荣誉名称、考试名称（如果有）、分数（如果有）
    let description = `获得荣誉：${honorName}`;
    if (examName) {
      description += `（${examName}）`;
    }
    if (examScore !== null && examScore !== undefined) {
      description += ` 考试分数：${examScore}分`;
    }
    const growthData = {
      schoolId,
      classId: classroomId,
      studentId,
      description,
      type: "获得荣誉",
      isShowInGrowthPath: true,
      data: {
        honorName,
        honorApplicationId: applicationId,
        studentPhoto
      },
      score: {
        time: now,
        reason: description,
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
    return true;
  } catch (error) {
    console.error("创建学生成长记录失败:", error);
    return false;
  }
}

/**
 * 处理荣誉申请（通过或取消）
 */
export async function processHonorApplication({
  applicationId,
  status,
  teacherRemark,
  schoolId
}) {
  try {
    // 获取申请记录
    const application = await getHonorApplicationById(applicationId);
    if (!application) {
      return {
        success: false,
        error: "申请记录不存在"
      };
    }
    if (application.status !== "pending") {
      return {
        success: false,
        error: "只能处理待审核的申请"
      };
    }

    // 如果是通过状态，需要创建成长记录
    if (status === "completed") {
      const honorConfig = await getHonorConfig(application.honorName);
      if (!honorConfig) {
        return {
          success: false,
          error: `未找到荣誉"${application.honorName}"的配置信息`
        };
      }

      // 创建成长记录
      const growthSuccess = await createHonorGrowthRecord({
        schoolId,
        classroomId: application.classroomId,
        studentId: application.studentId,
        honorName: application.honorName,
        points: honorConfig.points,
        applicationId,
        studentPhoto: application.studentPhoto,
        examName: application.examName,
        examScore: application.examScore
      });
      if (!growthSuccess) {
        return {
          success: false,
          error: "创建成长记录失败"
        };
      }
    }

    // 更新申请状态
    const updateData = {
      status
    };
    if (teacherRemark !== undefined) {
      updateData.teacherRemark = teacherRemark;
    }
    const updateSuccess = await updateDoc(HONOR_APPLICATION_COLLECTION, applicationId, updateData);
    if (!updateSuccess) {
      return {
        success: false,
        error: "更新申请状态失败"
      };
    }
    return {
      success: true
    };
  } catch (error) {
    console.error("处理荣誉申请失败:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "处理荣誉申请失败"
    };
  }
}

/**
 * 删除与荣誉申请关联的学生成长记录
 */
async function deleteRelatedGrowthRecords(applicationId) {
  try {
    // 查找关联的成长记录
    const growthRecords = await allDocs({
      c: STUDENT_GROWTH_COLLECTION,
      match: {
        type: "荣誉获得积分"
      }
    });

    // 过滤出与当前申请关联的成长记录
    const relatedRecords = growthRecords.filter(record => {
      const data = record.data;
      return data.honorApplicationId === applicationId;
    });

    // 删除关联的成长记录
    for (const record of relatedRecords) {
      await removeDoc(STUDENT_GROWTH_COLLECTION, record._id);
    }
  } catch (error) {
    console.error("删除关联成长记录失败:", error);
    throw error;
  }
}

/**
 * 删除荣誉申请记录
 */
export async function deleteHonorApplication(applicationId) {
  try {
    // 获取申请记录
    const application = await getHonorApplicationById(applicationId);
    if (!application) {
      return {
        success: false,
        error: "申请记录不存在"
      };
    }

    // 删除关联的成长记录
    await deleteRelatedGrowthRecords(applicationId);

    // 删除申请记录中的照片文件
    if (application.studentPhoto && application.studentPhoto.length > 0) {
      const {
        deleteFile
      } = await import("../../../../../../lib/common/file");
      const fileIds = application.studentPhoto.map(photo => photo.imageFileID);
      try {
        await deleteFile(fileIds);
      } catch (error) {
        console.error("删除照片文件失败:", error);
        // 继续删除其他文件，不中断整个流程
      }
    }

    // 删除申请记录
    const deleteSuccess = await removeDoc(HONOR_APPLICATION_COLLECTION, applicationId);
    if (!deleteSuccess) {
      return {
        success: false,
        error: "删除申请记录失败"
      };
    }
    return {
      success: true
    };
  } catch (error) {
    console.error("删除荣誉申请记录失败:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "删除申请记录失败"
    };
  }
}

/**
 * 批量通过荣誉申请
 */
export async function batchApproveHonorApplications({
  applicationIds,
  schoolId
}) {
  try {
    if (applicationIds.length === 0) {
      return {
        success: false,
        approvedCount: 0,
        error: "未选择任何申请"
      };
    }
    const _ = command();

    // 首先验证所有申请都是待审核状态且属于当前校园
    const applications = await allDocs({
      c: HONOR_APPLICATION_COLLECTION,
      match: {
        _id: _.in(applicationIds),
        schoolId
      }
    });

    // 检查是否所有申请都存在且属于当前校园
    if (applications.length !== applicationIds.length) {
      return {
        success: false,
        approvedCount: 0,
        error: "部分申请不存在或不属于当前校园"
      };
    }

    // 检查是否所有申请都是待审核状态
    const nonPendingApplications = applications.filter(app => app.status !== "pending");
    if (nonPendingApplications.length > 0) {
      return {
        success: false,
        approvedCount: 0,
        error: "只能批量通过待审核状态的申请"
      };
    }

    // 批量更新申请状态
    const updatedCount = await updateMatch(HONOR_APPLICATION_COLLECTION, {
      _id: _.in(applicationIds),
      schoolId,
      status: "pending"
    }, {
      status: "completed",
      processedTime: timestamp()
    });

    // 为每个通过的申请创建成长记录
    for (const application of applications) {
      try {
        const honorConfig = await getHonorConfig(application.honorName);
        if (honorConfig) {
          await createHonorGrowthRecord({
            schoolId,
            classroomId: application.classroomId,
            studentId: application.studentId,
            honorName: application.honorName,
            points: honorConfig.points,
            applicationId: application._id,
            studentPhoto: application.studentPhoto,
            examName: application.examName,
            examScore: application.examScore
          });
        }
      } catch (error) {
        console.error(`创建学生成长记录失败 (申请ID: ${application._id}):`, error);
        // 继续处理其他申请，不中断整个批量操作
      }
    }
    return {
      success: true,
      approvedCount: updatedCount
    };
  } catch (error) {
    console.error("批量通过荣誉申请失败:", error);
    return {
      success: false,
      approvedCount: 0,
      error: error instanceof Error ? error.message : "批量通过申请失败"
    };
  }
}
