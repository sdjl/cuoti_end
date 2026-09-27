"use client";

// 新建学情记录对话框组件，用于创建新的学情记录并设置积分变动
import { useCallback, useEffect, useState } from "react";
import { Button } from "../../../../../../../components/ui/button.js";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../../../../../../components/ui/dialog.js";
import { Input } from "../../../../../../../components/ui/input.js";
import { Label } from "../../../../../../../components/ui/label.js";
import { RadioGroup, RadioGroupItem } from "../../../../../../../components/ui/radio-group.js";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../../../../../components/ui/select.js";
import { Textarea } from "../../../../../../../components/ui/textarea.js";
export default function CreateStudyRecordDialog({
  open,
  onOpenChange,
  classrooms,
  onSearchStudent,
  onSave,
  isSaving
}) {
  const [selectedClassroomId, setSelectedClassroomId] = useState("");
  const [studentSearch, setStudentSearch] = useState("");
  const [foundStudents, setFoundStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showSearchInput, setShowSearchInput] = useState(true);
  const [showStudentList, setShowStudentList] = useState(false);
  const [content, setContent] = useState("");
  const [pointType, setPointType] = useState("add");
  const [pointAmount, setPointAmount] = useState("");

  // 重置表单
  useEffect(() => {
    if (open) {
      setSelectedClassroomId("");
      setStudentSearch("");
      setFoundStudents([]);
      setSelectedStudent(null);
      setShowSearchInput(true);
      setShowStudentList(false);
      setContent("");
      setPointType("add");
      setPointAmount("");
    }
  }, [open]);

  // 学生搜索
  const handleSearchStudent = useCallback(async searchText => {
    if (!selectedClassroomId || !searchText.trim()) {
      setFoundStudents([]);
      setShowStudentList(false);
      return;
    }
    try {
      const students = await onSearchStudent(selectedClassroomId, searchText);
      setFoundStudents(students);
      setShowStudentList(students.length > 0);
    } catch (error) {
      console.error("搜索学生失败:", error);
      setFoundStudents([]);
      setShowStudentList(false);
    }
  }, [selectedClassroomId, onSearchStudent]);

  // 自动搜索
  useEffect(() => {
    if (showSearchInput && studentSearch.trim()) {
      const timer = setTimeout(() => {
        handleSearchStudent(studentSearch);
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setFoundStudents([]);
      setShowStudentList(false);
      return undefined;
    }
  }, [studentSearch, handleSearchStudent, showSearchInput]);

  // 当班级改变时清空学生选择
  useEffect(() => {
    if (selectedClassroomId) {
      setStudentSearch("");
      setSelectedStudent(null);
      setShowSearchInput(true);
      setFoundStudents([]);
      setShowStudentList(false);
    }
  }, [selectedClassroomId]);

  // 选择学生
  const handleSelectStudent = useCallback(student => {
    setSelectedStudent(student);
    setShowSearchInput(false);
    setShowStudentList(false);
    setStudentSearch("");
    setFoundStudents([]);
  }, []);

  // 清空学生选择
  const handleClearStudent = useCallback(() => {
    setSelectedStudent(null);
    setShowSearchInput(true);
    setStudentSearch("");
    setFoundStudents([]);
    setShowStudentList(false);
  }, []);

  // 保存
  const handleSave = async () => {
    if (!selectedClassroomId || !selectedStudent || !content.trim() || !pointAmount.trim()) {
      return;
    }
    const points = pointType === "add" ? parseInt(pointAmount) : -parseInt(pointAmount);
    await onSave({
      classroomId: selectedClassroomId,
      studentId: selectedStudent._id,
      content: content.trim(),
      points
    });
  };
  const canSave = selectedClassroomId && selectedStudent && content.trim() && pointAmount.trim() && parseInt(pointAmount) > 0 && !isSaving;
  return <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>新建学情记录</DialogTitle>
          <DialogDescription>记录学生的学习情况和表现</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* 班级选择 */}
          <div className="space-y-2">
            <Label htmlFor="classroom">
              班级 <span className="text-red-500">*</span>
            </Label>
            <Select value={selectedClassroomId} onValueChange={setSelectedClassroomId}>
              <SelectTrigger>
                <SelectValue placeholder="请选择班级" />
              </SelectTrigger>
              <SelectContent>
                {classrooms.map(classroom => <SelectItem key={classroom._id} value={classroom._id}>
                    {classroom.name}
                  </SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* 学生选择 */}
          <div className="space-y-2">
            <Label htmlFor="student">
              学生 <span className="text-red-500">*</span>
            </Label>

            {/* 搜索框 - 只在未选择学生时显示 */}
            {showSearchInput && <div className="relative">
                <Input placeholder={selectedClassroomId ? "输入学生姓名或编号..." : "请先选择班级"} value={studentSearch} onChange={e => setStudentSearch(e.target.value)} disabled={!selectedClassroomId} />

                {/* 学生搜索结果列表 */}
                {showStudentList && foundStudents.length > 0 && <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-40 overflow-y-auto">
                    {foundStudents.map(student => <div key={student._id} className="px-3 py-2 cursor-pointer hover:bg-gray-100 border-b border-gray-200 last:border-b-0" onClick={() => handleSelectStudent(student)}>
                        <div className="font-medium text-sm">
                          {student.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          编号：{student.studentCode}
                        </div>
                      </div>)}
                  </div>}

                {/* 搜索中提示 */}
                {studentSearch.trim() && foundStudents.length === 0 && showStudentList && <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg">
                      <div className="text-sm text-gray-500 mt-2">
                        搜索中...
                      </div>
                    </div>}

                {/* 未找到学生提示 */}
                {studentSearch.trim() && foundStudents.length === 0 && !showStudentList && selectedClassroomId && <div className="text-sm text-gray-500 mt-1">
                      未找到匹配的学生
                    </div>}
              </div>}

            {/* 已选择的学生显示 */}
            {selectedStudent && !showSearchInput && <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-md">
                <div>
                  <div className="font-medium">{selectedStudent.name}</div>
                  <div className="text-sm text-gray-600">
                    编号：{selectedStudent.studentCode}
                  </div>
                </div>
                <Button type="button" variant="ghost" size="sm" onClick={handleClearStudent} className="text-gray-500 hover:text-gray-700">
                  ✕
                </Button>
              </div>}
          </div>

          {/* 记录内容 */}
          <div className="space-y-2">
            <Label htmlFor="content">
              记录内容 <span className="text-red-500">*</span>
            </Label>
            <Textarea id="content" value={content} onChange={e => setContent(e.target.value)} placeholder="请输入学情记录内容..." rows={3} />
          </div>

          {/* 积分设置 */}
          <div className="space-y-3">
            <Label>
              积分变动 <span className="text-red-500">*</span>
            </Label>

            {/* 积分类型选择 */}
            <RadioGroup value={pointType} onValueChange={value => setPointType(value)} className="space-x-2 flex">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="add" id="add" />
                <Label htmlFor="add" className="text-green-600 font-medium">
                  增加积分
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="deduct" id="deduct" />
                <Label htmlFor="deduct" className="text-red-600 font-medium">
                  扣除积分
                </Label>
              </div>
            </RadioGroup>

            {/* 积分数量 */}
            <div>
              <Input type="number" min="1" value={pointAmount} onChange={e => setPointAmount(e.target.value)} placeholder="请输入积分数量" />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            取消
          </Button>
          <Button onClick={handleSave} disabled={!canSave}>
            {isSaving ? "保存中..." : "保存"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>;
}
