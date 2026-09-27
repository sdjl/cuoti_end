"use client";

import { RotateCcw, Search } from "lucide-react";
// 题集过滤器组件，用于对定制题集进行搜索和筛选（学科、提交状态、分析状态、PDF状态等）
import { useCallback, useEffect, useState } from "react";
import { Button } from "../../../../../../../../../components/ui/button.js";
import { Input } from "../../../../../../../../../components/ui/input.js";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../../../../../../../components/ui/select.js";
import { useSubjects } from "../../../../../../../../../hooks/useAdminConfig.js";
export default function QuestionPackFilter({
  searchTerm,
  onSearchTermChange,
  selectedSubject,
  onSubjectChange,
  hasAnswerFilter,
  onHasAnswerFilterChange,
  hasQuestionsPdfFilter,
  onHasQuestionsPdfFilterChange,
  hasAnswersPdfFilter,
  onHasAnswersPdfFilterChange,
  isAnalysisCompletedFilter,
  onIsAnalysisCompletedFilterChange,
  onReset
}) {
  const {
    subjects,
    loading: subjectsLoading
  } = useSubjects();
  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm);

  // 同步外部的 searchTerm 变化到本地状态
  useEffect(() => {
    setLocalSearchTerm(searchTerm);
  }, [searchTerm]);

  // 处理搜索
  const handleSearch = useCallback(() => {
    onSearchTermChange(localSearchTerm);
  }, [localSearchTerm, onSearchTermChange]);

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
            <Input placeholder="搜索题集名称、描述、知识点..." value={localSearchTerm} onChange={e => setLocalSearchTerm(e.target.value)} onKeyPress={handleKeyPress} className="flex-1" />
            <Button onClick={handleSearch} size="default" className="px-3">
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* 筛选器 */}
        <div className="flex flex-col sm:flex-row gap-3 lg:flex-shrink-0">
          {/* 学科筛选 */}
          <Select value={selectedSubject} onValueChange={onSubjectChange} disabled={subjectsLoading}>
            <SelectTrigger className="w-full sm:w-[120px]">
              <SelectValue placeholder="学科" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部学科</SelectItem>
              {subjects.map(subject => <SelectItem key={subject.name} value={subject.name}>
                  {subject.name}
                </SelectItem>)}
            </SelectContent>
          </Select>

          {/* 答卷状态筛选 */}
          <Select value={hasAnswerFilter === undefined ? "all" : hasAnswerFilter ? "has" : "none"} onValueChange={value => {
          if (value === "all") {
            onHasAnswerFilterChange(undefined);
          } else if (value === "has") {
            onHasAnswerFilterChange(true);
          } else {
            onHasAnswerFilterChange(false);
          }
        }}>
            <SelectTrigger className="w-full sm:w-[120px]">
              <SelectValue placeholder="状态" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">提交状态</SelectItem>
              <SelectItem value="has">已提交</SelectItem>
              <SelectItem value="none">未提交</SelectItem>
            </SelectContent>
          </Select>
          {/* 分析状态筛选 */}
          <Select value={isAnalysisCompletedFilter === undefined ? "all" : isAnalysisCompletedFilter ? "completed" : "pending"} onValueChange={value => {
          if (value === "all") {
            onIsAnalysisCompletedFilterChange(undefined);
          } else if (value === "completed") {
            onIsAnalysisCompletedFilterChange(true);
          } else {
            onIsAnalysisCompletedFilterChange(false);
          }
        }}>
            <SelectTrigger className="w-full sm:w-[120px]">
              <SelectValue placeholder="分析状态" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">分析状态</SelectItem>
              <SelectItem value="completed">已分析</SelectItem>
              <SelectItem value="pending">未分析</SelectItem>
            </SelectContent>
          </Select>
          {/* 题目PDF状态筛选 */}
          <Select value={hasQuestionsPdfFilter === undefined ? "all" : hasQuestionsPdfFilter ? "has" : "none"} onValueChange={value => {
          if (value === "all") {
            onHasQuestionsPdfFilterChange(undefined);
          } else if (value === "has") {
            onHasQuestionsPdfFilterChange(true);
          } else {
            onHasQuestionsPdfFilterChange(false);
          }
        }}>
            <SelectTrigger className="w-full sm:w-[120px]">
              <SelectValue placeholder="题目PDF" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部题目</SelectItem>
              <SelectItem value="has">有题目PDF</SelectItem>
              <SelectItem value="none">无题目PDF</SelectItem>
            </SelectContent>
          </Select>

          {/* 答案PDF状态筛选 */}
          <Select value={hasAnswersPdfFilter === undefined ? "all" : hasAnswersPdfFilter ? "has" : "none"} onValueChange={value => {
          if (value === "all") {
            onHasAnswersPdfFilterChange(undefined);
          } else if (value === "has") {
            onHasAnswersPdfFilterChange(true);
          } else {
            onHasAnswersPdfFilterChange(false);
          }
        }}>
            <SelectTrigger className="w-full sm:w-[120px]">
              <SelectValue placeholder="答案PDF" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部答案</SelectItem>
              <SelectItem value="has">有答案PDF</SelectItem>
              <SelectItem value="none">无答案PDF</SelectItem>
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
