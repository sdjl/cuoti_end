"use client";

// 题集筛选器组件，用于按名称和科目筛选公共题集
import { Search, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "../../../../../../../../components/ui/button.js";
import { Input } from "../../../../../../../../components/ui/input.js";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../../../../../../components/ui/select.js";
export default function QuestionPackFilters({
  searchTerm,
  onSearchChange,
  selectedSubject,
  onSubjectChange,
  subjects,
  onReset,
  disabled = false
}) {
  const [inputValue, setInputValue] = useState(searchTerm);

  // 同步外部的searchTerm变化
  useEffect(() => {
    setInputValue(searchTerm);
  }, [searchTerm]);

  // 处理搜索提交
  const handleSearch = e => {
    e.preventDefault();
    onSearchChange(inputValue.trim());
  };

  // 检查是否有活跃的过滤器
  const hasActiveFilters = searchTerm || selectedSubject !== "all";
  return <div className="bg-white p-4 rounded-lg shadow-sm space-y-4">
      <div className="flex flex-col lg:flex-row gap-4">
        {/* 搜索框 */}
        <div className="flex-1">
          <form onSubmit={handleSearch} className="flex gap-2">
            <Input placeholder="搜索题集名称或描述..." value={inputValue} onChange={e => setInputValue(e.target.value)} className="flex-1" />
            <Button type="submit" size="default" className="px-3">
              <Search className="h-4 w-4" />
            </Button>
          </form>
        </div>

        {/* 筛选器 */}
        <div className="flex flex-col sm:flex-row gap-3 lg:flex-shrink-0">
          {/* 科目筛选 */}
          <Select value={selectedSubject} onValueChange={onSubjectChange} disabled={disabled}>
            <SelectTrigger className="w-full sm:w-[120px]">
              <SelectValue placeholder="科目" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部科目</SelectItem>
              {subjects.map(subject => <SelectItem key={subject} value={subject}>
                  {subject}
                </SelectItem>)}
            </SelectContent>
          </Select>

          {/* 重置按钮 */}
          {hasActiveFilters && <Button variant="outline" onClick={onReset} className="px-3">
              <X className="h-4 w-4" />
            </Button>}
        </div>
      </div>
    </div>;
}
