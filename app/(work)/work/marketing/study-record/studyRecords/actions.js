"use server";

import { deleteFile, getFileURL, uploadFile } from "../../../../../../lib/common/file.js";
import { timestamp } from "../../../../../../lib/common/time.js";
import { getCurrentUser } from "../../../../../../lib/utils/auth.js";
import { getTeacherAllClassRooms } from "../../../../../../lib/work/teacher/myClassroom.js";
import { createStudyRecord, deleteStudyRecord, deleteStudyRecordImage, getStudyRecordById, getStudyRecords, getStudyRecordsCount, searchStudentsInClass, updateStudyRecordContent, updateStudyRecordImages } from "./datas.js";

/**
 * 获取学情记录列表
 */
export async function getStudyRecordsAction({
  classIds,
  page = 1,
  pageSize = 20,
  selectedClassId = "all",
  searchContent = "",
  studentSearch = "",
  targetStudentId = null
}) {
  try {
    const pageNum = page - 1; // 转换为从0开始的页码

    const [records, totalCount] = await Promise.all([getStudyRecords({
      classIds,
      pageNum,
      pageSize,
      selectedClassId,
      searchContent,
      studentSearch,
      targetStudentId
    }), getStudyRecordsCount({
      classIds,
      selectedClassId,
      searchContent,
      studentSearch,
      targetStudentId
    })]);
    return {
      success: true,
      data: records,
      totalCount
    };
  } catch (error) {
    console.error("获取学情记录列表失败:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "获取学情记录列表失败",
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
 * 获取学情记录详情
 */
export async function getStudyRecordByIdAction({
  recordId
}) {
  try {
    const record = await getStudyRecordById(recordId);
    if (!record) {
      return {
        success: false,
        error: "学情记录不存在",
        record: null
      };
    }
    return {
      success: true,
      record
    };
  } catch (error) {
    console.error("获取学情记录详情失败:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "获取学情记录详情失败",
      record: null
    };
  }
}

/**
 * 在指定班级中搜索学生
 */
export async function searchStudentsInClassAction({
  classId,
  searchText
}) {
  try {
    const students = await searchStudentsInClass(classId, searchText);
    return {
      success: true,
      students
    };
  } catch (error) {
    console.error("搜索班级学生失败:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "搜索学生失败",
      students: []
    };
  }
}

/**
 * 创建学情记录
 */
export async function createStudyRecordAction({
  schoolId,
  classroomId,
  studentId,
  content,
  points
}) {
  try {
    // 获取当前用户信息
    const currentUser = await getCurrentUser();
    if (!currentUser?.wxUserId) {
      return {
        success: false,
        error: "无法获取当前用户信息"
      };
    }
    const result = await createStudyRecord({
      schoolId,
      classroomId,
      studentId,
      content,
      points,
      operatorUserId: currentUser.wxUserId
    });
    return result;
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
export async function updateStudyRecordContentAction({
  recordId,
  content
}) {
  try {
    const result = await updateStudyRecordContent({
      recordId,
      content
    });
    return result;
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
export async function deleteStudyRecordAction({
  recordId
}) {
  try {
    // 获取学情记录以获取图片信息
    const {
      success: getSuccess,
      record
    } = await getStudyRecordByIdAction({
      recordId
    });
    if (!getSuccess || !record) {
      return {
        success: false,
        error: "获取学情记录失败"
      };
    }

    // 先删除相关图片
    if (record.images && record.images.length > 0) {
      const fileIds = record.images.map(image => image.imageFileID);
      try {
        await deleteFile(fileIds);
      } catch (error) {
        console.warn("删除图片失败:", error);
        // 图片删除失败不影响记录删除
      }
    }

    // 然后删除记录
    const result = await deleteStudyRecord(recordId);
    return result;
  } catch (error) {
    console.error("删除学情记录失败:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "删除学情记录失败"
    };
  }
}

/**
 * 上传学情记录图片
 */
export async function uploadStudyRecordImageAction({
  recordId,
  file,
  studentId
}) {
  try {
    // 获取当前记录
    const {
      success: getSuccess,
      record
    } = await getStudyRecordByIdAction({
      recordId
    });
    if (!getSuccess || !record) {
      return {
        success: false,
        error: "学情记录不存在"
      };
    }
    const now = timestamp();
    const fileExtension = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const cloudPath = `cuoti/study-record/${studentId}/${now}-1.${fileExtension}`;

    // 将 File 转换为 Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 上传文件到云存储
    const uploadResult = await uploadFile(cloudPath, buffer);
    if (!uploadResult.fileID) {
      return {
        success: false,
        error: "图片上传失败"
      };
    }

    // 获取文件 URL
    const imageUrl = await getFileURL(uploadResult.fileID);
    const imageData = {
      imageFileID: uploadResult.fileID,
      imageUrl: imageUrl,
      imagePath: cloudPath
    };

    // 更新学情记录的图片数组
    const currentImages = record.images || [];
    const updatedImages = [...currentImages, imageData];
    const updateResult = await updateStudyRecordImages({
      recordId,
      images: updatedImages
    });
    if (!updateResult.success) {
      // 如果数据库更新失败，删除已上传的文件
      try {
        await deleteFile([uploadResult.fileID]);
      } catch (deleteError) {
        console.warn("删除上传失败的文件时出错:", deleteError);
      }
      return {
        success: false,
        error: updateResult.error || "更新数据库失败"
      };
    }
    return {
      success: true,
      imageData
    };
  } catch (error) {
    console.error("上传学情记录图片失败:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "上传图片失败"
    };
  }
}

/**
 * 删除学情记录图片
 */
export async function deleteStudyRecordImageAction({
  recordId,
  imageFileID
}) {
  try {
    // 先更新数据库
    const result = await deleteStudyRecordImage({
      recordId,
      imageFileID
    });
    if (!result.success) {
      return result;
    }

    // 数据库更新成功后删除云存储中的文件
    try {
      await deleteFile([imageFileID]);
    } catch (deleteError) {
      console.warn("删除云存储文件时出错:", deleteError);
      // 即使删除文件失败，也认为操作成功，因为数据库已更新
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
