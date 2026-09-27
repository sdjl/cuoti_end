"use client";

import { Loader2 } from "lucide-react";
// 错误归因编辑模态框组件，用于选择和编辑题目的错误归因
import { useEffect, useState } from "react";
import { Button } from "../../../../../../../components/ui/button.js";
import { Checkbox } from "../../../../../../../components/ui/checkbox.js";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../../../../../../../components/ui/dialog.js";
import { useToast } from "../../../../../../../hooks/use-toast.js";
export default function MistakePointEditModal({
  open,
  onClose,
  mistakePoints,
  selectedIds,
  onSave,
  maxSelection = 3
}) {
  const [selected, setSelected] = useState(new Set(selectedIds));
  const [saving, setSaving] = useState(false);
  const {
    toast
  } = useToast();

  // 当 selectedIds 变化时更新本地状态
  useEffect(() => {
    setSelected(new Set(selectedIds));
  }, [selectedIds]);

  // 切换选中状态
  const toggleSelection = id => {
    const newSelected = new Set(selected);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      // 检查是否超过最大选择数量
      if (newSelected.size >= maxSelection) {
        toast({
          title: "选择数量已达上限",
          description: `每个题目最多只能选择${maxSelection}个错误归因`,
          variant: "destructive"
        });
        return;
      }
      newSelected.add(id);
    }
    setSelected(newSelected);
  };

  // 保存
  const handleSave = async () => {
    try {
      setSaving(true);
      const result = await onSave(Array.from(selected));
      if (result.success) {
        toast({
          title: "保存成功",
          description: result.message
        });
        onClose();
      } else {
        toast({
          title: "保存失败",
          description: result.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("保存错误归因失败:", error);
      toast({
        title: "保存失败",
        description: "发生未知错误",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };
  return <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>编辑错误归因</DialogTitle>
          <DialogDescription>
            请选择本题的错误归因，最多可选择{maxSelection}个
          </DialogDescription>
        </DialogHeader>

        {/* 可滚动的错误归因列表 */}
        <div className="flex-1 overflow-y-auto space-y-3 py-4">
          {mistakePoints.length === 0 ? <div className="text-center text-gray-500 py-8">
              暂无错误归因数据
            </div> : mistakePoints.map(point => <div key={point._id} className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-gray-50 cursor-pointer" onClick={() => toggleSelection(point._id)}>
                <Checkbox checked={selected.has(point._id)} onCheckedChange={() => toggleSelection(point._id)} className="mt-1" />
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{point.name}</div>
                  {point.description && <div className="text-sm text-gray-600 mt-1">
                      {point.description}
                    </div>}
                </div>
              </div>)}
        </div>

        {/* 底部按钮 */}
        <div className="flex gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose} disabled={saving} className="flex-1">
            取消
          </Button>
          <Button onClick={handleSave} disabled={saving} className="flex-1">
            {saving ? <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                保存中...
              </> : "保存"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>;
}
