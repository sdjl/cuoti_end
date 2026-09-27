"use client";

import { Copy } from "lucide-react";
// 参数项组件，用于显示和复制提示词模板中的可用参数
import { Badge } from "../../../../../../components/ui/badge.js";
import { Button } from "../../../../../../components/ui/button.js";
export function ParameterItem({
  parameter,
  onCopy
}) {
  return <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
      <div className="flex items-center gap-2">
        <Badge variant="secondary" className="cursor-pointer hover:bg-blue-100 transition-colors" onClick={() => onCopy(parameter.name)}>
          {parameter.name}
        </Badge>
        <p className="text-sm text-gray-600">{parameter.description}</p>
      </div>
      <Button variant="ghost" size="sm" onClick={() => onCopy(parameter.name)} className="ml-2 h-auto p-1">
        <Copy className="h-3 w-3" />
      </Button>
    </div>;
}
