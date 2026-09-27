"use client";

/**
 * 学生卡片组件
 *
 * 显示学生的基本信息和保存状态：
 * - 学生姓名
 * - 学生编号
 * - 保存状态标签（已保存/未保存）
 * - 支持选中状态和点击事件
 */
import { cn } from "../../../../../../../lib/shadcn/utils.js";
export default function StudentCard({
  student,
  isSelected,
  isSaved,
  onClick
}) {
  return <div className={cn("p-3 border rounded-lg cursor-pointer transition-all hover:shadow-md", isSelected ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300")} onClick={onClick}>
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <div className="font-medium text-gray-900 truncate">
            {student.name}
          </div>
          <div className="text-sm text-gray-500 truncate">
            {student.studentCode}
          </div>
        </div>
        <div className="ml-2 flex-shrink-0">
          {isSaved ? <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
              已保存
            </span> : <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
              未保存
            </span>}
        </div>
      </div>
    </div>;
}
