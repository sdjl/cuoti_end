"use client";

// 学生答卷列表筛选组件，支持按班级课程和题集名称过滤
import { RotateCcw, Search } from "lucide-react";
import { Button } from "../../../../../../../../../components/ui/button.js";
import { Input } from "../../../../../../../../../components/ui/input.js";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../../../../../../../components/ui/select.js";
export default function StudentAnswerFilters({
  selectedClass,
  setSelectedClass,
  selectedCourse,
  setSelectedCourse,
  selectedType,
  setSelectedType,
  nameFilter,
  setNameFilter,
  classes,
  courses,
  onReset
}) {
  // 处理重置
  const handleReset = () => {
    onReset();
  };
  return <div className="bg-white p-4 rounded-lg shadow-sm">
      {/* 筛选器 */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* 题集名称筛选 */}
        <div className="relative w-full sm:w-[200px]">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input placeholder="搜索题集名称..." value={nameFilter} onChange={e => setNameFilter(e.target.value)} className="pl-10" />
        </div>

        {/* 班级筛选 */}
        <Select value={selectedClass} onValueChange={setSelectedClass}>
          <SelectTrigger className="w-full sm:w-[160px]">
            <SelectValue placeholder="班级" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部班级</SelectItem>
            {classes.map(cls => <SelectItem key={cls._id} value={cls._id}>
                {cls.name}
              </SelectItem>)}
          </SelectContent>
        </Select>

        {/* 课程筛选 */}
        <Select value={selectedCourse} onValueChange={setSelectedCourse}>
          <SelectTrigger className="w-full sm:w-[160px]">
            <SelectValue placeholder="课程" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部课程</SelectItem>
            <SelectItem value="null">无课程关联</SelectItem>
            {courses.map(course => <SelectItem key={course._id} value={course._id}>
                {course.name}
              </SelectItem>)}
          </SelectContent>
        </Select>

        {/* 题集类型筛选 */}
        <Select value={selectedType} onValueChange={setSelectedType}>
          <SelectTrigger className="w-full sm:w-[120px]">
            <SelectValue placeholder="类型" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部类型</SelectItem>
            <SelectItem value="试卷">试卷</SelectItem>
            <SelectItem value="错题集">错题集</SelectItem>
            <SelectItem value="知识点">知识点</SelectItem>
            <SelectItem value="自建">自建</SelectItem>
          </SelectContent>
        </Select>

        {/* 重置按钮 */}
        <Button variant="outline" onClick={handleReset} className="px-3">
          <RotateCcw className="h-4 w-4" />
        </Button>
      </div>
    </div>;
}
