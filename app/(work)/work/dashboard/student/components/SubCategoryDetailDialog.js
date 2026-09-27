"use client";

/**
 * 子分类详情对话框组件
 *
 * 使用 Server Actions: app/(work)/work/dashboard/student/componentsServerActions/knowledgeCategoryActions.ts
 *
 * 功能：
 * - 显示某个知识点分类的详细子分类信息（第三层级和第四层级）
 * - 使用柱状图展示各子分类的掌握率
 * - 使用饼图展示整体掌握情况
 * - 显示详细知识点列表（已掌握、部分掌握、需要加强）
 * - 支持搜索过滤子分类
 *
 * 父组件：
 * - KnowledgeCategoryAnalysis: 知识点分类掌握情况主组件
 */
import { BookOpen, Search, X, XCircle } from "lucide-react";
import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, LabelList, Pie, PieChart, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "../../../../../../components/ui/chart.js";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../../../../../components/ui/dialog.js";
import { Input } from "../../../../../../components/ui/input.js";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../../../../components/ui/tabs.js";
// 为子分类定义不同的颜色
const CATEGORY_COLORS = ["hsl(221, 83%, 53%)",
// 蓝色
"hsl(142, 71%, 45%)",
// 绿色
"hsl(262, 83%, 58%)",
// 紫色
"hsl(346, 77%, 50%)",
// 红色
"hsl(38, 92%, 50%)",
// 橙色
"hsl(199, 89%, 48%)",
// 青色
"hsl(280, 61%, 50%)",
// 粉紫色
"hsl(25, 95%, 53%)",
// 深橙色
"hsl(173, 58%, 39%)",
// 青绿色
"hsl(48, 96%, 53%)" // 黄色
];

/**
 * 子分类详情对话框
 */
export default function SubCategoryDetailDialog({
  isOpen,
  onClose,
  categoryName,
  subCategories,
  categoryColor
}) {
  const [searchTerm, setSearchTerm] = useState("");

  // 根据搜索词过滤子分类
  const filteredSubCategories = useMemo(() => {
    if (!searchTerm.trim()) {
      return subCategories;
    }
    return subCategories.filter(sub => sub.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [subCategories, searchTerm]);

  // 准备图表数据（使用过滤后的数据）
  const chartData = filteredSubCategories.map((item, index) => ({
    name: item.name,
    mastery: item.mastery,
    totalPoints: item.totalPoints,
    masteredPoints: item.masteredPoints,
    color: CATEGORY_COLORS[index % CATEGORY_COLORS.length]
  }));
  const chartConfig = {
    mastery: {
      label: "掌握度",
      color: categoryColor
    }
  };
  return <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] h-[95vh] max-w-[95vw] max-h-[95vh] flex flex-col p-0 gap-0 [&>button]:hidden">
        <DialogHeader className="px-6 py-4 border-b border-gray-200 shrink-0">
          <div className="flex items-center gap-4">
            <DialogTitle className="flex items-center gap-2 flex-1">
              <BookOpen className="w-5 h-5" style={{
              color: categoryColor
            }} />
              {categoryName} - 详细分析
            </DialogTitle>
            {/* 搜索框 */}
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 z-10" />
              <Input type="text" placeholder="搜索知识点..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-9 pr-9" />
              {/* 清空按钮 */}
              {searchTerm && <button onClick={() => setSearchTerm("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors" type="button">
                  <XCircle className="h-4 w-4" />
                </button>}
            </div>
            {/* 关闭按钮 */}
            <button onClick={onClose} className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus-visible:ring-0 disabled:pointer-events-none">
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden px-6 py-6">
          <Tabs defaultValue="pie" className="h-full flex flex-col">
            <TabsList className="shrink-0 mb-4 justify-start w-auto">
              <TabsTrigger value="pie">饼状图</TabsTrigger>
              <TabsTrigger value="chart">柱状图</TabsTrigger>
              {filteredSubCategories.map((sub, index) => <TabsTrigger key={index} value={`sub-${index}`}>
                  {sub.name}
                </TabsTrigger>)}
            </TabsList>

            {/* 柱状图 Tab */}
            <TabsContent value="chart" className="flex-1 overflow-auto mt-0">
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold mb-4">各子分类掌握情况</h3>
                <div className="overflow-x-auto">
                  <ChartContainer config={chartConfig} className="h-[400px]" style={{
                  minWidth: `${chartData.length * 80}px`
                }}>
                    <BarChart data={chartData} margin={{
                    top: 20,
                    right: 20,
                    bottom: 80,
                    left: 20
                  }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" tickLine={false} axisLine={false} angle={-45} textAnchor="end" height={100} interval={0} style={{
                      fontSize: "12px",
                      fontWeight: 500
                    }} />
                      <YAxis tickLine={false} axisLine={false} tickFormatter={value => `${value}%`} />
                      <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                      <Bar dataKey="mastery" radius={[8, 8, 0, 0]} maxBarSize={60}>
                        {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                        <LabelList dataKey="mastery" position="top" offset={8} className="fill-foreground font-bold" fontSize={14} formatter={value => `${value}%`} />
                      </Bar>
                    </BarChart>
                  </ChartContainer>
                </div>
              </div>
            </TabsContent>

            {/* 饼状图 Tab */}
            <TabsContent value="pie" className="flex-1 overflow-auto mt-0">
              <div className="border border-gray-200 rounded-lg p-4">
                <h3 className="text-sm font-semibold mb-4">各子分类掌握情况</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
                  {filteredSubCategories.map((sub, index) => {
                  const subColor = CATEGORY_COLORS[index % CATEGORY_COLORS.length];
                  const pieData = [{
                    name: "已掌握",
                    value: sub.mastery,
                    fill: subColor
                  }, {
                    name: "未掌握",
                    value: 100 - sub.mastery,
                    fill: "#e5e7eb"
                  }];
                  const pieChartConfig = {
                    已掌握: {
                      label: "已掌握",
                      color: subColor
                    },
                    未掌握: {
                      label: "未掌握",
                      color: "#e5e7eb"
                    }
                  };
                  return <div key={index} className="bg-white rounded-lg border border-gray-200 p-2">
                        {/* 子分类标题 */}
                        <div className="text-center mb-1">
                          <h4 className="text-sm font-semibold text-gray-900 line-clamp-2 min-h-[2.5rem]">
                            {sub.name}
                          </h4>
                        </div>

                        {/* 饼图容器 - 宽度减半 */}
                        <div className="relative w-[90px] h-[90px] mx-auto">
                          <ChartContainer config={pieChartConfig} className="w-full h-full">
                            <PieChart width={90} height={90}>
                              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={20} outerRadius={35} paddingAngle={2} startAngle={90} endAngle={450} />
                            </PieChart>
                          </ChartContainer>

                          {/* 中心显示百分比 */}
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="text-center">
                              <div className="text-sm font-bold" style={{
                            color: subColor
                          }}>
                                {sub.mastery}%
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>;
                })}
                </div>
              </div>
            </TabsContent>

            {/* 各个子分类详情 Tab */}
            {filteredSubCategories.map((sub, index) => {
            const subColor = CATEGORY_COLORS[index % CATEGORY_COLORS.length];
            return <TabsContent key={index} value={`sub-${index}`} className="flex-1 overflow-auto mt-0">
                  <div className="border border-gray-200 rounded-lg p-4">
                    {/* 子分类标题 */}
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-semibold text-gray-900">
                        {sub.name}
                      </h4>
                      <div className="text-right">
                        <div className="text-lg font-bold" style={{
                      color: subColor
                    }}>
                          {sub.mastery}%
                        </div>
                        <div className="text-xs text-gray-600">
                          {sub.masteredPoints}/{sub.totalPoints} 个知识点
                        </div>
                      </div>
                    </div>

                    {/* 详细知识点 */}
                    {sub.detailedKnowledgePoints && <div className="space-y-3">
                        {/* 已掌握的知识点 */}
                        {sub.detailedKnowledgePoints.mastered.length > 0 && <div>
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                              <h5 className="text-sm font-semibold text-emerald-700">
                                已掌握
                              </h5>
                              <div className="flex-1 h-px bg-emerald-200"></div>
                              <span className="text-xs text-emerald-600 font-medium">
                                {sub.detailedKnowledgePoints.mastered.length}
                              </span>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
                              {sub.detailedKnowledgePoints.mastered.map((kp, i) => {
                        const pieData = [{
                          name: "已掌握",
                          value: kp.masteryRate,
                          fill: "#10b981" // emerald-500
                        }, {
                          name: "未掌握",
                          value: 100 - kp.masteryRate,
                          fill: "#e5e7eb"
                        }];
                        const pieChartConfig = {
                          已掌握: {
                            label: "已掌握",
                            color: "#10b981"
                          },
                          未掌握: {
                            label: "未掌握",
                            color: "#e5e7eb"
                          }
                        };
                        return <div key={i} className="bg-white rounded-lg border border-gray-200 p-2">
                                      {/* 知识点标题 */}
                                      <div className="text-center mb-1">
                                        <h4 className="text-sm font-semibold text-gray-900 line-clamp-2 min-h-[2.5rem]">
                                          {kp.name}
                                        </h4>
                                      </div>

                                      {/* 饼图容器 */}
                                      <div className="relative w-[90px] h-[90px] mx-auto">
                                        <ChartContainer config={pieChartConfig} className="w-full h-full">
                                          <PieChart width={90} height={90}>
                                            <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={20} outerRadius={35} paddingAngle={2} startAngle={90} endAngle={450} />
                                          </PieChart>
                                        </ChartContainer>

                                        {/* 中心显示百分比 */}
                                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                          <div className="text-center">
                                            <div className="text-base font-bold text-emerald-600">
                                              {kp.masteryRate}%
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </div>;
                      })}
                            </div>
                          </div>}

                        {/* 部分掌握的知识点 */}
                        {sub.detailedKnowledgePoints.partiallyMastered.length > 0 && <div>
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                              <h5 className="text-sm font-semibold text-amber-700">
                                部分掌握
                              </h5>
                              <div className="flex-1 h-px bg-amber-200"></div>
                              <span className="text-xs text-amber-600 font-medium">
                                {sub.detailedKnowledgePoints.partiallyMastered.length}
                              </span>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
                              {sub.detailedKnowledgePoints.partiallyMastered.map((kp, i) => {
                        const pieData = [{
                          name: "已掌握",
                          value: kp.masteryRate,
                          fill: "#f59e0b" // amber-500
                        }, {
                          name: "未掌握",
                          value: 100 - kp.masteryRate,
                          fill: "#e5e7eb"
                        }];
                        const pieChartConfig = {
                          已掌握: {
                            label: "已掌握",
                            color: "#f59e0b"
                          },
                          未掌握: {
                            label: "未掌握",
                            color: "#e5e7eb"
                          }
                        };
                        return <div key={i} className="bg-white rounded-lg border border-gray-200 p-2">
                                      {/* 知识点标题 */}
                                      <div className="text-center mb-1">
                                        <h4 className="text-sm font-semibold text-gray-900 line-clamp-2 min-h-[2.5rem]">
                                          {kp.name}
                                        </h4>
                                      </div>

                                      {/* 饼图容器 */}
                                      <div className="relative w-[90px] h-[90px] mx-auto">
                                        <ChartContainer config={pieChartConfig} className="w-full h-full">
                                          <PieChart width={90} height={90}>
                                            <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={20} outerRadius={35} paddingAngle={2} startAngle={90} endAngle={450} />
                                          </PieChart>
                                        </ChartContainer>

                                        {/* 中心显示百分比 */}
                                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                          <div className="text-center">
                                            <div className="text-base font-bold text-amber-600">
                                              {kp.masteryRate}%
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </div>;
                      })}
                            </div>
                          </div>}

                        {/* 需要加强的知识点 */}
                        {sub.detailedKnowledgePoints.needsImprovement.length > 0 && <div>
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-2 h-2 bg-rose-500 rounded-full"></div>
                              <h5 className="text-sm font-semibold text-rose-700">
                                需要加强
                              </h5>
                              <div className="flex-1 h-px bg-rose-200"></div>
                              <span className="text-xs text-rose-600 font-medium">
                                {sub.detailedKnowledgePoints.needsImprovement.length}
                              </span>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
                              {sub.detailedKnowledgePoints.needsImprovement.map((kp, i) => {
                        const pieData = [{
                          name: "已掌握",
                          value: kp.masteryRate,
                          fill: "#f43f5e" // rose-500
                        }, {
                          name: "未掌握",
                          value: 100 - kp.masteryRate,
                          fill: "#e5e7eb"
                        }];
                        const pieChartConfig = {
                          已掌握: {
                            label: "已掌握",
                            color: "#f43f5e"
                          },
                          未掌握: {
                            label: "未掌握",
                            color: "#e5e7eb"
                          }
                        };
                        return <div key={i} className="bg-white rounded-lg border border-gray-200 p-2">
                                      {/* 知识点标题 */}
                                      <div className="text-center mb-1">
                                        <h4 className="text-sm font-semibold text-gray-900 line-clamp-2 min-h-[2.5rem]">
                                          {kp.name}
                                        </h4>
                                      </div>

                                      {/* 饼图容器 */}
                                      <div className="relative w-[90px] h-[90px] mx-auto">
                                        <ChartContainer config={pieChartConfig} className="w-full h-full">
                                          <PieChart width={90} height={90}>
                                            <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={20} outerRadius={35} paddingAngle={2} startAngle={90} endAngle={450} />
                                          </PieChart>
                                        </ChartContainer>

                                        {/* 中心显示百分比 */}
                                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                          <div className="text-center">
                                            <div className="text-base font-bold text-rose-600">
                                              {kp.masteryRate}%
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </div>;
                      })}
                            </div>
                          </div>}
                      </div>}
                  </div>
                </TabsContent>;
          })}
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>;
}
