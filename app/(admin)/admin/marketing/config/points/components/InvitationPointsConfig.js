"use client";

import { Loader2, Save } from "lucide-react";
// 邀请积分配置组件，用于配置邀请码被使用时分享者获得的积分奖励
import { useEffect, useState } from "react";
import { Alert, AlertDescription } from "../../../../../../../components/ui/alert.js";
import { Button } from "../../../../../../../components/ui/button.js";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../../../../../components/ui/card.js";
import { Input } from "../../../../../../../components/ui/input.js";
import { Label } from "../../../../../../../components/ui/label.js";
import { useToast } from "../../../../../../../hooks/use-toast.js";
import { updateInvitationPointsConfig } from "../actions.js";
export default function InvitationPointsConfig({
  config,
  onConfigChange
}) {
  const [formData, setFormData] = useState({
    pointsPerUse: 10
  });
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const {
    toast
  } = useToast();

  // 初始化表单数据
  useEffect(() => {
    const invitationConfig = config?.pointsSystem?.invitation;
    setFormData({
      pointsPerUse: invitationConfig?.pointsPerUse ?? 10
    });
    setHasChanges(false);
  }, [config]);

  // 检查是否有变化
  useEffect(() => {
    const originalConfig = config?.pointsSystem?.invitation;
    const hasChanged = formData.pointsPerUse !== (originalConfig?.pointsPerUse ?? 10);
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
    if (formData.pointsPerUse < 0) {
      toast({
        variant: "destructive",
        title: "验证失败",
        description: "每次获得的积分不能为负数"
      });
      return;
    }
    setSaving(true);
    try {
      const result = await updateInvitationPointsConfig(formData);
      if (result.success) {
        // 更新本地配置
        const updatedConfig = {
          ...config,
          pointsSystem: {
            invitation: formData,
            sharing: config?.pointsSystem?.sharing || {
              pointsPerShare: 5,
              dailyLimit: 50,
              cooldownDays: 1,
              sameWechatLimit: 100,
              shareDays: 7
            },
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
      console.error("保存邀请积分配置失败:", error);
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
    const invitationConfig = config?.pointsSystem?.invitation;
    setFormData({
      pointsPerUse: invitationConfig?.pointsPerUse ?? 10
    });
    setHasChanges(false);
  };
  return <div className="space-y-6">
      <Alert>
        <AlertDescription>
          配置邀请积分功能的相关设置。当邀请码被使用时，分享者可以获得相应的积分奖励。修改后需要点击&ldquo;保存&rdquo;按钮才能生效。
        </AlertDescription>
      </Alert>

      {/* 基础配置 */}
      <Card>
        <CardHeader>
          <CardTitle>邀请积分配置</CardTitle>
          <CardDescription>设置邀请码被使用时分享者获得的积分</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="pointsPerUse">每次使用获得积分</Label>
            <Input id="pointsPerUse" type="number" min="0" placeholder="10" value={formData.pointsPerUse} onChange={e => updateField("pointsPerUse", parseInt(e.target.value) || 0)} disabled={saving} />
            <p className="text-sm text-muted-foreground">
              当有人使用邀请码时，邀请码分享者获得的积分数量
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 使用说明 */}
      <Card>
        <CardHeader>
          <CardTitle>使用说明</CardTitle>
          <CardDescription>邀请积分的工作原理</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>• 当用户分享邀请码给其他人时，不会立即获得积分</p>
            <p>• 只有当邀请码被成功使用后，分享者才会获得积分奖励</p>
            <p>• 每个邀请码可能被多次使用，每次使用都会给分享者积分</p>
            <p>• 积分会自动添加到分享者的账户余额中</p>
            <p>• 设置为0表示不给予积分奖励</p>
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
