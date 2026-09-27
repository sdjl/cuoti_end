"use client";

import { Copy, RefreshCw } from "lucide-react";
import { Button } from "../../../../../../components/ui/button.js";

/**
 * JWT调试页面头部
 * 显示标题和操作按钮（刷新、复制）
 */

export function JWTHeader({
  onRefresh,
  onCopyData
}) {
  return <header className="bg-white p-4 shadow-sm">
      <div className="container mx-auto">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-primary">JWT调试信息</h1>
          <div className="flex gap-2">
            <Button onClick={onRefresh} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              刷新
            </Button>
            <Button onClick={onCopyData} size="sm">
              <Copy className="h-4 w-4 mr-2" />
              复制调试数据
            </Button>
          </div>
        </div>
      </div>
    </header>;
}
