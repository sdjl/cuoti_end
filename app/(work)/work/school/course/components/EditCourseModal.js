"use client";

import { Loader2 } from "lucide-react";
// 编辑课程对话框组件，用于修改课程的基本信息
import { useEffect, useState } from "react";
import { Button } from "../../../../../../components/ui/button.js";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../../../../../components/ui/dialog.js";
import { Input } from "../../../../../../components/ui/input.js";
import { Label } from "../../../../../../components/ui/label.js";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../../../../components/ui/select.js";
import { Textarea } from "../../../../../../components/ui/textarea.js";
export default function EditCourseModal({
  open,
  onOpenChange,
  course,
  onSubmit
}) {
  const [subject, setSubject] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("使用中");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 当课程数据变化时，更新表单
  useEffect(() => {
    if (course) {
      setSubject(course.subject || "");
      setName(course.name);
      setDescription(course.description || "");
      setStatus(course.status || "使用中");
    }
  }, [course]);
  const handleSubmit = async e => {
    e.preventDefault();
    if (!subject.trim() || !name.trim()) {
      return;
    }
    setIsSubmitting(true);
    try {
      await onSubmit({
        subject: subject.trim(),
        name: name.trim(),
        description: description.trim(),
        status
      });
    } catch (error) {
      console.error("提交失败:", error);
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleOpenChange = newOpen => {
    if (!isSubmitting) {
      onOpenChange(newOpen);
    }
  };
  return <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>编辑课程</DialogTitle>
          <DialogDescription>修改课程的基本信息。</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="subject">科目 *</Label>
              <div className="flex h-10 w-full rounded-md border border-input bg-gray-50 px-3 py-2 text-sm text-gray-700">
                {subject || "未设置科目"}
              </div>
              <p className="text-xs text-gray-500">课程创建后不可修改科目</p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="name">课程名称 *</Label>
              <Input id="name" value={name} onChange={e => setName(e.target.value)} placeholder="请输入课程名称" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">课程描述</Label>
              <Textarea id="description" value={description} onChange={e => setDescription(e.target.value)} placeholder="请输入课程描述（可选）" rows={3} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="status">课程状态</Label>
              <Select value={status} onValueChange={value => setStatus(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="选择课程状态" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="使用中">使用中</SelectItem>
                  <SelectItem value="已停用">已停用</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={isSubmitting}>
              取消
            </Button>
            <Button type="submit" disabled={isSubmitting || !subject.trim() || !name.trim()}>
              {isSubmitting ? <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  保存中...
                </> : "保存更改"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>;
}
