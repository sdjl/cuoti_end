import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { after } from "next/server";
import { allDocs, command } from "../../../lib/common/database.js";

// ==================== 全局配置变量 ====================

/** API访问密码 */
export const API_SECRET = "xK9mP2nQ7vR4wL8zT5jY";

/** 任务超时时间（分钟）- 适用于所有任务（学生PDF、班级ZIP、任务ZIP）的生成和清理 */
export const TASK_TIMEOUT_MINUTES = 3;

/** 临时目录清理时间（分钟）- 临时目录用于保存下载的PDF文件和班级ZIP文件，支持增量下载和断点续传 */
export const TEMP_DIR_CLEANUP_TIME_MINUTES = 60;

/**
 * 失败后自动重试的最大次数
 *
 * 重要机制说明（详见 docs/其他/服务端批量生成PDF调度方案.md）：
 * 1. 互斥执行：同一时间只有一个ZIP生成任务在执行（班级ZIP或任务ZIP）
 * 2. 失败优先重试：通过按创建时间排序，确保失败的任务优先被重新执行
 * 3. 临时文件管理：成功或彻底失败时清理，失败但可重试时保留
 */
export const MAX_RETRY_COUNT = 5; // 开得太大会导致CDN资源消耗过快

/**
 * 内存使用率阈值（百分比），超过此值将导致任务失败
 * 检查时将当前内存使用率乘以2来评估（因为生成ZIP也会占用内存）
 */
export const MEMORY_USAGE_THRESHOLD_PERCENT = 80;

/** 每次执行最多生成多少个 MistakeBatchStudentPdfDoc 的PDF文件，默认为5个 */
// 注意：每个 MistakeBatchStudentPdfDoc 有两个PDF（错题PDF和答案PDF），因此实际会生成 N*2 个PDF文件
export const MAX_STUDENTS_PER_RUN = 10;

/** 每次执行最多清理多少个文件（适用于所有清理任务），默认为20个 */
export const MAX_CLEANING_PER_RUN = 20;

/** 任务ZIP文件的最大大小限制（MB）
 * 如果任务的所有班级ZIP文件总和超过此限制，将跳过任务ZIP生成，直接标记为完成
 * 用户可以直接下载各个班级的ZIP文件
 */
export const MAX_TASK_ZIP_SIZE_MB = 1024;

/** PDF中图片的最大宽度（px），超过此宽度的图片将被等比例缩放，默认1500px（测试过，1000px不清晰） */
export const MAX_IMAGE_SIZE = 1500;

/** PDF中图片的JPEG压缩质量（1-100），默认为100 */
export const PDF_IMAGE_JPEG_QUALITY = 100;

/** 非首页是否显示页眉信息，true表示所有页面都有页眉，false表示只有第一页有页眉 */
export const SHOW_HEADER_ON_NON_FIRST_PAGE = false;

/** PDF页眉右侧二维码的尺寸（px），与左侧二维码保持一致 */
export const HEADER_QR_CODE_SIZE = 60;
import { DOMAIN } from "../../../lib/config/constants.js";

/** 学生PDF二维码URL基础路径
 * 老师扫码会访问： ${DOMAIN.PROD}/mistake-student-pdf/${MistakeBatchStudentPdfDoc._id}
 */
export const STUDENT_PDF_QR_CODE_BASE_URL = `${DOMAIN.PROD}/mistake-student-pdf`;

// ==================== 工具函数 ====================

/**
 * 检查 AbortSignal 是否已中止，如果是则抛出异常
 * 用于在 after 函数中定期检查是否超时
 */
export function throwIfAborted(signal) {
  if (signal?.aborted) {
    throw new Error("after运行超时");
  }
}


export function safeAfter(fn, timeoutMs = TASK_TIMEOUT_MINUTES * 60 * 1000) {
  after(async () => {
    // 创建 AbortController 用于取消支持的操作
    const abortController = new AbortController();

    // 创建超时 Promise
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        abortController.abort(); // 尝试中止正在进行的操作
        reject(new Error(`after 函数执行超时（超过 ${timeoutMs}ms）`));
      }, timeoutMs);
    });

    // 使用 Promise.race 同时运行任务和超时检查，将 AbortSignal 传递给实际执行的函数
    await Promise.race([fn(abortController.signal), timeoutPromise]);
  });
}

/**
 * 内存不足错误类（用于标识不需要重试的内存错误）
 */
export class InsufficientMemoryError extends Error {
  constructor(message) {
    super(message);
    this.name = "InsufficientMemoryError";
  }
}


export function checkMemoryUsage(taskType) {
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  const usedMemory = totalMemory - freeMemory;
  const usagePercent = usedMemory / totalMemory * 100;

  // 总是乘以2来评估，因为生成ZIP也会占用内存
  const effectiveUsagePercent = usagePercent * 2;
  if (effectiveUsagePercent > MEMORY_USAGE_THRESHOLD_PERCENT) {
    const usedMemoryMB = (usedMemory / 1024 / 1024).toFixed(2);
    const totalMemoryMB = (totalMemory / 1024 / 1024).toFixed(2);
    throw new InsufficientMemoryError(`内存不足：${taskType}当前内存使用率为 ${usagePercent.toFixed(2)}%` + `（已使用 ${usedMemoryMB}MB / 总共 ${totalMemoryMB}MB），` + `预计生成ZIP文件后将达到 ${effectiveUsagePercent.toFixed(2)}%，` + `超过了系统限制 ${MEMORY_USAGE_THRESHOLD_PERCENT}%。` + `请增加服务器内存或减少任务量（如减少题目数量、分批处理等），然后联系管理员处理。`);
  }
}


export async function checkTaskStatus() {
  const _ = command();

  // 一次性查询所有不是 completed 和 cleaned 状态的任务
  const tasks = await allDocs({
    c: "mistake_batch_task",
    match: {
      status: _.nin(["completed", "cleaned"])
    },
    only: "status"
  });

  // 生成中的状态（非清理状态）
  const generatingStatuses = ["waiting", "generating", "failed"];

  // 清理中的状态（非生成状态）
  const cleaningStatuses = ["waiting_clean", "cleaning", "clean_failed"];

  // 检查是否有生成中的任务
  const hasGeneratingTasks = tasks.some(task => generatingStatuses.includes(task.status));

  // 检查是否有清理中的任务
  const hasCleaningTasks = tasks.some(task => cleaningStatuses.includes(task.status));
  return {
    hasGeneratingTasks,
    hasCleaningTasks
  };
}

// ==================== 临时目录管理 ====================

/**
 * 获取临时目录根路径
 * 使用系统的 /tmp 目录
 */
export function getTempRootDir() {
  return path.join("/tmp", "mistake-batch");
}

/**
 * 生成班级ZIP临时目录路径
 * 格式：/tmp/mistake-batch/class/Class_{taskId}_{classId}
 */
export function getClassZipTempDir(taskId, classId) {
  const dirName = `Class_${taskId}_${classId}`;
  return path.join(getTempRootDir(), "class", dirName);
}

/**
 * 生成任务总ZIP临时目录路径
 * 格式：/tmp/mistake-batch/task/Task_{taskId}
 */
export function getTaskZipTempDir(taskId) {
  const dirName = `Task_${taskId}`;
  return path.join(getTempRootDir(), "task", dirName);
}

/**
 * 确保目录存在，如果不存在则创建，并写入创建时间文件
 */
export function ensureDirExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, {
      recursive: true
    });
    // 写入创建时间文件
    const createdAtFile = path.join(dirPath, "createdAt.txt");
    fs.writeFileSync(createdAtFile, Date.now().toString(), "utf-8");
  }
}


function getDirCreatedTime(dirPath) {
  const createdAtFile = path.join(dirPath, "createdAt.txt");
  try {
    if (fs.existsSync(createdAtFile)) {
      const content = fs.readFileSync(createdAtFile, "utf-8");
      const timestamp = parseInt(content, 10);
      return Number.isNaN(timestamp) ? null : timestamp;
    }
  } catch {
    // 读取失败
  }
  return null;
}

/**
 * 递归删除目录
 */
export function removeDirRecursive(dirPath) {
  if (fs.existsSync(dirPath)) {
    fs.rmSync(dirPath, {
      recursive: true,
      force: true
    });
  }
}

/**
 * 根据任务ID和班级ID清理班级临时目录
 * 用于任务达到最大重试次数后立即清理
 */
export function cleanupClassTempDir(taskId, classId) {
  const tempDir = getClassZipTempDir(taskId, classId);
  if (fs.existsSync(tempDir)) {
    try {
      removeDirRecursive(tempDir);
      console.log(`已清理班级临时目录（任务失败）: ${tempDir}`);
    } catch (error) {
      console.error(`清理班级临时目录失败: ${tempDir}`, error);
    }
  }
}

/**
 * 根据任务ID清理任务临时目录
 * 用于任务达到最大重试次数后立即清理
 */
export function cleanupTaskTempDir(taskId) {
  const tempDir = getTaskZipTempDir(taskId);
  if (fs.existsSync(tempDir)) {
    try {
      removeDirRecursive(tempDir);
      console.log(`已清理任务临时目录（任务失败）: ${tempDir}`);
    } catch (error) {
      console.error(`清理任务临时目录失败: ${tempDir}`, error);
    }
  }
}

/**
 * 清理过期的临时目录
 * 清理超过指定时间的临时目录
 */
export function cleanupExpiredTempDirs() {
  const tempRoot = getTempRootDir();

  // 确保临时根目录存在
  if (!fs.existsSync(tempRoot)) {
    return;
  }
  const now = Date.now();
  const expirationTime = now - TEMP_DIR_CLEANUP_TIME_MINUTES * 60 * 1000;

  // 清理班级ZIP临时目录
  const classDir = path.join(tempRoot, "class");
  if (fs.existsSync(classDir)) {
    const classDirs = fs.readdirSync(classDir);
    for (const dirName of classDirs) {
      const dirPath = path.join(classDir, dirName);
      try {
        const stats = fs.statSync(dirPath);
        if (stats.isDirectory()) {
          // 从 createdAt.txt 文件读取创建时间
          const createdTime = getDirCreatedTime(dirPath);
          if (createdTime && createdTime < expirationTime) {
            removeDirRecursive(dirPath);
            console.log(`已清理过期的班级临时目录: ${dirPath} (创建于: ${new Date(createdTime).toLocaleString()})`);
          }
        }
      } catch (error) {
        console.error(`清理班级临时目录失败: ${dirPath}`, error);
      }
    }
  }

  // 清理任务总ZIP临时目录
  const taskDir = path.join(tempRoot, "task");
  if (fs.existsSync(taskDir)) {
    const taskDirs = fs.readdirSync(taskDir);
    for (const dirName of taskDirs) {
      const dirPath = path.join(taskDir, dirName);
      try {
        const stats = fs.statSync(dirPath);
        if (stats.isDirectory()) {
          // 从 createdAt.txt 文件读取创建时间
          const createdTime = getDirCreatedTime(dirPath);
          if (createdTime && createdTime < expirationTime) {
            removeDirRecursive(dirPath);
            console.log(`已清理过期的任务临时目录: ${dirPath} (创建于: ${new Date(createdTime).toLocaleString()})`);
          }
        }
      } catch (error) {
        console.error(`清理任务临时目录失败: ${dirPath}`, error);
      }
    }
  }
}


export async function downloadFileToLocal({
  fileUrl,
  localFilePath,
  onProgress
}) {
  // 检查文件是否已存在
  if (fs.existsSync(localFilePath)) {
    const stats = fs.statSync(localFilePath);
    console.log(`文件已存在，跳过下载: ${localFilePath}`);
    if (onProgress) {
      onProgress();
    }
    return stats.size;
  }

  // 调用进度回调
  if (onProgress) {
    onProgress();
  }

  // 下载文件
  const response = await fetch(fileUrl);
  if (!response.ok) {
    throw new Error(`下载文件失败: ${fileUrl}, 状态码: ${response.status}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // 确保目录存在
  const dir = path.dirname(localFilePath);
  ensureDirExists(dir);

  // 保存到本地
  fs.writeFileSync(localFilePath, buffer);
  console.log(`文件下载成功: ${localFilePath}, 大小: ${buffer.length} 字节`);

  // 调用进度回调
  if (onProgress) {
    onProgress();
  }
  return buffer.length;
}
