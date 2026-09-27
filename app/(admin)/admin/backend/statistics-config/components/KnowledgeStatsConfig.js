"use client";

import { RotateCcw, Save } from "lucide-react";
// 知识点统计配置组件，用于配置知识点掌握程度的判定阈值（完全掌握阈值和部分掌握阈值）
import { useState } from "react";
import { Button } from "../../../../../../components/ui/button.js";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../../../../components/ui/card.js";
import { Input } from "../../../../../../components/ui/input.js";
import { Label } from "../../../../../../components/ui/label.js";
import { useToast } from "../../../../../../hooks/use-toast.js";
import { updateKnowledgeStatsConfig } from "../actions.js";
export default function KnowledgeStatsConfigComponent({
  config: initialConfig,
  onConfigChange
}) {
  const [config, setConfig] = useState(initialConfig);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEdited, setIsEdited] = useState(false);
  const {
    toast
  } = useToast();

  // 更新配置字段
  const updateConfigField = (field, value) => {
    const newConfig = {
      ...config,
      [field]: value
    };
    setConfig(newConfig);
    setIsEdited(true);
  };

  // 重置配置
  const resetConfig = () => {
    setConfig(initialConfig);
    setIsEdited(false);
  };

  // 保存配置
  const saveConfig = async () => {
    // 验证数据
    if (config.masteryThreshold <= 0 || config.masteryThreshold > 100 || config.partialMasteryThreshold <= 0 || config.partialMasteryThreshold > 100) {
      toast({
        title: "验证失败",
        description: "阈值必须在1-100之间",
        variant: "destructive"
      });
      return;
    }
    if (config.partialMasteryThreshold >= config.masteryThreshold) {
      toast({
        title: "验证失败",
        description: "部分掌握阈值必须小于完全掌握阈值",
        variant: "destructive"
      });
      return;
    }
    setIsSubmitting(true);
    try {
      const result = await updateKnowledgeStatsConfig(config);
      if (result.success) {
        toast({
          title: "保存成功",
          description: "知识点统计配置已更新"
        });
        setIsEdited(false);
        onConfigChange(config);
      } else {
        toast({
          title: "保存失败",
          description: result.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "保存失败",
        description: `发生错误: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  return <Card>
      <CardHeader>
        <CardTitle>知识点掌握程度判定标准</CardTitle>
        <CardDescription>
          设置知识点掌握程度的判定阈值，这些参数将用于生成学生的学习报告和统计分析。
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="masteryThreshold">完全掌握阈值 (%)</Label>
            <Input id="masteryThreshold" type="number" min="1" max="100" value={config.masteryThreshold} onChange={e => updateConfigField("masteryThreshold", parseInt(e.target.value) || 0)} placeholder="例如：90" />
            <p className="text-sm text-muted-foreground">
              答题正确率超过此百分比的知识点将被视为完全掌握
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="partialMasteryThreshold">部分掌握阈值 (%)</Label>
            <Input id="partialMasteryThreshold" type="number" min="1" max="100" value={config.partialMasteryThreshold} onChange={e => updateConfigField("partialMasteryThreshold", parseInt(e.target.value) || 0)} placeholder="例如：70" />
            <p className="text-sm text-muted-foreground">
              答题正确率超过此百分比但低于完全掌握阈值的知识点将被视为部分掌握
            </p>
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium mb-2">当前配置预览：</h4>
          <div className="space-y-1 text-sm">
            <p>
              • 正确率 ≥ {config.masteryThreshold}%：
              <span className="text-green-600 font-medium">完全掌握</span>
            </p>
            <p>
              • 正确率 {config.partialMasteryThreshold}% -{" "}
              {config.masteryThreshold - 1}%：
              <span className="text-yellow-600 font-medium">部分掌握</span>
            </p>
            <p>
              • 正确率 &lt; {config.partialMasteryThreshold}%：
              <span className="text-red-600 font-medium">未掌握</span>
            </p>
          </div>
        </div>

        <div className="flex justify-end space-x-2">
          {isEdited && <Button variant="outline" onClick={resetConfig}>
              <RotateCcw className="mr-1 h-4 w-4" /> 重置
            </Button>}
          <Button onClick={saveConfig} disabled={isSubmitting || !isEdited}>
            <Save className="mr-1 h-4 w-4" />
            {isSubmitting ? "保存中..." : "保存配置"}
          </Button>
        </div>
      </CardContent>
    </Card>;
}
