"use client";

import { RotateCcw, Search } from "lucide-react";
// 积分抽奖记录过滤器组件，用于筛选和搜索积分抽奖记录
import { useCallback, useEffect, useState } from "react";
import { Button } from "../../../../../../../components/ui/button.js";
import { Input } from "../../../../../../../components/ui/input.js";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../../../../../components/ui/select.js";
export default function LotteryRecordsFilters({
  searchText,
  setSearchText,
  selectedRedeemStatus,
  setSelectedRedeemStatus,
  selectedIsPublicFilter,
  setSelectedIsPublicFilter,
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
            <Input placeholder="搜索奖品名称、老师备注..." value={localSearchText} onChange={e => setLocalSearchText(e.target.value)} onKeyPress={handleKeyPress} className="flex-1" />
            <Button onClick={handleSearch} size="default" className="px-3">
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* 筛选器 */}
        <div className="flex flex-col sm:flex-row gap-3 lg:flex-shrink-0">
          {/* 兑换状态筛选 */}
          <Select value={selectedRedeemStatus} onValueChange={setSelectedRedeemStatus}>
            <SelectTrigger className="w-full sm:w-[140px]">
              <SelectValue placeholder="兑换状态" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部状态</SelectItem>
              <SelectItem value="pending">待处理</SelectItem>
              <SelectItem value="completed">已完成</SelectItem>
              <SelectItem value="cancelled">已取消</SelectItem>
            </SelectContent>
          </Select>

          {/* 公示状态筛选 */}
          <Select value={selectedIsPublicFilter} onValueChange={setSelectedIsPublicFilter}>
            <SelectTrigger className="w-full sm:w-[140px]">
              <SelectValue placeholder="公示状态" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部</SelectItem>
              <SelectItem value="public">已公示</SelectItem>
              <SelectItem value="private">未公示</SelectItem>
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
