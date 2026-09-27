"use client";

import { RotateCcw } from "lucide-react";
// 班级错题任务筛选组件，负责提供任务及学生搜索过滤交互
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "../../../../../../../../components/ui/button.js";
import { Input } from "../../../../../../../../components/ui/input.js";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../../../../../../components/ui/select.js";
export default function ClassroomTaskFilters({
  classroomTasks,
  studentPdfs,
  selectedTaskId,
  onTaskSelect,
  onFilter,
  isLoading
}) {
  const [taskSearchTerm, setTaskSearchTerm] = useState("");
  const [studentSearchTerm, setStudentSearchTerm] = useState("");
  const [showTaskSuggestions, setShowTaskSuggestions] = useState(false);

  // 过滤任务建议列表（搜索所有任务）
  const filteredTasks = useMemo(() => {
    if (!taskSearchTerm.trim()) return [];
    const keyword = taskSearchTerm.trim().toLowerCase();
    return classroomTasks.filter(ct => ct.task.taskName.toLowerCase().includes(keyword));
  }, [classroomTasks, taskSearchTerm]);

  // 获取最近10个任务（用于下拉列表）
  const recentTasks = useMemo(() => {
    return classroomTasks.slice(0, 10);
  }, [classroomTasks]);

  // 检查选中的任务是否在最近10个中
  const selectedTaskInRecent = useMemo(() => {
    return recentTasks.some(ct => ct.taskId === selectedTaskId);
  }, [recentTasks, selectedTaskId]);

  // 执行过滤
  const performFilter = useCallback(() => {
    let filtered = studentPdfs;

    // 按学生姓名过滤
    if (studentSearchTerm.trim()) {
      const keyword = studentSearchTerm.trim().toLowerCase();
      filtered = filtered.filter(pdf => pdf.studentName.toLowerCase().includes(keyword));
    }
    onFilter(filtered);
  }, [studentPdfs, studentSearchTerm, onFilter]);

  // 当过滤条件变化时执行过滤
  useEffect(() => {
    performFilter();
  }, [performFilter]);

  // 处理任务选择
  const handleTaskSelect = useCallback(taskId => {
    const task = classroomTasks.find(ct => ct.taskId === taskId);
    if (task) {
      setTaskSearchTerm(task.task.taskName);
      setShowTaskSuggestions(false);
      onTaskSelect(taskId);
    }
  }, [classroomTasks, onTaskSelect]);

  // 处理任务下拉选择
  const handleTaskDropdownChange = useCallback(taskId => {
    const task = classroomTasks.find(ct => ct.taskId === taskId);
    if (task) {
      setTaskSearchTerm(task.task.taskName);
      onTaskSelect(taskId);
    }
  }, [classroomTasks, onTaskSelect]);

  // 处理重置
  const handleReset = useCallback(() => {
    setTaskSearchTerm("");
    setStudentSearchTerm("");
    setShowTaskSuggestions(false);
    // 重置到第一个任务
    if (classroomTasks.length > 0) {
      onTaskSelect(classroomTasks[0].taskId);
    }
  }, [classroomTasks, onTaskSelect]);

  // 当选中的任务变化时，更新搜索框
  useEffect(() => {
    if (selectedTaskId) {
      const task = classroomTasks.find(ct => ct.taskId === selectedTaskId);
      if (task) {
        setTaskSearchTerm(task.task.taskName);
      }
    }
  }, [selectedTaskId, classroomTasks]);
  if (isLoading) {
    return <div className="bg-white p-4 rounded-lg shadow-sm">
        <p className="text-gray-500 text-center">加载中...</p>
      </div>;
  }
  if (classroomTasks.length === 0) {
    return <div className="bg-white p-4 rounded-lg shadow-sm">
        <p className="text-gray-500 text-center">该班级暂无错题批量生成任务</p>
      </div>;
  }
  return <div className="bg-white p-4 rounded-lg shadow-sm">
      <div className="flex gap-4">
        {/* 搜索任务 - 25% */}
        <div className="w-1/4 relative">
          <Input placeholder="搜索任务..." value={taskSearchTerm} onChange={e => {
          setTaskSearchTerm(e.target.value);
          setShowTaskSuggestions(true);
        }} onFocus={() => setShowTaskSuggestions(true)} className="w-full" />
          {/* 任务建议列表 */}
          {showTaskSuggestions && filteredTasks.length > 0 && taskSearchTerm.trim() && <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-auto">
                {filteredTasks.map(ct => <div key={ct.taskId} className="px-4 py-2 hover:bg-gray-100 cursor-pointer" onClick={() => handleTaskSelect(ct.taskId)}>
                    <div className="font-medium">{ct.task.taskName}</div>
                    <div className="text-xs text-gray-500">
                      {ct.task.subject}
                    </div>
                  </div>)}
              </div>}
        </div>

        {/* 搜索学生 - 25% */}
        <div className="w-1/4">
          <Input placeholder="过滤学生姓名..." value={studentSearchTerm} onChange={e => setStudentSearchTerm(e.target.value)} className="w-full" />
        </div>

        {/* 任务选择下拉 - 剩余宽度 */}
        <div className="flex-1 flex gap-2">
          <Select value={selectedTaskId || undefined} onValueChange={handleTaskDropdownChange}>
            <SelectTrigger className="flex-1 [&>span]:text-left">
              <SelectValue placeholder="选择任务">
                {selectedTaskId && !selectedTaskInRecent ? <span>-</span> : selectedTaskId && classroomTasks.find(ct => ct.taskId === selectedTaskId)?.task.taskName}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {recentTasks.map(ct => <SelectItem key={ct.taskId} value={ct.taskId}>
                  <div>
                    <div className="font-medium">{ct.task.taskName}</div>
                    <div className="text-xs text-gray-500">
                      {ct.task.subject} - 创建于{" "}
                      {new Date(ct.task.created).toLocaleDateString()}
                    </div>
                  </div>
                </SelectItem>)}
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
