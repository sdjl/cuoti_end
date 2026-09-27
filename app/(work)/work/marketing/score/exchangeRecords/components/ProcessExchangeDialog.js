"use client";

import { AlertTriangle, CheckCircle, XCircle } from "lucide-react";
// 处理积分兑换申请对话框组件，用于处理学生的积分兑换申请（完成或取消）
import { useEffect, useState } from "react";
import { Button } from "../../../../../../../components/ui/button.js";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../../../../../../components/ui/dialog.js";
import { Label } from "../../../../../../../components/ui/label.js";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../../../../../components/ui/select.js";
import { Textarea } from "../../../../../../../components/ui/textarea.js";
export default function ProcessExchangeDialog({
  open,
  onOpenChange,
  exchangeRecord,
  onProcess,
  isProcessing
}) {
  const [newStatus, setNewStatus] = useState("completed");
  const [teacherRemark, setTeacherRemark] = useState("");

  // 重置表单
  useEffect(() => {
    if (open && exchangeRecord) {
      setNewStatus("completed");
      setTeacherRemark("");
    }
  }, [open, exchangeRecord]);
  const handleSubmit = () => {
    onProcess({
      newStatus,
      teacherRemark: teacherRemark.trim() || undefined
    });
  };
  if (!exchangeRecord) return null;
  return <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            处理积分兑换申请
          </DialogTitle>
          <DialogDescription>
            请选择处理结果，操作完成后将无法撤销。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* 兑换信息 */}
          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
            <div className="text-sm">
              <span className="text-gray-600">商品名称：</span>
              <span className="font-medium">{exchangeRecord.itemName}</span>
            </div>
            <div className="text-sm">
              <span className="text-gray-600">消耗积分：</span>
              <span className="font-medium text-orange-600">
                {exchangeRecord.pointsUsed} 积分
              </span>
            </div>
            {exchangeRecord.studentRemark && <div className="text-sm">
                <span className="text-gray-600">学生备注：</span>
                <span>{exchangeRecord.studentRemark}</span>
              </div>}
          </div>

          {/* 处理状态选择 */}
          <div className="space-y-2">
            <Label htmlFor="status">处理结果</Label>
            <Select value={newStatus} onValueChange={value => setNewStatus(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="completed">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>完成兑换</span>
                  </div>
                </SelectItem>
                <SelectItem value="cancelled">
                  <div className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-red-500" />
                    <span>取消兑换（退还积分）</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 处理结果说明 */}
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="text-sm text-blue-800">
              {newStatus === "completed" ? <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-medium">完成兑换</div>
                    <div className="text-xs mt-1">
                      标记为已完成，不会对学生积分进行任何操作
                    </div>
                  </div>
                </div> : <div className="flex items-start gap-2">
                  <XCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-medium">取消兑换</div>
                    <div className="text-xs mt-1">
                      系统将自动退还 {exchangeRecord.pointsUsed}{" "}
                      积分给学生，并记录积分变动
                    </div>
                  </div>
                </div>}
            </div>
          </div>

          {/* 老师备注 */}
          <div className="space-y-2">
            <Label htmlFor="teacherRemark">
              老师备注 <span className="text-gray-400">（可选）</span>
            </Label>
            <Textarea id="teacherRemark" value={teacherRemark} onChange={e => setTeacherRemark(e.target.value)} placeholder="请输入处理说明或备注..." rows={3} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isProcessing}>
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={isProcessing} className={newStatus === "cancelled" ? "bg-red-600 hover:bg-red-700" : ""}>
            {isProcessing ? "处理中..." : newStatus === "completed" ? "确认完成" : "确认取消"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>;
}
