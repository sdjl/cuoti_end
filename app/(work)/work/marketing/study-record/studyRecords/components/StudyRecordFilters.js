"use client";

import { RotateCcw, Search } from "lucide-react";
// 学情记录筛选组件，提供搜索、班级筛选等功能
import { useCallback, useEffect, useState } from "react";
import { Button } from "../../../../../../../components/ui/button.js";
import { Input } from "../../../../../../../components/ui/input.js";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../../../../../components/ui/select.js";
export default function StudyRecordFilters({
  classrooms,
  searchContent,
  studentSearch,
  selectedClassId,
  onSearch,
  onReset
}) {
  const [localSearchContent, setLocalSearchContent] = useState(searchContent);
  const [localStudentSearch, setLocalStudentSearch] = useState(studentSearch);
  const [localSelectedClassId, setLocalSelectedClassId] = useState(selectedClassId);

  // 同步父组件的状态变化
  useEffect(() => {
    setLocalSearchContent(searchContent);
  }, [searchContent]);
  useEffect(() => {
    setLocalStudentSearch(studentSearch);
  }, [studentSearch]);
  useEffect(() => {
    setLocalSelectedClassId(selectedClassId);
  }, [selectedClassId]);
  const handleSearch = useCallback(() => {
    onSearch({
      searchContent: localSearchContent,
      studentSearch: localStudentSearch,
      selectedClassId: localSelectedClassId
    });
  }, [localSearchContent, localStudentSearch, localSelectedClassId, onSearch]);
  const handleKeyPress = useCallback(e => {
    if (e.key === "Enter") {
      handleSearch();
    }
  }, [handleSearch]);
  const handleReset = useCallback(() => {
    setLocalSearchContent("");
    setLocalStudentSearch("");
    setLocalSelectedClassId("all");
    onReset();
  }, [onReset]);

  // 班级改变时自动搜索
  const handleClassChange = useCallback(value => {
    setLocalSelectedClassId(value);
    // 立即触发搜索
    onSearch({
      searchContent: localSearchContent,
      studentSearch: localStudentSearch,
      selectedClassId: value
    });
  }, [localSearchContent, localStudentSearch, onSearch]);
  return <div className="bg-white p-4 rounded-lg shadow-sm">
      <div className="flex flex-col xl:flex-row gap-4 xl:items-end">
        {/* 记录内容搜索框 */}
        <div className="flex-1 min-w-0">
          <Input placeholder="搜索记录内容..." value={localSearchContent} onChange={e => setLocalSearchContent(e.target.value)} onKeyPress={handleKeyPress} />
        </div>

        {/* 学生搜索框 */}
        <div className="flex-1 min-w-0">
          <Input placeholder="搜索学生姓名或编号..." value={localStudentSearch} onChange={e => setLocalStudentSearch(e.target.value)} onKeyPress={handleKeyPress} />
        </div>

        {/* 班级筛选 */}
        <div className="w-full xl:w-[180px]">
          <Select value={localSelectedClassId} onValueChange={handleClassChange}>
            <SelectTrigger>
              <SelectValue placeholder="选择班级" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部班级</SelectItem>
              {classrooms.map(classroom => <SelectItem key={classroom._id} value={classroom._id}>
                  {classroom.name}
                </SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* 操作按钮 */}
        <div className="flex gap-2">
          <Button onClick={handleSearch} size="default" className="px-6">
            <Search className="h-4 w-4 mr-2" />
            搜索
          </Button>
          <Button variant="outline" onClick={handleReset} className="px-3">
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>;
}
