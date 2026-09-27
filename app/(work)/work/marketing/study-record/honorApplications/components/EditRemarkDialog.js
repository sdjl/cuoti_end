"use client";

// 编辑评语对话框组件，用于修改荣誉申请的老师评语
import { useEffect, useState } from "react";
import { Button } from "../../../../../../../components/ui/button.js";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../../../../../../components/ui/dialog.js";
import { Label } from "../../../../../../../components/ui/label.js";
import { Textarea } from "../../../../../../../components/ui/textarea.js";
export default function EditRemarkDialog({
  open,
  onOpenChange,
  currentRemark,
  onSave,
  isSaving
}) {
  const [remark, setRemark] = useState(currentRemark);
  useEffect(() => {
    if (open) {
      setRemark(currentRemark);
    }
  }, [open, currentRemark]);
  const handleSave = async () => {
    await onSave(remark);
  };
  return <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>编辑老师评语</DialogTitle>
          <DialogDescription>
            修改对此荣誉申请的评语信息，会显示在全校荣誉页面中
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="remark">老师评语</Label>
            <Textarea id="remark" value={remark} onChange={e => setRemark(e.target.value)} placeholder="请输入评语信息..." rows={4} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            取消
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "保存中..." : "保存"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>;
}
