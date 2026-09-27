"use client";

/**
 * 全页面加载状态组件
 *
 * 用途：显示完整的页面级加载状态，包含页面头部和主要内容区域
 * 使用场景：
 * - 权限验证过程中
 * - 页面初始化加载时
 * - 需要阻塞整个页面操作的长时间处理
 *
 * 特点：
 * - 包含完整的WorkHeader
 * - 支持动态subtitle（权限验证时显示副标题）
 * - 居中显示加载指示器和消息
 */
import { Loader2 } from "lucide-react";
import { Card, CardContent } from "../../../../../../../../components/ui/card.js";
import WorkHeader from "../../../../../../../../components/work/layout/WorkHeader.js";
export default function LoadingCard({
  message,
  classRoomId
}) {
  return <div className="min-h-screen bg-gray-50">
      <WorkHeader title="批量导入学生" showBackButton={true} backHref={`/work/classroom/${classRoomId}/student`} backText="返回学生管理" />
      <div className="container mx-auto p-6">
        <Card className="mx-auto">
          <CardContent className="p-8">
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2 text-gray-600">{message}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>;
}
