"use client";

import { Loader2, Save } from "lucide-react";
// 个人错题积分配置组件，用于配置录入个人错题和通过错题练习获得的积分奖励
import { useEffect, useState } from "react";
import { Alert, AlertDescription } from "../../../../../../../components/ui/alert.js";
import { Button } from "../../../../../../../components/ui/button.js";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../../../../../components/ui/card.js";
import { Input } from "../../../../../../../components/ui/input.js";
import { Label } from "../../../../../../../components/ui/label.js";
import { useToast } from "../../../../../../../hooks/use-toast.js";
import { DISPLAY_TEXT } from "../../../../../../../lib/config/constants.js";
import { updatePersonalMistakePointsConfig } from "../actions.js";
export default function PersonalMistakePointsConfig({
  config,
  onConfigChange
}) {
  const [formData, setFormData] = useState({
    pointsPerUpload: 2,
    dailyLimit: 20
  });
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const {
    toast
  } = useToast();

  // 初始化表单数据
  useEffect(() => {
    const personalMistakeConfig = config?.pointsSystem?.personalMistake;
    setFormData({
      pointsPerUpload: personalMistakeConfig?.pointsPerUpload ?? 2,
      dailyLimit: personalMistakeConfig?.dailyLimit ?? 20
    });
    setHasChanges(false);
  }, [config]);

  // 检查是否有变化
  useEffect(() => {
    const originalConfig = config?.pointsSystem?.personalMistake;
    const hasChanged = formData.pointsPerUpload !== (originalConfig?.pointsPerUpload ?? 2) || formData.dailyLimit !== (originalConfig?.dailyLimit ?? 20);
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
    if (formData.pointsPerUpload < 0) {
      toast({
        variant: "destructive",
        title: "验证失败",
        description: "每次录入获得的积分不能为负数"
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
    setSaving(true);
    try {
      const result = await updatePersonalMistakePointsConfig(formData);
      if (result.success) {
        // 更新本地配置
        const updatedConfig = {
          ...config,
          pointsSystem: {
            invitation: config?.pointsSystem?.invitation || {
              pointsPerUse: 10
            },
            sharing: config?.pointsSystem?.sharing || {
              pointsPerShare: 5,
              dailyLimit: 50,
              cooldownDays: 1,
              sameWechatLimit: 100,
              shareDays: 7
            },
            personalMistake: formData,
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
      console.error(`保存${DISPLAY_TEXT.SELF_UPLOAD_MISTAKE}积分配置失败:`, error);
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
    const personalMistakeConfig = config?.pointsSystem?.personalMistake;
    setFormData({
      pointsPerUpload: personalMistakeConfig?.pointsPerUpload ?? 2,
      dailyLimit: personalMistakeConfig?.dailyLimit ?? 20
    });
    setHasChanges(false);
  };
  return <div className="space-y-6">
      <Alert>
        <AlertDescription>
          配置{DISPLAY_TEXT.SELF_UPLOAD_MISTAKE}录入积分功能的相关设置。学生录入
          {DISPLAY_TEXT.SELF_UPLOAD_MISTAKE}
          和通过错题练习时可以获得积分奖励。修改后需要点击&ldquo;保存&rdquo;按钮才能生效。
        </AlertDescription>
      </Alert>

      {/* 基础配置 */}
      <Card>
        <CardHeader>
          <CardTitle>{DISPLAY_TEXT.SELF_UPLOAD_MISTAKE}积分配置</CardTitle>
          <CardDescription>
            设置录入{DISPLAY_TEXT.SELF_UPLOAD_MISTAKE}获得的积分和限制
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="pointsPerUpload">每次录入获得积分</Label>
              <Input id="pointsPerUpload" type="number" min="0" placeholder="2" value={formData.pointsPerUpload} onChange={e => updateField("pointsPerUpload", parseInt(e.target.value) || 0)} disabled={saving} />
              <p className="text-sm text-muted-foreground">
                每次录入{DISPLAY_TEXT.SELF_UPLOAD_MISTAKE}获得的积分数量
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dailyLimit">每日积分上限</Label>
              <Input id="dailyLimit" type="number" min="0" placeholder="20" value={formData.dailyLimit} onChange={e => updateField("dailyLimit", parseInt(e.target.value) || 0)} disabled={saving} />
              <p className="text-sm text-muted-foreground">
                每日通过录入错题+错题通过获得的积分总上限
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{DISPLAY_TEXT.SELF_UPLOAD_MISTAKE}积分配置</CardTitle>
          <CardDescription>
            设置录入{DISPLAY_TEXT.SELF_UPLOAD_MISTAKE}获得的积分和限制
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>
              • 学生每次录入{DISPLAY_TEXT.SELF_UPLOAD_MISTAKE}都可以获得积分奖励
            </p>
            <p>• 学生通过错题练习（标记为已掌握）也可以获得积分</p>
            <p>• 每日积分上限是录入积分和通过积分的总和限制</p>
            <p>• 积分会自动添加到学生的账户余额中</p>
            <p>• 设置为0表示不给予积分奖励</p>
            <p>• 超过每日上限后，当天不再获得此类积分</p>
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
