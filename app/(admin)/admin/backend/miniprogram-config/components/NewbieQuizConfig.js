"use client";

import { AlertCircle, Copy, Loader2, Save } from "lucide-react";
// 新生口述知识点测试配置组件，用于配置解题思路对比AI提示词模板
import { useCallback, useEffect, useState } from "react";
import { Badge } from "../../../../../../components/ui/badge.js";
import { Button } from "../../../../../../components/ui/button.js";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../../../../components/ui/card.js";
import { Label } from "../../../../../../components/ui/label.js";
import { Textarea } from "../../../../../../components/ui/textarea.js";
import { useToast } from "../../../../../../hooks/use-toast.js";
import { DISPLAY_TEXT } from "../../../../../../lib/config/constants.js";
import { getSolutionComparisonTemplateDefault, updateMiniprogramConfig } from "../actions.js";
export default function NewbieQuizConfig({
  config,
  onConfigChange
}) {
  const {
    toast
  } = useToast();
  const [resetting, setResetting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [templateValue, setTemplateValue] = useState("");

  // 初始化表单数据
  useEffect(() => {
    setTemplateValue(config.newbieQuiz?.solutionComparisonPromptTemplate || "");
    setHasChanges(false);
  }, [config]);

  // 检查是否有变化
  useEffect(() => {
    const originalValue = config.newbieQuiz?.solutionComparisonPromptTemplate || "";
    setHasChanges(templateValue !== originalValue);
  }, [templateValue, config]);

  // 处理保存
  const handleSave = useCallback(async () => {
    if (!hasChanges) {
      toast({
        title: "提示",
        description: "没有需要保存的更改"
      });
      return;
    }
    setSaving(true);
    try {
      const updatedConfig = {
        ...config,
        newbieQuiz: {
          ...config.newbieQuiz,
          solutionComparisonPromptTemplate: templateValue
        }
      };
      const result = await updateMiniprogramConfig(updatedConfig);
      if (result.success) {
        // 更新本地配置
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
      console.error(`保存新生${DISPLAY_TEXT.ORAL_KNOWLEDGE_QUIZ}配置失败:`, error);
      toast({
        variant: "destructive",
        title: "保存失败",
        description: `客户端错误: ${error instanceof Error ? error.message : String(error)}`
      });
    } finally {
      setSaving(false);
    }
  }, [hasChanges, templateValue, config, onConfigChange, toast]);

  // 重置表单
  const handleReset = useCallback(() => {
    setTemplateValue(config.newbieQuiz?.solutionComparisonPromptTemplate || "");
    setHasChanges(false);
  }, [config]);

  // 重置解题思路对比AI提示词模板
  const handleResetTemplate = useCallback(async () => {
    const confirmed = window.confirm('确定要重置"解题思路对比AI提示词模板"为默认值吗？此操作将覆盖当前内容。');
    if (!confirmed) return;
    try {
      setResetting(true);
      const defaultValue = await getSolutionComparisonTemplateDefault();

      // 更新配置
      setTemplateValue(defaultValue);
      toast({
        title: "重置成功",
        description: '已重置"解题思路对比AI提示词模板"为默认值，请点击保存配置以保存更改'
      });
    } catch {
      toast({
        variant: "destructive",
        title: "重置失败",
        description: "获取默认模板失败"
      });
    } finally {
      setResetting(false);
    }
  }, [toast]);

  // 复制参数到剪贴板
  const copyParameterToClipboard = useCallback(async parameter => {
    try {
      await navigator.clipboard.writeText(parameter);
      toast({
        title: "复制成功",
        description: `已复制参数 ${parameter} 到剪贴板`
      });
    } catch {
      toast({
        variant: "destructive",
        title: "复制失败",
        description: "无法访问剪贴板，请手动复制"
      });
    }
  }, [toast]);

  // 更新模板内容
  const handleTemplateChange = useCallback(value => {
    setTemplateValue(value);
  }, []);

  // 定义参数说明
  const templateParameters = [
  {
    name: "${parseText}",
    description: "已知的标准题目解题思路内容"
  },
  {
    name: "${studentContents}",
    description: "学生发送的解题思路描述内容"
  }];
  return <div className="space-y-6">
      <Card>
        <CardHeader className="relative">
          <CardTitle>
            新生{DISPLAY_TEXT.ORAL_KNOWLEDGE_QUIZ} - 解题思路对比AI提示词模板
          </CardTitle>
          <CardDescription>
            用于对比学生解题思路与标准解题思路是否一致的AI提示词模板。
          </CardDescription>
          <Button variant="ghost" size="sm" className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 h-auto" onClick={() => copyParameterToClipboard("solutionComparisonPromptTemplate")}>
            <Copy className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="solutionComparisonTemplate">提示词模板</Label>
            <Textarea id="solutionComparisonTemplate" placeholder="请输入解题思路对比的提示词模板..." value={templateValue} onChange={e => handleTemplateChange(e.target.value)} rows={12} className="resize-vertical font-mono text-sm" disabled={saving || resetting} />
          </div>

          {/* 参数说明 */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">可用参数</Label>
            <div className="grid grid-cols-1 gap-2">
              {templateParameters.map(param => <div key={param.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="cursor-pointer hover:bg-blue-100 transition-colors" onClick={() => copyParameterToClipboard(param.name)}>
                      {param.name}
                    </Badge>
                    <p className="text-sm text-gray-600">{param.description}</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => copyParameterToClipboard(param.name)} className="ml-2 h-auto p-1">
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>)}
            </div>
          </div>

          <div className="text-xs text-gray-500 bg-yellow-50 p-3 rounded-lg border border-yellow-200">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-yellow-800 mb-1">参数要求</p>
                <p>
                  保存时会检查所有参数是否都出现在模板中。模板必须包含所有上述参数，否则无法保存。
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-4">
            <Button onClick={handleSave} disabled={!hasChanges || saving || resetting} className="flex items-center gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {saving ? "保存中..." : "保存配置"}
            </Button>

            {hasChanges && <Button variant="outline" onClick={handleReset} disabled={saving || resetting}>
                重置
              </Button>}

            <Button variant="outline" size="sm" onClick={handleResetTemplate} disabled={resetting || saving} className="text-orange-600 hover:text-orange-700 border-orange-200 hover:bg-orange-50">
              {resetting && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
              重置为默认值
            </Button>

            {!hasChanges && <span className="text-sm text-muted-foreground">
                已保存最新配置
              </span>}
          </div>
        </CardContent>
      </Card>
    </div>;
}
