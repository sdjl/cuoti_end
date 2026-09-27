"use client";

import { Calendar, School } from "lucide-react";
// 报告页脚组件，显示学校名称、生成时间和产品标语
import { Card, CardContent } from "../../../../../../../components/ui/card.js";
export default function ReportFooter({
  schoolName,
  analysisCompletedTime
}) {
  // 格式化生成时间
  const formatTime = timestamp => {
    if (!timestamp) {
      return "未完成分析";
    }
    const date = new Date(timestamp);
    return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, "0")}/${String(date.getDate()).padStart(2, "0")} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
  };
  return <Card className="w-full bg-gray-50 mt-6">
      <CardContent className="pt-6 text-center space-y-3">
        {/* 学校信息 - 第一行 */}
        <div className="flex items-center justify-center gap-1 text-sm text-gray-600">
          <School className="w-4 h-4" />
          <span>{schoolName}</span>
        </div>

        {/* 生成时间 - 第二行 */}
        <div className="flex items-center justify-center gap-1 text-sm text-gray-600">
          <Calendar className="w-4 h-4" />
          <span>生成时间: {formatTime(analysisCompletedTime)}</span>
        </div>

        {/* 产品标语 - 第三行 */}
        <p className="text-xs text-gray-500">错题管家 - 让学习更高效</p>
      </CardContent>
    </Card>;
}
