import sharp from "sharp";

/**
 * 图片压缩配置
 */
export const IMAGE_COMPRESS_CONFIG = {
  // 最大宽度
  MAX_WIDTH: 2000,
  // 压缩质量（JPEG）
  JPEG_QUALITY: 85,
  // 压缩质量（WebP）
  WEBP_QUALITY: 85,
  // PNG压缩级别
  PNG_COMPRESSION_LEVEL: 6
};


export async function compressImage(imageBuffer, mimeType) {
  try {
    // 获取图片元数据
    const metadata = await sharp(imageBuffer).metadata();
    const originalWidth = metadata.width || 0;

    // 如果图片宽度小于等于最大宽度，不需要压缩
    if (originalWidth <= IMAGE_COMPRESS_CONFIG.MAX_WIDTH) {
      return imageBuffer;
    }

    // 创建sharp实例进行压缩
    let sharpInstance = sharp(imageBuffer).resize({
      width: IMAGE_COMPRESS_CONFIG.MAX_WIDTH,
      // 高度自适应，保持宽高比
      height: undefined,
      fit: "inside",
      withoutEnlargement: true
    });

    // 根据MIME类型选择输出格式和压缩参数
    switch (mimeType) {
      case "image/jpeg":
      case "image/jpg":
        sharpInstance = sharpInstance.jpeg({
          quality: IMAGE_COMPRESS_CONFIG.JPEG_QUALITY,
          progressive: true
        });
        break;
      case "image/png":
        sharpInstance = sharpInstance.png({
          compressionLevel: IMAGE_COMPRESS_CONFIG.PNG_COMPRESSION_LEVEL,
          progressive: true
        });
        break;
      case "image/webp":
        sharpInstance = sharpInstance.webp({
          quality: IMAGE_COMPRESS_CONFIG.WEBP_QUALITY
        });
        break;
      case "image/gif":
        // GIF 转换为 PNG 以保持透明度和质量
        sharpInstance = sharpInstance.png({
          compressionLevel: IMAGE_COMPRESS_CONFIG.PNG_COMPRESSION_LEVEL,
          progressive: true
        });
        break;
      default:
        // 默认转换为JPEG
        sharpInstance = sharpInstance.jpeg({
          quality: IMAGE_COMPRESS_CONFIG.JPEG_QUALITY,
          progressive: true
        });
        break;
    }
    const compressedBuffer = await sharpInstance.toBuffer();
    return compressedBuffer;
  } catch (error) {
    console.error("图片压缩失败:", error);
    // 如果压缩失败，返回原始图片
    return imageBuffer;
  }
}


export function getCompressedMimeType(originalMimeType) {
  switch (originalMimeType) {
    case "image/jpeg":
    case "image/jpg":
      return "image/jpeg";
    case "image/png":
      return "image/png";
    case "image/webp":
      return "image/webp";
    case "image/gif":
      // GIF 转换为 PNG
      return "image/png";
    default:
      // 默认转换为JPEG
      return "image/jpeg";
  }
}


export function getCompressedFileExtension(originalMimeType) {
  const compressedMimeType = getCompressedMimeType(originalMimeType);
  switch (compressedMimeType) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    default:
      return "jpg";
  }
}
