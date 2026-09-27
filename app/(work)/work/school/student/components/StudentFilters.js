"use client";

import { RotateCcw, Search } from "lucide-react";
// 学生筛选组件，提供搜索、性别筛选、排序等功能
import { useCallback, useEffect, useState } from "react";
import { Button } from "../../../../../../components/ui/button.js";
import { Input } from "../../../../../../components/ui/input.js";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../../../../components/ui/select.js";
export default function StudentFilters({
  searchTerm,
  setSearchTerm,
  selectedGender,
  setSelectedGender,
  selectedSortBy,
  setSelectedSortBy,
  selectedSortOrder,
  setSelectedSortOrder,
  onReset
}) {
  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm);

  // 同步外部的 searchTerm 变化到本地状态
  useEffect(() => {
    setLocalSearchTerm(searchTerm);
  }, [searchTerm]);

  // 处理搜索
  const handleSearch = useCallback(() => {
    setSearchTerm(localSearchTerm);
  }, [localSearchTerm, setSearchTerm]);

  // 处理回车搜索
  const handleKeyPress = useCallback(e => {
    if (e.key === "Enter") {
      handleSearch();
    }
  }, [handleSearch]);

  // 处理重置
  const handleReset = useCallback(() => {
    setLocalSearchTerm("");
    onReset();
  }, [onReset]);
  return <div className="bg-white p-4 rounded-lg shadow-sm space-y-4">
      <div className="flex flex-col lg:flex-row gap-4">
        {/* 搜索框 */}
        <div className="flex-1">
          <div className="flex gap-2">
            <Input placeholder="搜索学生姓名、学生编号、家庭地址、备注..." value={localSearchTerm} onChange={e => setLocalSearchTerm(e.target.value)} onKeyPress={handleKeyPress} className="flex-1" />
            <Button onClick={handleSearch} size="default" className="px-3">
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* 筛选器 */}
        <div className="flex flex-col sm:flex-row gap-3 lg:flex-shrink-0">
          {/* 性别筛选 */}
          <Select value={selectedGender} onValueChange={setSelectedGender}>
            <SelectTrigger className="w-full sm:w-[120px]">
              <SelectValue placeholder="性别" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部性别</SelectItem>
              <SelectItem value="男">男</SelectItem>
              <SelectItem value="女">女</SelectItem>
              <SelectItem value="未知">未知</SelectItem>
            </SelectContent>
          </Select>

          {/* 排序字段 */}
          <Select value={selectedSortBy} onValueChange={setSelectedSortBy}>
            <SelectTrigger className="w-full sm:w-[120px]">
              <SelectValue placeholder="排序" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="studentCode">编号</SelectItem>
              <SelectItem value="name">姓名</SelectItem>
              <SelectItem value="gender">性别</SelectItem>
              <SelectItem value="birthDate">出生日期</SelectItem>
              <SelectItem value="ethnicity">民族</SelectItem>
              <SelectItem value="homeAddress">家庭地址</SelectItem>
            </SelectContent>
          </Select>

          {/* 排序方向 */}
          <Select value={selectedSortOrder} onValueChange={setSelectedSortOrder}>
            <SelectTrigger className="w-full sm:w-[100px]">
              <SelectValue placeholder="顺序" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="asc">升序</SelectItem>
              <SelectItem value="desc">降序</SelectItem>
            </SelectContent>
          </Select>

          {/* 重置按钮 */}
          <Button variant="outline" onClick={handleReset} className="px-3">
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>;
}
