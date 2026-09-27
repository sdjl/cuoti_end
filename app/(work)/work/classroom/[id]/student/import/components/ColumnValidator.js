/**
 * Excel列验证组件 - 学生批量导入第2步
 *
 * 用途：验证上传的Excel文件是否包含所需的必要列
 * 使用场景：
 * - 文件上传解析完成后自动执行
 * - 检查Excel表头是否包含学校配置的必需字段
 *
 * 主要功能：
 * - 列完整性检查：对比Excel列与系统要求的必需列
 * - 可视化对比：并排显示必需列和实际Excel列
 * - 错误提示：明确指出缺失的列和解决方案
 * - 配置引导：提供修改导入配置的入口链接
 * - 状态反馈：通过颜色和图标清晰显示验证结果
 *
 * 验证逻辑：
 * - 成功：Excel包含所有必需列，自动进入下一步数据验证
 * - 失败：显示缺失列列表，提供重新选择文件或修改配置选项
 *
 * 特点：
 * - 实时状态反馈（成功/失败标识）
 * - 详细的解决方案说明
 * - 支持配置修改（可将不需要的列设为空来跳过验证）
 */

"use client";

import { ArrowLeft, CheckCircle, Settings, XCircle } from "lucide-react";
import Link from "next/link";
import { Alert, AlertDescription } from "../../../../../../../../components/ui/alert.js";
import { Badge } from "../../../../../../../../components/ui/badge.js";
import { Button } from "../../../../../../../../components/ui/button.js";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../../../../../components/ui/card.js";
export default function ColumnValidator({
  missingColumns,
  requiredColumns,
  currentColumns,
  onBack,
  isLoading
}) {
  const hasError = missingColumns.length > 0;
  return <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">Excel列验证</h3>
        <p className="text-gray-600 text-sm">
          检查Excel文件是否包含所需的列信息
        </p>
      </div>

      {hasError ? <Alert className="border-red-200 bg-red-50">
          <div className="flex items-center space-x-2">
            <XCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              Excel文件缺少必要的列，请检查文件格式或修改导入配置
            </AlertDescription>
          </div>
        </Alert> : <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Excel文件列验证通过，可以继续导入
          </AlertDescription>
        </Alert>}

      <div className="grid md:grid-cols-2 gap-6">
        {/* 必需列 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">必需列</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {requiredColumns.map(column => {
              const exists = currentColumns.includes(column);
              const isMissing = missingColumns.includes(column);
              return <div key={column} className="flex items-center justify-between">
                    <span className="text-sm">{column}</span>
                    <Badge variant={exists && !isMissing ? "default" : "destructive"} className="text-xs">
                      {exists && !isMissing ? <>
                          <CheckCircle className="h-3 w-3 mr-1" />
                          存在
                        </> : <>
                          <XCircle className="h-3 w-3 mr-1" />
                          缺失
                        </>}
                    </Badge>
                  </div>;
            })}
            </div>
          </CardContent>
        </Card>

        {/* 当前Excel列 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Excel文件列</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {currentColumns.length > 0 ? currentColumns.map((column, index) => <div key={index} className="flex items-center">
                    <span className="text-sm">{column}</span>
                  </div>) : <p className="text-sm text-gray-500">暂无列信息</p>}
            </div>
          </CardContent>
        </Card>
      </div>

      {hasError && <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="space-y-3">
              <div className="flex items-start space-x-2">
                <Settings className="h-5 w-5 text-orange-600 mt-0.5" />
                <div>
                  <p className="font-medium text-orange-800">解决方案</p>
                  <div className="text-sm text-orange-700 mt-1 space-y-1">
                    <p>
                      您可以修改Excel文件使其包含必需的列，或者前往设置页面修改导入配置。
                    </p>
                    <p>
                      如果确实不需要某一列，可以在配置中把这一列清空，这样系统就不会要求Excel表格必须有这一列。
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <Link href="/work/setting/import-student">
                  <Button variant="outline" size="sm" className="text-orange-700 border-orange-300 hover:bg-orange-100">
                    <Settings className="h-4 w-4 mr-2" />
                    修改导入配置
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>}

      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={onBack} disabled={isLoading}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          重新选择文件
        </Button>

        {!hasError && <div className="text-sm text-green-600 flex items-center">
            <CheckCircle className="h-4 w-4 mr-1" />
            列验证通过，系统将自动进行下一步
          </div>}
      </div>
    </div>;
}
