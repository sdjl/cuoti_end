"use client";

// 合作伙伴邀请码对话框组件，用于创建或编辑合作伙伴邀请码
import { useEffect, useState } from "react";
import { Button } from "../../../../../../../components/ui/button.js";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "../../../../../../../components/ui/dialog.js";
import { Input } from "../../../../../../../components/ui/input.js";
import { Label } from "../../../../../../../components/ui/label.js";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../../../../../components/ui/select.js";
import { Textarea } from "../../../../../../../components/ui/textarea.js";
import { useToast } from "../../../../../../../hooks/use-toast.js";
export default function PartnerCodeDialog({
  open,
  onOpenChange,
  invitationCode,
  onSave
}) {
  const {
    toast
  } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    code: "",
    status: "active",
    experienceDays: 30,
    validDays: 365,
    remark: ""
  });
  const isEditing = !!invitationCode;

  // 当邀请码数据变化时更新表单
  useEffect(() => {
    if (invitationCode) {
      setFormData({
        code: invitationCode.code || "",
        status: invitationCode.status || "active",
        experienceDays: invitationCode.experienceDays || 30,
        validDays: invitationCode.validDays || 365,
        remark: invitationCode.remark || ""
      });
    } else {
      // 新增时重置表单
      setFormData({
        code: "",
        status: "active",
        experienceDays: 30,
        validDays: 365,
        remark: ""
      });
    }
  }, [invitationCode, open]);

  // 验证邀请码格式（只能是数字和大写字母）
  const validateCode = code => {
    const codeRegex = /^[A-Z0-9]+$/;
    return codeRegex.test(code);
  };

  // 处理表单提交
  const handleSubmit = async e => {
    e.preventDefault();

    // 验证必填字段
    if (!formData.code.trim()) {
      toast({
        title: "表单验证失败",
        description: "邀请码不能为空",
        variant: "destructive"
      });
      return;
    }

    // 验证邀请码格式
    if (!validateCode(formData.code.trim())) {
      toast({
        title: "表单验证失败",
        description: "邀请码只能包含数字和大写字母",
        variant: "destructive"
      });
      return;
    }
    if (formData.experienceDays <= 0) {
      toast({
        title: "表单验证失败",
        description: "体验天数必须大于0",
        variant: "destructive"
      });
      return;
    }
    if (formData.experienceDays > 365) {
      toast({
        title: "表单验证失败",
        description: "体验天数不能超过365天",
        variant: "destructive"
      });
      return;
    }
    if (formData.validDays <= 0) {
      toast({
        title: "表单验证失败",
        description: "有效期天数必须大于0",
        variant: "destructive"
      });
      return;
    }
    if (formData.validDays > 3650) {
      toast({
        title: "表单验证失败",
        description: "有效期天数不能超过3650天（10年）",
        variant: "destructive"
      });
      return;
    }
    setIsSubmitting(true);
    try {
      await onSave({
        code: formData.code.trim().toUpperCase(),
        status: formData.status,
        experienceDays: formData.experienceDays,
        validDays: formData.validDays,
        remark: formData.remark.trim() || undefined
      });
      onOpenChange(false);
    } catch (error) {
      // 错误处理由父组件完成
      console.error("保存邀请码失败:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 处理取消
  const handleCancel = () => {
    onOpenChange(false);
  };

  // 格式化日期时间
  const formatDateTime = timestamp => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleString("zh-CN");
    } catch {
      return "无效时间";
    }
  };
  return <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "编辑邀请码" : "新建邀请码"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 基本信息展示（仅编辑时） */}
          {isEditing && invitationCode && <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">已使用次数：</span>
                  <span>{invitationCode.usedCount} 次</span>
                </div>
                <div>
                  <span className="text-gray-600">创建时间：</span>
                  <span>{formatDateTime(invitationCode.created)}</span>
                </div>
              </div>
            </div>}

          <div className="grid grid-cols-1 gap-4">
            {/* 邀请码 */}
            <div className="space-y-2">
              <Label htmlFor="code">
                邀请码 <span className="text-red-500">*</span>
              </Label>
              <Input id="code" value={formData.code} onChange={e => setFormData({
              ...formData,
              code: e.target.value.toUpperCase()
            })} placeholder="请输入邀请码（只能包含数字和大写字母）" required />
              <p className="text-xs text-gray-500">
                邀请码只能包含数字和大写字母，系统会自动转换为大写
              </p>
            </div>

            {/* 邀请码状态 */}
            <div className="space-y-2">
              <Label htmlFor="status">
                邀请码状态 <span className="text-red-500">*</span>
              </Label>
              <Select value={formData.status} onValueChange={value => setFormData({
              ...formData,
              status: value
            })}>
                <SelectTrigger>
                  <SelectValue placeholder="选择状态" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">启用</SelectItem>
                  <SelectItem value="disabled">禁用</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* 体验天数 */}
              <div className="space-y-2">
                <Label htmlFor="experienceDays">
                  体验天数 <span className="text-red-500">*</span>
                </Label>
                <Input id="experienceDays" type="number" min="1" max="365" value={formData.experienceDays} onChange={e => setFormData({
                ...formData,
                experienceDays: parseInt(e.target.value) || 0
              })} placeholder="请输入体验天数" required />
                <p className="text-xs text-gray-500">体验天数范围：1-365天</p>
              </div>

              {/* 有效期天数 */}
              <div className="space-y-2">
                <Label htmlFor="validDays">
                  有效期天数 <span className="text-red-500">*</span>
                </Label>
                <Input id="validDays" type="number" min="1" max="3650" value={formData.validDays} onChange={e => setFormData({
                ...formData,
                validDays: parseInt(e.target.value) || 0
              })} placeholder="请输入有效期天数" required />
                <p className="text-xs text-gray-500">有效期范围：1-3650天</p>
              </div>
            </div>

            {/* 备注信息 */}
            <div className="space-y-2">
              <Label htmlFor="remark">备注信息</Label>
              <Textarea id="remark" value={formData.remark} onChange={e => setFormData({
              ...formData,
              remark: e.target.value
            })} placeholder="请输入备注信息" rows={3} />
            </div>
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
