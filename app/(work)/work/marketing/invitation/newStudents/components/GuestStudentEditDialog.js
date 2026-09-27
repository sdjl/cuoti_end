"use client";

// 编辑新生信息的对话框组件
import { useEffect, useState } from "react";
import { Button } from "../../../../../../../components/ui/button.js";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../../../../../../components/ui/dialog.js";
import { Input } from "../../../../../../../components/ui/input.js";
import { Label } from "../../../../../../../components/ui/label.js";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../../../../../components/ui/select.js";
import { Switch } from "../../../../../../../components/ui/switch.js";
import { Textarea } from "../../../../../../../components/ui/textarea.js";
import { useToast } from "../../../../../../../hooks/use-toast.js";
import { updateContactStatus, updateGuestStudentInfo } from "../actions.js";
export default function GuestStudentEditDialog({
  open,
  onOpenChange,
  student,
  onSave
}) {
  const {
    toast
  } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  // 表单状态
  const [formData, setFormData] = useState({
    studentName: "",
    studentPhone: "",
    schoolName: "",
    grade: "",
    personalNote: "",
    isContactedByTeacher: false
  });

  // 当student变化时更新表单数据
  useEffect(() => {
    if (student) {
      setFormData({
        studentName: student.studentInfo.studentName || "",
        studentPhone: student.studentInfo.studentPhone || "",
        schoolName: student.studentInfo.schoolName || "",
        grade: student.studentInfo.grade || "",
        personalNote: student.studentInfo.personalNote || "",
        isContactedByTeacher: student.isContactedByTeacher
      });
    }
  }, [student]);
  const handleSave = async () => {
    if (!student) return;
    setIsLoading(true);
    try {
      // 更新学生信息
      await updateGuestStudentInfo(student._id, {
        studentName: formData.studentName.trim(),
        studentPhone: formData.studentPhone.trim(),
        schoolName: formData.schoolName.trim(),
        grade: formData.grade.trim(),
        personalNote: formData.personalNote.trim()
      });

      // 如果联系状态有变化，单独更新
      if (formData.isContactedByTeacher !== student.isContactedByTeacher) {
        await updateContactStatus(student._id, formData.isContactedByTeacher);
      }
      toast({
        title: "保存成功",
        description: "新生信息已更新"
      });
      onSave();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "保存失败",
        description: error instanceof Error ? error.message : "请稍后重试",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  const handleCancel = () => {
    onOpenChange(false);
  };
  if (!student) return null;
  return <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>编辑新生信息</DialogTitle>
          <DialogDescription>修改新生的基本信息和联系状态</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* 学生姓名 */}
          <div className="space-y-2">
            <Label htmlFor="studentName">学生姓名 *</Label>
            <Input id="studentName" value={formData.studentName} onChange={e => setFormData(prev => ({
            ...prev,
            studentName: e.target.value
          }))} placeholder="请输入学生姓名" />
          </div>

          {/* 学生电话 */}
          <div className="space-y-2">
            <Label htmlFor="studentPhone">学生电话</Label>
            <Input id="studentPhone" value={formData.studentPhone} onChange={e => setFormData(prev => ({
            ...prev,
            studentPhone: e.target.value
          }))} placeholder="请输入学生电话" />
          </div>

          {/* 所在校园 */}
          <div className="space-y-2">
            <Label htmlFor="schoolName">所在校园</Label>
            <Input id="schoolName" value={formData.schoolName} onChange={e => setFormData(prev => ({
            ...prev,
            schoolName: e.target.value
          }))} placeholder="请输入所在校园" />
          </div>

          {/* 年级 */}
          <div className="space-y-2">
            <Label htmlFor="grade">年级</Label>
            <Select value={formData.grade} onValueChange={value => setFormData(prev => ({
            ...prev,
            grade: value
          }))}>
              <SelectTrigger>
                <SelectValue placeholder="请选择年级" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="小学一年级">小学一年级</SelectItem>
                <SelectItem value="小学二年级">小学二年级</SelectItem>
                <SelectItem value="小学三年级">小学三年级</SelectItem>
                <SelectItem value="小学四年级">小学四年级</SelectItem>
                <SelectItem value="小学五年级">小学五年级</SelectItem>
                <SelectItem value="小学六年级">小学六年级</SelectItem>
                <SelectItem value="初中一年级">初中一年级</SelectItem>
                <SelectItem value="初中二年级">初中二年级</SelectItem>
                <SelectItem value="初中三年级">初中三年级</SelectItem>
                <SelectItem value="高中一年级">高中一年级</SelectItem>
                <SelectItem value="高中二年级">高中二年级</SelectItem>
                <SelectItem value="高中三年级">高中三年级</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 个人备注 */}
          <div className="space-y-2">
            <Label htmlFor="personalNote">个人备注</Label>
            <Textarea id="personalNote" value={formData.personalNote} onChange={e => setFormData(prev => ({
            ...prev,
            personalNote: e.target.value
          }))} placeholder="请输入个人备注" rows={3} />
          </div>

          {/* 老师联系状态 */}
          <div className="flex items-center space-x-2">
            <Switch id="isContactedByTeacher" checked={formData.isContactedByTeacher} onCheckedChange={checked => setFormData(prev => ({
            ...prev,
            isContactedByTeacher: checked
          }))} />
            <Label htmlFor="isContactedByTeacher">老师已联系过此新生</Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel} disabled={isLoading}>
            取消
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? "保存中..." : "保存"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>;
}
