"use server";

import { deleteFile, getFileURL, uploadFile } from "../../../../../../lib/common/file.js";
import { timestamp } from "../../../../../../lib/common/time.js";
import { getCurrentUser } from "../../../../../../lib/utils/auth.js";
import { getTeacherAllClassRooms } from "../../../../../../lib/work/teacher/myClassroom.js";
import { createLearningMaterial, deleteLearningMaterial, getLearningMaterialById, getLearningMaterials, getLearningMaterialsCount, updateLearningMaterial } from "./datas.js";

/**
 * 根据文件扩展名获取资料类型
 */
function getFileType(fileName) {
  const extension = fileName.split(".").pop()?.toLowerCase() || "";
  if (["pdf"].includes(extension)) return "pdf";
  if (["doc", "docx"].includes(extension)) return "word";
  if (["xls", "xlsx"].includes(extension)) return "excel";
  if (["ppt", "pptx"].includes(extension)) return "ppt";
  if (["zip", "rar", "7z"].includes(extension)) return "zip";
  if (["jpg", "jpeg", "png", "gif", "bmp"].includes(extension)) return "image";
  return "other";
}

/**
 * 获取学习资料列表
 */
export async function getLearningMaterialsAction({
  schoolId,
  page = 1,
  pageSize = 20,
  selectedClassId = "all",
  searchText = "",
  selectedType = "all",
  selectedStatus = "all"
}) {
  try {
    const pageNum = page - 1; // 转换为从0开始的页码

    const [materials, totalCount] = await Promise.all([getLearningMaterials({
      schoolId,
      pageNum,
      pageSize,
      selectedClassId,
      searchText,
      selectedType,
      selectedStatus
    }), getLearningMaterialsCount({
      schoolId,
      selectedClassId,
      searchText,
      selectedType,
      selectedStatus
    })]);
    return {
      success: true,
      data: materials,
      totalCount
    };
  } catch (error) {
    console.error("获取学习资料列表失败:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "获取学习资料列表失败",
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
 * 获取学习资料详情
 */
export async function getLearningMaterialByIdAction({
  materialId
}) {
  try {
    const material = await getLearningMaterialById(materialId);
    if (!material) {
      return {
        success: false,
        error: "学习资料不存在",
        material: null
      };
    }
    return {
      success: true,
      material
    };
  } catch (error) {
    console.error("获取学习资料详情失败:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "获取学习资料详情失败",
      material: null
    };
  }
}

/**
 * 创建学习资料
 */
export async function createLearningMaterialAction({
  schoolId,
  classroomId,
  title,
  description,
  file,
  status,
  remark
}) {
  try {
    const now = timestamp();
    const currentUser = await getCurrentUser();
    if (!currentUser?.wxUserId) {
      return {
        success: false,
        error: "无法获取当前用户信息"
      };
    }
    const uploaderUserId = currentUser.wxUserId;

    // 上传文件
    const fileExtension = file.name.split(".").pop()?.toLowerCase() || "";
    const cloudPath = `cuoti/learning-materials/${schoolId}/${now}.${fileExtension}`;

    // 将 File 转换为 Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 上传文件到云存储
    const uploadResult = await uploadFile(cloudPath, buffer);
    if (!uploadResult.fileID) {
      return {
        success: false,
        error: "文件上传失败"
      };
    }

    // 获取文件 URL
    const fileUrl = await getFileURL(uploadResult.fileID);

    // 创建学习资料记录
    const materialData = {
      schoolId,
      classroomId,
      title: title.trim(),
      description: description?.trim(),
      type: getFileType(file.name),
      file: {
        fileId: uploadResult.fileID,
        fileSize: file.size,
        filePath: cloudPath,
        fileUrl: fileUrl,
        fileExtension: fileExtension
      },
      status,
      uploaderUserId,
      created: now,
      updated: now,
      remark: remark?.trim()
    };
    const result = await createLearningMaterial({
      materialData
    });
    return result;
  } catch (error) {
    console.error("创建学习资料失败:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "创建学习资料失败"
    };
  }
}

/**
 * 更新学习资料
 */
export async function updateLearningMaterialAction({
  materialId,
  title,
  description,
  file,
  status,
  remark
}) {
  try {
    const now = timestamp();

    // 获取当前资料信息
    const material = await getLearningMaterialById(materialId);
    if (!material) {
      return {
        success: false,
        error: "学习资料不存在"
      };
    }
    let fileData = material.file;

    // 如果有新文件，处理文件上传
    if (file) {
      // 删除旧文件
      try {
        await deleteFile([material.file.fileId]);
      } catch (error) {
        console.warn("删除旧文件失败:", error);
      }

      // 上传新文件
      const fileExtension = file.name.split(".").pop()?.toLowerCase() || "";
      const cloudPath = `cuoti/learning-materials/${material.schoolId}/${now}.${fileExtension}`;

      // 将 File 转换为 Buffer
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // 上传文件到云存储
      const uploadResult = await uploadFile(cloudPath, buffer);
      if (!uploadResult.fileID) {
        return {
          success: false,
          error: "文件上传失败"
        };
      }

      // 获取文件 URL
      const fileUrl = await getFileURL(uploadResult.fileID);
      fileData = {
        fileId: uploadResult.fileID,
        fileSize: file.size,
        filePath: cloudPath,
        fileUrl: fileUrl,
        fileExtension: fileExtension
      };
    }

    // 更新资料信息
    const updateData = {
      title: title.trim(),
      description: description?.trim(),
      file: fileData,
      status,
      updated: now,
      remark: remark?.trim()
    };

    // 如果有新文件，也更新文件类型
    if (file) {
      updateData.type = getFileType(file.name);
    }
    const result = await updateLearningMaterial({
      materialId,
      updateData
    });
    return result;
  } catch (error) {
    console.error("更新学习资料失败:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "更新学习资料失败"
    };
  }
}

/**
 * 删除学习资料
 */
export async function deleteLearningMaterialAction({
  materialId
}) {
  try {
    // 获取学习资料
    const material = await getLearningMaterialById(materialId);
    if (!material) {
      return {
        success: false,
        error: "学习资料不存在"
      };
    }

    // 删除文件
    try {
      await deleteFile([material.file.fileId]);
    } catch (error) {
      console.warn("删除文件失败:", error);
      // 文件删除失败不影响记录删除
    }

    // 删除学习资料记录
    const result = await deleteLearningMaterial(materialId);
    return result;
  } catch (error) {
    console.error("删除学习资料失败:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "删除学习资料失败"
    };
  }
}
