"use client";

import { Copy } from "lucide-react";
import { Button } from "../../../../../../components/ui/button.js";
// Bot配置卡片组件，用于配置各种AI Bot的ID信息
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../../../../components/ui/card.js";
import { Input } from "../../../../../../components/ui/input.js";
import { Label } from "../../../../../../components/ui/label.js";
export function BotConfigCard({
  title,
  description,
  configKey,
  value,
  onChange,
  onCopyKey
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
          <Label htmlFor={configKey}>Bot ID</Label>
          <Input id={configKey} placeholder="请输入Bot ID，例如：bot-24433b83" value={value} onChange={e => onChange(e.target.value)} />
        </div>
      </CardContent>
    </Card>;
}
