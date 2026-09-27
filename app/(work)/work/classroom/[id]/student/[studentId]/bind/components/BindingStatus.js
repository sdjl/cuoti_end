"use client";

// 绑定状态组件，显示学生绑定二维码的生成状态和有效期信息
import { AlertTriangle, Clock, QrCode, RefreshCw, Trash2 } from "lucide-react";
import { Button } from "../../../../../../../../../components/ui/button.js";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../../../../../../components/ui/card.js";
export default function BindingStatus({
  student,
  isGenerating,
  isDeleting,
  isExpired,
  formatDateTime,
  getExpiryDate,
  onGeneratePassword,
  onDeletePassword
}) {
  const hasBindPassword = !!student.bindPassword;
  return <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <QrCode className="h-5 w-5 mr-2" />
          绑定状态
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {hasBindPassword ? <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium">已生成绑定二维码</span>
              {isExpired && <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-red-100 text-red-800">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  已过期
                </span>}
              {!isExpired && <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                  有效
                </span>}
            </div>
            {student.bindPasswordGeneratedAt && <div className="text-sm text-gray-600">
                <div>
                  生成时间：
                  {formatDateTime(new Date(student.bindPasswordGeneratedAt))}
                </div>
                <div>
                  有效期至：
                  {formatDateTime(getExpiryDate(student.bindPasswordGeneratedAt))}
                </div>
              </div>}
          </div> : <div className="text-sm text-gray-600">暂未生成绑定二维码</div>}

        <div className="flex flex-wrap gap-2">
          <Button onClick={onGeneratePassword} disabled={isGenerating} className="flex items-center">
            <RefreshCw className={`h-4 w-4 mr-2 ${isGenerating ? "animate-spin" : ""}`} />
            {hasBindPassword ? "重新生成" : "生成绑定二维码"}
          </Button>
          {hasBindPassword && <Button onClick={onDeletePassword} disabled={isDeleting} variant="destructive" className="flex items-center text-white">
              <Trash2 className="h-4 w-4 mr-2" />
              删除二维码
            </Button>}
        </div>
      </CardContent>
    </Card>;
}
