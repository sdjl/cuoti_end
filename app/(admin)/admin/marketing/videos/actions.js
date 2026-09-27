"use server";

import { createVideo as createVideoInDB, deleteVideo as deleteVideoFromDB, getVideoCategories as getCategoriesFromDB, getVideo as getVideoFromDB, getVideos as getVideosFromDB, updateVideo as updateVideoInDB } from "./datas.js";
/**
 * 获取视频列表
 */
export async function getVideos(params = {}) {
  return await getVideosFromDB(params);
}

/**
 * 获取所有视频分类
 */
export async function getVideoCategories() {
  return await getCategoriesFromDB();
}

/**
 * 获取单个视频
 */
export async function getVideo(id) {
  return await getVideoFromDB(id);
}

/**
 * 创建视频
 */
export async function createVideo(videoData) {
  return await createVideoInDB(videoData);
}

/**
 * 更新视频
 */
export async function updateVideo(id, videoData) {
  return await updateVideoInDB(id, videoData);
}

/**
 * 删除视频
 */
export async function deleteVideo(id) {
  return await deleteVideoFromDB(id);
}
