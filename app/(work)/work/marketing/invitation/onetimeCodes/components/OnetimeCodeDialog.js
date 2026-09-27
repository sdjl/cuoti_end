"use client";

// 一次性邀请码的编辑和批量创建对话框组件
import { useEffect, useState } from "react";
import { Button } from "../../../../../../../components/ui/button.js";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "../../../../../../../components/ui/dialog.js";
import { Input } from "../../../../../../../components/ui/input.js";
import { Label } from "../../../../../../../components/ui/label.js";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../../../../../components/ui/select.js";
import { useToast } from "../../../../../../../hooks/use-toast.js";
export default function OnetimeCodeDialog({
  open,
  onOpenChange,
  invitationCode,
  onSave,
  onBatchCreate
}) {
  const {
    toast
  } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    // 编辑模式的字段
    status: "active",
    experienceDays: 30,
    validDays: 365,
    // 批量创建模式的字段
    count: 10,
    codeLength: 10,
    prefix: ""
  });
  const isEditing = !!invitationCode;
  const isBatchCreating = !isEditing;

  // 当邀请码数据变化时更新表单
  useEffect(() => {
    if (invitationCode) {
      setFormData(prevData => ({
        ...prevData,
        status: invitationCode.status || "active",
        experienceDays: invitationCode.experienceDays || 30,
        validDays: invitationCode.validDays || 365
      }));
    } else {
      // 新增时重置表单
      setFormData({
        status: "active",
        experienceDays: 30,
        validDays: 365,
        count: 10,
        codeLength: 10,
        prefix: ""
      });
    }
  }, [invitationCode, open]);

  // 验证前缀格式（只能是数字和大写字母）
  const validatePrefix = prefix => {
    const prefixRegex = /^[A-Z0-9]+$/;
    return prefixRegex.test(prefix);
  };

  // 处理表单提交
  const handleSubmit = async e => {
    e.preventDefault();
    if (isEditing) {
      // 编辑模式
      if (!onSave) return;
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
          status: formData.status,
          experienceDays: formData.experienceDays,
          validDays: formData.validDays
        });
        onOpenChange(false);
      } catch (error) {
        console.error("保存邀请码失败:", error);
      } finally {
        setIsSubmitting(false);
      }
    } else {
      // 批量创建模式
      if (!onBatchCreate) return;

      // 验证批量创建的字段
      if (formData.count <= 0) {
        toast({
          title: "表单验证失败",
          description: "生成数量必须大于0",
          variant: "destructive"
        });
        return;
      }
      if (formData.count > 1000) {
        toast({
          title: "表单验证失败",
          description: "生成数量不能超过1000个",
          variant: "destructive"
        });
        return;
      }
      if (formData.codeLength < 10) {
        toast({
          title: "表单验证失败",
          description: "邀请码长度不能少于10位",
          variant: "destructive"
        });
        return;
      }
      if (formData.codeLength > 20) {
        toast({
          title: "表单验证失败",
          description: "邀请码长度不能超过20位",
          variant: "destructive"
        });
        return;
      }
      if (!formData.prefix.trim()) {
        toast({
          title: "表单验证失败",
          description: "前缀字符不能为空",
          variant: "destructive"
        });
        return;
      }
      if (formData.prefix.trim().length < 3) {
        toast({
          title: "表单验证失败",
          description: "前缀字符不能少于3位",
          variant: "destructive"
        });
        return;
      }
      if (formData.codeLength - formData.prefix.trim().length < 5) {
        toast({
          title: "表单验证失败",
          description: "邀请码长度减去前缀长度不能少于5位",
          variant: "destructive"
        });
        return;
      }
      if (!validatePrefix(formData.prefix.trim())) {
        toast({
          title: "表单验证失败",
          description: "前缀字符只能包含数字和大写字母",
          variant: "destructive"
        });
        return;
      }
      if (formData.experienceDays <= 0 || formData.experienceDays > 365) {
        toast({
          title: "表单验证失败",
          description: "体验天数必须在1-365天之间",
          variant: "destructive"
        });
        return;
      }
      if (formData.validDays <= 0 || formData.validDays > 3650) {
        toast({
          title: "表单验证失败",
          description: "有效期天数必须在1-3650天之间",
          variant: "destructive"
        });
        return;
      }
      setIsSubmitting(true);
      try {
        await onBatchCreate({
          count: formData.count,
          codeLength: formData.codeLength,
          prefix: formData.prefix.trim().toUpperCase(),
          experienceDays: formData.experienceDays,
          validDays: formData.validDays
        });
        onOpenChange(false);
      } catch (error) {
        console.error("批量创建邀请码失败:", error);
      } finally {
        setIsSubmitting(false);
      }
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
          <DialogTitle>
            {isEditing ? "编辑邀请码" : "批量生成一次性邀请码"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 基本信息展示（仅编辑时） */}
          {isEditing && invitationCode && <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">邀请码：</span>
                  <span className="font-mono">{invitationCode.code}</span>
                </div>
                <div>
                  <span className="text-gray-600">已使用次数：</span>
                  <span>{invitationCode.usedCount} 次</span>
                </div>
                <div className="col-span-2">
                  <span className="text-gray-600">创建时间：</span>
                  <span>{formatDateTime(invitationCode.created)}</span>
                </div>
              </div>
            </div>}

          <div className="grid grid-cols-1 gap-4">
            {/* 批量创建模式的字段 */}
            {isBatchCreating && <>
                <div className="grid grid-cols-2 gap-4">
                  {/* 生成数量 */}
                  <div className="space-y-2">
                    <Label htmlFor="count">
                      生成数量 <span className="text-red-500">*</span>
                    </Label>
                    <Input id="count" type="number" min="1" max="1000" value={formData.count} onChange={e => setFormData({
                  ...formData,
                  count: parseInt(e.target.value) || 0
                })} placeholder="请输入生成数量" required />
                    <p className="text-xs text-gray-500">生成数量：1-1000个</p>
                  </div>

                  {/* 邀请码长度 */}
                  <div className="space-y-2">
                    <Label htmlFor="codeLength">
                      邀请码长度 <span className="text-red-500">*</span>
                    </Label>
                    <Input id="codeLength" type="number" min="10" max="20" value={formData.codeLength} onChange={e => setFormData({
                  ...formData,
                  codeLength: parseInt(e.target.value) || 0
                })} placeholder="请输入邀请码长度" required />
                    <p className="text-xs text-gray-500">长度：10-20位</p>
                  </div>
                </div>

                {/* 前缀字符 */}
                <div className="space-y-2">
                  <Label htmlFor="prefix">
                    前缀字符 <span className="text-red-500">*</span>
                  </Label>
                  <Input id="prefix" value={formData.prefix} onChange={e => setFormData({
                ...formData,
                prefix: e.target.value.toUpperCase()
              })} placeholder="请输入前缀字符（只能包含数字和大写字母）" required />
                  <p className="text-xs text-gray-500">
                    前缀最少3位，且邀请码长度减去前缀长度不能少于5位。系统会自动转换为大写。
                  </p>
                </div>
              </>}

            {/* 邀请码状态（仅编辑时） */}
            {isEditing && <div className="space-y-2">
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
              </div>}

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
                <p className="text-xs text-gray-500">体验天数：1-365天</p>
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
                <p className="text-xs text-gray-500">有效期：1-3650天</p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleCancel} disabled={isSubmitting}>
              取消
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? isEditing ? "保存中..." : "生成中..." : isEditing ? "保存" : "批量生成"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>;
}
