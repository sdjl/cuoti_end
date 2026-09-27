"use client";

import { endOfMonth, endOfWeek, format, startOfMonth, startOfWeek, subDays, subMonths, subWeeks } from "date-fns";
import { zhCN } from "date-fns/locale";
import { CalendarIcon, Loader2 } from "lucide-react";
// 学生分组对比统计筛选组件，提供时间范围筛选功能
import { useMemo } from "react";
import { Button } from "../../../../../../../components/ui/button.js";
import { Calendar } from "../../../../../../../components/ui/calendar.js";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../../../../../components/ui/card.js";
import { Label } from "../../../../../../../components/ui/label.js";
import { Popover, PopoverContent, PopoverTrigger } from "../../../../../../../components/ui/popover.js";
import { cn } from "../../../../../../../lib/shadcn/utils.js";
export default function ComparisonFilters({
  filterState,
  onFilterChange,
  onQuery,
  querying
}) {
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

  // 检查查询条件是否完整
  const isQueryDisabled = useMemo(() => {
    // 如果正在查询，禁用按钮
    if (querying) return true;

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
              查看所有学生分组的错题重练对比统计
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
        {/* 统计时间 */}
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
      </CardContent>
    </Card>;
}
