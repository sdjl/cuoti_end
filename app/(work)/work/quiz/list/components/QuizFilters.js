"use client";

import { RotateCcw, Search } from "lucide-react";
// 口述核心知识点筛选组件，提供搜索、科目、年级、状态等筛选功能
import { useCallback, useEffect, useState } from "react";
import { Button } from "../../../../../../components/ui/button.js";
import { Input } from "../../../../../../components/ui/input.js";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../../../../components/ui/select.js";
import { useSubjects } from "../../../../../../hooks/useAdminConfig.js";
import { DISPLAY_TEXT } from "../../../../../../lib/config/constants.js";
import { getSchoolGradesAction } from "../actions.js";
export default function QuizFilters({
  searchTerm,
  setSearchTerm,
  selectedSubject,
  setSelectedSubject,
  selectedGrade,
  setSelectedGrade,
  selectedStatus,
  setSelectedStatus,
  selectedTeamEnabled,
  setSelectedTeamEnabled,
  selectedActivityStatus,
  setSelectedActivityStatus,
  onResetFilters
}) {
  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm);
  const {
    subjects,
    loading: subjectsLoading
  } = useSubjects();
  const [grades, setGrades] = useState([]);
  const [gradesLoading, setGradesLoading] = useState(true);

  // 获取年级列表
  useEffect(() => {
    const fetchGrades = async () => {
      try {
        setGradesLoading(true);
        const gradesList = await getSchoolGradesAction();
        setGrades(gradesList);
      } catch (error) {
        console.error("获取年级列表失败:", error);
      } finally {
        setGradesLoading(false);
      }
    };
    fetchGrades();
  }, []);

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
            <Input placeholder={`搜索${DISPLAY_TEXT.ORAL_KNOWLEDGE_QUIZ}标题、描述...`} value={localSearchTerm} onChange={e => setLocalSearchTerm(e.target.value)} onKeyPress={handleKeyPress} className="flex-1" />
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

          {/* 年级筛选 */}
          <Select value={selectedGrade} onValueChange={setSelectedGrade}>
            <SelectTrigger className="w-full sm:w-[120px]">
              <SelectValue placeholder="年级" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部年级</SelectItem>
              {!gradesLoading && grades.map(grade => <SelectItem key={grade} value={grade}>
                    {grade}
                  </SelectItem>)}
            </SelectContent>
          </Select>

          {/* 状态筛选 */}
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-full sm:w-[120px]">
              <SelectValue placeholder="状态" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部状态</SelectItem>
              <SelectItem value="unlocked">未锁定</SelectItem>
              <SelectItem value="locked">已锁定</SelectItem>
            </SelectContent>
          </Select>

          {/* 组队功能筛选 */}
          <Select value={selectedTeamEnabled} onValueChange={setSelectedTeamEnabled}>
            <SelectTrigger className="w-full sm:w-[120px]">
              <SelectValue placeholder="组队功能" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部组队</SelectItem>
              <SelectItem value="enabled">已开启</SelectItem>
              <SelectItem value="disabled">未开启</SelectItem>
            </SelectContent>
          </Select>

          {/* 活动状态筛选 */}
          <Select value={selectedActivityStatus} onValueChange={setSelectedActivityStatus}>
            <SelectTrigger className="w-full sm:w-[140px]">
              <SelectValue placeholder="活动状态" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部时间</SelectItem>
              <SelectItem value="ongoing">进行中</SelectItem>
              <SelectItem value="ended">已结束</SelectItem>
              <SelectItem value="no-time">无时间限制</SelectItem>
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
