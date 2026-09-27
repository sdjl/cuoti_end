/**
 * 导入完成提示组件 - 学生批量导入第4步
 *
 * 用途：显示导入流程完成的状态和结果信息
 * 使用场景：
 * - 所有验证步骤都通过并完成数据导入后显示
 * - 显示导入操作的结果统计
 *
 * 主要功能：
 * - 成功反馈：显示导入成功的状态
 * - 数据统计：显示导入的学生记录详细统计
 * - 操作引导：提供重新导入和返回班级的入口
 *
 * 显示内容：
 * - 导入完成的成功提示（绿色主题）
 * - 新增学生、添加学生和班级总人数的统计
 * - 返回班级和重新导入的操作按钮
 */

"use client";

import { ArrowLeft, CheckCircle, School, UserPlus, Users } from "lucide-react";
import Link from "next/link";
import { Button } from "../../../../../../../../components/ui/button.js";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../../../../../components/ui/card.js";
export default function ImportComplete({
  validRowCount,
  onBack,
  isLoading,
  classRoomId,
  importResult
}) {
  return <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">导入成功</h3>
        <p className="text-gray-600 text-sm">已成功导入学生数据到班级</p>
      </div>

      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto" />
            <div>
              <h4 className="text-xl font-semibold text-green-800 mb-2">
                导入完成
              </h4>
              <p className="text-green-700">
                成功处理 <span className="font-bold">{validRowCount}</span>{" "}
                条学生记录，数据已成功导入班级。
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 导入统计 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">导入统计</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-green-50 rounded-lg p-4 flex flex-col items-center">
              <span className="text-green-800 text-xs font-medium mb-1 flex items-center">
                <UserPlus className="h-3 w-3 mr-1" />
                新增学生
              </span>
              <span className="text-2xl font-bold text-green-700">
                {importResult.newStudentsCount}
              </span>
            </div>
            <div className="bg-purple-50 rounded-lg p-4 flex flex-col items-center">
              <span className="text-purple-800 text-xs font-medium mb-1 flex items-center">
                <School className="h-3 w-3 mr-1" />
                添加已有学生
              </span>
              <span className="text-2xl font-bold text-purple-700">
                {importResult.addedStudentsCount}
              </span>
            </div>
            <div className="bg-blue-50 rounded-lg p-4 flex flex-col items-center">
              <span className="text-blue-800 text-xs font-medium mb-1 flex items-center">
                <Users className="h-3 w-3 mr-1" />
                班级总人数
              </span>
              <span className="text-2xl font-bold text-blue-700">
                {importResult.totalStudentsCount}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={onBack} disabled={isLoading}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          重新导入
        </Button>

        <Link href={`/work/classroom/${classRoomId}/student`}>
          <Button type="button" variant="default">
            <Users className="h-4 w-4 mr-2" />
            返回班级
          </Button>
        </Link>
      </div>
    </div>;
}
