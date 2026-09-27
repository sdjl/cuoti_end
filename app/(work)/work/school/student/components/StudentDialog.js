"use client";

// 学生信息对话框组件，用于添加或编辑学生的基本信息
import { useEffect, useState } from "react";
import { Button } from "../../../../../../components/ui/button.js";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "../../../../../../components/ui/dialog.js";
import { Input } from "../../../../../../components/ui/input.js";
import { Label } from "../../../../../../components/ui/label.js";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../../../../components/ui/select.js";
import { Textarea } from "../../../../../../components/ui/textarea.js";
import { useToast } from "../../../../../../hooks/use-toast.js";
export default function StudentDialog({
  open,
  onOpenChange,
  student,
  onSave
}) {
  const {
    toast
  } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    studentCode: "",
    name: "",
    birthDate: "",
    ethnicity: "",
    homeAddress: "",
    gender: "未知",
    publicSchoolName: "",
    contactPhones: "",
    // 使用字符串，保存时会split成数组
    notes: ""
  });

  // 当学生数据变化时更新表单
  useEffect(() => {
    if (student) {
      setFormData({
        studentCode: student.studentCode || "",
        name: student.name || "",
        birthDate: student.birthDate || "",
        ethnicity: student.ethnicity || "",
        homeAddress: student.homeAddress || "",
        gender: student.gender || "未知",
        publicSchoolName: student.publicSchoolName || "",
        contactPhones: student.contactPhones?.join(" ") || "",
        // 将数组转换为空格分隔的字符串
        notes: student.notes || ""
      });
    } else {
      // 新增时重置表单
      setFormData({
        studentCode: "",
        name: "",
        birthDate: "",
        ethnicity: "",
        homeAddress: "",
        gender: "未知",
        publicSchoolName: "",
        contactPhones: "",
        notes: ""
      });
    }
  }, [student, open]);

  // 处理表单提交
  const handleSubmit = async e => {
    e.preventDefault();

    // 验证必填字段
    if (!formData.studentCode.trim()) {
      toast({
        title: "表单验证失败",
        description: "学生编号不能为空",
        variant: "destructive"
      });
      return;
    }
    if (!formData.name.trim()) {
      toast({
        title: "表单验证失败",
        description: "学生姓名不能为空",
        variant: "destructive"
      });
      return;
    }
    setIsSubmitting(true);
    try {
      // 处理联系电话：将空格分隔的字符串转换为数组
      const contactPhonesArray = formData.contactPhones.trim().split(/\s+/).filter(phone => phone.length > 0);
      await onSave({
        studentCode: formData.studentCode.trim(),
        name: formData.name.trim(),
        birthDate: formData.birthDate.trim(),
        ethnicity: formData.ethnicity.trim(),
        homeAddress: formData.homeAddress.trim(),
        gender: formData.gender,
        publicSchoolName: formData.publicSchoolName.trim() || undefined,
        contactPhones: contactPhonesArray.length > 0 ? contactPhonesArray : undefined,
        notes: formData.notes.trim() || undefined
      });
      onOpenChange(false);
    } catch (error) {
      // 错误处理由父组件完成
      console.error("保存学生失败:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 处理取消
  const handleCancel = () => {
    onOpenChange(false);
  };
  return <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{student ? "编辑学生" : "添加学生"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 学生编号 */}
            <div className="space-y-2">
              <Label htmlFor="studentCode">
                学生编号 <span className="text-red-500">*</span>
              </Label>
              <Input id="studentCode" value={formData.studentCode} onChange={e => setFormData({
              ...formData,
              studentCode: e.target.value
            })} placeholder="请输入学生编号" required />
            </div>

            {/* 学生姓名 */}
            <div className="space-y-2">
              <Label htmlFor="name">
                学生姓名 <span className="text-red-500">*</span>
              </Label>
              <Input id="name" value={formData.name} onChange={e => setFormData({
              ...formData,
              name: e.target.value
            })} placeholder="请输入学生姓名" required />
            </div>

            {/* 性别 */}
            <div className="space-y-2">
              <Label htmlFor="gender">性别</Label>
              <Select value={formData.gender} onValueChange={value => setFormData({
              ...formData,
              gender: value
            })}>
                <SelectTrigger>
                  <SelectValue placeholder="选择性别" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="男">男</SelectItem>
                  <SelectItem value="女">女</SelectItem>
                  <SelectItem value="未知">未知</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 出生日期 */}
            <div className="space-y-2">
              <Label htmlFor="birthDate">出生日期</Label>
              <Input id="birthDate" type="date" value={formData.birthDate} onChange={e => setFormData({
              ...formData,
              birthDate: e.target.value
            })} />
            </div>

            {/* 民族 */}
            <div className="space-y-2">
              <Label htmlFor="ethnicity">民族</Label>
              <Input id="ethnicity" value={formData.ethnicity} onChange={e => setFormData({
              ...formData,
              ethnicity: e.target.value
            })} placeholder="请输入民族" />
            </div>

            {/* 就读校园 */}
            <div className="space-y-2">
              <Label htmlFor="publicSchoolName">就读校园</Label>
              <Input id="publicSchoolName" value={formData.publicSchoolName} onChange={e => setFormData({
              ...formData,
              publicSchoolName: e.target.value
            })} placeholder="请输入就读的公立校园名称" />
            </div>

            {/* 联系电话 */}
            <div className="space-y-2">
              <Label htmlFor="contactPhones">联系电话</Label>
              <Input id="contactPhones" value={formData.contactPhones} onChange={e => setFormData({
              ...formData,
              contactPhones: e.target.value
            })} placeholder="多个电话请用空格隔开" />
            </div>
          </div>

          {/* 家庭地址 */}
          <div className="space-y-2">
            <Label htmlFor="homeAddress">家庭地址</Label>
            <Input id="homeAddress" value={formData.homeAddress} onChange={e => setFormData({
            ...formData,
            homeAddress: e.target.value
          })} placeholder="请输入家庭地址" />
          </div>

          {/* 备注信息 */}
          <div className="space-y-2">
            <Label htmlFor="notes">备注信息</Label>
            <Textarea id="notes" value={formData.notes} onChange={e => setFormData({
            ...formData,
            notes: e.target.value
          })} placeholder="请输入备注信息" rows={3} />
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
