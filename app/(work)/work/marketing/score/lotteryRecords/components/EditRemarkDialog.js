"use client";

import { Edit } from "lucide-react";
// 编辑抽奖记录备注对话框组件，用于编辑抽奖记录的老师备注和公示状态
import { useEffect, useState } from "react";
import { Button } from "../../../../../../../components/ui/button.js";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../../../../../../components/ui/dialog.js";
import { Label } from "../../../../../../../components/ui/label.js";
import { Switch } from "../../../../../../../components/ui/switch.js";
import { Textarea } from "../../../../../../../components/ui/textarea.js";
export default function EditRemarkDialog({
  open,
  onOpenChange,
  currentRemark,
  currentIsPublic,
  onSave,
  isSaving
}) {
  const [remark, setRemark] = useState(currentRemark);
  const [isPublic, setIsPublic] = useState(currentIsPublic);

  // 同步外部传入的数据
  useEffect(() => {
    setRemark(currentRemark);
    setIsPublic(currentIsPublic);
  }, [currentRemark, currentIsPublic]);
  const handleSave = () => {
    onSave(remark.trim(), isPublic);
  };
  return <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5 text-blue-500" />
            编辑老师备注
          </DialogTitle>
          <DialogDescription>
            您可以添加或修改此抽奖记录的老师备注。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="remark">老师备注</Label>
            <Textarea id="remark" value={remark} onChange={e => setRemark(e.target.value)} placeholder="请输入老师备注..." rows={4} />
          </div>

          {/* 公示状态 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="isPublic">全校公示</Label>
                <div className="text-xs text-gray-500">
                  开启后，该中奖记录将显示在全校中奖记录页面
                </div>
              </div>
              <Switch id="isPublic" checked={isPublic} onCheckedChange={setIsPublic} />
            </div>
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
