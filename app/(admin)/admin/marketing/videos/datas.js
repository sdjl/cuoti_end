"use server";

import { addDoc, count, docs, getDistinctValues, getDoc, removeDoc, updateDoc } from "../../../../../lib/common/database.js";
/**
 * 获取视频列表（分页）
 */
export async function getVideos(params = {}) {
  try {
    const {
      title,
      category,
      page = 1,
      pageSize = 20
    } = params;

    // 构建查询条件
    const where = {};
    if (title) {
      where.title = new RegExp(title, "i"); // 模糊搜索，不区分大小写
    }
    if (category) {
      where.category = category;
    }

    // 分页查询 - pageNum从0开始
    const pageNum = page - 1;
    const [videos, totalCount] = await Promise.all([docs({
      c: "video",
      w: where,
      pageNum,
      pageSize,
      orderBy: "created desc"
    }), count("video", where)]);
    const totalPages = Math.ceil(totalCount / pageSize);
    return {
      success: true,
      data: videos,
      total: totalCount,
      page,
      pageSize,
      totalPages
    };
  } catch (error) {
    console.error("获取视频列表失败:", error);
    return {
      success: false,
      message: `获取视频列表失败: ${error.message}`,
      data: [],
      total: 0,
      page: 1,
      pageSize: 20,
      totalPages: 0
    };
  }
}

/**
 * 获取所有视频分类
 */
export async function getVideoCategories() {
  try {
    const categories = await getDistinctValues({
      c: "video",
      field: "category"
    });
    return {
      success: true,
      data: categories
    };
  } catch (error) {
    console.error("获取视频分类失败:", error);
    return {
      success: false,
      message: `获取视频分类失败: ${error.message}`,
      data: []
    };
  }
}

/**
 * 获取单个视频
 */
export async function getVideo(id) {
  try {
    const result = await getDoc("video", id);
    if (result) {
      return {
        success: true,
        data: result
      };
    } else {
      return {
        success: false,
        message: "视频不存在"
      };
    }
  } catch (error) {
    console.error("获取视频失败:", error);
    return {
      success: false,
      message: `获取视频失败: ${error.message}`
    };
  }
}

/**
 * 创建视频
 */
export async function createVideo(videoData) {
  try {
    const newVideo = {
      ...videoData,
      created: Date.now()
    };
    const docId = await addDoc("video", newVideo);
    return {
      success: true,
      message: "视频创建成功",
      data: {
        _id: docId,
        ...newVideo
      }
    };
  } catch (error) {
    console.error("创建视频失败:", error);
    return {
      success: false,
      message: `创建视频失败: ${error.message}`
    };
  }
}

/**
 * 更新视频
 */
export async function updateVideo(id, videoData) {
  try {
    const success = await updateDoc("video", id, videoData);
    if (success) {
      return {
        success: true,
        message: "视频更新成功"
      };
    } else {
      return {
        success: false,
        message: "视频不存在或数据无变化"
      };
    }
  } catch (error) {
    console.error("更新视频失败:", error);
    return {
      success: false,
      message: `更新视频失败: ${error.message}`
    };
  }
}

/**
 * 删除视频
 */
export async function deleteVideo(id) {
  try {
    const success = await removeDoc("video", id, {
      deleteDocFiles: false
    });
    if (success) {
      return {
        success: true,
        message: "视频删除成功"
      };
    } else {
      return {
        success: false,
        message: "视频不存在或删除失败"
      };
    }
  } catch (error) {
    console.error("删除视频失败:", error);
    return {
      success: false,
      message: `删除视频失败: ${error.message}`
    };
  }
}
