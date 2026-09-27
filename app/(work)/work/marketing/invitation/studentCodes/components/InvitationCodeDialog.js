"use client";

// 学生邀请码对话框组件，用于编辑学生邀请码的状态和体验天数
import { useEffect, useState } from "react";
import { Button } from "../../../../../../../components/ui/button.js";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "../../../../../../../components/ui/dialog.js";
import { Input } from "../../../../../../../components/ui/input.js";
import { Label } from "../../../../../../../components/ui/label.js";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../../../../../components/ui/select.js";
import { useToast } from "../../../../../../../hooks/use-toast.js";

// 扩展类型定义，包含关联信息

export default function InvitationCodeDialog({
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
    status: "active",
    experienceDays: 30
  });

  // 当邀请码数据变化时更新表单
  useEffect(() => {
    if (invitationCode) {
      setFormData({
        status: invitationCode.status || "active",
        experienceDays: invitationCode.experienceDays || 30
      });
    } else {
      // 重置表单
      setFormData({
        status: "active",
        experienceDays: 30
      });
    }
  }, [invitationCode, open]);

  // 处理表单提交
  const handleSubmit = async e => {
    e.preventDefault();

    // 验证必填字段
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
    setIsSubmitting(true);
    try {
      await onSave({
        status: formData.status,
        experienceDays: formData.experienceDays
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
          <DialogTitle>编辑邀请码</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 基本信息展示 */}
          {invitationCode && <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">邀请码：</span>
                  <span className="font-mono">{invitationCode.code}</span>
                </div>
                <div>
                  <span className="text-gray-600">班级：</span>
                  <span>{invitationCode.classroom?.name || "未知班级"}</span>
                </div>
                <div>
                  <span className="text-gray-600">学生：</span>
                  <span>{invitationCode.student?.name || "未知学生"}</span>
                </div>
                <div>
                  <span className="text-gray-600">学生编号：</span>
                  <span>
                    {invitationCode.student?.studentCode || "未知编号"}
                  </span>
                </div>
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
