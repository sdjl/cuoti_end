import Image from "next/image";
import { isLocal } from "../../lib/common/env.js";
import { IMAGE_CONFIG } from "../../lib/config/constants.js";

/**
 * BaseImage组件的属性定义
 * 继承Next.js原生Image组件的所有属性，但重写src和width属性
 * src: 图片路径，可以是相对路径或完整URL
 * width: 图片宽度，当不使用fill时必须传递
 */


function getImageUrl(path) {
  // 1. 如果是Data URL（Base64图片数据），直接返回
  // 例如：data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD...
  if (path.startsWith("data:")) {
    return path;
  }

  // 2. 如果已经是完整URL（包含http或https），直接返回
  // 这样可以支持外部图片URL的使用
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }

  // 3. 去掉路径中可能存在的开发环境前缀
  // 例如：'/images/user/about/team-1.jpg' -> '/user/about/team-1.jpg'
  // 这样做是为了防止路径中出现重复的/images前缀
  const cleanPath = path.startsWith(IMAGE_CONFIG.DEV_IMAGE_PREFIX) ? path.slice(IMAGE_CONFIG.DEV_IMAGE_PREFIX.length) : path;

  // 4. 根据环境拼接最终URL
  if (!isLocal()) {
    // 4.1 生产环境：添加CDN域名和路径前缀
    // 例如：https://cloud1-xxx.tcloudbaseapp.com/cuoti/next/user/about/team-1.jpg
    return `${IMAGE_CONFIG.PROD_IMAGE_DOMAIN}${IMAGE_CONFIG.PROD_IMAGE_PREFIX}${cleanPath}`;
  } else {
    // 4.2 开发环境：使用本地路径
    // 例如：/images/user/about/team-1.jpg
    return `${IMAGE_CONFIG.DEV_IMAGE_PREFIX}${cleanPath}`;
  }
}

/**
 * BaseImage组件 - 封装Next.js的Image组件，自动处理图片URL，适配不同环境
 *
 * 主要功能：
 * 1. 自动处理图片路径，根据环境（开发/生产）使用正确的URL
 * 2. 确保图片在各种环境下都能正确显示
 * 3. 当不使用fill时，要求必须传递width参数
 *
 * 使用示例：
 * // 使用width和height
 * <BaseImage
 *   src="/images/user/index/logo.png"
 *   alt="Logo"
 *   width={200}
 *   height={100}
 * />
 *
 * // 使用fill
 * <BaseImage
 *   src="/images/user/index/logo.png"
 *   alt="Logo"
 *   fill
 * />
 */
export default function BaseImage({
  src,
  alt = "",
  width,
  ...props
}) {
  // 处理图片URL，转换为适合当前环境的完整URL
  const processedSrc = getImageUrl(src);

  // 如果提供了width，则传递给Image组件
  if (width !== undefined) {
    return <Image src={processedSrc} alt={alt} width={width} {...props} />;
  }

  // 否则不传递width（适用于使用fill的情况）
  return <Image src={processedSrc} alt={alt} {...props} />;
}
