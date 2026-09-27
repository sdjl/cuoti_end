"use client";

import { Bar, BarChart, XAxis, YAxis } from "recharts";
// 分享统计图表组件，用于以图表形式展示分享统计数据
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../../../../../components/ui/card.js";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "../../../../../../../components/ui/chart.js";
export default function ShareStatCharts({
  data,
  type
}) {
  // 获取统一的数据
  const shareCount = type === "classroom" ? data.totalShareCount : data.shareCount;
  const clickCount = type === "classroom" ? data.totalClickCount : data.clickCount;
  const scoreAmount = type === "classroom" ? data.totalScoreAmount : data.scoreAmount;

  // 柱状图数据 - 删除分享类型分布，只保留详细统计数据
  const barData = [{
    category: "分享次数",
    count: shareCount,
    fill: "#3b82f6" // blue-500
  }, {
    category: "点击次数",
    count: clickCount,
    fill: "#f59e0b" // amber-500
  }, {
    category: "获得积分",
    count: scoreAmount,
    fill: "#22c55e" // green-500
  }, {
    category: "分享给非学生",
    count: data.shareToNonStudentCount,
    fill: "#f97316" // orange-500
  }, {
    category: "分享给学生",
    count: data.shareToStudentCount,
    fill: "#8b5cf6" // violet-500
  }, {
    category: "独立查看者",
    count: data.uniqueViewersCount,
    fill: "#6366f1" // indigo-500
  }];
  const chartConfig = {
    share: {
      label: "分享次数",
      color: "hsl(var(--chart-1))"
    },
    click: {
      label: "点击次数",
      color: "hsl(var(--chart-2))"
    },
    total: {
      label: "总计",
      color: "hsl(var(--chart-3))"
    }
  };
  return <div className="w-full">
      {/* 柱状图 - 详细统计，占据整行 */}
      <Card>
        <CardHeader>
          <CardTitle>详细统计数据</CardTitle>
          <CardDescription>
            {type === "classroom" ? "班级" : "学生"}
            分享活动的各项指标，分享次数按(学生ID+分享时间)去重计算
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
          <div className="mt-4 grid grid-cols-6 gap-2 text-center text-sm">
            <div>
              <div className="font-bold text-blue-600">{shareCount}</div>
              <div className="text-xs text-muted-foreground">分享次数</div>
            </div>
            <div>
              <div className="font-bold text-amber-600">{clickCount}</div>
              <div className="text-xs text-muted-foreground">点击次数</div>
            </div>
            <div>
              <div className="font-bold text-green-600">{scoreAmount}</div>
              <div className="text-xs text-muted-foreground">获得积分</div>
            </div>
            <div>
              <div className="font-bold text-orange-600">
                {data.shareToNonStudentCount}
              </div>
              <div className="text-xs text-muted-foreground">分享给非学生</div>
            </div>
            <div>
              <div className="font-bold text-violet-600">
                {data.shareToStudentCount}
              </div>
              <div className="text-xs text-muted-foreground">分享给学生</div>
            </div>
            <div>
              <div className="font-bold text-indigo-600">
                {data.uniqueViewersCount}
              </div>
              <div className="text-xs text-muted-foreground">独立查看者</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>;
}
