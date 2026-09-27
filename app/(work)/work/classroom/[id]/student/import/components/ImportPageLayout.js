"use client";

/**
 * 导入页面统一布局组件
 *
 * 用途：为学生批量导入功能提供统一的页面布局结构
 * 使用场景：
 * - 所有导入相关的页面状态（权限错误、各个步骤等）
 * - 需要保持页面布局一致性的场景
 *
 * 特点：
 * - 统一的WorkHeader配置（标题、返回按钮等）
 * - 标准的容器和卡片布局
 * - 通过children prop接受不同的内容组件
 * - 确保所有导入步骤的视觉一致性
 */
import { Card, CardContent } from "../../../../../../../../components/ui/card.js";
import WorkHeader from "../../../../../../../../components/work/layout/WorkHeader.js";
export default function ImportPageLayout({
  classRoomId,
  children
}) {
  return <div className="min-h-screen bg-gray-50">
      <WorkHeader title="批量导入学生" showBackButton={true} backHref={`/work/classroom/${classRoomId}/student`} backText="返回学生管理" />
      <div className="container mx-auto p-6">
        <Card className="mx-auto">
          <CardContent className="p-8">{children}</CardContent>
        </Card>
      </div>
    </div>;
}
