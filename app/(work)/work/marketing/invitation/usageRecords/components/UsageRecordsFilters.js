"use client";

import { RotateCcw, Search } from "lucide-react";
// 邀请码使用记录过滤器组件，提供搜索和类型筛选功能
import { useCallback, useEffect, useState } from "react";
import { Button } from "../../../../../../../components/ui/button.js";
import { Input } from "../../../../../../../components/ui/input.js";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../../../../../components/ui/select.js";
export default function UsageRecordsFilters({
  searchText,
  setSearchText,
  selectedType,
  setSelectedType,
  onReset
}) {
  const [localSearchText, setLocalSearchText] = useState(searchText);

  // 同步外部的 searchText 变化到本地状态
  useEffect(() => {
    setLocalSearchText(searchText);
  }, [searchText]);

  // 处理搜索
  const handleSearch = useCallback(() => {
    setSearchText(localSearchText);
  }, [localSearchText, setSearchText]);

  // 处理回车搜索
  const handleKeyPress = useCallback(e => {
    if (e.key === "Enter") {
      handleSearch();
    }
  }, [handleSearch]);

  // 处理重置
  const handleReset = useCallback(() => {
    setLocalSearchText("");
    onReset();
  }, [onReset]);
  return <div className="bg-white p-4 rounded-lg shadow-sm space-y-4">
      <div className="flex flex-col lg:flex-row gap-4">
        {/* 搜索框 */}
        <div className="flex-1">
          <div className="flex gap-2">
            <Input placeholder="搜索邀请码、被邀请者姓名、电话..." value={localSearchText} onChange={e => setLocalSearchText(e.target.value)} onKeyPress={handleKeyPress} className="flex-1" />
            <Button onClick={handleSearch} size="default" className="px-3">
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* 筛选器 */}
        <div className="flex flex-col sm:flex-row gap-3 lg:flex-shrink-0">
          {/* 邀请码类型筛选 */}
          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger className="w-full sm:w-[140px]">
              <SelectValue placeholder="邀请码类型" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部类型</SelectItem>
              <SelectItem value="student">学生邀请</SelectItem>
              <SelectItem value="partner">合作伙伴</SelectItem>
              <SelectItem value="onetime">一次性</SelectItem>
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
