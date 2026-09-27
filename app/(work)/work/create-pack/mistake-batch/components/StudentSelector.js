"use client";

import { FileCheck, Search, X } from "lucide-react";
// 错题批量学生选择器，负责筛选勾选学生并创建任务参数
import { useEffect, useMemo, useState } from "react";
import { Button } from "../../../../../../components/ui/button.js";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../../../../components/ui/card.js";
import { Checkbox } from "../../../../../../components/ui/checkbox.js";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../../../../../../components/ui/dialog.js";
import { Input } from "../../../../../../components/ui/input.js";
import { Label } from "../../../../../../components/ui/label.js";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../../../../components/ui/select.js";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../../../../components/ui/table.js";
import { Textarea } from "../../../../../../components/ui/textarea.js";
export default function StudentSelector({
  data,
  classIds,
  questionPackIds,
  onCreateTask
}) {
  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedGrade, setSelectedGrade] = useState("all");
  const [selectedClass, setSelectedClass] = useState("all");

  // 选中的学生（使用 studentId-classId 作为唯一标识）
  const [selectedStudentKeys, setSelectedStudentKeys] = useState(new Set());

  // 默认全选所有学生
  useEffect(() => {
    const allKeys = new Set(data.map(item => `${item.studentId}-${item.classId}`));
    setSelectedStudentKeys(allKeys);
  }, [data]);

  // 对话框状态
  const [dialogOpen, setDialogOpen] = useState(false);
  const [taskName, setTaskName] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [allowStudentsDownloadAnswers, setAllowStudentsDownloadAnswers] = useState(true);

  // 处理单个学生选择
  const handleStudentToggle = (studentId, classId) => {
    const key = `${studentId}-${classId}`;
    const newSelected = new Set(selectedStudentKeys);
    if (newSelected.has(key)) {
      newSelected.delete(key);
    } else {
      newSelected.add(key);
    }
    setSelectedStudentKeys(newSelected);
  };

  // 处理全选/取消全选
  const handleSelectAll = () => {
    if (selectedStudentKeys.size === filteredData.length) {
      // 当前已全选，则取消全选
      setSelectedStudentKeys(new Set());
    } else {
      // 否则全选
      const allKeys = new Set(filteredData.map(item => `${item.studentId}-${item.classId}`));
      setSelectedStudentKeys(allKeys);
    }
  };

  // 处理创建任务
  const handleSubmit = () => {
    if (!taskName.trim()) {
      return;
    }

    // 获取选中的学生列表
    const selectedStudents = data.filter(item => selectedStudentKeys.has(`${item.studentId}-${item.classId}`)).map(item => ({
      studentId: item.studentId,
      studentName: item.studentName,
      classId: item.classId
    }));
    onCreateTask({
      taskName: taskName.trim(),
      taskDescription: taskDescription.trim() || undefined,
      allowStudentsDownloadAnswers,
      selectedStudents,
      classIds,
      questionPackIds
    });
    setDialogOpen(false);
    // 重置表单
    setTaskName("");
    setTaskDescription("");
    setAllowStudentsDownloadAnswers(true);
  };

  // 获取所有年级
  const grades = useMemo(() => {
    const gradeSet = new Set();
    data.forEach(item => {
      if (item.grade) gradeSet.add(item.grade);
    });
    return Array.from(gradeSet).sort();
  }, [data]);

  // 获取所有班级
  const classes = useMemo(() => {
    const classMap = new Map();
    data.forEach(item => {
      if (!classMap.has(item.classId)) {
        classMap.set(item.classId, {
          id: item.classId,
          name: item.className
        });
      }
    });
    return Array.from(classMap.values());
  }, [data]);

  // 过滤后的数据
  const filteredData = useMemo(() => {
    return data.filter(item => {
      // 按姓名搜索
      if (searchKeyword && !item.studentName.toLowerCase().includes(searchKeyword.toLowerCase())) {
        return false;
      }

      // 按年级过滤
      if (selectedGrade !== "all" && item.grade !== selectedGrade) {
        return false;
      }

      // 按班级过滤
      if (selectedClass !== "all" && item.classId !== selectedClass) {
        return false;
      }
      return true;
    });
  }, [data, searchKeyword, selectedGrade, selectedClass]);

  // 统计信息（基于选中的学生）
  const selectedStudents = data.filter(item => selectedStudentKeys.has(`${item.studentId}-${item.classId}`));
  const totalStudents = selectedStudents.length;
  const totalMistakes = selectedStudents.reduce((sum, item) => sum + item.mistakeCount, 0);

  // 检查是否全选（基于过滤后的数据）
  const isAllSelected = filteredData.length > 0 && filteredData.every(item => selectedStudentKeys.has(`${item.studentId}-${item.classId}`));
  return <Card>
      <CardHeader>
        <CardTitle>学生选择</CardTitle>
        <CardDescription>
          选择需要生成错题集的学生，默认为所有学生
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 过滤条件 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 搜索学生姓名 */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">学生姓名</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input placeholder="搜索学生..." value={searchKeyword} onChange={e => setSearchKeyword(e.target.value)} className="pl-9 pr-9" />
              {searchKeyword && <Button variant="ghost" size="sm" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0" onClick={() => setSearchKeyword("")}>
                  <X className="h-4 w-4" />
                </Button>}
            </div>
          </div>

          {/* 年级筛选 */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">年级</Label>
            <Select value={selectedGrade} onValueChange={setSelectedGrade}>
              <SelectTrigger>
                <SelectValue placeholder="选择年级" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部年级</SelectItem>
                {grades.map(grade => <SelectItem key={grade} value={grade}>
                    {grade}
                  </SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* 班级筛选 */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">班级</Label>
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger>
                <SelectValue placeholder="选择班级" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部班级</SelectItem>
                {classes.map(cls => <SelectItem key={cls.id} value={cls.id}>
                    {cls.name}
                  </SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* 统计信息 */}
        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
          <div className="flex items-center space-x-4 text-sm">
            <span>
              <span className="font-medium">已选学生：</span>
              {totalStudents} 人
            </span>
            <span>
              <span className="font-medium">错题总数：</span>
              {totalMistakes} 题
            </span>
            <span>
              <span className="font-medium">平均每人：</span>
              {totalStudents > 0 ? (totalMistakes / totalStudents).toFixed(1) : 0}{" "}
              题
            </span>
          </div>
        </div>

        {/* 学生列表 */}
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox checked={isAllSelected} onCheckedChange={handleSelectAll} />
                </TableHead>
                <TableHead>学生姓名</TableHead>
                <TableHead>班级</TableHead>
                <TableHead>年级</TableHead>
                <TableHead className="text-right">错题数量</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.length === 0 ? <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <p className="text-gray-500">暂无数据</p>
                  </TableCell>
                </TableRow> : filteredData.map(item => {
              const key = `${item.studentId}-${item.classId}`;
              const isSelected = selectedStudentKeys.has(key);
              return <TableRow key={key}>
                      <TableCell>
                        <Checkbox checked={isSelected} onCheckedChange={() => handleStudentToggle(item.studentId, item.classId)} />
                      </TableCell>
                      <TableCell>{item.studentName}</TableCell>
                      <TableCell>{item.className}</TableCell>
                      <TableCell>{item.grade}</TableCell>
                      <TableCell className="text-right">
                        <span className="font-medium">{item.mistakeCount}</span>
                      </TableCell>
                    </TableRow>;
            })}
            </TableBody>
          </Table>
        </div>

        {/* 创建任务按钮 */}
        <div className="flex justify-end pt-4 border-t">
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center" disabled={totalStudents === 0}>
                <FileCheck className="mr-2 h-4 w-4" />
                创建任务
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>创建批量错题生成任务</DialogTitle>
                <DialogDescription>
                  请填写任务信息，系统将为 {totalStudents} 位学生生成错题集PDF
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                {/* 任务名称 */}
                <div className="space-y-2">
                  <Label htmlFor="taskName">
                    任务名称 <span className="text-red-500">*</span>
                  </Label>
                  <Input id="taskName" placeholder="例如：七月错题集" value={taskName} onChange={e => setTaskName(e.target.value)} />
                  <p className="text-xs text-gray-500">
                    此名称将显示给家长，建议使用易于理解的名称
                  </p>
                </div>

                {/* 任务描述 */}
                <div className="space-y-2">
                  <Label htmlFor="taskDescription">任务描述（可选）</Label>
                  <Textarea id="taskDescription" placeholder="例如：本月错题汇总，请认真复习" value={taskDescription} onChange={e => setTaskDescription(e.target.value)} rows={3} />
                </div>

                {/* 是否允许学生下载答案 */}
                <div className="flex items-center space-x-2">
                  <Checkbox id="allowStudentsDownloadAnswers" checked={allowStudentsDownloadAnswers} onCheckedChange={checked => setAllowStudentsDownloadAnswers(checked === true)} />
                  <Label htmlFor="allowStudentsDownloadAnswers" className="text-sm font-normal cursor-pointer">
                    允许学生下载答案PDF
                  </Label>
                </div>

                {/* 统计信息 */}
                <div className="bg-blue-50 p-3 rounded-lg space-y-1 text-sm">
                  <p>
                    <span className="font-medium">学生总数：</span>
                    {totalStudents} 人
                  </p>
                  <p>
                    <span className="font-medium">错题总数：</span>
                    {totalMistakes} 题
                  </p>
                  <p>
                    <span className="font-medium">平均每人：</span>
                    {totalStudents > 0 ? (totalMistakes / totalStudents).toFixed(1) : 0}{" "}
                    题
                  </p>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  取消
                </Button>
                <Button onClick={handleSubmit} disabled={!taskName.trim() || totalStudents === 0}>
                  确认创建
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>;
}
