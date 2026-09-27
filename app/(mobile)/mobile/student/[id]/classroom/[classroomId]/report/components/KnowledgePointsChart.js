"use client";

import { X } from "lucide-react";
import { useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, LabelList, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartContainer } from "../../../../../../../../../components/ui/chart.js";

/**
 * 知识点掌握情况图表组件
 *
 * 功能：
 * - 使用饼图展示各知识点分类的掌握程度
 * - 手机端优化布局
 * - 使用彩色主题色系
 * - 支持点击查看子分类详情
 */

/**
 * 饼图数据类型
 */

/**
 * Tooltip 属性类型
 */

/**
 * 自定义提示框组件
 */
const CustomTooltip = ({
  active,
  payload
}) => {
  if (active && payload && payload.length > 0) {
    const data = payload[0];
    return <div className="bg-card border border-border rounded-lg shadow-lg p-2">
        <p className="text-xs text-card-foreground">
          {data.name === "已掌握" ? `掌握度: ${data.value}%` : `未掌握: ${data.value}%`}
        </p>
      </div>;
  }
  return null;
};

/**
 * 子分类详情模态框组件
 */
const SubCategoryModal = ({
  isOpen,
  onClose,
  categoryName,
  subCategories,
  categoryColor
}) => {
  // 准备图表数据
  const chartData = subCategories.map(item => ({
    name: item.name,
    mastery: item.mastery,
    totalPoints: item.totalPoints,
    masteredPoints: item.masteredPoints
  }));
  const chartConfig = {
    mastery: {
      label: "掌握度",
      color: categoryColor
    },
    label: {
      color: "var(--background)"
    }
  };
  if (!isOpen) return null;
  return <>
      {/* 背景遮罩 */}
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />

      {/* 模态框 - 从右侧滑入 */}
      <div className={`fixed top-0 right-0 h-full bg-background border-l border-border z-50 transform transition-transform duration-300 ${isOpen ? "translate-x-0" : "translate-x-full"}`} style={{
      width: "calc(100vw - 50px)"
    }}>
        <div className="flex flex-col h-full">
          {/* 头部 */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div>
              <h3 className="text-lg font-semibold text-card-foreground">
                {categoryName} - 详细分析
              </h3>
              <p className="text-sm text-muted-foreground">各子分类掌握情况</p>
            </div>
            <button onClick={onClose} className="p-1 hover:bg-muted rounded-md transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* 内容区域 */}
          <div className="flex-1 overflow-y-auto p-4">
            {subCategories.length > 0 ? <ChartContainer config={chartConfig}>
                <BarChart accessibilityLayer data={chartData} layout="vertical" margin={{
              left: 20,
              right: 80,
              top: 20,
              bottom: 20
            }} height={Math.max(chartData.length * 60, 200)}>
                  <CartesianGrid horizontal={false} />
                  <YAxis dataKey="name" type="category" tickLine={false} tickMargin={10} axisLine={false} hide />
                  <XAxis dataKey="mastery" type="number" hide />

                  <Bar dataKey="mastery" layout="vertical" fill={categoryColor} radius={6} barSize={40}>
                    <LabelList dataKey="name" position="insideLeft" offset={12} className="fill-white font-semibold" fontSize={14} />
                    <LabelList dataKey="mastery" position="right" offset={12} className="fill-foreground font-bold" fontSize={16} formatter={value => `${value}%`} />
                  </Bar>
                </BarChart>
              </ChartContainer> : <div className="flex items-center justify-center h-40">
                <p className="text-muted-foreground">暂无子分类数据</p>
              </div>}

            {/* 统计信息 */}
            <div className="mt-4 space-y-4">
              {subCategories.map((sub, index) => <div key={index} className="p-4 bg-muted/50 rounded-lg space-y-3">
                  {/* 子分类标题和统计 */}
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-card-foreground">
                      {sub.name}
                    </span>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-card-foreground">
                        {sub.mastery}%
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {sub.masteredPoints}/{sub.totalPoints} 个知识点
                      </div>
                    </div>
                  </div>

                  {/* 详细知识点掌握情况 */}
                  {sub.detailedKnowledgePoints && <div className="space-y-3 text-sm">
                      {/* 已掌握的知识点 */}
                      {sub.detailedKnowledgePoints.mastered.length > 0 && <div className="relative">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                            <h4 className="font-semibold text-emerald-700">
                              已掌握
                            </h4>
                            <div className="flex-1 h-px bg-emerald-200"></div>
                            <span className="text-xs text-emerald-600 font-medium">
                              {sub.detailedKnowledgePoints.mastered.length}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {sub.detailedKnowledgePoints.mastered.map(kp => <div key={kp.name} className="bg-emerald-500 text-white px-2 py-1 rounded-md text-xs font-medium shadow-sm flex-shrink-0">
                                {kp.name} {kp.masteryRate}%
                              </div>)}
                          </div>
                        </div>}

                      {/* 部分掌握的知识点 */}
                      {sub.detailedKnowledgePoints.partiallyMastered.length > 0 && <div className="relative">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                            <h4 className="font-semibold text-amber-700">
                              部分掌握
                            </h4>
                            <div className="flex-1 h-px bg-amber-200"></div>
                            <span className="text-xs text-amber-600 font-medium">
                              {sub.detailedKnowledgePoints.partiallyMastered.length}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {sub.detailedKnowledgePoints.partiallyMastered.map(kp => <div key={kp.name} className="bg-amber-100 border border-amber-300 text-amber-800 px-2 py-1 rounded-md text-xs font-medium shadow-sm flex-shrink-0">
                                  {kp.name} {kp.masteryRate}%
                                </div>)}
                          </div>
                        </div>}

                      {/* 需要加强的知识点 */}
                      {sub.detailedKnowledgePoints.needsImprovement.length > 0 && <div className="relative">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-2 h-2 bg-rose-500 rounded-full"></div>
                            <h4 className="font-semibold text-rose-700">
                              需要加强
                            </h4>
                            <div className="flex-1 h-px bg-rose-200"></div>
                            <span className="text-xs text-rose-600 font-medium">
                              {sub.detailedKnowledgePoints.needsImprovement.length}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {sub.detailedKnowledgePoints.needsImprovement.map(kp => <div key={kp.name} className="bg-rose-100 border-2 border-dashed border-rose-300 text-rose-800 px-2 py-1 rounded-md text-xs font-medium shadow-sm flex-shrink-0">
                                  {kp.name} {kp.masteryRate}%
                                </div>)}
                          </div>
                        </div>}
                    </div>}
                </div>)}
            </div>
          </div>
        </div>
      </div>
    </>;
};

/**
 * 单个知识点分类饼图组件
 */
const SingleKnowledgePie = ({
  category,
  onClick,
  isClickable = false
}) => {
  const pieData = [{
    name: "已掌握",
    value: category.mastery,
    color: category.color
  }, {
    name: "未掌握",
    value: category.remaining,
    color: "#f3f4f6" // 浅灰色
  }];
  return <div className={`bg-card rounded-lg border border-border p-3 shadow-sm ${isClickable ? "cursor-pointer hover:shadow-md transition-shadow" : ""}`} onClick={onClick}>
      {/* 分类标题 */}
      <div className="text-center mb-2">
        <h4 className="text-sm font-semibold text-card-foreground">
          {category.name}
        </h4>
      </div>

      {/* 饼图容器 */}
      <div className="relative" style={{
      height: "120px"
    }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={pieData} cx="50%" cy="50%" innerRadius={25} outerRadius={45} paddingAngle={2} dataKey="value" startAngle={90} endAngle={450}>
              {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>

        {/* 中心显示百分比 */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-lg font-bold" style={{
            color: category.color
          }}>
              {category.mastery}%
            </div>
          </div>
        </div>
      </div>

      {/* 统计数据 */}
      <div className="text-center mt-2">
        <p className="text-xs text-muted-foreground">
          {category.masteredPoints}/{category.totalPoints}
        </p>
      </div>
    </div>;
};

/**
 * 知识点掌握情况主组件
 */
const KnowledgePointsChart = ({
  data
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");
  const handleCategoryClick = categoryName => {
    // 检查是否有子分类数据
    const subCategories = data.subCategoriesMap[categoryName];
    if (subCategories && subCategories.length > 0) {
      setSelectedCategory(categoryName);
      setIsModalOpen(true);
    }
  };
  const selectedSubCategories = selectedCategory ? data.subCategoriesMap[selectedCategory] || [] : [];

  // 获取选中分类的颜色
  const selectedCategoryColor = selectedCategory ? data.categories.find(cat => cat.name === selectedCategory)?.color || "#3b82f6" : "#3b82f6";

  // 如果没有分类数据，显示空状态
  if (!data.categories || data.categories.length === 0) {
    return <div className="bg-card rounded-lg border border-border overflow-hidden shadow-sm">
        <div className="px-4 py-3 border-b border-border">
          <h3 className="text-base font-semibold text-card-foreground">
            知识点掌握情况
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            点击分类可显示掌握详情
          </p>
        </div>
        <div className="p-8 text-center">
          <p className="text-muted-foreground">暂无知识点数据</p>
        </div>
      </div>;
  }
  return <>
      <div className="bg-card rounded-lg border border-border overflow-hidden shadow-sm">
        {/* 组件标题 */}
        <div className="px-4 py-3 border-b border-border">
          <h3 className="text-base font-semibold text-card-foreground">
            知识点掌握情况
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            点击分类可显示掌握详情
          </p>
        </div>

        {/* 知识点分类饼图网格 */}
        <div className="p-4">
          <div className="grid grid-cols-2 gap-3">
            {data.categories.map((category, index) => {
            const hasSubCategories = data.subCategoriesMap[category.name] && data.subCategoriesMap[category.name].length > 0;
            return <SingleKnowledgePie key={index} category={category} onClick={() => handleCategoryClick(category.name)} isClickable={hasSubCategories} />;
          })}
          </div>
        </div>
      </div>

      {/* 子分类详情模态框 */}
      <SubCategoryModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} categoryName={selectedCategory} subCategories={selectedSubCategories} categoryColor={selectedCategoryColor} />
    </>;
};
export default KnowledgePointsChart;
