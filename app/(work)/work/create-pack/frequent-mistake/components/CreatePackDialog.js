"use client";

// 高频错题集创建弹窗，收集名称及描述后触发创建回调
import { useState } from "react";
import { Button } from "../../../../../../components/ui/button.js";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../../../../../components/ui/dialog.js";
import { Input } from "../../../../../../components/ui/input.js";
import { Label } from "../../../../../../components/ui/label.js";
import { Textarea } from "../../../../../../components/ui/textarea.js";
export default function CreatePackDialog({
  open,
  onOpenChange,
  onConfirm,
  loading = false
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const handleConfirm = () => {
    if (!name.trim()) {
      return;
    }
    onConfirm(name.trim(), description.trim());
  };
  const handleOpenChange = newOpen => {
    if (!newOpen && !loading) {
      // 关闭对话框时重置表单
      setName("");
      setDescription("");
    }
    onOpenChange(newOpen);
  };
  return <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>创建高频错题集</DialogTitle>
          <DialogDescription>
            请输入高频错题集的名称和描述信息
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">
              名称 <span className="text-red-500">*</span>
            </Label>
            <Input id="name" placeholder="请输入高频错题集名称" value={name} onChange={e => setName(e.target.value)} disabled={loading} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">描述</Label>
            <Textarea id="description" placeholder="请输入高频错题集描述（可选）" value={description} onChange={e => setDescription(e.target.value)} disabled={loading} rows={4} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={loading}>
            取消
          </Button>
          <Button onClick={handleConfirm} disabled={!name.trim() || loading}>
            {loading ? "创建中..." : "确认创建"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>;
}
