"use client";

import { endOfMonth, endOfWeek, format, startOfMonth, startOfWeek, subDays, subMonths, subWeeks } from "date-fns";
import { zhCN } from "date-fns/locale";
import { CalendarIcon, Loader2, Search } from "lucide-react";
// 错题批量时间范围选择器，提供快捷日期段与自定义查询
import { useState } from "react";
import { Button } from "../../../../../../components/ui/button.js";
import { Calendar } from "../../../../../../components/ui/calendar.js";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../../../../components/ui/card.js";
import { Label } from "../../../../../../components/ui/label.js";
import { Popover, PopoverContent, PopoverTrigger } from "../../../../../../components/ui/popover.js";
import { cn } from "../../../../../../lib/shadcn/utils.js";
export default function TimeRangeSelector({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onQuery,
  isQuerying,
  disabled = false
}) {
  const [selectedTimeRange, setSelectedTimeRange] = useState(null);

  // 根据时间范围设置日期
  const handleTimeRangeChange = timeRange => {
    const today = new Date();
    setSelectedTimeRange(timeRange);
    switch (timeRange) {
      case "today":
        onStartDateChange(today);
        onEndDateChange(today);
        break;
      case "yesterday":
        {
          const yesterday = subDays(today, 1);
          onStartDateChange(yesterday);
          onEndDateChange(yesterday);
          break;
        }
      case "thisWeek":
        onStartDateChange(startOfWeek(today, {
          weekStartsOn: 1
        }));
        onEndDateChange(endOfWeek(today, {
          weekStartsOn: 1
        }));
        break;
      case "lastWeek":
        {
          const lastWeek = subWeeks(today, 1);
          onStartDateChange(startOfWeek(lastWeek, {
            weekStartsOn: 1
          }));
          onEndDateChange(endOfWeek(lastWeek, {
            weekStartsOn: 1
          }));
          break;
        }
      case "thisMonth":
        onStartDateChange(startOfMonth(today));
        onEndDateChange(endOfMonth(today));
        break;
      case "lastMonth":
        {
          const lastMonth = subMonths(today, 1);
          onStartDateChange(startOfMonth(lastMonth));
          onEndDateChange(endOfMonth(lastMonth));
          break;
        }
      case "custom":
        // 自定义区间不设置日期，由用户手动选择
        break;
    }
  };

  // 检查查询按钮是否应该禁用
  const isQueryDisabled = disabled || isQuerying || !startDate || !endDate;
  return <Card>
      <CardHeader>
        <CardTitle>选择时间区间</CardTitle>
        <CardDescription>
          选择答卷提交时间区间，系统将查询该时间段内有答卷记录的试卷题集
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 快捷时间选择 */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">快捷选择</Label>
          <div className="grid grid-cols-7 gap-2">
            <Button variant={selectedTimeRange === "today" ? "default" : "outline"} size="sm" onClick={() => handleTimeRangeChange("today")} disabled={disabled}>
              今日
            </Button>
            <Button variant={selectedTimeRange === "yesterday" ? "default" : "outline"} size="sm" onClick={() => handleTimeRangeChange("yesterday")} disabled={disabled}>
              昨日
            </Button>
            <Button variant={selectedTimeRange === "thisWeek" ? "default" : "outline"} size="sm" onClick={() => handleTimeRangeChange("thisWeek")} disabled={disabled}>
              本周
            </Button>
            <Button variant={selectedTimeRange === "lastWeek" ? "default" : "outline"} size="sm" onClick={() => handleTimeRangeChange("lastWeek")} disabled={disabled}>
              上周
            </Button>
            <Button variant={selectedTimeRange === "thisMonth" ? "default" : "outline"} size="sm" onClick={() => handleTimeRangeChange("thisMonth")} disabled={disabled}>
              本月
            </Button>
            <Button variant={selectedTimeRange === "lastMonth" ? "default" : "outline"} size="sm" onClick={() => handleTimeRangeChange("lastMonth")} disabled={disabled}>
              上月
            </Button>
            <Button variant={selectedTimeRange === "custom" ? "default" : "outline"} size="sm" onClick={() => handleTimeRangeChange("custom")} disabled={disabled}>
              自定义
            </Button>
          </div>
        </div>

        {/* 自定义时间选择 */}
        {selectedTimeRange === "custom" && <div className="space-y-3">
            <Label className="text-sm font-medium">自定义区间</Label>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !startDate && "text-muted-foreground")} disabled={disabled}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, "yyyy年M月d日", {
                    locale: zhCN
                  }) : "开始日期"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={startDate} onSelect={onStartDateChange} initialFocus locale={zhCN} />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="flex-1">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !endDate && "text-muted-foreground")} disabled={disabled}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, "yyyy年M月d日", {
                    locale: zhCN
                  }) : "结束日期"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar mode="single" selected={endDate} onSelect={onEndDateChange} initialFocus locale={zhCN} disabled={date => startDate ? date < startDate : false} />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>}

        {/* 显示选择的时间区间 */}
        {startDate && endDate && <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
            已选择时间区间：
            <span className="font-medium text-gray-900 ml-1">
              {format(startDate, "yyyy年M月d日", {
            locale: zhCN
          })}
            </span>{" "}
            至{" "}
            <span className="font-medium text-gray-900">
              {format(endDate, "yyyy年M月d日", {
            locale: zhCN
          })}
            </span>
          </div>}

        {/* 查询按钮 */}
        <div className="flex justify-end pt-2">
          <Button onClick={onQuery} disabled={isQueryDisabled} className="min-w-[120px]">
            {isQuerying ? <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                查询中
              </> : <>
                <Search className="mr-2 h-4 w-4" />
                查询题集
              </>}
          </Button>
        </div>
      </CardContent>
    </Card>;
}
