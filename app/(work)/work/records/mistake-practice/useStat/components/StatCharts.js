"use client";

// 课程错题统计图表组件，展示错题掌握情况的饼图和柱状图，包括掌握率统计
import { Bar, BarChart, Cell, Pie, PieChart, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../../../../../components/ui/card.js";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "../../../../../../../components/ui/chart.js";
import { DISPLAY_TEXT } from "../../../../../../../lib/config/constants.js";
export default function StatCharts({
  data
}) {
  // 饼图数据
  const pieData = [{
    name: "已掌握",
    value: data.correctedCount,
    fill: "#22c55e" // green-500
  }, {
    name: "未掌握",
    value: data.uncorrectedCount,
    fill: "#f97316" // orange-500
  }];

  // 柱状图数据
  const barData = [{
    category: "总题目数",
    count: data.totalQuestions,
    fill: "#3b82f6" // blue-500
  }, {
    category: "已掌握",
    count: data.correctedCount,
    fill: "#22c55e" // green-500
  }, {
    category: "未掌握",
    count: data.uncorrectedCount,
    fill: "#f97316" // orange-500
  }];
  const chartConfig = {
    corrected: {
      label: "已掌握",
      color: "hsl(var(--chart-1))"
    },
    uncorrected: {
      label: "未掌握",
      color: "hsl(var(--chart-2))"
    },
    total: {
      label: "总计",
      color: "hsl(var(--chart-3))"
    }
  };
  const correctionRate = data.totalQuestions > 0 ? (data.correctedCount / data.totalQuestions * 100).toFixed(1) : "0.0";
  return <div className="grid gap-6 md:grid-cols-2">
      {/* 饼图 - 掌握情况分布 */}
      <Card>
        <CardHeader>
          <CardTitle>错题掌握情况分布</CardTitle>
          <CardDescription>
            通过{DISPLAY_TEXT.COURSE_MISTAKE}掌握的题目比例
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="w-full max-h-[250px]">
            <PieChart>
              <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius="70%" innerRadius="30%" labelLine={false} label={({
              name,
              percent
            }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
              </Pie>
            </PieChart>
          </ChartContainer>
          <div className="mt-4 text-center">
            <div className="text-2xl font-bold text-green-600">
              {correctionRate}%
            </div>
            <div className="text-sm text-muted-foreground">错题掌握率</div>
          </div>
        </CardContent>
      </Card>

      {/* 柱状图 - 数量统计 */}
      <Card>
        <CardHeader>
          <CardTitle>错题数量统计</CardTitle>
          <CardDescription>
            {DISPLAY_TEXT.COURSE_MISTAKE}的详细数量分布
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={chartConfig} className="w-full max-h-[250px]">
            <BarChart data={barData} margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 5
          }}>
              <XAxis dataKey="category" tickLine={false} axisLine={false} className="text-xs" />
              <YAxis tickLine={false} axisLine={false} className="text-xs" />
              <ChartTooltip content={<ChartTooltipContent hideLabel />} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
          <div className="mt-4 grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-xl font-bold">{data.totalQuestions}</div>
              <div className="text-sm text-muted-foreground">总题目数</div>
            </div>
            <div>
              <div className="text-xl font-bold text-green-600">
                {data.correctedCount}
              </div>
              <div className="text-sm text-muted-foreground">已掌握</div>
            </div>
            <div>
              <div className="text-xl font-bold text-orange-600">
                {data.uncorrectedCount}
              </div>
              <div className="text-sm text-muted-foreground">未掌握</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>;
}
