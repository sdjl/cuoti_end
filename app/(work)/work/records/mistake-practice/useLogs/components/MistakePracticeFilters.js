"use client";

// 课程错题使用日志的过滤器组件，提供学生搜索、班级选择、时间范围、学生评价和排序等筛选功能
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { CalendarIcon, Check, RotateCcw, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "../../../../../../../components/ui/button.js";
import { Calendar } from "../../../../../../../components/ui/calendar.js";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "../../../../../../../components/ui/command.js";
import { Input } from "../../../../../../../components/ui/input.js";
import { Popover, PopoverContent, PopoverTrigger } from "../../../../../../../components/ui/popover.js";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../../../../../components/ui/select.js";
import { cn } from "../../../../../../../lib/shadcn/utils.js";
import { getSchoolClassroomsAction } from "../classActions.js";
export default function MistakePracticeFilters({
  studentSearch,
  setStudentSearch,
  classroomName,
  setClassroomName,
  startTime,
  setStartTime,
  endTime,
  setEndTime,
  sortOrder,
  setSortOrder,
  studentRating,
  setStudentRating,
  onReset
}) {
  const [localStudentSearch, setLocalStudentSearch] = useState(studentSearch);
  const [localClassroomName, setLocalClassroomName] = useState(classroomName);
  const [localStartDate, setLocalStartDate] = useState(startTime ? new Date(`${startTime}T00:00:00`) : undefined);
  const [localEndDate, setLocalEndDate] = useState(endTime ? new Date(`${endTime}T00:00:00`) : undefined);
  const [classrooms, setClassrooms] = useState([]);
  const [classroomOpen, setClassroomOpen] = useState(false);

  // 加载班级列表
  useEffect(() => {
    async function loadClassrooms() {
      const data = await getSchoolClassroomsAction();
      setClassrooms(data);
    }
    loadClassrooms();
  }, []);

  // 同步外部状态变化到本地状态（仅在外部状态变化且本地状态为空时）
  useEffect(() => {
    if (studentSearch !== localStudentSearch && localStudentSearch === "") {
      setLocalStudentSearch(studentSearch);
    }
  }, [studentSearch, localStudentSearch]);
  useEffect(() => {
    if (classroomName !== localClassroomName && localClassroomName === "") {
      setLocalClassroomName(classroomName);
    }
  }, [classroomName, localClassroomName]);
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
    setStudentSearch(localStudentSearch);
    setClassroomName(localClassroomName);
    setStartTime(localStartDate ? format(localStartDate, "yyyy-MM-dd") : "");
    setEndTime(localEndDate ? format(localEndDate, "yyyy-MM-dd") : "");
  }, [localStudentSearch, localClassroomName, localStartDate, localEndDate, setStudentSearch, setClassroomName, setStartTime, setEndTime]);

  // 处理回车搜索
  const handleKeyPress = useCallback(e => {
    if (e.key === "Enter") {
      handleSearch();
    }
  }, [handleSearch]);

  // 处理重置
  const handleReset = useCallback(() => {
    setLocalStudentSearch("");
    setLocalClassroomName("");
    setLocalStartDate(undefined);
    setLocalEndDate(undefined);
    onReset();
  }, [onReset]);
  return <div className="bg-white p-4 rounded-lg shadow-sm space-y-4">
      <div className="flex flex-col lg:flex-row gap-4">
        {/* 学生和班级搜索 */}
        <div className="flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* 学生搜索（合并编号和姓名） */}
            <div className="relative">
              <Input placeholder="学生编号或姓名..." value={localStudentSearch} onChange={e => setLocalStudentSearch(e.target.value)} onKeyPress={handleKeyPress} className="pr-8" />
              {localStudentSearch && <Button variant="ghost" size="sm" className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0 hover:bg-gray-100" onClick={() => setLocalStudentSearch("")}>
                  <X className="h-3 w-3" />
                </Button>}
            </div>

            {/* 班级搜索 */}
            <Popover open={classroomOpen} onOpenChange={setClassroomOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" aria-expanded={classroomOpen} className="w-full justify-between">
                  {localClassroomName || "选择班级..."}
                  <X className={cn("ml-2 h-4 w-4 shrink-0 opacity-50", localClassroomName && "cursor-pointer hover:opacity-100")} onClick={e => {
                  if (localClassroomName) {
                    e.stopPropagation();
                    setLocalClassroomName("");
                  }
                }} />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[300px] p-0">
                <Command>
                  <CommandInput placeholder="搜索班级..." />
                  <CommandList>
                    <CommandEmpty>未找到班级</CommandEmpty>
                    <CommandGroup>
                      {classrooms.map(classroom => <CommandItem key={classroom._id} value={classroom.name} onSelect={currentValue => {
                      setLocalClassroomName(currentValue);
                      setClassroomOpen(false);
                    }}>
                          <Check className={cn("mr-2 h-4 w-4", localClassroomName === classroom.name ? "opacity-100" : "opacity-0")} />
                          <div className="flex flex-col">
                            <span>{classroom.name}</span>
                            {classroom.grade && <span className="text-xs text-gray-500">
                                {classroom.grade}
                              </span>}
                          </div>
                        </CommandItem>)}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
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

        {/* 学生评价过滤 */}
        <div className="flex-shrink-0">
          <div className="space-y-2">
            <Select value={studentRating} onValueChange={setStudentRating}>
              <SelectTrigger className="w-24">
                <SelectValue placeholder="评价过滤" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部评价</SelectItem>
                <SelectItem value="none">未评价</SelectItem>
                <SelectItem value="1">一颗星</SelectItem>
                <SelectItem value="2">两颗星</SelectItem>
                <SelectItem value="3">三颗星</SelectItem>
                <SelectItem value="4">四颗星</SelectItem>
                <SelectItem value="5">五颗星</SelectItem>
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
