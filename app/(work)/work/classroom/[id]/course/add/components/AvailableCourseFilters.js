"use client";

// 班级选课页面的筛选器，负责搜索和按学科过滤课程
import { RotateCcw, Search } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "../../../../../../../../components/ui/button.js";
import { Input } from "../../../../../../../../components/ui/input.js";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../../../../../../components/ui/select.js";
import { useSubjects } from "../../../../../../../../hooks/useAdminConfig.js";
export default function AvailableCourseFilters({
  searchTerm,
  setSearchTerm,
  selectedSubject,
  setSelectedSubject,
  onResetFilters
}) {
  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm);
  const {
    subjects,
    loading: subjectsLoading
  } = useSubjects();

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
            <Input placeholder="搜索课程名称、课程描述..." value={localSearchTerm} onChange={e => setLocalSearchTerm(e.target.value)} onKeyPress={handleKeyPress} className="flex-1" />
            <Button onClick={handleSearch} size="default" className="px-3">
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* 筛选器 */}
        <div className="flex flex-col sm:flex-row gap-3 lg:flex-shrink-0">
          {/* 科目筛选 */}
          <Select value={selectedSubject} onValueChange={setSelectedSubject}>
            <SelectTrigger className="w-full sm:w-[120px]">
              <SelectValue placeholder="科目" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部科目</SelectItem>
              {!subjectsLoading && subjects.map(subject => <SelectItem key={subject.name} value={subject.name}>
                    {subject.name}
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
