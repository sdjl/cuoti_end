"use client";

import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { CalendarIcon, RotateCcw, X } from "lucide-react";
// 非登录用户自主上传错题AI问答过滤组件，提供学生姓名、时间范围、掌握情况和排序等筛选功能
import { useCallback, useEffect, useState } from "react";
import { Button } from "../../../../../../../components/ui/button.js";
import { Calendar } from "../../../../../../../components/ui/calendar.js";
import { Input } from "../../../../../../../components/ui/input.js";
import { Popover, PopoverContent, PopoverTrigger } from "../../../../../../../components/ui/popover.js";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../../../../../components/ui/select.js";
import { cn } from "../../../../../../../lib/shadcn/utils.js";
export default function GuestAIQuestionFilters({
  studentName,
  setStudentName,
  startTime,
  setStartTime,
  endTime,
  setEndTime,
  sortOrder,
  setSortOrder,
  masteryStatus,
  setMasteryStatus,
  onReset
}) {
  const [localStudentName, setLocalStudentName] = useState(studentName);
  const [localStartDate, setLocalStartDate] = useState(startTime ? new Date(`${startTime}T00:00:00`) : undefined);
  const [localEndDate, setLocalEndDate] = useState(endTime ? new Date(`${endTime}T00:00:00`) : undefined);

  // 同步外部状态变化到本地状态（仅在外部状态变化且本地状态为空时）
  useEffect(() => {
    if (studentName !== localStudentName && localStudentName === "") {
      setLocalStudentName(studentName);
    }
  }, [studentName, localStudentName]);
  useEffect(() => {
    if (startTime && !localStartDate) {
      setLocalStartDate(new Date(`${startTime}T00:00:00`));
    }
  }, [startTime, localStartDate]);
  useEffect(() => {
    if (endTime && !localEndDate) {
      setLocalEndDate(new Date(`${endTime}T00:00:00`));
    }
  }, [endTime, localEndDate]);

  // 处理搜索
  const handleSearch = useCallback(() => {
    setStudentName(localStudentName);
    setStartTime(localStartDate ? format(localStartDate, "yyyy-MM-dd") : "");
    setEndTime(localEndDate ? format(localEndDate, "yyyy-MM-dd") : "");
  }, [localStudentName, localStartDate, localEndDate, setStudentName, setStartTime, setEndTime]);

  // 处理回车搜索
  const handleKeyPress = useCallback(e => {
    if (e.key === "Enter") {
      handleSearch();
    }
  }, [handleSearch]);

  // 处理重置
  const handleReset = useCallback(() => {
    setLocalStudentName("");
    setLocalStartDate(undefined);
    setLocalEndDate(undefined);
    onReset();
  }, [onReset]);
  return <div className="bg-white p-4 rounded-lg shadow-sm space-y-4">
      <div className="flex flex-col lg:flex-row gap-4">
        {/* 学生信息搜索 */}
        <div className="flex-1">
          <div className="grid grid-cols-1 gap-3">
            <div className="relative">
              <Input placeholder="学生姓名或openid..." value={localStudentName} onChange={e => setLocalStudentName(e.target.value)} onKeyPress={handleKeyPress} className="pr-8" />
              {localStudentName && <Button variant="ghost" size="sm" className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0 hover:bg-gray-100" onClick={() => setLocalStudentName("")}>
                  <X className="h-3 w-3" />
                </Button>}
            </div>
          </div>
        </div>

        {/* 时间范围搜索 */}
        <div className="flex-1">
          <div className="space-y-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !localStartDate && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {localStartDate ? format(localStartDate, "yyyy年M月d日", {
                      locale: zhCN
                    }) : "开始日期"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={localStartDate} onSelect={setLocalStartDate} initialFocus locale={zhCN} />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-1">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !localEndDate && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {localEndDate ? format(localEndDate, "yyyy年M月d日", {
                      locale: zhCN
                    }) : "结束日期"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={localEndDate} onSelect={setLocalEndDate} initialFocus locale={zhCN} disabled={date => localStartDate ? date < localStartDate : false} />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>
        </div>

        {/* 掌握情况过滤 */}
        <div className="flex-shrink-0">
          <div className="space-y-2">
            <Select value={masteryStatus} onValueChange={setMasteryStatus}>
              <SelectTrigger className="w-24">
                <SelectValue placeholder="掌握情况" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部情况</SelectItem>
                <SelectItem value="mastered">已掌握</SelectItem>
                <SelectItem value="not_mastered">未掌握</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* 排序选择 */}
        <div className="flex-shrink-0">
          <div className="space-y-2">
            <Select value={sortOrder} onValueChange={setSortOrder}>
              <SelectTrigger className="w-20">
                <SelectValue placeholder="排序" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">最新</SelectItem>
                <SelectItem value="oldest">最早</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex gap-2 lg:flex-shrink-0">
          <Button onClick={handleSearch} size="default" className="px-3">
            搜索
          </Button>
          <Button variant="outline" onClick={handleReset} className="px-3">
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>;
}
