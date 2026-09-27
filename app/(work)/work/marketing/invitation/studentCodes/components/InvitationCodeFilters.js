"use client";

import { RotateCcw, Search } from "lucide-react";
// 学生邀请码过滤器组件，提供搜索、状态筛选等功能
import { useCallback, useEffect, useState } from "react";
import { Button } from "../../../../../../../components/ui/button.js";
import { Input } from "../../../../../../../components/ui/input.js";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../../../../../components/ui/select.js";
export default function InvitationCodeFilters({
  searchCode,
  setSearchCode,
  selectedStatus,
  setSelectedStatus,
  selectedIsUsed,
  setSelectedIsUsed,
  onReset
}) {
  const [localSearchCode, setLocalSearchCode] = useState(searchCode);

  // 同步外部的 searchCode 变化到本地状态
  useEffect(() => {
    setLocalSearchCode(searchCode);
  }, [searchCode]);

  // 处理搜索
  const handleSearch = useCallback(() => {
    setSearchCode(localSearchCode);
  }, [localSearchCode, setSearchCode]);

  // 处理回车搜索
  const handleKeyPress = useCallback(e => {
    if (e.key === "Enter") {
      handleSearch();
    }
  }, [handleSearch]);

  // 处理重置
  const handleReset = useCallback(() => {
    setLocalSearchCode("");
    onReset();
  }, [onReset]);
  return <div className="bg-white p-4 rounded-lg shadow-sm space-y-4">
      <div className="flex flex-col lg:flex-row gap-4">
        {/* 搜索框 */}
        <div className="flex-1">
          <div className="flex gap-2">
            <Input placeholder="搜索邀请码..." value={localSearchCode} onChange={e => setLocalSearchCode(e.target.value)} onKeyPress={handleKeyPress} className="flex-1" />
            <Button onClick={handleSearch} size="default" className="px-3">
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* 筛选器 */}
        <div className="flex flex-col sm:flex-row gap-3 lg:flex-shrink-0">
          {/* 状态筛选 */}
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-full sm:w-[120px]">
              <SelectValue placeholder="状态" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部状态</SelectItem>
              <SelectItem value="active">启用</SelectItem>
              <SelectItem value="disabled">禁用</SelectItem>
            </SelectContent>
          </Select>

          {/* 使用状态筛选 */}
          <Select value={selectedIsUsed} onValueChange={setSelectedIsUsed}>
            <SelectTrigger className="w-full sm:w-[120px]">
              <SelectValue placeholder="使用状态" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部</SelectItem>
              <SelectItem value="used">已使用</SelectItem>
              <SelectItem value="unused">未使用</SelectItem>
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
