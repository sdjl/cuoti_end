"use client";

import { Info } from "lucide-react";
import { Card, CardContent } from "../../../../../../../components/ui/card.js";

/**
 * 重要提示卡片
 * 显示用户需要注意的重要信息，如重新登录提示等
 */

export function ImportantTips() {
  return <Card className="border-blue-200 bg-blue-50">
      <CardContent className="pt-6">
        <div className="flex items-start space-x-3">
          <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">重要提示</p>
            <p>
              修改用户信息后，需要用户重新登录才能在系统中显示最新的信息。角色权限的变更也需要重新登录后生效。
            </p>
          </div>
        </div>
      </CardContent>
    </Card>;
}
