"use client";

import { Badge } from "../../../../../../components/ui/badge.js";
// 错因信息展示组件，用于显示错因点的基本信息、详细描述和时间信息
import { Card, CardContent, CardHeader, CardTitle } from "../../../../../../components/ui/card.js";
import { Separator } from "../../../../../../components/ui/separator.js";
import { DISPLAY_TEXT } from "../../../../../../lib/config/constants.js";
export default function MistakePointDisplay({
  data
}) {
  const formatDate = timestamp => {
    return new Date(timestamp).toLocaleString("zh-CN");
  };
  return <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {DISPLAY_TEXT.ERROR_ATTRIBUTION}信息
          <Badge variant="secondary">mistake_point</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="font-semibold text-lg mb-2">基本信息</h3>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <span className="text-muted-foreground">ID:</span>
              <p className="font-mono text-sm">{data._id}</p>
            </div>
            <div>
              <span className="text-muted-foreground">
                {DISPLAY_TEXT.ERROR_ATTRIBUTION}名称:
              </span>
              <p className="font-semibold text-lg">{data.name}</p>
            </div>
            <div>
              <span className="text-muted-foreground">科目:</span>
              <p>{data.subject}</p>
            </div>
          </div>
        </div>

        <Separator />

        <div>
          <h3 className="font-semibold text-lg mb-2">详细描述</h3>
          <div className="bg-gray-50 p-4 rounded-md">
            <p className="text-sm whitespace-pre-wrap">{data.description}</p>
          </div>
        </div>

        <Separator />

        <div>
          <h3 className="font-semibold text-lg mb-2">时间信息</h3>
          <div>
            <span className="text-muted-foreground">创建时间:</span>
            <p>{formatDate(data.created)}</p>
          </div>
        </div>
      </CardContent>
    </Card>;
}
