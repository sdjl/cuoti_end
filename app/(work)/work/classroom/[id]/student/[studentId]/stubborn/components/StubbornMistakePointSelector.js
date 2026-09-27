/**
 * 错误归因选择器组件
 *
 * 为学生的错题选择对应的错误归因：
 * - 显示所有可选的错误归因列表
 * - 支持通过名称和描述搜索过滤错误归因
 * - 显示已选择的错误归因（带删除功能）
 * - 支持点击错误归因进行选择/取消选择
 */
"use client";

import { Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import { Badge } from "../../../../../../../../../components/ui/badge.js";
import { Input } from "../../../../../../../../../components/ui/input.js";
import { DISPLAY_TEXT } from "../../../../../../../../../lib/config/constants.js";
export default function StubbornMistakePointSelector({
  mistakePoints,
  selectedMistakePointIds,
  onMistakePointsChange
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const filteredMistakePoints = useMemo(() => {
    // 如果没有搜索词，不显示任何数据
    if (!searchTerm.trim()) return [];
    const term = searchTerm.toLowerCase().trim();
    return mistakePoints.filter(point => point.name.toLowerCase().includes(term) || point.description.toLowerCase().includes(term));
  }, [mistakePoints, searchTerm]);
  const selectedMistakePoints = useMemo(() => {
    return mistakePoints.filter(point => selectedMistakePointIds.includes(point._id));
  }, [mistakePoints, selectedMistakePointIds]);
  const handleMistakePointToggle = mistakePointId => {
    const newSelected = selectedMistakePointIds.includes(mistakePointId) ? selectedMistakePointIds.filter(id => id !== mistakePointId) : [...selectedMistakePointIds, mistakePointId];
    onMistakePointsChange(newSelected);
  };
  const handleRemoveMistakePoint = mistakePointId => {
    const newSelected = selectedMistakePointIds.filter(id => id !== mistakePointId);
    onMistakePointsChange(newSelected);
  };
  const clearSearch = () => {
    setSearchTerm("");
  };
  return <div className="space-y-3">
      {/* 标题和搜索框在同一行 */}
      <div className="flex items-center gap-4">
        <h5 className="text-sm font-medium text-gray-700 whitespace-nowrap">
          选择{DISPLAY_TEXT.ERROR_ATTRIBUTION}
        </h5>
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input placeholder={`输入关键词搜索${DISPLAY_TEXT.ERROR_ATTRIBUTION}...`} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10 pr-10 h-8" />
          {searchTerm && <button onClick={clearSearch} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>}
        </div>
      </div>

      {/* 已选择的错误归因 - 增加背景色 */}
      {selectedMistakePoints.length > 0 && <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
          <h6 className="text-sm font-medium text-blue-900 mb-2">
            已选择的{DISPLAY_TEXT.ERROR_ATTRIBUTION}
          </h6>
          <div className="flex flex-wrap gap-2">
            {selectedMistakePoints.map(point => <Badge key={point._id} variant="secondary" className="flex items-center gap-1 bg-blue-100 text-blue-800 border-blue-300">
                {point.name}
                <X className="w-3 h-3 cursor-pointer hover:text-red-500" onClick={() => handleRemoveMistakePoint(point._id)} />
              </Badge>)}
          </div>
        </div>}

      {/* 可选择的错误归因列表 - 减少内间距 */}
      <div className="space-y-2">
        <div className="max-h-60 overflow-y-auto space-y-1 border rounded-lg p-2">
          {!searchTerm ? <div className="text-center text-gray-500 py-8">
              请在上方输入关键词搜索{DISPLAY_TEXT.ERROR_ATTRIBUTION}
            </div> : filteredMistakePoints.length === 0 ? <div className="text-center text-gray-500 py-4">
              未找到匹配的{DISPLAY_TEXT.ERROR_ATTRIBUTION}
            </div> : filteredMistakePoints.map(point => {
          const isSelected = selectedMistakePointIds.includes(point._id);
          return <div key={point._id} className={`p-2 border rounded cursor-pointer transition-all hover:shadow-sm ${isSelected ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"}`} onClick={() => handleMistakePointToggle(point._id)} title={point.description || point.name} // hover显示描述
          >
                  <div className="font-medium text-sm text-gray-900">
                    {point.name}
                  </div>
                </div>;
        })}
        </div>
      </div>
    </div>;
}
