"use client";

// 二维码显示组件，展示学生的绑定二维码和学生信息
import { QrCode } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../../../../../../components/ui/card.js";
import { BIND_PASSWORD_VALIDITY_DAYS } from "../page.js";
import QRCodeGenerator from "./QRCodeGenerator.js";
export default function QRCodeDisplay({
  student,
  classRoom,
  generateQRCodeURL,
  formatDateTime,
  getExpiryDate,
  isExpired
}) {
  const hasBindPassword = !!student.bindPassword;
  return <Card className="top-6">
      <CardHeader>
        <CardTitle>绑定二维码</CardTitle>
      </CardHeader>
      <CardContent>
        {hasBindPassword && student.bindPassword ? <div className="max-w-xs mx-auto">
            <div className="bg-white p-4 rounded-lg border-2 border-gray-200 mx-auto" style={{
          width: "280px",
          minHeight: "380px"
        }}>
              <div className="h-full flex flex-col items-center justify-center space-y-4">
                {/* 学生信息 */}
                <div className="text-center space-y-2">
                  <div className="text-lg font-bold text-gray-800">
                    {student.name}
                  </div>
                  <div className="text-xs text-gray-600">
                    学生编号：{student.studentCode}
                  </div>
                  <div className="text-xs text-gray-500">
                    {classRoom.grade} · {classRoom.name}
                  </div>
                </div>

                {/* 二维码区域 */}
                <div className="flex items-center justify-center py-2">
                  <QRCodeGenerator value={generateQRCodeURL(student._id, student.bindPassword, classRoom._id)} size={140} />
                </div>

                {/* 扫码提示 */}
                <div className="text-center text-xs text-blue-600 px-4">
                  <div className="font-medium">请使用微信扫码绑定</div>
                  <div className="mt-1">可长按二维码识别</div>
                  <div className="mt-1">支持多人绑定</div>
                </div>

                {/* 有效期信息 */}
                <div className="text-center text-xs text-gray-500">
                  {student.bindPasswordGeneratedAt && <div>
                      有效期至：
                      {formatDateTime(getExpiryDate(student.bindPasswordGeneratedAt))}
                    </div>}
                  <div className="mt-1 text-red-500">
                    {isExpired ? "已过期，请重新生成" : `${BIND_PASSWORD_VALIDITY_DAYS}天内有效`}
                  </div>
                </div>
              </div>
            </div>
          </div> : <div className="max-w-xs mx-auto">
            <div className="bg-gray-50 p-4 rounded-lg border-2 border-dashed border-gray-300 text-center mx-auto" style={{
          width: "280px",
          minHeight: "380px"
        }}>
              <div className="h-full flex flex-col items-center justify-center space-y-4">
                <QrCode className="w-12 h-12 text-gray-400" />
                <div className="text-gray-500 text-sm">暂未生成绑定二维码</div>
                <div className="text-xs text-gray-400">点击左侧按钮生成</div>
              </div>
            </div>
          </div>}
      </CardContent>
    </Card>;
}
