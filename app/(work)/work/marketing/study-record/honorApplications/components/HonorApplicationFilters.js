"use client";

import { RotateCcw, Search } from "lucide-react";
// 荣誉申请过滤器组件，提供搜索和筛选功能
import { useCallback, useState } from "react";
import { Button } from "../../../../../../../components/ui/button.js";
import { Input } from "../../../../../../../components/ui/input.js";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../../../../../components/ui/select.js";
export default function HonorApplicationFilters({
  classrooms,
  searchText,
  studentSearch,
  selectedClassId,
  selectedStatus,
  selectedShowInHonorBoard,
  onSearch,
  onReset
}) {
  const [localSearchText, setLocalSearchText] = useState(searchText);
  const [localStudentSearch, setLocalStudentSearch] = useState(studentSearch);
  const [localSelectedClassId, setLocalSelectedClassId] = useState(selectedClassId);
  const [localSelectedStatus, setLocalSelectedStatus] = useState(selectedStatus);
  const [localSelectedShowInHonorBoard, setLocalSelectedShowInHonorBoard] = useState(selectedShowInHonorBoard);
  const handleSearch = useCallback(() => {
    onSearch({
      searchText: localSearchText,
      studentSearch: localStudentSearch,
      selectedClassId: localSelectedClassId,
      selectedStatus: localSelectedStatus,
      selectedShowInHonorBoard: localSelectedShowInHonorBoard
    });
  }, [localSearchText, localStudentSearch, localSelectedClassId, localSelectedStatus, localSelectedShowInHonorBoard, onSearch]);
  const handleKeyPress = useCallback(e => {
    if (e.key === "Enter") {
      handleSearch();
    }
  }, [handleSearch]);
  const handleReset = useCallback(() => {
    setLocalSearchText("");
    setLocalStudentSearch("");
    setLocalSelectedClassId("all");
    setLocalSelectedStatus("all");
    setLocalSelectedShowInHonorBoard("all");
    onReset();
  }, [onReset]);
  return <div className="bg-white p-4 rounded-lg shadow-sm">
      <div className="flex flex-col xl:flex-row gap-4 xl:items-end">
        {/* 备注、荣誉名称搜索框 */}
        <div className="flex-1 min-w-0">
          <Input placeholder="搜索荣誉名称、学生备注、老师评语..." value={localSearchText} onChange={e => setLocalSearchText(e.target.value)} onKeyPress={handleKeyPress} />
        </div>

        {/* 学生搜索框 */}
        <div className="flex-1 min-w-0">
          <Input placeholder="搜索学生姓名或编号..." value={localStudentSearch} onChange={e => setLocalStudentSearch(e.target.value)} onKeyPress={handleKeyPress} />
        </div>

        {/* 班级筛选 */}
        <div className="w-full xl:w-[180px]">
          <Select value={localSelectedClassId} onValueChange={setLocalSelectedClassId}>
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

        {/* 状态筛选 */}
        <div className="w-full xl:w-[180px]">
          <Select value={localSelectedStatus} onValueChange={setLocalSelectedStatus}>
            <SelectTrigger>
              <SelectValue placeholder="选择状态" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部状态</SelectItem>
              <SelectItem value="pending">待审核</SelectItem>
              <SelectItem value="completed">已通过</SelectItem>
              <SelectItem value="cancelled">已取消</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* 显示在荣誉榜筛选 */}
        <div className="w-full xl:w-[180px]">
          <Select value={localSelectedShowInHonorBoard} onValueChange={setLocalSelectedShowInHonorBoard}>
            <SelectTrigger>
              <SelectValue placeholder="荣誉榜显示" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部</SelectItem>
              <SelectItem value="true">显示在荣誉榜</SelectItem>
              <SelectItem value="false">不显示</SelectItem>
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
