"use client";

import { AlertCircle, Loader2, Scissors } from "lucide-react";
import { Button } from "../../../../../../components/ui/button.js";
// 切题操作卡片组件，提供开始切题按钮和切题状态提示信息
import { Card, CardContent, CardHeader, CardTitle } from "../../../../../../components/ui/card.js";
export default function CuttingOperationCard({
  examPaper,
  isCutting,
  isLoading,
  onStartCutting
}) {
  // 如果已经完成切题，不显示操作卡片
  if (examPaper.cuttingStatus === "done") {
    return null;
  }
  return <Card className="w-full">
      <CardHeader>
        <CardTitle>操作</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Button className="w-full sm:w-auto" onClick={onStartCutting} disabled={isCutting || isLoading || examPaper.isLocked}>
            {isCutting ? <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                切题中
              </> : <>
                <Scissors className="mr-2 h-4 w-4" />
                开始切题
              </>}
          </Button>

          {examPaper.isLocked && <div className="flex p-4 bg-orange-50 border border-orange-200 rounded-md">
              <AlertCircle className="h-5 w-5 text-orange-500 mr-2 flex-shrink-0" />
              <div className="text-sm text-orange-700">
                <p className="font-medium">该试卷已锁定</p>
                <p>试卷锁定后不能进行切题操作。</p>
              </div>
            </div>}

          {isCutting && <div className="flex p-4 bg-amber-50 border border-amber-200 rounded-md">
              <AlertCircle className="h-5 w-5 text-amber-500 mr-2 flex-shrink-0" />
              <div className="text-sm text-amber-700">
                <p className="font-medium">正在进行试卷切题，请耐心等待</p>
                <p>
                  切题过程可能需要几分钟时间。任务正在后台进行，您可以离开此页面或进行其他操作。
                </p>
              </div>
            </div>}
        </div>
      </CardContent>
    </Card>;
}
