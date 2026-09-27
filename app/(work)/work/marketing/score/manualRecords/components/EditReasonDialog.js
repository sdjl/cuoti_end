"use client";

import { Edit } from "lucide-react";
// 编辑手动积分记录原因对话框组件，用于修改手动积分记录的修改原因
import { useEffect, useState } from "react";
import { Button } from "../../../../../../../components/ui/button.js";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../../../../../../components/ui/dialog.js";
import { Label } from "../../../../../../../components/ui/label.js";
import { Textarea } from "../../../../../../../components/ui/textarea.js";
export default function EditReasonDialog({
  open,
  onOpenChange,
  currentReason,
  onSave,
  isSaving
}) {
  const [reason, setReason] = useState(currentReason);

  // 同步外部传入的原因
  useEffect(() => {
    setReason(currentReason);
  }, [currentReason]);
  const handleSave = () => {
    if (!reason.trim()) {
      return;
    }
    onSave(reason.trim());
  };
  return <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5 text-blue-500" />
            编辑修改原因
          </DialogTitle>
          <DialogDescription>
            您可以修改此手动积分记录的原因说明。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reason">
              修改原因 <span className="text-red-500">*</span>
            </Label>
            <Textarea id="reason" value={reason} onChange={e => setReason(e.target.value)} placeholder="请输入修改原因..." rows={4} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            取消
          </Button>
          <Button onClick={handleSave} disabled={!reason.trim() || isSaving}>
            {isSaving ? "保存中..." : "保存"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>;
}
