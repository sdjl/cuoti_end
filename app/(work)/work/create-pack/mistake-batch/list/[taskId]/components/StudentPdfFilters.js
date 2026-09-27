"use client";

import { RotateCcw, Search } from "lucide-react";
// 错题批量任务的学生 PDF 筛选面板，负责学生、年级和状态过滤
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "../../../../../../../../components/ui/button.js";
import { Input } from "../../../../../../../../components/ui/input.js";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../../../../../../components/ui/select.js";
export default function StudentPdfFilters({
  studentPdfs,
  onFilter,
  initialStudentId
}) {
  const [localSearchTerm, setLocalSearchTerm] = useState("");
  const [selectedGrade, setSelectedGrade] = useState("all");
  const [selectedClass, setSelectedClass] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [targetStudentId, setTargetStudentId] = useState(null);

  // 初始化学生ID（从URL参数）
  useEffect(() => {
    if (initialStudentId && studentPdfs.length > 0) {
      // 查找学生
      const student = studentPdfs.find(pdf => pdf.studentId === initialStudentId);
      if (student) {
        // 设置学生ID和姓名
        setTargetStudentId(initialStudentId);
        setLocalSearchTerm(student.studentName);
      }
    }
  }, [initialStudentId, studentPdfs]);

  // 提取唯一的年级列表
  const grades = useMemo(() => {
    const gradeSet = new Set();
    studentPdfs.forEach(pdf => {
      if (pdf.grade) gradeSet.add(pdf.grade);
    });
    return Array.from(gradeSet).sort();
  }, [studentPdfs]);

  // 提取唯一的班级列表
  const classes = useMemo(() => {
    const classMap = new Map();
    studentPdfs.forEach(pdf => {
      if (!classMap.has(pdf.classId)) {
        classMap.set(pdf.classId, pdf.className);
      }
    });
    return Array.from(classMap.entries()).map(([id, name]) => ({
      id,
      name
    }));
  }, [studentPdfs]);

  // 执行过滤
  const performFilter = useCallback(() => {
    let filtered = studentPdfs;

    // 如果有指定的学生ID，优先使用学生ID过滤（精确匹配）
    if (targetStudentId) {
      filtered = filtered.filter(pdf => pdf.studentId === targetStudentId);
    } else if (localSearchTerm.trim()) {
      // 否则按关键词过滤（学生姓名，模糊匹配）
      const keyword = localSearchTerm.trim().toLowerCase();
      filtered = filtered.filter(pdf => pdf.studentName.toLowerCase().includes(keyword));
    }

    // 按年级过滤
    if (selectedGrade !== "all") {
      filtered = filtered.filter(pdf => pdf.grade === selectedGrade);
    }

    // 按班级过滤
    if (selectedClass !== "all") {
      filtered = filtered.filter(pdf => pdf.classId === selectedClass);
    }

    // 按状态过滤
    if (selectedStatus !== "all") {
      filtered = filtered.filter(pdf => pdf.status === selectedStatus);
    }
    onFilter(filtered);
  }, [studentPdfs, targetStudentId, localSearchTerm, selectedGrade, selectedClass, selectedStatus, onFilter]);

  // 当过滤条件变化时执行过滤
  useEffect(() => {
    performFilter();
  }, [performFilter]);

  // 处理搜索
  const handleSearch = useCallback(() => {
    performFilter();
  }, [performFilter]);

  // 处理回车搜索
  const handleKeyPress = useCallback(e => {
    if (e.key === "Enter") {
      handleSearch();
    }
  }, [handleSearch]);

  // 处理重置
  const handleReset = useCallback(() => {
    setLocalSearchTerm("");
    setSelectedGrade("all");
    setSelectedClass("all");
    setSelectedStatus("all");
    setTargetStudentId(null); // 清除学生ID过滤
  }, []);
  return <div className="bg-white p-4 rounded-lg shadow-sm space-y-4">
      <div className="flex flex-col lg:flex-row gap-4">
        {/* 搜索框 */}
        <div className="flex-1">
          <div className="flex gap-2">
            <Input placeholder="搜索学生姓名..." value={localSearchTerm} onChange={e => setLocalSearchTerm(e.target.value)} onKeyPress={handleKeyPress} className="flex-1" />
            <Button onClick={handleSearch} size="default" className="px-3">
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* 筛选器 */}
        <div className="flex flex-col sm:flex-row gap-3 lg:flex-shrink-0">
          {/* 年级筛选 */}
          <Select value={selectedGrade} onValueChange={setSelectedGrade}>
            <SelectTrigger className="w-full sm:w-[120px]">
              <SelectValue placeholder="年级" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部年级</SelectItem>
              {grades.map(grade => <SelectItem key={grade} value={grade}>
                  {grade}
                </SelectItem>)}
            </SelectContent>
          </Select>

          {/* 班级筛选 */}
          <Select value={selectedClass} onValueChange={setSelectedClass}>
            <SelectTrigger className="w-full sm:w-[140px]">
              <SelectValue placeholder="班级" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部班级</SelectItem>
              {classes.map(cls => <SelectItem key={cls.id} value={cls.id}>
                  {cls.name}
                </SelectItem>)}
            </SelectContent>
          </Select>

          {/* 状态筛选 */}
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-full sm:w-[120px]">
              <SelectValue placeholder="状态" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部状态</SelectItem>
              <SelectItem value="waiting">等待生成</SelectItem>
              <SelectItem value="generating">生成中</SelectItem>
              <SelectItem value="completed">已完成</SelectItem>
              <SelectItem value="cleaning">文件清理中</SelectItem>
              <SelectItem value="cleaned">文件已清理</SelectItem>
              <SelectItem value="failed">失败</SelectItem>
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
