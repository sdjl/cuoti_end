"use server";

import { exec } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
const execAsync = promisify(exec);


const checkFileExists = filePath => {
  if (!fs.existsSync(filePath)) {
    throw new Error(`文件不存在: ${filePath}`);
  }
};


const ensureDirectoryExists = dirPath => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, {
      recursive: true
    });
  }
};


export const convertPdfToJpg = async (pdfPath, outputPath, targetWidth, targetHeight) => {
  // 检查PDF文件是否存在
  checkFileExists(pdfPath);

  // 确保输出目录存在
  const outputDir = path.dirname(outputPath);
  ensureDirectoryExists(outputDir);

  // 检查输出路径是否以os.tmpdir()开头
  if (!outputPath.startsWith(os.tmpdir())) {
    throw new Error(`输出路径必须以${os.tmpdir()}开头`);
  }
  try {
    // 构建转换命令
    let command = `convert -density 300 "${pdfPath}"`;

    // 如果指定了目标宽度和高度，添加调整大小参数
    if (targetWidth && targetHeight) {
      command += ` -background white -alpha remove -flatten -resize ${targetWidth}x${targetHeight}!`;
    }
    command += ` -quality 100 "${outputPath}"`;

    // 使用ImageMagick将PDF转换为JPG
    await execAsync(command);
    return outputPath;
  } catch (error) {
    throw new Error(`PDF转JPG失败: ${error.message}`);
  }
};


export const cropImage = async (imagePath, outputPath, topLeft, bottomRight) => {
  // 检查图片文件是否存在
  checkFileExists(imagePath);

  // 确保输出目录存在
  const outputDir = path.dirname(outputPath);
  ensureDirectoryExists(outputDir);

  // 检查输出路径是否以os.tmpdir()开头
  if (!outputPath.startsWith(os.tmpdir())) {
    throw new Error(`输出路径必须以${os.tmpdir()}开头`);
  }

  // 计算裁剪区域宽度和高度
  const width = bottomRight[0] - topLeft[0];
  const height = bottomRight[1] - topLeft[1];
  if (width <= 0 || height <= 0) {
    throw new Error("裁剪区域无效: 宽度或高度必须大于0");
  }
  try {
    // 使用ImageMagick裁剪图片
    await execAsync(`convert "${imagePath}" -crop ${width}x${height}+${topLeft[0]}+${topLeft[1]} "${outputPath}"`);
    return outputPath;
  } catch (error) {
    throw new Error(`裁剪图片失败: ${error.message}`);
  }
};
