"use client";

/**
 * 知识点分类掌握情况主组件
 *
 * 使用 Server Actions: app/(work)/work/dashboard/student/componentsServerActions/knowledgeCategoryActions.ts
 *
 * 功能：
 * - 显示学生某个科目的知识点分类掌握情况（第一层级和第二层级）
 * - 使用饼图展示每个分类的掌握率
 * - 点击分类可查看详细子分类和具体知识点（通过 SubCategoryDetailDialog 组件）
 *
 * 依赖组件：
 * - SubCategoryDetailDialog: 子分类详情对话框
 */
import { BookOpen } from "lucide-react";
import { useState } from "react";
import { Pie, PieChart } from "recharts";
import { ChartContainer } from "../../../../../../components/ui/chart.js";
import SubCategoryDetailDialog from "./SubCategoryDetailDialog.js";
/**
 * 单个知识点分类饼图卡片
 */
const CategoryPieCard = ({
  category,
  onClick,
  hasSubCategories
}) => {
  const pieData = [{
    name: "已掌握",
    value: category.mastery,
    fill: category.color
  }, {
    name: "未掌握",
    value: category.remaining,
    fill: "#e5e7eb"
  }];
  const chartConfig = {
    已掌握: {
      label: "已掌握",
      color: category.color
    },
    未掌握: {
      label: "未掌握",
      color: "#e5e7eb"
    }
  };
  return <div className={`bg-white rounded-lg border border-gray-200 p-4 transition-all ${hasSubCategories ? "cursor-pointer hover:shadow-lg hover:border-gray-300" : "opacity-75"}`} onClick={hasSubCategories ? onClick : undefined}>
      {/* 分类标题 */}
      <div className="text-center mb-3">
        <h4 className="text-sm font-semibold text-gray-900">{category.name}</h4>
      </div>

      {/* 饼图容器 */}
      <div className={`relative w-[180px] h-[180px] mx-auto ${hasSubCategories ? "cursor-pointer" : ""}`}>
        <ChartContainer config={chartConfig} className="w-full h-full">
          <PieChart width={180} height={180}>
            <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={2} startAngle={90} endAngle={450} />
          </PieChart>
        </ChartContainer>

        {/* 中心显示百分比 - 绝对定位覆盖在饼图中心 */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <div className="text-2xl font-bold" style={{
            color: category.color
          }}>
              {category.mastery}%
            </div>
          </div>
        </div>
      </div>

      {/* 统计数据 */}
      <div className="text-center mt-3">
        <p className="text-xs text-gray-600">
          {category.masteredPoints}/{category.totalPoints} 个知识点
        </p>
      </div>
    </div>;
};

/**
 * 知识点分类掌握情况主组件
 */
export default function KnowledgeCategoryAnalysis({
  data
}) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");
  const handleCategoryClick = categoryName => {
    const subCategories = data.subCategoriesMap[categoryName];
    if (subCategories && subCategories.length > 0) {
      setSelectedCategory(categoryName);
      setIsDialogOpen(true);
    }
  };
  const selectedSubCategories = selectedCategory ? data.subCategoriesMap[selectedCategory] || [] : [];
  const selectedCategoryColor = selectedCategory ? data.categories.find(cat => cat.name === selectedCategory)?.color || "hsl(221, 83%, 53%)" : "hsl(221, 83%, 53%)";
  if (!data.categories || data.categories.length === 0) {
    return <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <BookOpen className="w-5 h-5 text-blue-600" />
          <h2 className="text-xl font-bold">知识点掌握情况分析统计</h2>
        </div>
        <div className="text-center py-12">
          <p className="text-gray-500">暂无知识点数据</p>
        </div>
      </div>;
  }
  return <>
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        {/* 标题 */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-bold">知识点掌握情况分析统计</h2>
          </div>
          <p className="text-sm text-gray-600">
            按知识点分类展示掌握程度，点击分类可查看详细子分类和具体知识点
          </p>
        </div>

        {/* 知识点分类饼图网格 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {data.categories.map((category, index) => {
          const hasSubCategories = data.subCategoriesMap[category.name] && data.subCategoriesMap[category.name].length > 0;
          return <CategoryPieCard key={index} category={category} onClick={() => handleCategoryClick(category.name)} hasSubCategories={hasSubCategories} />;
        })}
        </div>
      </div>

      {/* 子分类详情对话框 */}
      <SubCategoryDetailDialog isOpen={isDialogOpen} onClose={() => setIsDialogOpen(false)} categoryName={selectedCategory} subCategories={selectedSubCategories} categoryColor={selectedCategoryColor} />
    </>;
}
