"use client";

import { Copy } from "lucide-react";
import { Button } from "../../../../../../components/ui/button.js";
// AI解析返回格式要求配置卡片组件，用于配置站外AI文案的返回格式要求
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../../../../components/ui/card.js";
import { Label } from "../../../../../../components/ui/label.js";
import { Textarea } from "../../../../../../components/ui/textarea.js";
export function AIConfigFormatCard({
  value,
  onChange,
  onCopyKey
}) {
  return <Card>
      <CardHeader className="relative">
        <CardTitle>AI解析返回格式要求</CardTitle>
        <CardDescription>
          注意：此配置用于站外AI文案，并不用于站内AI分析时传给DeepSeek-R1的提示词，站内提示词需在&ldquo;云开发控制台&rdquo;中修改。
        </CardDescription>
        <Button variant="ghost" size="sm" className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 h-auto" onClick={() => onCopyKey("ai_response_format_requirement")}>
          <Copy className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="requirement">格式要求</Label>
          <Textarea id="requirement" placeholder="请输入AI解析返回格式的具体要求..." value={value} onChange={e => onChange(e.target.value)} rows={10} className="resize-vertical" />
        </div>
      </CardContent>
    </Card>;
}
