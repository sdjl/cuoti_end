"use client";

import { Loader2, Save } from "lucide-react";
// 学生邀请码配置组件，用于配置学生邀请码功能的相关参数
import { useEffect, useState } from "react";
import { Alert, AlertDescription } from "../../../../../../../components/ui/alert.js";
import { Button } from "../../../../../../../components/ui/button.js";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../../../../../components/ui/card.js";
import { Input } from "../../../../../../../components/ui/input.js";
import { Label } from "../../../../../../../components/ui/label.js";
import { Switch } from "../../../../../../../components/ui/switch.js";
import { Textarea } from "../../../../../../../components/ui/textarea.js";
import { useToast } from "../../../../../../../hooks/use-toast.js";
import { updateStudentInvitationConfig } from "../actions.js";
export default function StudentInvitationConfig({
  config,
  onConfigChange
}) {
  const [formData, setFormData] = useState({
    enabled: false,
    codeLength: 6,
    defaultValidDays: 30,
    inviterBenefit: "",
    inviteeBenefit: "",
    promotionText: "",
    experienceDays: 7
  });
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const {
    toast
  } = useToast();

  // 初始化表单数据
  useEffect(() => {
    const studentConfig = config.invitationCode?.student;
    setFormData({
      enabled: studentConfig?.enabled ?? false,
      codeLength: studentConfig?.codeLength ?? 6,
      defaultValidDays: studentConfig?.defaultValidDays ?? 30,
      inviterBenefit: studentConfig?.inviterBenefit ?? "",
      inviteeBenefit: studentConfig?.inviteeBenefit ?? "",
      promotionText: studentConfig?.promotionText ?? "",
      experienceDays: studentConfig?.experienceDays ?? 7
    });
    setHasChanges(false);
  }, [config]);

  // 检查是否有变化
  useEffect(() => {
    const originalConfig = config.invitationCode?.student;
    const hasChanged = formData.enabled !== (originalConfig?.enabled ?? false) || formData.codeLength !== (originalConfig?.codeLength ?? 6) || formData.defaultValidDays !== (originalConfig?.defaultValidDays ?? 30) || formData.inviterBenefit !== (originalConfig?.inviterBenefit ?? "") || formData.inviteeBenefit !== (originalConfig?.inviteeBenefit ?? "") || formData.promotionText !== (originalConfig?.promotionText ?? "") || formData.experienceDays !== (originalConfig?.experienceDays ?? 7);
    setHasChanges(hasChanged);
  }, [formData, config]);

  // 更新表单字段
  const updateField = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // 处理保存
  const handleSave = async () => {
    if (!hasChanges) {
      toast({
        title: "提示",
        description: "没有需要保存的更改"
      });
      return;
    }

    // 验证字段
    if (formData.codeLength < 5) {
      toast({
        variant: "destructive",
        title: "验证失败",
        description: "邀请码长度不能小于5位"
      });
      return;
    }
    if (formData.defaultValidDays < 1) {
      toast({
        variant: "destructive",
        title: "验证失败",
        description: "默认有效期不能小于1天"
      });
      return;
    }
    if (formData.experienceDays < 1) {
      toast({
        variant: "destructive",
        title: "验证失败",
        description: "体验天数不能小于1天"
      });
      return;
    }
    setSaving(true);
    try {
      const result = await updateStudentInvitationConfig(formData);
      if (result.success) {
        // 更新本地配置
        const updatedConfig = {
          ...config,
          invitationCode: {
            student: formData,
            partner: config.invitationCode?.partner || {
              codeLength: 8,
              defaultValidDays: 365,
              experienceDescription: "体验全部功能",
              defaultExperienceDays: 30
            },
            onetime: config.invitationCode?.onetime || {
              codeLength: 10,
              defaultValidDays: 90,
              defaultExperienceDays: 15,
              experienceDescription: "一次性体验码"
            }
          }
        };
        onConfigChange(updatedConfig);
        toast({
          title: "保存成功",
          description: result.message
        });
        setHasChanges(false);
      } else {
        toast({
          variant: "destructive",
          title: "保存失败",
          description: result.message
        });
      }
    } catch (error) {
      console.error("保存学生邀请码配置失败:", error);
      toast({
        variant: "destructive",
        title: "保存失败",
        description: `客户端错误: ${error instanceof Error ? error.message : String(error)}`
      });
    } finally {
      setSaving(false);
    }
  };

  // 重置表单
  const handleReset = () => {
    const studentConfig = config.invitationCode?.student;
    setFormData({
      enabled: studentConfig?.enabled ?? false,
      codeLength: studentConfig?.codeLength ?? 6,
      defaultValidDays: studentConfig?.defaultValidDays ?? 30,
      inviterBenefit: studentConfig?.inviterBenefit ?? "",
      inviteeBenefit: studentConfig?.inviteeBenefit ?? "",
      promotionText: studentConfig?.promotionText ?? "",
      experienceDays: studentConfig?.experienceDays ?? 7
    });
    setHasChanges(false);
  };
  return <div className="space-y-6">
      <Alert>
        <AlertDescription>
          配置学生邀请码功能的相关设置。学生可以分享邀请码给其他学生，双方都能获得相应的好处。修改后需要点击&ldquo;保存&rdquo;按钮才能生效。
        </AlertDescription>
      </Alert>

      {/* 功能开关 */}
      <Card>
        <CardHeader>
          <CardTitle>功能开关</CardTitle>
          <CardDescription>控制学生邀请码功能是否启用</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between space-x-2">
            <div className="space-y-1">
              <Label htmlFor="enabled" className="text-sm font-medium">
                启用学生邀请码功能
              </Label>
              <p className="text-sm text-muted-foreground">
                开启后，学生可以生成和分享邀请码
              </p>
            </div>
            <Switch id="enabled" checked={formData.enabled} onCheckedChange={checked => updateField("enabled", checked)} disabled={saving} />
          </div>
        </CardContent>
      </Card>

      {/* 基础配置 */}
      <Card>
        <CardHeader>
          <CardTitle>基础配置</CardTitle>
          <CardDescription>设置邀请码的基本参数</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="codeLength">邀请码长度</Label>
              <Input id="codeLength" type="number" min="5" placeholder="6" value={formData.codeLength} onChange={e => updateField("codeLength", parseInt(e.target.value) || 6)} disabled={saving} />
              <p className="text-sm text-muted-foreground">
                邀请码字符数，最少5位
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="defaultValidDays">默认有效期（天）</Label>
              <Input id="defaultValidDays" type="number" min="1" placeholder="30" value={formData.defaultValidDays} onChange={e => updateField("defaultValidDays", parseInt(e.target.value) || 30)} disabled={saving} />
              <p className="text-sm text-muted-foreground">
                新生成邀请码的默认有效天数
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="experienceDays">产品体验天数</Label>
              <Input id="experienceDays" type="number" min="1" placeholder="7" value={formData.experienceDays} onChange={e => updateField("experienceDays", parseInt(e.target.value) || 7)} disabled={saving} />
              <p className="text-sm text-muted-foreground">
                使用邀请码后的体验天数
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 好处描述配置 */}
      <Card>
        <CardHeader>
          <CardTitle>好处描述配置</CardTitle>
          <CardDescription>设置邀请者和被邀请者的获益描述</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="inviterBenefit">邀请者获得的好处</Label>
            <Input id="inviterBenefit" type="text" placeholder="分享获得积分奖励" value={formData.inviterBenefit} onChange={e => updateField("inviterBenefit", e.target.value)} disabled={saving} maxLength={100} />
            <p className="text-sm text-muted-foreground">
              描述分享邀请码的学生能获得什么好处
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="inviteeBenefit">被邀请者获得的好处</Label>
            <Input id="inviteeBenefit" type="text" placeholder="使用邀请码可获得额外体验时长" value={formData.inviteeBenefit} onChange={e => updateField("inviteeBenefit", e.target.value)} disabled={saving} maxLength={100} />
            <p className="text-sm text-muted-foreground">
              描述使用邀请码的学生能获得什么好处
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 推广文案配置 */}
      <Card>
        <CardHeader>
          <CardTitle>推广文案配置</CardTitle>
          <CardDescription>设置分享邀请码时的推荐文案</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="promotionText">邀请码推荐文案</Label>
            <Textarea id="promotionText" placeholder="我正在使用错题本，效果很好！快来试试吧，使用我的邀请码：{code}" value={formData.promotionText} onChange={e => updateField("promotionText", e.target.value)} disabled={saving} rows={4} maxLength={500} />
            <p className="text-sm text-muted-foreground">
              文案中的 {"{code}"}{" "}
              会被替换成实际的邀请码。建议包含产品介绍和使用邀请码的好处。
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 保存按钮区域 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <Button onClick={handleSave} disabled={!hasChanges || saving} className="flex items-center gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {saving ? "保存中..." : "保存配置"}
            </Button>

            {hasChanges && <Button variant="outline" onClick={handleReset} disabled={saving}>
                重置
              </Button>}

            {!hasChanges && <span className="text-sm text-muted-foreground">
                已保存最新配置
              </span>}
          </div>
        </CardContent>
      </Card>
    </div>;
}
