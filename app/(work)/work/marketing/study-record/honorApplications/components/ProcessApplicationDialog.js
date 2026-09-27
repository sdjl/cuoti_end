"use client";

import { AlertTriangle } from "lucide-react";
// 处理荣誉申请对话框组件，用于通过或取消荣誉申请
import { useEffect, useState } from "react";
import { Button } from "../../../../../../../components/ui/button.js";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../../../../../../components/ui/dialog.js";
import { Label } from "../../../../../../../components/ui/label.js";
import { RadioGroup, RadioGroupItem } from "../../../../../../../components/ui/radio-group.js";
import { Textarea } from "../../../../../../../components/ui/textarea.js";
export default function ProcessApplicationDialog({
  open,
  onOpenChange,
  application,
  onProcess,
  isProcessing
}) {
  const [status, setStatus] = useState("completed");
  const [teacherRemark, setTeacherRemark] = useState("");
  useEffect(() => {
    if (open && application) {
      setStatus("completed");
      setTeacherRemark(application.teacherRemark || "");
    }
  }, [open, application]);
  const handleProcess = async () => {
    if (!application) return;
    await onProcess({
      applicationId: application._id,
      status,
      teacherRemark: teacherRemark.trim() || undefined
    });
  };
  if (!application) {
    return null;
  }
  return <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>处理荣誉申请</DialogTitle>
          <DialogDescription>
            处理学生 {application.student?.name} 的荣誉申请：
            {application.honorName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* 警告提示 */}
          <div className="flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-800">
              <div className="font-medium mb-1">操作不可撤销</div>
              <div>
                请仔细确认处理结果。通过申请后将为学生增加积分，取消申请后学生需要重新申请。
              </div>
            </div>
          </div>

          {/* 处理结果选择 */}
          <div className="space-y-3">
            <Label>
              处理结果 <span className="text-red-500">*</span>
            </Label>
            <RadioGroup value={status} onValueChange={value => setStatus(value)} className="flex space-x-2">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="completed" id="completed" />
                <Label htmlFor="completed" className="text-green-600 font-medium">
                  通过申请
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="cancelled" id="cancelled" />
                <Label htmlFor="cancelled" className="text-red-600 font-medium">
                  取消申请
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* 处理说明 */}
          <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
            {status === "completed" ? <div>
                <div className="font-medium text-green-700 mb-1">
                  通过申请说明：
                </div>
                <ul className="list-disc list-inside space-y-1">
                  <li>系统将根据荣誉配置为学生增加相应积分</li>
                  <li>学生将收到荣誉获得通知</li>
                  <li>该记录将在学生成长路径中显示</li>
                </ul>
              </div> : <div>
                <div className="font-medium text-red-700 mb-1">
                  取消申请说明：
                </div>
                <ul className="list-disc list-inside space-y-1">
                  <li>不会为学生增加积分</li>
                  <li>学生可以重新申请该荣誉</li>
                  <li>建议在备注中说明取消原因</li>
                </ul>
              </div>}
          </div>

          {/* 老师评语 */}
          <div className="space-y-2">
            <Label htmlFor="teacherRemark">
              老师评语
              {status === "completed" && <span className="text-xs text-gray-500 ml-2">
                  （会显示在全校荣誉页面中）
                </span>}
            </Label>
            <Textarea id="teacherRemark" value={teacherRemark} onChange={e => setTeacherRemark(e.target.value)} placeholder={status === "completed" ? "恭喜获得此项荣誉..." : "请说明取消原因..."} rows={3} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isProcessing}>
            取消
          </Button>
          <Button onClick={handleProcess} disabled={isProcessing} className={status === "completed" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}>
            {isProcessing ? "处理中..." : status === "completed" ? "确认通过" : "确认取消"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>;
}
