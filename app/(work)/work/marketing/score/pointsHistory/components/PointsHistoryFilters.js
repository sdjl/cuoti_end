"use client";

import { RotateCcw, Search } from "lucide-react";
// 积分变动记录过滤器组件，用于筛选和搜索学生的积分变动记录
import { useCallback, useEffect, useState } from "react";
import { Button } from "../../../../../../../components/ui/button.js";
import { Input } from "../../../../../../../components/ui/input.js";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../../../../../components/ui/select.js";
import { DISPLAY_TEXT } from "../../../../../../../lib/config/constants.js";
// 成长类型选项
const GROWTH_TYPE_OPTIONS = [{
  value: "all",
  label: "全部类型"
}, {
  value: "课程错题",
  label: DISPLAY_TEXT.COURSE_MISTAKE
}, {
  value: "自主上传错题",
  label: DISPLAY_TEXT.SELF_UPLOAD_MISTAKE
}, {
  value: "上传错题",
  label: "上传错题"
}, {
  value: "获得荣誉",
  label: "获得荣誉"
}, {
  value: "学情记录",
  label: "学情记录"
}, {
  value: "分享获得积分",
  label: "分享获得积分"
}, {
  value: "邀请获得积分",
  label: "邀请获得积分"
}, {
  value: "抽奖消耗积分",
  label: "抽奖消耗积分"
}, {
  value: "兑换消耗积分",
  label: "兑换消耗积分"
}, {
  value: "手动调整积分",
  label: "手动调整积分"
}, {
  value: "积分返还",
  label: "积分返还"
}];
export default function PointsHistoryFilters({
  studentSearch,
  setStudentSearch,
  selectedClassId,
  setSelectedClassId,
  selectedGrowthType,
  setSelectedGrowthType,
  selectedIsShowInGrowthPath,
  setSelectedIsShowInGrowthPath,
  classrooms,
  onReset
}) {
  const [localStudentSearch, setLocalStudentSearch] = useState(studentSearch);

  // 同步外部的 studentSearch 变化到本地状态
  useEffect(() => {
    setLocalStudentSearch(studentSearch);
  }, [studentSearch]);

  // 处理搜索
  const handleSearch = useCallback(() => {
    setStudentSearch(localStudentSearch);
  }, [localStudentSearch, setStudentSearch]);

  // 处理回车搜索
  const handleKeyPress = useCallback(e => {
    if (e.key === "Enter") {
      handleSearch();
    }
  }, [handleSearch]);

  // 处理重置
  const handleReset = useCallback(() => {
    setLocalStudentSearch("");
    onReset();
  }, [onReset]);
  return <div className="bg-white p-4 rounded-lg shadow-sm space-y-4">
      <div className="flex flex-col lg:flex-row gap-4">
        {/* 搜索框 */}
        <div className="flex-1">
          <div className="flex gap-2">
            <Input placeholder="搜索学生姓名或学生编号..." value={localStudentSearch} onChange={e => setLocalStudentSearch(e.target.value)} onKeyPress={handleKeyPress} className="flex-1" />
            <Button onClick={handleSearch} size="default" className="px-3">
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* 筛选器 */}
        <div className="flex flex-col sm:flex-row gap-3 lg:flex-shrink-0">
          {/* 班级筛选 */}
          <Select value={selectedClassId} onValueChange={setSelectedClassId}>
            <SelectTrigger className="w-full sm:w-[140px]">
              <SelectValue placeholder="选择班级" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部班级</SelectItem>
              {classrooms.map(classroom => <SelectItem key={classroom._id} value={classroom._id}>
                  {classroom.name}
                </SelectItem>)}
            </SelectContent>
          </Select>

          {/* 成长类型筛选 */}
          <Select value={selectedGrowthType} onValueChange={setSelectedGrowthType}>
            <SelectTrigger className="w-full sm:w-[140px]">
              <SelectValue placeholder="成长类型" />
            </SelectTrigger>
            <SelectContent>
              {GROWTH_TYPE_OPTIONS.map(option => <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>)}
            </SelectContent>
          </Select>

          {/* 是否显示在成长路径筛选 */}
          <Select value={selectedIsShowInGrowthPath} onValueChange={setSelectedIsShowInGrowthPath}>
            <SelectTrigger className="w-full sm:w-[160px]">
              <SelectValue placeholder="成长路径显示" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部记录</SelectItem>
              <SelectItem value="show">显示在成长路径</SelectItem>
              <SelectItem value="hide">不显示在成长路径</SelectItem>
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
