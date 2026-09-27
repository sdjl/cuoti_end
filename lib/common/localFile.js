import { promises as fs } from "node:fs";
import { resolve } from "node:path";


export async function readLocalFileBuffer(filePath) {
  // 将相对路径解析到项目根目录，确保不会越界读取
  const absolutePath = resolve(process.cwd(), filePath);
  try {
    const data = await fs.readFile(absolutePath);
    return data;
  } catch (err) {
    // 你可以根据需要自定义错误处理逻辑
    throw new Error(`读取文件失败: ${err.message}`);
  }
}
