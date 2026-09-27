"use client";

import { Bar, BarChart, XAxis, YAxis } from "recharts";
// 学生分组对比柱状图组件，直观展示各分组的对比数据
import { Card, CardContent, CardHeader, CardTitle } from "../../../../../../../components/ui/card.js";
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from "../../../../../../../components/ui/chart.js";
export default function ComparisonChart({
  data,
  loading
}) {
  if (loading) {
    return <Card>
        <CardHeader>
          <CardTitle>分组对比图表</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2 text-gray-600">加载图表数据中...</span>
          </div>
        </CardContent>
      </Card>;
  }
  if (!data || data.length === 0) {
    return <Card>
        <CardHeader>
          <CardTitle>分组对比图表</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">暂无分组数据</div>
        </CardContent>
      </Card>;
  }

  // 按通过率从高到低排序
  const sortedData = [...data].sort((a, b) => {
    if (b.correctionRate !== a.correctionRate) {
      return b.correctionRate - a.correctionRate;
    }
    return b.correctedCount - a.correctedCount;
  });

  // 错题数量对比图表数据
  const mistakeChartData = sortedData.map(group => ({
    groupName: group.groupName,
    错题总数: group.totalMistakes,
    通过数量: group.correctedCount,
    未通过数量: group.uncorrectedCount
  }));

  // 通过率对比图表数据
  const rateChartData = sortedData.map(group => ({
    groupName: group.groupName,
    通过率: Number(group.correctionRate.toFixed(1))
  }));

  // 平均积分增量对比图表数据
  const scoreChartData = sortedData.map(group => ({
    groupName: group.groupName,
    平均积分增量: Number(group.averageScorePerStudent.toFixed(1))
  }));

  // 错题数量图表配置
  const mistakeChartConfig = {
    错题总数: {
      label: "错题总数",
      color: "#6b7280"
    },
    通过数量: {
      label: "通过数量",
      color: "#10b981"
    },
    未通过数量: {
      label: "未通过数量",
      color: "#ef4444"
    }
  };

  // 通过率图表配置
  const rateChartConfig = {
    通过率: {
      label: "通过率",
      color: "#3b82f6"
    }
  };

  // 平均积分增量图表配置
  const scoreChartConfig = {
    平均积分增量: {
      label: "平均积分增量",
      color: "#f59e0b"
    }
  };
  return <Card>
      <CardHeader>
        <CardTitle>分组对比图表</CardTitle>
        <p className="text-sm text-gray-600">
          按通过率从高到低排序，共 {data.length} 个分组
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-8">
          {/* 错题数量对比柱状图 - 水平 */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">
              错题数量对比
            </h4>
            <ChartContainer config={mistakeChartConfig} className="w-full" style={{
            height: `${Math.max(300, data.length * 60)}px`
          }}>
              <BarChart data={mistakeChartData} layout="vertical" margin={{
              top: 5,
              right: 30,
              left: 100,
              bottom: 5
            }}>
                <XAxis type="number" tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="groupName" tickLine={false} axisLine={false} width={90} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Bar dataKey="错题总数" fill="var(--color-错题总数)" radius={4} />
                <Bar dataKey="通过数量" fill="var(--color-通过数量)" radius={4} />
                <Bar dataKey="未通过数量" fill="var(--color-未通过数量)" radius={4} />
              </BarChart>
            </ChartContainer>
          </div>

          {/* 通过率对比柱状图 - 水平 */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">
              通过率对比
            </h4>
            <ChartContainer config={rateChartConfig} className="w-full" style={{
            height: `${Math.max(300, data.length * 50)}px`
          }}>
              <BarChart data={rateChartData} layout="vertical" margin={{
              top: 5,
              right: 30,
              left: 100,
              bottom: 5
            }}>
                <XAxis type="number" domain={[0, 100]} tickLine={false} axisLine={false} tickFormatter={value => `${value}%`} />
                <YAxis type="category" dataKey="groupName" tickLine={false} axisLine={false} width={90} />
                <ChartTooltip content={<ChartTooltipContent />} formatter={value => `${value}%`} />
                <ChartLegend content={<ChartLegendContent />} />
                <Bar dataKey="通过率" fill="var(--color-通过率)" radius={4} />
              </BarChart>
            </ChartContainer>
          </div>

          {/* 平均积分增量对比柱状图 - 水平 */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">
              平均积分增量对比
            </h4>
            <ChartContainer config={scoreChartConfig} className="w-full" style={{
            height: `${Math.max(300, data.length * 50)}px`
          }}>
              <BarChart data={scoreChartData} layout="vertical" margin={{
              top: 5,
              right: 30,
              left: 100,
              bottom: 5
            }}>
                <XAxis type="number" tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="groupName" tickLine={false} axisLine={false} width={90} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Bar dataKey="平均积分增量" fill="var(--color-平均积分增量)" radius={4} />
              </BarChart>
            </ChartContainer>
          </div>
        </div>
      </CardContent>
    </Card>;
}
