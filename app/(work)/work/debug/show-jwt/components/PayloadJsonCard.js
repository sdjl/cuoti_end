"use client";

import { Card, CardContent, CardHeader, CardTitle } from "../../../../../../components/ui/card.js";

/**
 * 完整载荷JSON卡片
 * 以格式化的JSON形式显示JWT的完整载荷数据
 */

export function PayloadJsonCard({
  payload
}) {
  return <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle>完整载荷JSON</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <pre className="p-4 bg-gray-50 rounded text-xs max-h-[32rem] overflow-y-auto whitespace-pre-wrap break-all">
            {JSON.stringify(payload, null, 2)}
          </pre>
        </div>
      </CardContent>
    </Card>;
}
