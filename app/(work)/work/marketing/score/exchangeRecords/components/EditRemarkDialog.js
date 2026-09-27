"use client";

import { Edit } from "lucide-react";
// 编辑备注对话框组件，用于编辑兑换记录的老师备注信息
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

  // 同步外部传入的备注
  useEffect(() => {
    setRemark(currentRemark);
  }, [currentRemark]);
  const handleSave = () => {
    onSave(remark.trim());
  };
  return <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5 text-blue-500" />
            编辑老师备注
          </DialogTitle>
          <DialogDescription>
            您可以添加或修改此兑换记录的老师备注。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="remark">老师备注</Label>
            <Textarea id="remark" value={remark} onChange={e => setRemark(e.target.value)} placeholder="请输入老师备注..." rows={4} />
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
