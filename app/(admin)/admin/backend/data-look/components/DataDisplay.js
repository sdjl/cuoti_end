"use client";

import { Badge } from "../../../../../../components/ui/badge.js";
// 通用数据展示组件，用于以格式化的方式展示任意类型的数据（对象、数组、基本类型等）
import { Card, CardContent, CardHeader, CardTitle } from "../../../../../../components/ui/card.js";
export default function DataDisplay({
  title,
  data,
  dataType
}) {
  if (!data) {
    return <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {title}
            <Badge variant="secondary">{dataType}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">未找到数据</p>
        </CardContent>
      </Card>;
  }
  const formatValue = value => {
    if (value === null) return <span className="text-muted-foreground">null</span>;
    if (value === undefined) return <span className="text-muted-foreground">undefined</span>;
    if (typeof value === "string") return <span className="text-green-600">&quot;{value}&quot;</span>;
    if (typeof value === "number") return <span className="text-blue-600">{value}</span>;
    if (typeof value === "boolean") return <span className="text-purple-600">{value.toString()}</span>;
    if (Array.isArray(value)) {
      return <div className="ml-4">
          <span className="text-gray-500">[</span>
          {value.length === 0 ? <span className="text-muted-foreground ml-2">空数组</span> : value.map((item, index) => <div key={index} className="ml-4">
                <span className="text-gray-400">{index}:</span>{" "}
                {formatValue(item)}
                {index < value.length - 1 && <span className="text-gray-500">,</span>}
              </div>)}
          <span className="text-gray-500">]</span>
        </div>;
    }
    if (typeof value === "object") {
      const obj = value;
      const entries = Object.entries(obj);
      return <div className="ml-4">
          <span className="text-gray-500">{"{"}</span>
          {entries.length === 0 ? <span className="text-muted-foreground ml-2">空对象</span> : entries.map(([key, val], index) => <div key={key} className="ml-4">
                <span className="text-orange-600">&quot;{key}&quot;</span>
                <span className="text-gray-500">: </span>
                {formatValue(val)}
                {index < entries.length - 1 && <span className="text-gray-500">,</span>}
              </div>)}
          <span className="text-gray-500">{"}"}</span>
        </div>;
    }
    return String(value);
  };
  return <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {title}
          <Badge variant="secondary">{dataType}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="bg-gray-50 p-4 rounded-md font-mono text-sm overflow-auto max-h-96">
          {formatValue(data)}
        </div>
      </CardContent>
    </Card>;
}
