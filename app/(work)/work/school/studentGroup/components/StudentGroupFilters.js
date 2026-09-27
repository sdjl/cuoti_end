"use client";

import { RotateCcw, Search } from "lucide-react";
// 学生分组筛选组件，提供搜索功能
import { useCallback, useEffect, useState } from "react";
import { Button } from "../../../../../../components/ui/button.js";
import { Input } from "../../../../../../components/ui/input.js";
export default function StudentGroupFilters({
  searchTerm,
  setSearchTerm,
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
            <Input placeholder="搜索分组名称、老师姓名、备注..." value={localSearchTerm} onChange={e => setLocalSearchTerm(e.target.value)} onKeyPress={handleKeyPress} className="flex-1" />
            <Button onClick={handleSearch} size="default" className="px-3">
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* 重置按钮 */}
        <div className="flex lg:flex-shrink-0">
          <Button variant="outline" onClick={handleReset} className="px-3">
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>;
}
