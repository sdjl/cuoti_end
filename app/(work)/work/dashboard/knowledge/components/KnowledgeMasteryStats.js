"use client";

/**
 * 班级掌握情况统计组件
 *
 * 依赖的 Server Action:
 * - app/(work)/work/dashboard/knowledge/componentsServerActions/knowledgeMasteryStatsActions.ts
 */
import { TrendingUp } from "lucide-react";
import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "../../../../../../components/ui/chart.js";
const CHART_COLORS = ["hsl(221, 83%, 53%)", "hsl(142, 76%, 36%)", "hsl(48, 96%, 53%)", "hsl(0, 84%, 60%)", "hsl(262, 83%, 58%)"];
export default function KnowledgeMasteryStats({
  data,
  knowledgePointName
}) {
  const chartData = data.map((item, index) => ({
    ...item,
    fill: CHART_COLORS[index % CHART_COLORS.length]
  }));
  const chartConfig = data.reduce((config, item, index) => {
    config[item.className] = {
      label: item.className,
      color: CHART_COLORS[index % CHART_COLORS.length]
    };
    return config;
  }, {});
  return <div className="bg-white rounded-xl shadow-sm p-6 mb-6 max-w-full overflow-hidden">
      <div className="flex items-center gap-2 mb-6">
        <TrendingUp className="w-5 h-5 text-blue-600" />
        <h2 className="text-xl font-bold">班级掌握情况统计</h2>
        <span className="text-sm text-gray-500 ml-auto">
          知识点：{knowledgePointName}
        </span>
      </div>

      {/* 各班级掌握率对比柱状图 */}
      <div className="flex flex-col max-w-full">
        <h3 className="text-base font-semibold mb-4 text-center">
          各班级掌握率对比
        </h3>
        <div className="w-full overflow-x-auto">
          <div className="w-[600px]">
            <ChartContainer config={chartConfig} className="w-[600px] max-w-[600px]" style={{
            height: `${Math.max(350, data.length * 60)}px`
          }}>
              <BarChart data={chartData} layout="vertical" margin={{
              left: 20,
              right: 100,
              top: 20,
              bottom: 20
            }}>
                <CartesianGrid horizontal={false} />
                <YAxis dataKey="className" type="category" hide />
                <XAxis type="number" hide />
                <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                <Bar dataKey="masteryRate" radius={6} barSize={35}>
                  <LabelList dataKey="className" position="insideLeft" offset={12} className="fill-white font-semibold" fontSize={13} />
                  <LabelList dataKey="masteryRate" position="right" offset={12} className="fill-foreground font-bold" fontSize={15} formatter={value => `${value}%`} />
                </Bar>
              </BarChart>
            </ChartContainer>
          </div>
        </div>
      </div>

      {/* 底部详细数据表格 */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="overflow-x-auto max-w-full">
          <table className="min-w-full text-sm whitespace-nowrap">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-2 font-semibold text-gray-700 sticky left-0 bg-white z-10">
                  班级
                </th>
                <th className="text-center py-3 px-2 font-semibold text-gray-700">
                  总学生数
                </th>
                <th className="text-center py-3 px-2 font-semibold text-gray-700">
                  做过人数
                </th>
                <th className="text-center py-3 px-2 font-semibold text-gray-700">
                  未做人数
                </th>
                <th className="text-center py-3 px-2 font-semibold text-gray-700">
                  做题次数
                </th>
                <th className="text-center py-3 px-2 font-semibold text-gray-700">
                  正确次数
                </th>
                <th className="text-center py-3 px-2 font-semibold text-gray-700">
                  正确率
                </th>
                <th className="text-center py-3 px-2 font-semibold text-gray-700">
                  错误次数
                </th>
                <th className="text-center py-3 px-2 font-semibold text-gray-700">
                  错误率
                </th>
                <th className="text-center py-3 px-2 font-semibold text-gray-700">
                  掌握人数
                </th>
                <th className="text-center py-3 px-2 font-semibold text-gray-700">
                  掌握率
                </th>
              </tr>
            </thead>
            <tbody>
              {data.map((item, index) => <tr key={item.classId} className={index % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                  <td className="py-3 px-2 sticky left-0 bg-inherit z-10">
                    {item.className}
                  </td>
                  <td className="text-center py-3 px-2">
                    {item.totalStudentCount}
                  </td>
                  <td className="text-center py-3 px-2 text-blue-600">
                    {item.studiedStudentCount}
                  </td>
                  <td className="text-center py-3 px-2 text-gray-500">
                    {item.notStudiedStudentCount}
                  </td>
                  <td className="text-center py-3 px-2">
                    {item.totalAttempts}
                  </td>
                  <td className="text-center py-3 px-2 text-green-600">
                    {item.correctCount}
                  </td>
                  <td className="text-center py-3 px-2 text-green-600 font-medium">
                    {item.correctRate}%
                  </td>
                  <td className="text-center py-3 px-2 text-red-600">
                    {item.wrongCount}
                  </td>
                  <td className="text-center py-3 px-2 text-red-600 font-medium">
                    {item.wrongRate}%
                  </td>
                  <td className="text-center py-3 px-2 text-green-600 font-medium">
                    {item.masteredStudentCount}
                  </td>
                  <td className="text-center py-3 px-2 font-semibold text-blue-600">
                    {item.masteryRate}%
                  </td>
                </tr>)}
            </tbody>
          </table>
        </div>
      </div>
    </div>;
}
