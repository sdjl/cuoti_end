"use client";

// 班级对话框组件，用于添加或编辑班级信息
import { useEffect, useState } from "react";
import { getGradeListAction } from "../../../setting/grade-list/actions.js";
import { Button } from "../../../../../../components/ui/button.js";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "../../../../../../components/ui/dialog.js";
import { Input } from "../../../../../../components/ui/input.js";
import { Label } from "../../../../../../components/ui/label.js";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../../../../components/ui/select.js";
import { Textarea } from "../../../../../../components/ui/textarea.js";
import { useToast } from "../../../../../../hooks/use-toast.js";
export default function ClassRoomDialog({
  open,
  onOpenChange,
  classRoom,
  onSave
}) {
  const {
    toast
  } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [grades, setGrades] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    grade: "",
    headTeacher: "",
    headTeacherPhone: "",
    description: "",
    status: "正常"
  });

  // 当班级数据变化时更新表单
  useEffect(() => {
    if (classRoom) {
      setFormData({
        name: classRoom.name || "",
        grade: classRoom.grade || "",
        headTeacher: classRoom.headTeacher || "",
        headTeacherPhone: classRoom.headTeacherPhone || "",
        description: classRoom.description || "",
        status: classRoom.status || "正常"
      });
    } else {
      // 新增时重置表单
      setFormData({
        name: "",
        grade: "",
        headTeacher: "",
        headTeacherPhone: "",
        description: "",
        status: "正常"
      });
    }
  }, [classRoom, open]);

  // 加载年级列表
  useEffect(() => {
    const loadGrades = async () => {
      try {
        const {
          grades: gradeList
        } = await getGradeListAction();
        setGrades(gradeList);
      } catch (error) {
        console.error("加载年级列表失败:", error);
      }
    };
    if (open) {
      loadGrades();
    }
  }, [open]);

  // 处理表单提交
  const handleSubmit = async e => {
    e.preventDefault();

    // 验证必填字段
    if (!formData.name.trim()) {
      toast({
        title: "表单验证失败",
        description: "班级名称不能为空",
        variant: "destructive"
      });
      return;
    }
    if (!formData.grade.trim()) {
      toast({
        title: "表单验证失败",
        description: "年级不能为空",
        variant: "destructive"
      });
      return;
    }
    setIsSubmitting(true);
    try {
      await onSave({
        name: formData.name.trim(),
        grade: formData.grade.trim(),
        headTeacher: formData.headTeacher.trim() || undefined,
        headTeacherPhone: formData.headTeacherPhone.trim() || undefined,
        description: formData.description.trim() || undefined,
        status: formData.status
      });
      onOpenChange(false);
    } catch (error) {
      // 错误处理由父组件完成
      console.error("保存班级失败:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 处理取消
  const handleCancel = () => {
    onOpenChange(false);
  };
  return <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{classRoom ? "编辑班级" : "添加班级"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 班级名称 */}
          <div className="space-y-2">
            <Label htmlFor="name">
              班级名称 <span className="text-red-500">*</span>
            </Label>
            <Input id="name" value={formData.name} onChange={e => setFormData({
            ...formData,
            name: e.target.value
          })} placeholder="请输入班级名称" required />
          </div>

          {/* 年级 */}
          <div className="space-y-2">
            <Label htmlFor="grade">
              年级 <span className="text-red-500">*</span>
            </Label>
            <Select value={formData.grade} onValueChange={value => setFormData({
            ...formData,
            grade: value
          })}>
              <SelectTrigger>
                <SelectValue placeholder="选择年级" />
              </SelectTrigger>
              <SelectContent>
                {grades.map(grade => <SelectItem key={grade} value={grade}>
                    {grade}
                  </SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* 班主任姓名 */}
          <div className="space-y-2">
            <Label htmlFor="headTeacher">班主任姓名</Label>
            <Input id="headTeacher" value={formData.headTeacher} onChange={e => setFormData({
            ...formData,
            headTeacher: e.target.value
          })} placeholder="请输入班主任姓名" />
          </div>

          {/* 班主任联系方式 */}
          <div className="space-y-2">
            <Label htmlFor="headTeacherPhone">班主任联系方式</Label>
            <Input id="headTeacherPhone" value={formData.headTeacherPhone} onChange={e => setFormData({
            ...formData,
            headTeacherPhone: e.target.value
          })} placeholder="请输入班主任联系方式" type="tel" />
          </div>

          {/* 班级状态 */}
          <div className="space-y-2">
            <Label htmlFor="status">班级状态</Label>
            <Select value={formData.status} onValueChange={value => setFormData({
            ...formData,
            status: value
          })}>
              <SelectTrigger>
                <SelectValue placeholder="选择班级状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="正常">正常</SelectItem>
                <SelectItem value="毕业">毕业</SelectItem>
                <SelectItem value="停用">停用</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 班级描述 */}
          <div className="space-y-2">
            <Label htmlFor="description">班级描述</Label>
            <Textarea id="description" value={formData.description} onChange={e => setFormData({
            ...formData,
            description: e.target.value
          })} placeholder="请输入班级描述" rows={3} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleCancel} disabled={isSubmitting}>
              取消
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "保存中..." : "保存"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>;
}
