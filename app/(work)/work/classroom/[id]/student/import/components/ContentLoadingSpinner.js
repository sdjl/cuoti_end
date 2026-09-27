"use client";

/**
 * 内容区域加载指示器组件
 *
 * 用途：在页面内容区域显示加载状态，不影响页面的整体布局和导航
 * 使用场景：
 * - 文件上传和解析过程中
 * - 数据验证处理时
 * - AJAX请求等异步操作
 *
 * 特点：
 * - 轻量级，只包含加载图标和消息
 * - 可嵌入到任何容器中
 * - 适合短时间的处理过程
 */
import { Loader2 } from "lucide-react";
export default function ContentLoadingSpinner({
  message
}) {
  return <div className="flex items-center justify-center py-8">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <span className="ml-2 text-gray-600">{message}</span>
    </div>;
}
