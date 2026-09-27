"use client";

import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { CalendarIcon, Clock } from "lucide-react";
// 日期时间选择器组件，用于选择日期和时间
import { useEffect, useState } from "react";
import { Button } from "../../../../../../../components/ui/button.js";
import { Calendar } from "../../../../../../../components/ui/calendar.js";
import { Input } from "../../../../../../../components/ui/input.js";
import { Label } from "../../../../../../../components/ui/label.js";
import { Popover, PopoverContent, PopoverTrigger } from "../../../../../../../components/ui/popover.js";
export default function DateTimePicker({
  value,
  onChange,
  disabled = false,
  placeholder = "选择日期和时间"
}) {
  const [selectedDate, setSelectedDate] = useState(value ? new Date(value) : undefined);
  const [timeValue, setTimeValue] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  // 当外部value变化时，同步内部状态
  useEffect(() => {
    if (value) {
      const date = new Date(value);
      setSelectedDate(date);
      setTimeValue(`${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`);
    } else {
      setSelectedDate(undefined);
      setTimeValue("");
    }
  }, [value]);

  // 处理日期选择
  const handleDateSelect = date => {
    setSelectedDate(date);
    if (date && timeValue) {
      // 如果已有时间，合并日期和时间
      const [hours, minutes] = timeValue.split(":").map(Number);
      const newDateTime = new Date(date);
      newDateTime.setHours(hours, minutes, 0, 0);
      onChange(newDateTime.getTime());
    } else if (date) {
      // 如果没有时间，设置默认时间为当前时间
      const now = new Date();
      const newDateTime = new Date(date);
      newDateTime.setHours(now.getHours(), now.getMinutes(), 0, 0);
      const newTimeValue = `${newDateTime.getHours().toString().padStart(2, "0")}:${newDateTime.getMinutes().toString().padStart(2, "0")}`;
      setTimeValue(newTimeValue);
      onChange(newDateTime.getTime());
    }
  };

  // 处理时间变化
  const handleTimeChange = time => {
    setTimeValue(time);
    if (selectedDate && time) {
      const [hours, minutes] = time.split(":").map(Number);
      if (!Number.isNaN(hours) && !Number.isNaN(minutes)) {
        const newDateTime = new Date(selectedDate);
        newDateTime.setHours(hours, minutes, 0, 0);
        onChange(newDateTime.getTime());
      }
    }
  };

  // 清空选择
  const handleClear = () => {
    setSelectedDate(undefined);
    setTimeValue("");
    onChange(undefined);
    setIsOpen(false);
  };

  // 格式化显示文本
  const getDisplayText = () => {
    if (!selectedDate) return placeholder;
    const dateStr = format(selectedDate, "yyyy-MM-dd", {
      locale: zhCN
    });
    return `${dateStr} ${timeValue}`;
  };
  return <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full justify-start text-left font-normal" disabled={disabled}>
          <CalendarIcon className="mr-2 h-4 w-4" />
          <span className={selectedDate ? "text-gray-900" : "text-gray-500"}>
            {getDisplayText()}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-4">
          <Calendar mode="single" selected={selectedDate} onSelect={handleDateSelect} initialFocus />

          <div className="mt-4 space-y-2">
            <Label htmlFor="time-picker" className="flex items-center space-x-2">
              <Clock className="h-4 w-4" />
              <span>时间</span>
            </Label>
            <Input id="time-picker" type="time" value={timeValue} onChange={e => handleTimeChange(e.target.value)} className="w-full" />
          </div>

          <div className="mt-4 flex space-x-2">
            <Button variant="outline" size="sm" onClick={handleClear} className="flex-1">
              清空
            </Button>
            <Button size="sm" onClick={() => setIsOpen(false)} className="flex-1" disabled={!selectedDate || !timeValue}>
              确定
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>;
}
