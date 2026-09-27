"use server";

import fs from "node:fs";
import os from "node:os";
import path from "node:path";

/**
 * 系统信息接口
 */

/**
 * 临时文件统计接口
 */

/**
 * 获取 Docker 容器的内存限制（如果在容器中运行）
 * 优先读取 cgroup v2，然后尝试 cgroup v1
 */
function getContainerMemoryLimit() {
  try {
    // 尝试读取 cgroup v2 (统一层次结构)
    const cgroupV2Path = "/sys/fs/cgroup/memory.max";
    if (fs.existsSync(cgroupV2Path)) {
      const limit = fs.readFileSync(cgroupV2Path, "utf-8").trim();
      // "max" 表示没有限制
      if (limit !== "max") {
        const limitBytes = parseInt(limit, 10);
        if (!Number.isNaN(limitBytes) && limitBytes > 0) {
          return limitBytes;
        }
      }
    }

    // 尝试读取 cgroup v1
    const cgroupV1Path = "/sys/fs/cgroup/memory/memory.limit_in_bytes";
    if (fs.existsSync(cgroupV1Path)) {
      const limit = fs.readFileSync(cgroupV1Path, "utf-8").trim();
      const limitBytes = parseInt(limit, 10);
      // 一个非常大的数字（如 9223372036854771712）通常表示没有限制
      if (!Number.isNaN(limitBytes) && limitBytes > 0 && limitBytes < 9e15) {
        return limitBytes;
      }
    }
  } catch (error) {
    // 读取失败，返回 null
    console.error("读取容器内存限制失败:", error);
  }
  return null;
}

/**
 * 获取容器的内存使用情况（如果在容器中运行）
 */
function getContainerMemoryUsage() {
  try {
    // 尝试读取 cgroup v2
    const cgroupV2Path = "/sys/fs/cgroup/memory.current";
    if (fs.existsSync(cgroupV2Path)) {
      const usage = fs.readFileSync(cgroupV2Path, "utf-8").trim();
      const usageBytes = parseInt(usage, 10);
      if (!Number.isNaN(usageBytes) && usageBytes > 0) {
        return usageBytes;
      }
    }

    // 尝试读取 cgroup v1
    const cgroupV1Path = "/sys/fs/cgroup/memory/memory.usage_in_bytes";
    if (fs.existsSync(cgroupV1Path)) {
      const usage = fs.readFileSync(cgroupV1Path, "utf-8").trim();
      const usageBytes = parseInt(usage, 10);
      if (!Number.isNaN(usageBytes) && usageBytes > 0) {
        return usageBytes;
      }
    }
  } catch (error) {
    console.error("读取容器内存使用失败:", error);
  }
  return null;
}

/**
 * 获取系统信息
 */
export async function getSystemInfo() {
  try {
    // 优先使用容器的内存限制，如果不在容器中则使用系统总内存
    const containerMemoryLimit = getContainerMemoryLimit();
    const totalMemory = containerMemoryLimit || os.totalmem();

    // 优先使用容器的内存使用量
    const containerMemoryUsage = getContainerMemoryUsage();
    let usedMemory;
    let freeMemory;
    if (containerMemoryUsage !== null && containerMemoryLimit !== null) {
      // 在容器中，使用 cgroup 数据
      usedMemory = containerMemoryUsage;
      freeMemory = containerMemoryLimit - containerMemoryUsage;
    } else {
      // 不在容器中或无法读取 cgroup，使用系统数据
      freeMemory = os.freemem();
      usedMemory = totalMemory - freeMemory;
    }
    const memoryUsagePercent = usedMemory / totalMemory * 100;
    let cpuCount = null;
    try {
      cpuCount = os.cpus().length;
    } catch {
      // 如果无法读取CPU信息，保持为null
    }
    return {
      cpuCount,
      totalMemory,
      freeMemory,
      usedMemory,
      memoryUsagePercent
    };
  } catch (error) {
    console.error("获取系统信息失败:", error);
    throw new Error("获取系统信息失败");
  }
}

/**
 * 递归计算目录大小和文件数量
 */
function calculateDirStats(dirPath) {
  let fileCount = 0;
  let size = 0;
  if (!fs.existsSync(dirPath)) {
    return {
      fileCount: 0,
      size: 0
    };
  }
  try {
    const items = fs.readdirSync(dirPath);
    for (const item of items) {
      const itemPath = path.join(dirPath, item);
      try {
        const stats = fs.statSync(itemPath);
        if (stats.isDirectory()) {
          const subStats = calculateDirStats(itemPath);
          fileCount += subStats.fileCount;
          size += subStats.size;
        } else {
          fileCount++;
          size += stats.size;
        }
      } catch (error) {
        // 忽略无法访问的文件/目录
        console.error(`无法访问: ${itemPath}`, error);
      }
    }
  } catch (error) {
    console.error(`读取目录失败: ${dirPath}`, error);
  }
  return {
    fileCount,
    size
  };
}

/**
 * 获取临时文件统计信息
 */
export async function getTempFileStats() {
  const tempRoot = "/tmp/mistake-batch";
  const result = {
    totalFiles: 0,
    totalSize: 0,
    classDirs: 0,
    taskDirs: 0,
    details: {
      classFiles: [],
      taskFiles: []
    }
  };
  if (!fs.existsSync(tempRoot)) {
    return result;
  }
  try {
    // 统计班级目录
    const classDir = path.join(tempRoot, "class");
    if (fs.existsSync(classDir)) {
      const classDirs = fs.readdirSync(classDir);
      result.classDirs = classDirs.length;
      for (const dirName of classDirs) {
        const dirPath = path.join(classDir, dirName);
        try {
          const stats = fs.statSync(dirPath);
          if (stats.isDirectory()) {
            const dirStats = calculateDirStats(dirPath);
            result.totalFiles += dirStats.fileCount;
            result.totalSize += dirStats.size;
            result.details.classFiles.push({
              dirName,
              fileCount: dirStats.fileCount,
              size: dirStats.size
            });
          }
        } catch (error) {
          console.error(`读取班级目录失败: ${dirPath}`, error);
        }
      }
    }

    // 统计任务目录
    const taskDir = path.join(tempRoot, "task");
    if (fs.existsSync(taskDir)) {
      const taskDirs = fs.readdirSync(taskDir);
      result.taskDirs = taskDirs.length;
      for (const dirName of taskDirs) {
        const dirPath = path.join(taskDir, dirName);
        try {
          const stats = fs.statSync(dirPath);
          if (stats.isDirectory()) {
            const dirStats = calculateDirStats(dirPath);
            result.totalFiles += dirStats.fileCount;
            result.totalSize += dirStats.size;
            result.details.taskFiles.push({
              dirName,
              fileCount: dirStats.fileCount,
              size: dirStats.size
            });
          }
        } catch (error) {
          console.error(`读取任务目录失败: ${dirPath}`, error);
        }
      }
    }
  } catch (error) {
    console.error("统计临时文件失败:", error);
    throw new Error("统计临时文件失败");
  }
  return result;
}
