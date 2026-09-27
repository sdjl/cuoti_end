"use client";

import { Copy } from "lucide-react";
import { Button } from "../../../../../../components/ui/button.js";
// 用于显示切题API返回的JSON数据，支持格式化和复制功能
import { Card, CardContent, CardHeader, CardTitle } from "../../../../../../components/ui/card.js";
import { useToast } from "../../../../../../hooks/use-toast.js";
export default function JsonDisplay({
  title,
  data,
  error,
  provider
}) {
  const {
    toast
  } = useToast();
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(data);
      toast({
        title: "已复制",
        description: "JSON数据已复制到剪贴板"
      });
    } catch {
      toast({
        title: "复制失败",
        description: "无法复制到剪贴板",
        variant: "destructive"
      });
    }
  };

  // 格式化JSON数据，根据provider决定是否处理嵌套JSON字符串
  const formatJson = jsonString => {
    try {
      const parsed = JSON.parse(jsonString);

      // 只有阿里巴巴provider才需要处理嵌套JSON字符串
      if (provider === "alibaba") {
        // 递归处理对象中的每个值
        const deepParseJson = obj => {
          if (typeof obj === "string") {
            // 尝试解析字符串是否为JSON
            try {
              const innerParsed = JSON.parse(obj);
              return deepParseJson(innerParsed); // 递归解析
            } catch {
              return obj; // 不是JSON字符串，直接返回
            }
          } else if (Array.isArray(obj)) {
            return obj.map(item => deepParseJson(item));
          } else if (obj !== null && typeof obj === "object") {
            const result = {};
            for (const [key, value] of Object.entries(obj)) {
              result[key] = deepParseJson(value);
            }
            return result;
          }
          return obj;
        };
        const fullyParsed = deepParseJson(parsed);
        return JSON.stringify(fullyParsed, null, 2);
      } else {
        // 腾讯provider或其他情况，直接格式化JSON
        return JSON.stringify(parsed, null, 2);
      }
    } catch {
      // 如果无法解析为JSON，尝试格式化为多行显示
      return jsonString.replace(/,/g, ",\n").replace(/:/g, ": ").replace(/{/g, "{\n").replace(/}/g, "\n}");
    }
  };
  return <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{title}</CardTitle>
          <Button variant="outline" size="sm" onClick={handleCopy} className="h-8">
            <Copy className="h-4 w-4 mr-1" />
            复制
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-700 font-medium">错误信息：</p>
            <p className="text-sm text-red-600">{error}</p>
          </div>}

        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">
            以下是API返回的原始数据，可用于问题调试：
          </p>
          <div className="bg-gray-900 rounded-md border overflow-hidden">
            <pre className="p-4 overflow-auto text-sm text-green-400 font-mono whitespace-pre-wrap" style={{
            height: "800px"
          }}>
              <code className="text-green-400">{formatJson(data)}</code>
            </pre>
          </div>
        </div>
      </CardContent>
    </Card>;
}
