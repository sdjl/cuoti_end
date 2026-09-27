"use client";

import { endOfMonth, endOfWeek, format, startOfMonth, startOfWeek, subDays, subMonths, subWeeks } from "date-fns";
import { zhCN } from "date-fns/locale";
import { CalendarIcon, Check, ChevronsUpDown, Loader2 } from "lucide-react";
// 邀请码统计过滤器组件，提供统计范围、班级、学生和时间范围的选择
import { useMemo, useState } from "react";
import { Button } from "../../../../../../../components/ui/button.js";
import { Calendar } from "../../../../../../../components/ui/calendar.js";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../../../../../components/ui/card.js";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "../../../../../../../components/ui/command.js";
import { Label } from "../../../../../../../components/ui/label.js";
import { Popover, PopoverContent, PopoverTrigger } from "../../../../../../../components/ui/popover.js";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../../../../../components/ui/select.js";
import { cn } from "../../../../../../../lib/shadcn/utils.js";
export default function InvitationStatFilters({
  filterState,
  onFilterChange,
  classRooms,
  students,
  loadingClassRooms,
  loadingStudents,
  onLoadStudents,
  onQuery,
  querying
}) {
  const [studentSearchOpen, setStudentSearchOpen] = useState(false);
  const [studentSearchValue, setStudentSearchValue] = useState("");

  // 根据时间范围计算日期
  const getDateRangeByTimeRange = timeRange => {
    const today = new Date();
    switch (timeRange) {
      case "today":
        return {
          startDate: today,
          endDate: today
        };
      case "yesterday":
        {
          const yesterday = subDays(today, 1);
          return {
            startDate: yesterday,
            endDate: yesterday
          };
        }
      case "thisWeek":
        return {
          startDate: startOfWeek(today, {
            weekStartsOn: 1
          }),
          endDate: endOfWeek(today, {
            weekStartsOn: 1
          })
        };
      case "lastWeek":
        {
          const lastWeek = subWeeks(today, 1);
          return {
            startDate: startOfWeek(lastWeek, {
              weekStartsOn: 1
            }),
            endDate: endOfWeek(lastWeek, {
              weekStartsOn: 1
            })
          };
        }
      case "thisMonth":
        return {
          startDate: startOfMonth(today),
          endDate: endOfMonth(today)
        };
      case "lastMonth":
        {
          const lastMonth = subMonths(today, 1);
          return {
            startDate: startOfMonth(lastMonth),
            endDate: endOfMonth(lastMonth)
          };
        }
      default:
        return {};
    }
  };

  // 当范围改变时重置子选项
  const handleScopeChange = scope => {
    onFilterChange({
      ...filterState,
      scope,
      classRoomId: undefined,
      studentId: undefined
    });
  };

  // 当班级改变时重置学生选项并加载学生
  const handleClassRoomChange = classRoomId => {
    onFilterChange({
      ...filterState,
      classRoomId,
      studentId: undefined
    });
    if (classRoomId) {
      onLoadStudents(classRoomId);
    }
  };

  // 当学生改变时
  const handleStudentChange = studentId => {
    onFilterChange({
      ...filterState,
      studentId
    });
    setStudentSearchOpen(false);
    setStudentSearchValue("");
  };

  // 当时间范围改变时
  const handleTimeRangeChange = timeRange => {
    const dateRange = getDateRangeByTimeRange(timeRange);
    onFilterChange({
      ...filterState,
      timeRange,
      startDate: dateRange.startDate,
      endDate: dateRange.endDate
    });
  };

  // 当自定义开始日期改变时
  const handleStartDateChange = date => {
    onFilterChange({
      ...filterState,
      startDate: date
    });
  };

  // 当自定义结束日期改变时
  const handleEndDateChange = date => {
    onFilterChange({
      ...filterState,
      endDate: date
    });
  };

  // 获取当前选中的班级
  const selectedClassRoom = useMemo(() => {
    return classRooms.find(c => c._id === filterState.classRoomId);
  }, [classRooms, filterState.classRoomId]);

  // 获取当前选中的学生
  const selectedStudent = useMemo(() => {
    return students.find(s => s._id === filterState.studentId);
  }, [students, filterState.studentId]);

  // 过滤学生列表
  const filteredStudents = useMemo(() => {
    if (!studentSearchValue) return students;
    const searchLower = studentSearchValue.toLowerCase();
    return students.filter(student => student.name.toLowerCase().includes(searchLower) || student.studentCode.toLowerCase().includes(searchLower));
  }, [students, studentSearchValue]);

  // 检查查询条件是否完整
  const isQueryDisabled = useMemo(() => {
    // 如果正在查询，禁用按钮
    if (querying) return true;

    // 检查基本条件：必须选择班级
    if (!filterState.classRoomId) return true;

    // 如果是按学生统计，还必须选择学生
    if (filterState.scope === "student" && !filterState.studentId) return true;

    // 如果是自定义时间区间，必须选择开始和结束日期
    if (filterState.timeRange === "custom") {
      if (!filterState.startDate || !filterState.endDate) return true;
    }
    return false;
  }, [filterState, querying]);
  return <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>筛选条件</CardTitle>
            <CardDescription>
              选择查看范围和时间，查看邀请码使用统计数据，时间按邀请码创建时间统计
            </CardDescription>
          </div>
          <Button onClick={onQuery} disabled={isQueryDisabled} className="min-w-[100px]">
            {querying ? <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                查询中
              </> : "查询"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 左右布局：左边是统计范围相关，右边是时间选择 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 左侧：统计范围、班级选择、学生选择 */}
          <div className="space-y-6">
            {/* 统计范围 */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">统计范围</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button variant={filterState.scope === "classroom" ? "default" : "outline"} size="sm" onClick={() => handleScopeChange("classroom")}>
                  按班级
                </Button>
                <Button variant={filterState.scope === "student" ? "default" : "outline"} size="sm" onClick={() => handleScopeChange("student")}>
                  按学生
                </Button>
              </div>
            </div>

            {/* 班级选择 */}
            {(filterState.scope === "classroom" || filterState.scope === "student") && <div className="space-y-3">
                <Label className="text-sm font-medium">选择班级</Label>
                <Select value={filterState.classRoomId || ""} onValueChange={handleClassRoomChange} disabled={loadingClassRooms}>
                  <SelectTrigger>
                    <SelectValue placeholder={loadingClassRooms ? "加载班级中..." : "请选择班级"} />
                  </SelectTrigger>
                  <SelectContent>
                    {classRooms.map(classRoom => <SelectItem key={classRoom._id} value={classRoom._id}>
                        {classRoom.grade} - {classRoom.name}
                      </SelectItem>)}
                  </SelectContent>
                </Select>
              </div>}

            {/* 学生选择 */}
            {filterState.scope === "student" && selectedClassRoom && <div className="space-y-3">
                <Label className="text-sm font-medium">选择学生</Label>
                <Popover open={studentSearchOpen} onOpenChange={setStudentSearchOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" role="combobox" aria-expanded={studentSearchOpen} className="w-full justify-between" disabled={loadingStudents}>
                      {selectedStudent ? <span>
                          {selectedStudent.name} ({selectedStudent.studentCode})
                        </span> : loadingStudents ? <span className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          加载学生中...
                        </span> : "请选择学生"}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0" align="start">
                    <Command>
                      <CommandInput placeholder="搜索学生姓名或编号..." value={studentSearchValue} onValueChange={setStudentSearchValue} />
                      <CommandEmpty>
                        {students.length === 0 ? "暂无学生数据" : "未找到学生"}
                      </CommandEmpty>
                      <CommandList>
                        <CommandGroup>
                          {filteredStudents.map(student => <CommandItem key={student._id} value={`${student.name}-${student.studentCode}`} onSelect={() => handleStudentChange(student._id)}>
                              <Check className={cn("mr-2 h-4 w-4", selectedStudent?._id === student._id ? "opacity-100" : "opacity-0")} />
                              <div className="flex flex-col">
                                <span>{student.name}</span>
                                <span className="text-xs text-muted-foreground">
                                  编号: {student.studentCode}
                                </span>
                              </div>
                            </CommandItem>)}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>}
          </div>

          {/* 右侧：统计时间 */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">统计时间</Label>
              {filterState.timeRange !== "all" && filterState.timeRange !== "custom" && filterState.startDate && filterState.endDate && <span className="text-xs text-muted-foreground">
                    {format(filterState.startDate, "yyyy年M月d日", {
                locale: zhCN
              })}{" "}
                    -{" "}
                    {format(filterState.endDate, "yyyy年M月d日", {
                locale: zhCN
              })}
                  </span>}
            </div>
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <Button variant={filterState.timeRange === "all" ? "default" : "outline"} size="sm" onClick={() => handleTimeRangeChange("all")}>
                  所有时间
                </Button>
                <Button variant={filterState.timeRange === "today" ? "default" : "outline"} size="sm" onClick={() => handleTimeRangeChange("today")}>
                  今日
                </Button>
                <Button variant={filterState.timeRange === "yesterday" ? "default" : "outline"} size="sm" onClick={() => handleTimeRangeChange("yesterday")}>
                  昨日
                </Button>
                <Button variant={filterState.timeRange === "thisWeek" ? "default" : "outline"} size="sm" onClick={() => handleTimeRangeChange("thisWeek")}>
                  本周
                </Button>
                <Button variant={filterState.timeRange === "lastWeek" ? "default" : "outline"} size="sm" onClick={() => handleTimeRangeChange("lastWeek")}>
                  上周
                </Button>
                <Button variant={filterState.timeRange === "thisMonth" ? "default" : "outline"} size="sm" onClick={() => handleTimeRangeChange("thisMonth")}>
                  本月
                </Button>
                <Button variant={filterState.timeRange === "lastMonth" ? "default" : "outline"} size="sm" onClick={() => handleTimeRangeChange("lastMonth")}>
                  上月
                </Button>
                <Button variant={filterState.timeRange === "custom" ? "default" : "outline"} size="sm" onClick={() => handleTimeRangeChange("custom")}>
                  自定义区间
                </Button>
              </div>

              {/* 自定义时间区间 */}
              {filterState.timeRange === "custom" && <div className="grid grid-cols-2 gap-3 mt-3">
                  <div>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !filterState.startDate && "text-muted-foreground")}>
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {filterState.startDate ? format(filterState.startDate, "yyyy年M月d日", {
                        locale: zhCN
                      }) : "开始日期"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar mode="single" selected={filterState.startDate} onSelect={handleStartDateChange} initialFocus locale={zhCN} />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !filterState.endDate && "text-muted-foreground")}>
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {filterState.endDate ? format(filterState.endDate, "yyyy年M月d日", {
                        locale: zhCN
                      }) : "结束日期"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar mode="single" selected={filterState.endDate} onSelect={handleEndDateChange} initialFocus locale={zhCN} disabled={date => filterState.startDate ? date < filterState.startDate : false} />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>;
}
