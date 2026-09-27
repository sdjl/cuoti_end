"use client";

import { RotateCcw, Search } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "../../../../../../components/ui/button.js";
import { Input } from "../../../../../../components/ui/input.js";
import { Select, SelectContent, SelectItem, SelectTrigger,
/**
 * 学生筛选器组件
 * 提供学生的搜索、性别、状态、提交状态等多维度筛选功能
 */
SelectValue } from "../../../../../../components/ui/select.js";
export default function StudentFilters({
  searchTerm,
  setSearchTerm,
  selectedGender,
  setSelectedGender,
  selectedStatus,
  setSelectedStatus,
  selectedSubmitStatus,
  setSelectedSubmitStatus,
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
            <Input placeholder="搜索学生姓名、学生编号、备注..." value={localSearchTerm} onChange={e => setLocalSearchTerm(e.target.value)} onKeyPress={handleKeyPress} className="flex-1" />
            <Button onClick={handleSearch} size="default" className="px-3">
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* 筛选器 */}
        <div className="flex flex-col sm:flex-row gap-3 lg:flex-shrink-0">
          {/* 提交状态筛选 */}
          <Select value={selectedSubmitStatus} onValueChange={setSelectedSubmitStatus}>
            <SelectTrigger className="w-full sm:w-[140px]">
              <SelectValue placeholder="提交状态" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部提交状态</SelectItem>
              <SelectItem value="submitted">已提交</SelectItem>
              <SelectItem value="notSubmitted">未提交</SelectItem>
            </SelectContent>
          </Select>

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

          {/* 学生状态筛选 */}
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-full sm:w-[120px]">
              <SelectValue placeholder="状态" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部状态</SelectItem>
              <SelectItem value="在读">在读</SelectItem>
              <SelectItem value="退学">退学</SelectItem>
            </SelectContent>
          </Select>

          {/* 排序字段 */}
          <Select value={selectedSortBy} onValueChange={setSelectedSortBy}>
            <SelectTrigger className="w-full sm:w-[120px]">
              <SelectValue placeholder="排序" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="correctRate">正确率</SelectItem>
              <SelectItem value="studentCode">编号</SelectItem>
              <SelectItem value="name">姓名</SelectItem>
              <SelectItem value="score">积分余额</SelectItem>
              <SelectItem value="gender">性别</SelectItem>
              <SelectItem value="status">状态</SelectItem>
              <SelectItem value="submitStatus">提交状态</SelectItem>
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
