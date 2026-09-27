"use server";

import { deleteFile } from "../../../../../../lib/common/file.js";
import { getTeacherAllClassRooms } from "../../../../../../lib/work/teacher/myClassroom.js";
import { getCurrentSchoolId } from "../../../../../../lib/work/teacher/mySchool.js";
import { batchApproveHonorApplications, deleteHonorApplication, getHonorApplicationById, getHonorApplications, getHonorApplicationsCount, processHonorApplication, updateHonorApplicationInfo, updateHonorApplicationRemark } from "./datas.js";

/**
 * 获取荣誉申请记录列表
 */
export async function getHonorApplicationsAction({
  classIds,
  page = 1,
  pageSize = 20,
  selectedClassId = "all",
  searchText = "",
  studentSearch = "",
  selectedStatus = "all",
  selectedShowInHonorBoard = "all",
  targetStudentId = null
}) {
  try {
    // 获取当前校园ID
    const schoolId = await getCurrentSchoolId();
    const pageNum = page - 1; // 转换为从0开始的页码

    const [applications, totalCount] = await Promise.all([getHonorApplications({
      schoolId,
      classIds,
      pageNum,
      pageSize,
      selectedClassId,
      searchText,
      studentSearch,
      selectedStatus,
      selectedShowInHonorBoard,
      targetStudentId
    }), getHonorApplicationsCount({
      schoolId,
      classIds,
      selectedClassId,
      searchText,
      studentSearch,
      selectedStatus,
      selectedShowInHonorBoard,
      targetStudentId
    })]);
    return {
      success: true,
      data: applications,
      totalCount
    };
  } catch (error) {
    console.error("获取荣誉申请记录列表失败:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "获取荣誉申请记录列表失败",
      data: [],
      totalCount: 0
    };
  }
}

/**
 * 获取当前用户可查看的班级列表
 */
export async function getAvailableClassroomsAction() {
  try {
    const classrooms = await getTeacherAllClassRooms();
    return {
      success: true,
      data: classrooms
    };
  } catch (error) {
    console.error("获取班级列表失败:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "获取班级列表失败",
      data: []
    };
  }
}

/**
 * 获取荣誉申请记录详情
 */
export async function getHonorApplicationByIdAction({
  applicationId
}) {
  try {
    const application = await getHonorApplicationById(applicationId);
    if (!application) {
      return {
        success: false,
        error: "申请记录不存在",
        application: null
      };
    }
    return {
      success: true,
      application
    };
  } catch (error) {
    console.error("获取荣誉申请记录详情失败:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "获取申请记录详情失败",
      application: null
    };
  }
}

/**
 * 更新荣誉申请的老师评语
 */
export async function updateHonorApplicationRemarkAction({
  applicationId,
  teacherRemark
}) {
  try {
    const result = await updateHonorApplicationRemark({
      applicationId,
      teacherRemark
    });
    return result;
  } catch (error) {
    console.error("更新老师评语失败:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "更新老师评语失败"
    };
  }
}

/**
 * 更新荣誉申请信息
 */
export async function updateHonorApplicationInfoAction({
  applicationId,
  showInSchoolHonorBoard,
  subject,
  examScore,
  examName,
  teacherRemark
}) {
  try {
    const result = await updateHonorApplicationInfo({
      applicationId,
      showInSchoolHonorBoard,
      subject,
      examScore,
      examName,
      teacherRemark
    });
    return result;
  } catch (error) {
    console.error("更新荣誉信息失败:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "更新荣誉信息失败"
    };
  }
}

/**
 * 处理荣誉申请
 */
export async function processHonorApplicationAction({
  applicationId,
  status,
  teacherRemark,
  schoolId
}) {
  try {
    const result = await processHonorApplication({
      applicationId,
      status,
      teacherRemark,
      schoolId
    });
    return result;
  } catch (error) {
    console.error("处理荣誉申请失败:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "处理荣誉申请失败"
    };
  }
}

/**
 * 删除荣誉申请记录
 */
export async function deleteHonorApplicationAction({
  applicationId
}) {
  try {
    // 获取申请记录以获取图片信息
    const {
      success: getSuccess,
      application
    } = await getHonorApplicationByIdAction({
      applicationId
    });
    if (!getSuccess || !application) {
      return {
        success: false,
        error: "获取申请记录失败"
      };
    }

    // 先删除相关图片
    if (application.studentPhoto && application.studentPhoto.length > 0) {
      const fileIds = application.studentPhoto.map(photo => photo.imageFileID);
      try {
        await deleteFile(fileIds);
      } catch (error) {
        console.warn("删除图片失败:", error);
        // 图片删除失败不影响记录删除
      }
    }

    // 然后删除记录
    const result = await deleteHonorApplication(applicationId);
    return result;
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
export async function batchApproveHonorApplicationsAction({
  applicationIds
}) {
  try {
    // 获取当前校园ID
    const schoolId = await getCurrentSchoolId();
    const result = await batchApproveHonorApplications({
      applicationIds,
      schoolId
    });
    return result;
  } catch (error) {
    console.error("批量通过荣誉申请失败:", error);
    return {
      success: false,
      approvedCount: 0,
      error: error instanceof Error ? error.message : "批量通过申请失败"
    };
  }
}
