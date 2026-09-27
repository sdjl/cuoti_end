"use client";

import { Loader2, Save } from "lucide-react";
// 合作伙伴邀请码配置组件，用于配置合作伙伴邀请码的相关参数
import { useEffect, useState } from "react";
import { Alert, AlertDescription } from "../../../../../../../components/ui/alert.js";
import { Button } from "../../../../../../../components/ui/button.js";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../../../../../components/ui/card.js";
import { Input } from "../../../../../../../components/ui/input.js";
import { Label } from "../../../../../../../components/ui/label.js";
import { Textarea } from "../../../../../../../components/ui/textarea.js";
import { useToast } from "../../../../../../../hooks/use-toast.js";
import { updatePartnerInvitationConfig } from "../actions.js";
export default function PartnerInvitationConfig({
  config,
  onConfigChange
}) {
  const [formData, setFormData] = useState({
    codeLength: 8,
    defaultValidDays: 365,
    experienceDescription: "",
    defaultExperienceDays: 30
  });
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const {
    toast
  } = useToast();

  // 初始化表单数据
  useEffect(() => {
    const partnerConfig = config.invitationCode?.partner;
    setFormData({
      codeLength: partnerConfig?.codeLength ?? 8,
      defaultValidDays: partnerConfig?.defaultValidDays ?? 365,
      experienceDescription: partnerConfig?.experienceDescription ?? "",
      defaultExperienceDays: partnerConfig?.defaultExperienceDays ?? 30
    });
    setHasChanges(false);
  }, [config]);

  // 检查是否有变化
  useEffect(() => {
    const originalConfig = config.invitationCode?.partner;
    const hasChanged = formData.codeLength !== (originalConfig?.codeLength ?? 8) || formData.defaultValidDays !== (originalConfig?.defaultValidDays ?? 365) || formData.experienceDescription !== (originalConfig?.experienceDescription ?? "") || formData.defaultExperienceDays !== (originalConfig?.defaultExperienceDays ?? 30);
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
    if (formData.defaultExperienceDays < 1) {
      toast({
        variant: "destructive",
        title: "验证失败",
        description: "默认体验天数不能小于1天"
      });
      return;
    }
    setSaving(true);
    try {
      const result = await updatePartnerInvitationConfig(formData);
      if (result.success) {
        // 更新本地配置
        const updatedConfig = {
          ...config,
          invitationCode: {
            student: config.invitationCode?.student || {
              enabled: false,
              codeLength: 6,
              defaultValidDays: 30,
              inviterBenefit: "分享获得积分奖励",
              inviteeBenefit: "使用邀请码可获得额外体验时长",
              promotionText: "我正在使用错题本，效果很好！快来试试吧，使用我的邀请码：{code}",
              experienceDays: 7
            },
            partner: formData,
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
      console.error("保存合作伙伴邀请码配置失败:", error);
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
    const partnerConfig = config.invitationCode?.partner;
    setFormData({
      codeLength: partnerConfig?.codeLength ?? 8,
      defaultValidDays: partnerConfig?.defaultValidDays ?? 365,
      experienceDescription: partnerConfig?.experienceDescription ?? "",
      defaultExperienceDays: partnerConfig?.defaultExperienceDays ?? 30
    });
    setHasChanges(false);
  };
  return <div className="space-y-6">
      <Alert>
        <AlertDescription>
          配置合作伙伴邀请码功能的相关设置。合作伙伴可以获得专用的邀请码，为其客户提供体验服务。修改后需要点击&ldquo;保存&rdquo;按钮才能生效。
        </AlertDescription>
      </Alert>

      {/* 基础配置 */}
      <Card>
        <CardHeader>
          <CardTitle>基础配置</CardTitle>
          <CardDescription>设置合作伙伴邀请码的基本参数</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="codeLength">邀请码长度</Label>
              <Input id="codeLength" type="number" min="5" placeholder="8" value={formData.codeLength} onChange={e => updateField("codeLength", parseInt(e.target.value) || 8)} disabled={saving} />
              <p className="text-sm text-muted-foreground">
                邀请码字符数，最少5位
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="defaultValidDays">默认有效期（天）</Label>
              <Input id="defaultValidDays" type="number" min="1" placeholder="365" value={formData.defaultValidDays} onChange={e => updateField("defaultValidDays", parseInt(e.target.value) || 365)} disabled={saving} />
              <p className="text-sm text-muted-foreground">
                新生成邀请码的默认有效天数
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="defaultExperienceDays">默认体验天数</Label>
              <Input id="defaultExperienceDays" type="number" min="1" placeholder="30" value={formData.defaultExperienceDays} onChange={e => updateField("defaultExperienceDays", parseInt(e.target.value) || 30)} disabled={saving} />
              <p className="text-sm text-muted-foreground">
                使用邀请码后的体验天数
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 体验功能描述 */}
      <Card>
        <CardHeader>
          <CardTitle>体验功能描述</CardTitle>
          <CardDescription>
            设置合作伙伴邀请码提供的体验内容说明
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="experienceDescription">体验功能描述</Label>
            <Textarea id="experienceDescription" placeholder="体验全部功能，包括错题分析、学习报告、AI辅导等" value={formData.experienceDescription} onChange={e => updateField("experienceDescription", e.target.value)} disabled={saving} rows={4} maxLength={500} />
            <p className="text-sm text-muted-foreground">
              详细描述使用合作伙伴邀请码可以体验的功能和服务内容
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
