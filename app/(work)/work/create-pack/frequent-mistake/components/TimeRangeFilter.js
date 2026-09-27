"use client";

// 高频错题集时间区间筛选模块，支持全部与自定义区间
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { Button } from "../../../../../../components/ui/button.js";
import { Calendar } from "../../../../../../components/ui/calendar.js";
import { Label } from "../../../../../../components/ui/label.js";
import { Popover, PopoverContent, PopoverTrigger } from "../../../../../../components/ui/popover.js";
import { cn } from "../../../../../../lib/shadcn/utils.js";
export default function TimeRangeFilter({
  timeRangeType,
  onTimeRangeTypeChange,
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange
}) {
  const handleTimeRangeChange = type => {
    onTimeRangeTypeChange(type);
    if (type === "all") {
      onStartDateChange(undefined);
      onEndDateChange(undefined);
    }
  };
  return <div className="bg-white rounded-lg p-4 shadow-sm border">
      <div className="flex items-center gap-6">
        {/* 时间区间选择 */}
        <div className="flex items-center gap-3">
          <Label className="text-sm font-medium whitespace-nowrap">
            时间区间
          </Label>
          <div className="flex gap-2">
            <Button variant={timeRangeType === "all" ? "default" : "outline"} size="sm" onClick={() => handleTimeRangeChange("all")} className="min-w-[100px]">
              所有时间
            </Button>
            <Button variant={timeRangeType === "custom" ? "default" : "outline"} size="sm" onClick={() => handleTimeRangeChange("custom")} className="min-w-[100px]">
              自定义区间
            </Button>
          </div>
        </div>

        {/* 自定义时间选择 */}
        {timeRangeType === "custom" && <div className="flex items-center gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className={cn("justify-start text-left font-normal min-w-[140px]", !startDate && "text-muted-foreground")}>
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
            <span className="text-sm text-gray-500">至</span>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className={cn("justify-start text-left font-normal min-w-[140px]", !endDate && "text-muted-foreground")}>
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
          </div>}
      </div>
    </div>;
}
