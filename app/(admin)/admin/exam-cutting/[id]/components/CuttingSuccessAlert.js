"use client";

import { CheckCircle2 } from "lucide-react";
// 切题成功提示组件，当切题成功时显示成功提示信息
import { Card, CardContent } from "../../../../../../components/ui/card.js";
export default function CuttingSuccessAlert({
  examPaper
}) {
  // 只在切题成功时显示
  if (examPaper.cuttingStatus !== "done") {
    return null;
  }
  return <Card className="w-full bg-green-50 border-green-200">
      <CardContent className="pt-6">
        <div className="flex items-start">
          <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-green-800">试卷切题成功</p>
            <p className="text-sm text-green-700">
              系统已完成试卷切题和题目识别，您可以查看下方识别到的题目内容。
            </p>
          </div>
        </div>
      </CardContent>
    </Card>;
}
