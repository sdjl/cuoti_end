"use client";

// 错题分析页的筛选条，支持搜索、纠错状态和题型难度过滤
import { RotateCcw, Search } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "../../../../../../../../../components/ui/button.js";
import { Input } from "../../../../../../../../../components/ui/input.js";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../../../../../../../components/ui/select.js";
export default function MistakeRecordFilters({
  searchText,
  setSearchText,
  selectedCorrectionStatus,
  setSelectedCorrectionStatus,
  selectedQuestionType,
  setSelectedQuestionType,
  selectedDifficulty,
  setSelectedDifficulty,
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
  return <div className="bg-white p-4 rounded-lg shadow-sm">
      <div className="flex flex-col lg:flex-row gap-4">
        {/* 搜索框 */}
        <div className="flex-1">
          <div className="flex gap-2">
            <Input placeholder="搜索题目内容..." value={localSearchText} onChange={e => setLocalSearchText(e.target.value)} onKeyPress={handleKeyPress} className="flex-1" />
            <Button onClick={handleSearch} size="default" className="px-3">
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* 筛选器 */}
        <div className="flex flex-col sm:flex-row gap-3 lg:flex-shrink-0">
          {/* 过关状态筛选 */}
          <Select value={selectedCorrectionStatus} onValueChange={setSelectedCorrectionStatus}>
            <SelectTrigger className="w-full sm:w-[120px]">
              <SelectValue placeholder="过关状态" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部状态</SelectItem>
              <SelectItem value="corrected">已过关</SelectItem>
              <SelectItem value="pending">待过关</SelectItem>
              <SelectItem value="stubborn">顽固错题</SelectItem>
            </SelectContent>
          </Select>

          {/* 题目类型筛选 */}
          <Select value={selectedQuestionType} onValueChange={setSelectedQuestionType}>
            <SelectTrigger className="w-full sm:w-[120px]">
              <SelectValue placeholder="题目类型" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部类型</SelectItem>
              <SelectItem value="选择题">选择题</SelectItem>
              <SelectItem value="填空题">填空题</SelectItem>
              <SelectItem value="解答题">解答题</SelectItem>
              <SelectItem value="算术题">算术题</SelectItem>
            </SelectContent>
          </Select>

          {/* 题目难度筛选 */}
          <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
            <SelectTrigger className="w-full sm:w-[120px]">
              <SelectValue placeholder="题目难度" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部难度</SelectItem>
              <SelectItem value="容易">容易</SelectItem>
              <SelectItem value="中等">中等</SelectItem>
              <SelectItem value="困难">困难</SelectItem>
              <SelectItem value="超难">超难</SelectItem>
              <SelectItem value="未知">未知</SelectItem>
            </SelectContent>
          </Select>

          {/* 重置按钮 */}
          <Button variant="outline" onClick={handleReset} className="px-3" title="重置筛选条件">
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>;
}
