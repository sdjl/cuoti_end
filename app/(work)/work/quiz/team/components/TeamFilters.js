"use client";

import { RotateCcw, Search } from "lucide-react";
// 队伍过滤器组件，支持按队伍名称和关联的口述核心知识点筛选
import { useCallback, useEffect, useState } from "react";
import { Button } from "../../../../../../components/ui/button.js";
import { Input } from "../../../../../../components/ui/input.js";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../../../../components/ui/select.js";
import { DISPLAY_TEXT } from "../../../../../../lib/config/constants.js";
export default function TeamFilters({
  searchTerm,
  setSearchTerm,
  selectedQuiz,
  setSelectedQuiz,
  quizzes,
  onResetFilters
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
    onResetFilters();
  }, [onResetFilters]);
  return <div className="bg-white p-4 rounded-lg shadow-sm space-y-4">
      <div className="flex flex-col lg:flex-row gap-4">
        {/* 搜索框 */}
        <div className="flex-1">
          <div className="flex gap-2">
            <Input placeholder="搜索队伍名称、描述..." value={localSearchTerm} onChange={e => setLocalSearchTerm(e.target.value)} onKeyPress={handleKeyPress} className="flex-1" />
            <Button onClick={handleSearch} size="default" className="px-3">
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* 筛选器 */}
        <div className="flex flex-col sm:flex-row gap-3 lg:flex-shrink-0">
          {/* 口述核心知识点筛选 */}
          <Select value={selectedQuiz} onValueChange={setSelectedQuiz}>
            <SelectTrigger className="w-full sm:w-[160px]">
              <SelectValue placeholder={`选择${DISPLAY_TEXT.ORAL_KNOWLEDGE_QUIZ}`} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                全部{DISPLAY_TEXT.ORAL_KNOWLEDGE_QUIZ}
              </SelectItem>
              {quizzes.map(quiz => <SelectItem key={quiz._id} value={quiz._id}>
                  {quiz.title}
                </SelectItem>)}
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
