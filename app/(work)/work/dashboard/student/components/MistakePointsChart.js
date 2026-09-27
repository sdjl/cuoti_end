"use client";

/**
 * 错误归因统计图表组件
 *
 * 使用 Server Actions: app/(work)/work/dashboard/student/componentsServerActions/mistakePointsActions.ts
 *
 * 功能：
 * - 显示学生某个科目的错误归因统计数据
 * - 使用饼图展示错误归因分布占比
 * - 使用柱状图展示错误归因次数统计
 * - 底部表格显示详细数据（名称、次数、占比）
 *
 * 数据结构：
 * - name: 错误归因名称
 * - count: 出现次数
 * - percentage: 占比百分比
 */
import { TrendingUp } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Pie, PieChart, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from "../../../../../../components/ui/chart.js";
const CHART_COLORS = ["hsl(221, 83%, 53%)",
// blue
"hsl(142, 76%, 36%)",
// green
"hsl(48, 96%, 53%)",
// yellow
"hsl(0, 84%, 60%)",
// red
"hsl(262, 83%, 58%)",
// purple
"hsl(199, 89%, 48%)",
// cyan
"hsl(24, 95%, 53%)",
// orange
"hsl(320, 65%, 52%)" // pink
];
export default function MistakePointsChart({
  data
}) {
  const total = data.reduce((sum, item) => sum + item.count, 0);

  // 为图表数据添加颜色配置
  const chartData = data.map((item, index) => ({
    ...item,
    fill: CHART_COLORS[index % CHART_COLORS.length]
  }));

  // 构建图表配置
  const chartConfig = data.reduce((config, item, index) => {
    config[item.name] = {
      label: item.name,
      color: CHART_COLORS[index % CHART_COLORS.length]
    };
    return config;
  }, {});
  return <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
      <div className="flex items-center gap-2 mb-6">
        <TrendingUp className="w-5 h-5 text-blue-600" />
        <h2 className="text-xl font-bold">错误归因统计</h2>
        <span className="text-sm text-gray-500 ml-auto">
          总计 {total} 次错误
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 左侧：饼图 */}
        <div className="flex flex-col">
          <h3 className="text-base font-semibold mb-4 text-center">
            错误归因分布占比
          </h3>
          <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[350px] w-full">
            <PieChart width={350} height={350}>
              <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
              <Pie data={chartData} dataKey="count" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={100} strokeWidth={2} label />
              <ChartLegend content={<ChartLegendContent nameKey="name" />} className="-translate-y-2 flex-wrap gap-2 [&>*]:basis-1/4 [&>*]:justify-center" />
            </PieChart>
          </ChartContainer>
        </div>

        {/* 右侧：柱状图 */}
        <div className="flex flex-col">
          <h3 className="text-base font-semibold mb-4 text-center">
            错误归因次数统计
          </h3>
          <ChartContainer config={chartConfig} className="w-full" style={{
          height: `${Math.max(350, data.length * 60)}px`
        }}>
            <BarChart data={chartData} layout="vertical" margin={{
            left: 20,
            right: 80,
            top: 20,
            bottom: 20
          }}>
              <CartesianGrid horizontal={false} />
              <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} width={100} style={{
              fontSize: "13px",
              fontWeight: 500
            }} />
              <XAxis type="number" tickLine={false} axisLine={false} tickMargin={8} />
              <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
              <Bar dataKey="count" radius={6} barSize={35} />
            </BarChart>
          </ChartContainer>
        </div>
      </div>

      {/* 底部详细数据表格 */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {data.map((item, index) => <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-3 h-3 rounded-full flex-shrink-0" style={{
            backgroundColor: CHART_COLORS[index % CHART_COLORS.length]
          }} />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate">{item.name}</div>
                <div className="text-xs text-gray-600">
                  {item.count}次 · {item.percentage}%
                </div>
              </div>
            </div>)}
        </div>
      </div>
    </div>;
}
