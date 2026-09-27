"use client";

import { Loader2, Save } from "lucide-react";
// 一次性邀请码配置组件，用于配置一次性邀请码的相关参数
import { useEffect, useState } from "react";
import { Alert, AlertDescription } from "../../../../../../../components/ui/alert.js";
import { Button } from "../../../../../../../components/ui/button.js";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../../../../../components/ui/card.js";
import { Input } from "../../../../../../../components/ui/input.js";
import { Label } from "../../../../../../../components/ui/label.js";
import { Textarea } from "../../../../../../../components/ui/textarea.js";
import { useToast } from "../../../../../../../hooks/use-toast.js";
import { updateOnetimeInvitationConfig } from "../actions.js";
export default function OnetimeInvitationConfig({
  config,
  onConfigChange
}) {
  const [formData, setFormData] = useState({
    codeLength: 10,
    defaultValidDays: 90,
    defaultExperienceDays: 15,
    experienceDescription: ""
  });
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const {
    toast
  } = useToast();

  // 初始化表单数据
  useEffect(() => {
    const onetimeConfig = config.invitationCode?.onetime;
    setFormData({
      codeLength: onetimeConfig?.codeLength ?? 10,
      defaultValidDays: onetimeConfig?.defaultValidDays ?? 90,
      defaultExperienceDays: onetimeConfig?.defaultExperienceDays ?? 15,
      experienceDescription: onetimeConfig?.experienceDescription ?? ""
    });
    setHasChanges(false);
  }, [config]);

  // 检查是否有变化
  useEffect(() => {
    const originalConfig = config.invitationCode?.onetime;
    const hasChanged = formData.codeLength !== (originalConfig?.codeLength ?? 10) || formData.defaultValidDays !== (originalConfig?.defaultValidDays ?? 90) || formData.defaultExperienceDays !== (originalConfig?.defaultExperienceDays ?? 15) || formData.experienceDescription !== (originalConfig?.experienceDescription ?? "");
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
      const result = await updateOnetimeInvitationConfig(formData);
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
            partner: config.invitationCode?.partner || {
              codeLength: 8,
              defaultValidDays: 365,
              experienceDescription: "体验全部功能",
              defaultExperienceDays: 30
            },
            onetime: formData
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
      console.error("保存一次性邀请码配置失败:", error);
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
    const onetimeConfig = config.invitationCode?.onetime;
    setFormData({
      codeLength: onetimeConfig?.codeLength ?? 10,
      defaultValidDays: onetimeConfig?.defaultValidDays ?? 90,
      defaultExperienceDays: onetimeConfig?.defaultExperienceDays ?? 15,
      experienceDescription: onetimeConfig?.experienceDescription ?? ""
    });
    setHasChanges(false);
  };
  return <div className="space-y-6">
      <Alert>
        <AlertDescription>
          配置一次性邀请码功能的相关设置。一次性邀请码通常用于特殊活动或限时推广，每个邀请码只能使用一次。修改后需要点击&ldquo;保存&rdquo;按钮才能生效。
        </AlertDescription>
      </Alert>

      {/* 基础配置 */}
      <Card>
        <CardHeader>
          <CardTitle>基础配置</CardTitle>
          <CardDescription>设置一次性邀请码的基本参数</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="codeLength">邀请码长度</Label>
              <Input id="codeLength" type="number" min="5" placeholder="10" value={formData.codeLength} onChange={e => updateField("codeLength", parseInt(e.target.value) || 10)} disabled={saving} />
              <p className="text-sm text-muted-foreground">
                一次性邀请码字符数，最少5位，建议10位以上确保唯一性
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="defaultValidDays">默认有效期（天）</Label>
              <Input id="defaultValidDays" type="number" min="1" placeholder="90" value={formData.defaultValidDays} onChange={e => updateField("defaultValidDays", parseInt(e.target.value) || 90)} disabled={saving} />
              <p className="text-sm text-muted-foreground">
                新生成一次性邀请码的默认有效天数
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="defaultExperienceDays">默认产品体验天数</Label>
              <Input id="defaultExperienceDays" type="number" min="1" placeholder="15" value={formData.defaultExperienceDays} onChange={e => updateField("defaultExperienceDays", parseInt(e.target.value) || 15)} disabled={saving} />
              <p className="text-sm text-muted-foreground">
                使用一次性邀请码后的默认体验天数
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 体验功能描述 */}
      <Card>
        <CardHeader>
          <CardTitle>体验功能描述</CardTitle>
          <CardDescription>设置一次性邀请码提供的体验内容说明</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="experienceDescription">体验功能描述</Label>
            <Textarea id="experienceDescription" placeholder="一次性体验码，可体验错题分析、学习诊断等核心功能" value={formData.experienceDescription} onChange={e => updateField("experienceDescription", e.target.value)} disabled={saving} rows={4} maxLength={500} />
            <p className="text-sm text-muted-foreground">
              详细描述使用一次性邀请码可以体验的功能和服务内容
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 使用说明 */}
      <Card>
        <CardHeader>
          <CardTitle>使用说明</CardTitle>
          <CardDescription>一次性邀请码的特点和使用规则</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>• 每个一次性邀请码只能被使用一次</p>
            <p>• 使用后邀请码立即失效</p>
            <p>• 适用于特殊活动、限时推广等场景</p>
            <p>• 可以设置不同的体验天数和功能范围</p>
            <p>• 建议设置较长的邀请码以确保唯一性</p>
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
