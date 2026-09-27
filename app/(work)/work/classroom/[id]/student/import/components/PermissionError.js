/**
 * 权限错误提示组件
 *
 * 用途：当用户没有执行批量导入操作的权限或配置不完整时显示错误信息
 * 使用场景：
 * - 用户不是班级的老师或管理员
 * - 学校或班级的导入配置缺失或不完整
 * - 系统配置错误导致无法进行导入操作
 *
 * 主要功能：
 * - 错误信息展示：清晰显示具体的错误原因
 * - 错误类型识别：自动判断是权限问题还是配置问题
 * - 解决方案引导：针对配置错误提供具体的解决路径
 * - 导航支持：提供返回按钮和配置页面链接
 *
 * 错误处理：
 * - 权限错误：显示权限不足的提示
 * - 配置错误：显示配置缺失的具体信息和解决方案
 * - 通用错误：显示基本的错误信息和返回选项
 *
 * 特点：
 * - 智能错误分类（通过关键词识别错误类型）
 * - 渐进式引导（错误说明 → 解决方案 → 具体操作）
 * - 友好的用户体验（明确的下一步行动指引）
 * - 配置快速入口（直接链接到导入配置页面）
 */

"use client";

import { ArrowLeft, Settings, XCircle } from "lucide-react";
import Link from "next/link";
import { Alert, AlertDescription } from "../../../../../../../../components/ui/alert.js";
import { Button } from "../../../../../../../../components/ui/button.js";
import { Card, CardContent } from "../../../../../../../../components/ui/card.js";
export default function PermissionError({
  error,
  classRoomId
}) {
  // 判断是否是配置相关的错误
  const isConfigError = error.includes("配置") || error.includes("缺少");
  return <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">无法进行批量导入</h3>
        <p className="text-gray-600 text-sm">请检查您的权限和配置</p>
      </div>

      <Alert className="border-red-200 bg-red-50">
        <div className="flex items-center space-x-2">
          <XCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </div>
      </Alert>

      {isConfigError && <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="space-y-3">
              <div className="flex items-start space-x-2">
                <Settings className="h-5 w-5 text-orange-600 mt-0.5" />
                <div>
                  <p className="font-medium text-orange-800">解决方案</p>
                  <p className="text-sm text-orange-700 mt-1">
                    您需要先配置导入学生时使用的表格列映射，特别是学号和姓名列的配置。
                  </p>
                </div>
              </div>

              <div className="pt-2">
                <Link href="/work/setting/import-student">
                  <Button variant="outline" size="sm" className="text-orange-700 border-orange-300 hover:bg-orange-100">
                    <Settings className="h-4 w-4 mr-2" />
                    前往配置页面
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>}

      <div className="flex justify-center">
        <Link href={`/work/classroom/${classRoomId}/student`}>
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回
          </Button>
        </Link>
      </div>
    </div>;
}
