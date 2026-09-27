"use client";

import { AlertCircle, Copy, Loader2 } from "lucide-react";
import { Button } from "../../../../../../components/ui/button.js";
// 提示词模板配置卡片组件，用于配置各种AI分析场景的提示词模板
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../../../../components/ui/card.js";
import { Label } from "../../../../../../components/ui/label.js";
import { Textarea } from "../../../../../../components/ui/textarea.js";
import { ParameterItem } from "./ParameterItem.js";
export function PromptTemplateCard({
  title,
  description,
  configKey,
  value,
  onChange,
  onCopyKey,
  onCopyParameter,
  onResetTemplate,
  templateType,
  parameters,
  showFormatWarning = false,
  resetting,
  saving
}) {
  return <Card>
      <CardHeader className="relative">
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
        <Button variant="ghost" size="sm" className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 h-auto" onClick={() => onCopyKey(configKey)}>
          <Copy className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor={configKey}>提示词模板</Label>
          <Textarea id={configKey} placeholder={`请输入${title}的提示词模板...`} value={value} onChange={e => onChange(e.target.value)} rows={showFormatWarning ? 15 : 12} className="resize-vertical font-mono text-sm" />
        </div>

        {/* 参数说明 */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">可用参数</Label>
          <div className="grid grid-cols-1 gap-2">
            {parameters.map(param => <ParameterItem key={param.name} parameter={param} onCopy={onCopyParameter} />)}
          </div>
        </div>

        <div className="text-xs text-gray-500 bg-yellow-50 p-3 rounded-lg border border-yellow-200">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-yellow-800 mb-1">
                {showFormatWarning ? "格式要求" : "参数要求"}
              </p>
              <p>
                {showFormatWarning ? '此模板的返回格式部分不能修改，AI必须严格按照"解答思路点评："和"模仿老师评语："的格式返回结果。' : "保存时会检查所有参数是否都出现在模板中。模板必须包含所有上述参数，否则无法保存。"}
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={() => onResetTemplate(templateType, configKey)} disabled={resetting || saving} className="text-orange-600 hover:text-orange-700 border-orange-200 hover:bg-orange-50">
            {resetting && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
            重置为默认值
          </Button>
        </div>
      </CardContent>
    </Card>;
}
