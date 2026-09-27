"use client";

import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { Brain, CalendarIcon, Search } from "lucide-react";
// 薄弱知识点查询组件，用于查询学生在指定时间范围内的薄弱知识点
import { useEffect, useState } from "react";
import { Button } from "../../../../../../../../../components/ui/button.js";
import { Calendar } from "../../../../../../../../../components/ui/calendar.js";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../../../../../../components/ui/card.js";
import { Label } from "../../../../../../../../../components/ui/label.js";
import { Popover, PopoverContent, PopoverTrigger } from "../../../../../../../../../components/ui/popover.js";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../../../../../../../components/ui/select.js";
import { useSubjects } from "../../../../../../../../../hooks/useAdminConfig.js";
import { cn } from "../../../../../../../../../lib/shadcn/utils.js";
import { queryStudentWeakKnowledgePoints } from "../actions.js";
import WeakKnowledgeResults from "./WeakKnowledgeResults.js";

function calculateTimeRange(timeRange, startDate, endDate) {
  const now = new Date();
  switch (timeRange) {
    case "整个学期":
      {
        // TODO: 根据学校设置获取学期开始和结束时间
        const semesterStart = new Date(now.getFullYear(), 8, 1); // 9月1日
        const semesterEnd = new Date(now.getFullYear() + 1, 6, 31); // 次年7月31日
        return {
          start: semesterStart,
          end: new Date(semesterEnd.getTime() + 24 * 60 * 60 * 1000),
          // 次日00:00:00
          description: "整个学期"
        };
      }
    case "上月":
      {
        const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0); // 上月最后一天
        return {
          start: lastMonthStart,
          end: new Date(lastMonthEnd.getTime() + 24 * 60 * 60 * 1000),
          // 次日00:00:00
          description: `${lastMonthStart.getFullYear()}年${lastMonthStart.getMonth() + 1}月${lastMonthStart.getDate()}日 - ${lastMonthEnd.getFullYear()}年${lastMonthEnd.getMonth() + 1}月${lastMonthEnd.getDate()}日`
        };
      }
    case "上周":
      {
        // 计算上周周一到周日（中国习惯）
        const today = now.getDay(); // 0=周日, 1=周一, ..., 6=周六
        const mondayOffset = today === 0 ? 6 : today - 1; // 到本周一的天数
        const thisMonday = new Date(now);
        thisMonday.setDate(now.getDate() - mondayOffset);
        thisMonday.setHours(0, 0, 0, 0);
        const lastMondayStart = new Date(thisMonday);
        lastMondayStart.setDate(thisMonday.getDate() - 7); // 上周一

        const lastSundayEnd = new Date(lastMondayStart);
        lastSundayEnd.setDate(lastMondayStart.getDate() + 6); // 上周日

        return {
          start: lastMondayStart,
          end: new Date(lastSundayEnd.getTime() + 24 * 60 * 60 * 1000),
          // 次日00:00:00
          description: `${lastMondayStart.getFullYear()}年${lastMondayStart.getMonth() + 1}月${lastMondayStart.getDate()}日 - ${lastSundayEnd.getFullYear()}年${lastSundayEnd.getMonth() + 1}月${lastSundayEnd.getDate()}日`
        };
      }
    case "自定义":
      {
        if (!startDate || !endDate) {
          throw new Error("自定义时间范围需要提供开始和结束日期");
        }
        const customStart = new Date(startDate);
        customStart.setHours(0, 0, 0, 0);
        const customEnd = new Date(endDate);
        customEnd.setHours(0, 0, 0, 0);
        return {
          start: customStart,
          end: new Date(customEnd.getTime() + 24 * 60 * 60 * 1000),
          // 次日00:00:00
          description: `${customStart.getFullYear()}年${customStart.getMonth() + 1}月${customStart.getDate()}日 - ${customEnd.getFullYear()}年${customEnd.getMonth() + 1}月${customEnd.getDate()}日`
        };
      }
    default:
      throw new Error("不支持的时间范围类型");
  }
}
export default function WeakKnowledgeQuery({
  studentId,
  classRoomId
}) {
  const {
    subjects,
    loading: subjectsLoading
  } = useSubjects();
  const [selectedSubject, setSelectedSubject] = useState("");
  const [timeRange, setTimeRange] = useState("整个学期");
  const [startDate, setStartDate] = useState(undefined);
  const [endDate, setEndDate] = useState(undefined);
  const [querying, setQuerying] = useState(false);

  // 薄弱知识点查询结果状态
  const [queryResults, setQueryResults] = useState([]);
  const [hasQueried, setHasQueried] = useState(false);
  const [timeRangeDescription, setTimeRangeDescription] = useState("");

  // 当学科列表加载完成后，默认选择第一个学科
  useEffect(() => {
    if (subjects.length > 0 && !selectedSubject) {
      setSelectedSubject(subjects[0].name);
    }
  }, [subjects, selectedSubject]);
  const handleQuery = async () => {
    if (!selectedSubject) {
      alert("请选择学科");
      return;
    }
    setQuerying(true);
    setHasQueried(true);
    try {
      let timeRangeData;
      let startTime;
      let endTime;

      // 如果不是整个学期，计算时间范围
      if (timeRange !== "整个学期") {
        timeRangeData = calculateTimeRange(timeRange, startDate, endDate);
        startTime = timeRangeData.start.toISOString();
        endTime = timeRangeData.end.toISOString();
      }

      // 调用Server Action查询薄弱知识点
      const result = await queryStudentWeakKnowledgePoints({
        studentId,
        classRoomId,
        subject: selectedSubject,
        timeRange,
        startTime,
        endTime
      });
      if (result.success && result.data) {
        setQueryResults(result.data);
        // 保存时间范围描述
        if (timeRange === "整个学期") {
          setTimeRangeDescription("整个学期");
        } else if (timeRangeData) {
          setTimeRangeDescription(timeRangeData.description);
        }
        console.log("查询薄弱知识点成功:", result.data);
      } else {
        console.error("查询薄弱知识点失败:", result.error);
        alert(`查询失败: ${result.error || "未知错误"}`);
        setQueryResults([]);
      }
    } catch (error) {
      console.error("查询薄弱知识点失败:", error);
      alert(`查询失败: ${error instanceof Error ? error.message : "未知错误"}`);
      setQueryResults([]);
    } finally {
      setQuerying(false);
    }
  };

  // 获取时间范围的描述
  const getTimeRangeDescription = () => {
    try {
      const timeRangeData = calculateTimeRange(timeRange, startDate, endDate);
      return timeRangeData.description;
    } catch {
      if (timeRange === "自定义") {
        return "请选择开始和结束日期";
      }
      return "时间范围计算错误";
    }
  };
  return <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5" />
            薄弱知识点查询
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 学科选择 */}
          <div className="space-y-2">
            <Label htmlFor="subject">选择学科</Label>
            <Select value={selectedSubject} onValueChange={setSelectedSubject} disabled={subjectsLoading}>
              <SelectTrigger>
                <SelectValue placeholder={subjectsLoading ? "加载中..." : "请选择学科"} />
              </SelectTrigger>
              <SelectContent>
                {subjects.map(subject => <SelectItem key={subject.name} value={subject.name}>
                    {subject.name}
                  </SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* 时间范围选择 */}
          <div className="space-y-4">
            <Label>选择学生做题时间范围</Label>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {["整个学期", "上月", "上周", "自定义"].map(range => <Button key={range} variant={timeRange === range ? "default" : "outline"} size="sm" onClick={() => setTimeRange(range)} className="text-sm">
                    {range}
                  </Button>)}
            </div>

            {/* 时间范围描述 */}
            <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
              {getTimeRangeDescription()}
            </div>

            {/* 自定义时间选择 */}
            {timeRange === "自定义" && <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>开始日期</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !startDate && "text-muted-foreground")}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {startDate ? format(startDate, "yyyy年M月d日", {
                      locale: zhCN
                    }) : "选择开始日期"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus locale={zhCN} />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label>结束日期</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !endDate && "text-muted-foreground")}>
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {endDate ? format(endDate, "yyyy年M月d日", {
                      locale: zhCN
                    }) : "选择结束日期"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar mode="single" selected={endDate} onSelect={setEndDate} initialFocus locale={zhCN} disabled={date => startDate ? date < startDate : false} />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>}
          </div>

          {/* 查询按钮 */}
          <div className="flex justify-end">
            <Button onClick={handleQuery} disabled={querying || !selectedSubject || timeRange === "自定义" && (!startDate || !endDate)} className="flex items-center gap-2">
              <Search className="w-4 h-4" />
              {querying ? "查询中..." : "查询薄弱知识点"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 查询结果显示 */}
      {hasQueried && <WeakKnowledgeResults results={queryResults} loading={querying} studentId={studentId} classRoomId={classRoomId} subject={selectedSubject} timeRangeDescription={timeRangeDescription} />}
    </div>;
}
