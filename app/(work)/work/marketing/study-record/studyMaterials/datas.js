import { addDoc, allDocs, command, count, docs, getDoc, removeDoc, updateDoc } from "../../../../../../lib/common/database.js";

// 只导入数据库相关的函数

/** 学习资料集合名称 */
const LEARNING_MATERIAL_COLLECTION = "learning_material";

/** 班级集合名称 */
const CLASSROOM_COLLECTION = "classroom";

/** 微信用户集合名称 */
const WX_USER_COLLECTION = "wx_user";

/**
 * 构建查询条件
 */
async function buildQueryConditions({
  schoolId,
  selectedClassId = "all",
  searchText = "",
  selectedType = "all",
  selectedStatus = "all"
}) {
  const _ = command();
  let where = {
    schoolId
  };

  // 按班级过滤
  if (selectedClassId !== "all") {
    where.classroomId = selectedClassId;
  }

  // 搜索标题、描述、备注
  if (searchText.trim()) {
    where = _.and(where, _.or({
      title: new RegExp(searchText.trim(), "i")
    }, {
      description: new RegExp(searchText.trim(), "i")
    }, {
      remark: new RegExp(searchText.trim(), "i")
    }));
  }

  // 按文件类型过滤
  if (selectedType !== "all") {
    where = _.and(where, {
      type: selectedType
    });
  }

  // 按状态过滤
  if (selectedStatus !== "all") {
    where = _.and(where, {
      status: selectedStatus
    });
  }
  return where;
}

/**
 * 获取学习资料列表（分页）
 */
export async function getLearningMaterials({
  schoolId,
  pageNum = 0,
  pageSize = 20,
  selectedClassId = "all",
  searchText = "",
  selectedType = "all",
  selectedStatus = "all"
}) {
  if (!schoolId) {
    throw new Error("schoolId 不能为空");
  }
  const where = await buildQueryConditions({
    schoolId,
    selectedClassId,
    searchText,
    selectedType,
    selectedStatus
  });
  try {
    const materials = await docs({
      c: LEARNING_MATERIAL_COLLECTION,
      w: where,
      pageNum,
      pageSize,
      orderBy: {
        created: -1
      }
    });
    const materialsWithData = materials;

    // 获取相关的班级和微信用户数据
    const classroomIds = [...new Set(materialsWithData.map(material => material.classroomId))];
    const uploaderUserIds = [...new Set(materialsWithData.map(material => material.uploaderUserId))];

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
    const wxUsers = uploaderUserIds.length > 0 ? await allDocs({
      c: WX_USER_COLLECTION,
      match: {
        _id: command().in(uploaderUserIds)
      },
      project: {
        _id: 1,
        userInfo: 1
      }
    }) : [];

    // 组装数据
    const enrichedMaterials = materialsWithData.map(material => ({
      ...material,
      classroom: classrooms.find(c => c._id === material.classroomId) || null,
      uploaderUser: wxUsers.find(u => u._id === material.uploaderUserId) || null
    }));
    return enrichedMaterials;
  } catch (error) {
    console.error("获取学习资料失败:", error);
    throw new Error("获取学习资料失败");
  }
}

/**
 * 获取学习资料总数
 */
export async function getLearningMaterialsCount({
  schoolId,
  selectedClassId = "all",
  searchText = "",
  selectedType = "all",
  selectedStatus = "all"
}) {
  if (!schoolId) {
    throw new Error("schoolId 不能为空");
  }
  const where = await buildQueryConditions({
    schoolId,
    selectedClassId,
    searchText,
    selectedType,
    selectedStatus
  });
  try {
    const totalCount = await count(LEARNING_MATERIAL_COLLECTION, where);
    return totalCount;
  } catch (error) {
    console.error("获取学习资料总数失败:", error);
    throw new Error("获取学习资料总数失败");
  }
}

/**
 * 根据ID获取学习资料详情
 */
export async function getLearningMaterialById(materialId) {
  try {
    const material = await getDoc(LEARNING_MATERIAL_COLLECTION, materialId);
    if (!material) {
      return null;
    }
    return material;
  } catch (error) {
    console.error("获取学习资料详情失败:", error);
    return null;
  }
}

// 文件类型检测函数已移到actions.ts

/**
 * 创建学习资料记录（仅数据库操作）
 */
export async function createLearningMaterial({
  materialData
}) {
  try {
    const materialId = await addDoc(LEARNING_MATERIAL_COLLECTION, materialData);
    return {
      success: true,
      materialId
    };
  } catch (error) {
    console.error("创建学习资料失败:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "创建学习资料失败"
    };
  }
}

/**
 * 更新学习资料记录（仅数据库操作）
 */
export async function updateLearningMaterial({
  materialId,
  updateData
}) {
  try {
    const success = await updateDoc(LEARNING_MATERIAL_COLLECTION, materialId, updateData);
    if (!success) {
      return {
        success: false,
        error: "更新学习资料失败"
      };
    }
    return {
      success: true
    };
  } catch (error) {
    console.error("更新学习资料失败:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "更新学习资料失败"
    };
  }
}

/**
 * 删除学习资料记录（仅数据库操作）
 */
export async function deleteLearningMaterial(materialId) {
  try {
    // 删除学习资料记录
    const deleteSuccess = await removeDoc(LEARNING_MATERIAL_COLLECTION, materialId);
    if (!deleteSuccess) {
      return {
        success: false,
        error: "删除学习资料失败"
      };
    }
    return {
      success: true
    };
  } catch (error) {
    console.error("删除学习资料失败:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "删除学习资料失败"
    };
  }
}
