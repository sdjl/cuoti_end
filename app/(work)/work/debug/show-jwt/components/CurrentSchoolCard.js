"use client";

import { Badge } from "../../../../../../components/ui/badge.js";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../../../components/ui/card.js";

/**
 * 当前校园信息卡片
 * 显示用户当前选择的校园详细信息
 */

export function CurrentSchoolCard({
  school,
  isPrincipal,
  formatTime
}) {
  return <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle>当前校园</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="overflow-hidden">
            <span className="font-medium">学校ID：</span>
            <span className="font-mono text-xs break-all">{school._id}</span>
          </div>
          <div className="overflow-hidden">
            <span className="font-medium">学校名称：</span>
            <span className="break-all">{school.name}</span>
          </div>
          <div className="overflow-hidden">
            <span className="font-medium">学校区域：</span>
            <span className="break-all">{school.region}</span>
          </div>
          <div>
            <span className="font-medium">学校状态：</span>
            <Badge variant={school.status === "正常" ? "default" : "secondary"}>
              {school.status}
            </Badge>
          </div>
          {school.address && <div className="md:col-span-2 overflow-hidden">
              <span className="font-medium">学校地址：</span>
              <span className="break-all">{school.address}</span>
            </div>}
          {school.phone && <div className="overflow-hidden">
              <span className="font-medium">联系电话：</span>
              <span className="break-all">{school.phone}</span>
            </div>}
          {school.description && <div className="md:col-span-2 overflow-hidden">
              <span className="font-medium">学校描述：</span>
              <span className="break-all">{school.description}</span>
            </div>}
          <div className="overflow-hidden">
            <span className="font-medium">创建时间：</span>
            <span className="text-xs break-all">
              {formatTime(school.created)}
            </span>
          </div>
          <div className="overflow-hidden">
            <span className="font-medium">更新时间：</span>
            <span className="text-xs break-all">
              {formatTime(school.updated)}
            </span>
          </div>
          <div>
            <span className="font-medium">当前身份：</span>
            <Badge variant={isPrincipal === true ? "default" : "secondary"}>
              {isPrincipal === true ? "校长" : "老师"}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>;
}
