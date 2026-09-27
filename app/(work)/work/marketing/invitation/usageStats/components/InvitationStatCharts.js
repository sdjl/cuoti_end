"use client";

import { Bar, BarChart, XAxis, YAxis } from "recharts";
// 邀请码统计图表组件，以柱状图形式展示邀请码的创建和使用统计
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../../../../../components/ui/card.js";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "../../../../../../../components/ui/chart.js";
export default function InvitationStatCharts({
  data,
  type
}) {
  // 获取统一的数据
  const createdCodes = type === "classroom" ? data.totalCreatedCodes : data.createdCodes;
  const usedCodes = type === "classroom" ? data.totalUsedCodes : data.usedCodes;
  const usedCount = type === "classroom" ? data.totalUsedCount : data.usedCount;
  const unusedCodes = type === "classroom" ? data.totalUnusedCodes : data.unusedCodes;

  // 柱状图数据
  const barData = [{
    category: "创建邀请码",
    count: createdCodes,
    fill: "#3b82f6" // blue-500
  }, {
    category: "被使用邀请码",
    count: usedCodes,
    fill: "#22c55e" // green-500
  }, {
    category: "被使用次数",
    count: usedCount,
    fill: "#f59e0b" // amber-500
  }, {
    category: "未使用邀请码",
    count: unusedCodes,
    fill: "#6b7280" // gray-500
  }];
  const chartConfig = {
    created: {
      label: "创建邀请码",
      color: "hsl(var(--chart-1))"
    },
    used: {
      label: "被使用邀请码",
      color: "hsl(var(--chart-2))"
    },
    usedCount: {
      label: "被使用次数",
      color: "hsl(var(--chart-3))"
    },
    unused: {
      label: "未使用邀请码",
      color: "hsl(var(--chart-4))"
    }
  };
  return <div className="w-full">
      {/* 柱状图 - 详细统计，占据整行 */}
      <Card>
        <CardHeader>
          <CardTitle>邀请码使用统计</CardTitle>
          <CardDescription>
            {type === "classroom" ? "班级" : "学生"}
            邀请码创建和使用情况的各项指标
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="w-full">
            <BarChart data={barData} margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 60
          }}>
              <XAxis dataKey="category" tickLine={false} axisLine={false} className="text-xs" angle={-45} textAnchor="end" height={60} />
              <YAxis tickLine={false} axisLine={false} className="text-xs" />
              <ChartTooltip content={<ChartTooltipContent hideLabel />} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
          <div className="mt-4 grid grid-cols-4 gap-2 text-center text-sm">
            <div>
              <div className="font-bold text-blue-600">{createdCodes}</div>
              <div className="text-xs text-muted-foreground">创建邀请码</div>
            </div>
            <div>
              <div className="font-bold text-green-600">{usedCodes}</div>
              <div className="text-xs text-muted-foreground">被使用邀请码</div>
            </div>
            <div>
              <div className="font-bold text-amber-600">{usedCount}</div>
              <div className="text-xs text-muted-foreground">被使用次数</div>
            </div>
            <div>
              <div className="font-bold text-gray-600">{unusedCodes}</div>
              <div className="text-xs text-muted-foreground">未使用邀请码</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>;
}
