"use client";

// 添加课程对话框组件，用于创建新的课程
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { Button } from "../../../../../../components/ui/button.js";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../../../../../components/ui/dialog.js";
import { Input } from "../../../../../../components/ui/input.js";
import { Label } from "../../../../../../components/ui/label.js";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../../../../components/ui/select.js";
import { Textarea } from "../../../../../../components/ui/textarea.js";
import { useSubjects } from "../../../../../../hooks/useAdminConfig.js";
export default function AddCourseModal({
  open,
  onOpenChange,
  onSubmit
}) {
  const [subject, setSubject] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("使用中");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    subjects,
    loading: subjectsLoading
  } = useSubjects();
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
      // 重置表单
      setSubject("");
      setName("");
      setDescription("");
      setStatus("使用中");
    } catch (error) {
      console.error("提交失败:", error);
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleOpenChange = newOpen => {
    if (!isSubmitting) {
      onOpenChange(newOpen);
      if (!newOpen) {
        // 关闭时重置表单
        setSubject("");
        setName("");
        setDescription("");
        setStatus("使用中");
      }
    }
  };
  return <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>添加课程</DialogTitle>
          <DialogDescription>
            创建一个新的课程，可以包含多个题目集合。
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="subject">科目 *</Label>
              <Select value={subject} onValueChange={setSubject} disabled={isSubmitting || subjectsLoading}>
                <SelectTrigger>
                  <SelectValue placeholder="请选择科目" />
                </SelectTrigger>
                <SelectContent>
                  {!subjectsLoading && subjects.map(subjectOption => <SelectItem key={subjectOption.name} value={subjectOption.name}>
                        {subjectOption.name}
                      </SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="name">课程名称 *</Label>
              <Input id="name" value={name} onChange={e => setName(e.target.value)} placeholder="请输入课程名称" disabled={isSubmitting} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">课程描述</Label>
              <Textarea id="description" value={description} onChange={e => setDescription(e.target.value)} placeholder="请输入课程描述（可选）" disabled={isSubmitting} rows={3} />
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
                  添加中...
                </> : "添加课程"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>;
}
