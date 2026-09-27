"use client";

import { Badge } from "../../../../../../components/ui/badge.js";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../../../components/ui/card.js";

/**
 * 基本信息卡片
 * 显示JWT的基本验证信息、状态和剩余时间
 */

export function BasicInfoCard({
  jwtData,
  formatRemainingTime
}) {
  return <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle>基本信息</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="overflow-hidden">
            <span className="font-medium">Cookie名称：</span>
            <span className="font-mono text-sm break-all">
              {jwtData.cookieName}
            </span>
          </div>
          <div>
            <span className="font-medium">验证状态：</span>
            <Badge variant={jwtData.verified.valid ? "default" : "destructive"}>
              {jwtData.verified.valid ? "有效" : "无效"}
            </Badge>
          </div>
          {jwtData.verified.error && <div className="md:col-span-2 overflow-hidden">
              <span className="font-medium">错误信息：</span>
              <span className="text-red-600 break-all">
                {jwtData.verified.error}
              </span>
            </div>}
          <div>
            <span className="font-medium">需要刷新：</span>
            <Badge variant={jwtData.verified.needRefresh ? "secondary" : "outline"}>
              {jwtData.verified.needRefresh ? "是" : "否"}
            </Badge>
          </div>
          {jwtData.remainingTime !== undefined && <div>
              <span className="font-medium">剩余时间：</span>
              <span className={jwtData.remainingTime <= 0 ? "text-red-600" : "text-green-600"}>
                {formatRemainingTime(jwtData.remainingTime)}
              </span>
            </div>}
          {jwtData.decoded?.lastActiveAt && <div className="overflow-hidden">
              <span className="font-medium">最后活跃：</span>
              <span className="text-sm break-all">
                {new Date(jwtData.decoded.lastActiveAt).toLocaleString("zh-CN", {
              timeZone: "Asia/Shanghai"
            })}
              </span>
            </div>}
        </div>
      </CardContent>
    </Card>;
}
