"use client";

import { Loader2, Save } from "lucide-react";
// 分享积分配置组件，用于配置分享内容后查看者点击帮助分享者获得积分奖励的相关设置
import { useEffect, useState } from "react";
import { Alert, AlertDescription } from "../../../../../../../components/ui/alert.js";
import { Button } from "../../../../../../../components/ui/button.js";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../../../../../components/ui/card.js";
import { Input } from "../../../../../../../components/ui/input.js";
import { Label } from "../../../../../../../components/ui/label.js";
import { useToast } from "../../../../../../../hooks/use-toast.js";
import { updateSharingPointsConfig } from "../actions.js";
export default function SharingPointsConfig({
  config,
  onConfigChange
}) {
  const [formData, setFormData] = useState({
    pointsPerShare: 5,
    dailyLimit: 50,
    cooldownDays: 1,
    sameWechatLimit: 100,
    shareDays: 7
  });
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const {
    toast
  } = useToast();

  // 初始化表单数据
  useEffect(() => {
    const sharingConfig = config?.pointsSystem?.sharing;
    setFormData({
      pointsPerShare: sharingConfig?.pointsPerShare ?? 5,
      dailyLimit: sharingConfig?.dailyLimit ?? 50,
      cooldownDays: sharingConfig?.cooldownDays ?? 1,
      sameWechatLimit: sharingConfig?.sameWechatLimit ?? 100,
      shareDays: sharingConfig?.shareDays ?? 7
    });
    setHasChanges(false);
  }, [config]);

  // 检查是否有变化
  useEffect(() => {
    const originalConfig = config?.pointsSystem?.sharing;
    const hasChanged = formData.pointsPerShare !== (originalConfig?.pointsPerShare ?? 5) || formData.dailyLimit !== (originalConfig?.dailyLimit ?? 50) || formData.cooldownDays !== (originalConfig?.cooldownDays ?? 1) || formData.sameWechatLimit !== (originalConfig?.sameWechatLimit ?? 100) || formData.shareDays !== (originalConfig?.shareDays ?? 7);
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
    if (formData.pointsPerShare < 0) {
      toast({
        variant: "destructive",
        title: "验证失败",
        description: "每次分享获得的积分不能为负数"
      });
      return;
    }
    if (formData.dailyLimit < 0) {
      toast({
        variant: "destructive",
        title: "验证失败",
        description: "每日积分上限不能为负数"
      });
      return;
    }
    if (formData.cooldownDays < 0) {
      toast({
        variant: "destructive",
        title: "验证失败",
        description: "间隔天数不能为负数"
      });
      return;
    }
    if (formData.shareDays < 1) {
      toast({
        variant: "destructive",
        title: "验证失败",
        description: "分享有效天数不能小于1天"
      });
      return;
    }
    setSaving(true);
    try {
      const result = await updateSharingPointsConfig(formData);
      if (result.success) {
        // 更新本地配置
        const updatedConfig = {
          ...config,
          pointsSystem: {
            invitation: config?.pointsSystem?.invitation || {
              pointsPerUse: 10
            },
            sharing: formData,
            personalMistake: config?.pointsSystem?.personalMistake || {
              pointsPerUpload: 2,
              dailyLimit: 20
            },
            lottery: config?.pointsSystem?.lottery || {
              enabled: false,
              pointsPerDraw: 10,
              prizes: []
            },
            exchange: config?.pointsSystem?.exchange || {
              enabled: false,
              items: []
            },
            honor: config?.pointsSystem?.honor || {
              enabled: false,
              honors: []
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
      console.error("保存分享积分配置失败:", error);
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
    const sharingConfig = config?.pointsSystem?.sharing;
    setFormData({
      pointsPerShare: sharingConfig?.pointsPerShare ?? 5,
      dailyLimit: sharingConfig?.dailyLimit ?? 50,
      cooldownDays: sharingConfig?.cooldownDays ?? 1,
      sameWechatLimit: sharingConfig?.sameWechatLimit ?? 100,
      shareDays: sharingConfig?.shareDays ?? 7
    });
    setHasChanges(false);
  };
  return <div className="space-y-6">
      <Alert>
        <AlertDescription>
          配置分享积分功能的相关设置。用户分享内容后，查看者点击可以帮助分享者获得积分奖励。修改后需要点击&ldquo;保存&rdquo;按钮才能生效。
        </AlertDescription>
      </Alert>

      {/* 基础积分配置 */}
      <Card>
        <CardHeader>
          <CardTitle>基础积分配置</CardTitle>
          <CardDescription>设置每次分享获得的积分和限制</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="pointsPerShare">每次分享获得积分</Label>
              <Input id="pointsPerShare" type="number" min="0" placeholder="5" value={formData.pointsPerShare} onChange={e => updateField("pointsPerShare", parseInt(e.target.value) || 0)} disabled={saving} />
              <p className="text-sm text-muted-foreground">
                每次成功分享获得的积分数量
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dailyLimit">分享者每天积分上限</Label>
              <Input id="dailyLimit" type="number" min="0" placeholder="50" value={formData.dailyLimit} onChange={e => updateField("dailyLimit", parseInt(e.target.value) || 0)} disabled={saving} />
              <p className="text-sm text-muted-foreground">
                分享者每天能获得的积分上限
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 限制配置 */}
      <Card>
        <CardHeader>
          <CardTitle>限制配置</CardTitle>
          <CardDescription>设置积分获取的时间和数量限制</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cooldownDays">间隔天数</Label>
              <Input id="cooldownDays" type="number" min="0" placeholder="1" value={formData.cooldownDays} onChange={e => updateField("cooldownDays", parseInt(e.target.value) || 0)} disabled={saving} />
              <p className="text-sm text-muted-foreground">
                查看者帮助获得积分后，需要等待多少天才能再次帮助任何人获得积分
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sameWechatLimit">同微信积分上限</Label>
              <Input id="sameWechatLimit" type="number" min="0" placeholder="100" value={formData.sameWechatLimit} onChange={e => updateField("sameWechatLimit", parseInt(e.target.value) || 0)} disabled={saving} />
              <p className="text-sm text-muted-foreground">
                同一个学生账户在同一个微信上能获得的积分上限（所有时间累计）
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="shareDays">分享有效天数</Label>
              <Input id="shareDays" type="number" min="1" placeholder="7" value={formData.shareDays} onChange={e => updateField("shareDays", parseInt(e.target.value) || 1)} disabled={saving} />
              <p className="text-sm text-muted-foreground">
                分享后多少天内点击才能获得积分
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 使用说明 */}
      <Card>
        <CardHeader>
          <CardTitle>使用说明</CardTitle>
          <CardDescription>分享积分的工作原理</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>• 用户分享内容时，分享链接中会包含分享时间信息</p>
            <p>• 查看者点击分享链接后，系统会检查是否在有效期内</p>
            <p>• 如果查看者在冷却期内已帮助别人获得积分，则不能再帮助任何人</p>
            <p>• 同一微信号对同一学生的积分贡献有上限</p>
            <p>• 分享者每天获得的积分总数有上限</p>
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
