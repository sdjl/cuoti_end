"use client";

import { RotateCcw, Search } from "lucide-react";
// 手动积分记录过滤器组件，用于筛选和搜索手动积分记录
import { useCallback, useEffect, useState } from "react";
import { Button } from "../../../../../../../components/ui/button.js";
import { Input } from "../../../../../../../components/ui/input.js";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../../../../../components/ui/select.js";
export default function ManualRecordsFilters({
  searchText,
  setSearchText,
  studentSearch,
  setStudentSearch,
  selectedClassId,
  setSelectedClassId,
  classrooms,
  onReset
}) {
  const [localSearchText, setLocalSearchText] = useState(searchText);
  const [localStudentSearch, setLocalStudentSearch] = useState(studentSearch);

  // 同步外部的搜索条件变化到本地状态
  useEffect(() => {
    setLocalSearchText(searchText);
  }, [searchText]);
  useEffect(() => {
    setLocalStudentSearch(studentSearch);
  }, [studentSearch]);

  // 处理搜索
  const handleSearch = useCallback(() => {
    setSearchText(localSearchText);
    setStudentSearch(localStudentSearch);
  }, [localSearchText, localStudentSearch, setSearchText, setStudentSearch]);

  // 处理回车搜索
  const handleKeyPress = useCallback(e => {
    if (e.key === "Enter") {
      handleSearch();
    }
  }, [handleSearch]);

  // 处理重置
  const handleReset = useCallback(() => {
    setLocalSearchText("");
    setLocalStudentSearch("");
    onReset();
  }, [onReset]);
  return <div className="bg-white p-4 rounded-lg shadow-sm">
      <div className="flex flex-col xl:flex-row gap-4 xl:items-end">
        {/* 修改原因搜索框 */}
        <div className="flex-1 min-w-0">
          <Input placeholder="搜索修改原因..." value={localSearchText} onChange={e => setLocalSearchText(e.target.value)} onKeyPress={handleKeyPress} />
        </div>

        {/* 学生搜索框 */}
        <div className="flex-1 min-w-0">
          <Input placeholder="搜索学生编号或姓名..." value={localStudentSearch} onChange={e => setLocalStudentSearch(e.target.value)} onKeyPress={handleKeyPress} />
        </div>

        {/* 班级筛选 */}
        <div className="w-full xl:w-[180px]">
          <Select value={selectedClassId} onValueChange={setSelectedClassId}>
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
