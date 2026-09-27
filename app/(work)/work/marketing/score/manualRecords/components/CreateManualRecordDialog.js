"use client";

import { Plus } from "lucide-react";
// 创建手动积分记录对话框组件，用于手动为学生增加或减少积分
import { useCallback, useEffect, useState } from "react";
import { Button } from "../../../../../../../components/ui/button.js";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../../../../../../components/ui/dialog.js";
import { Input } from "../../../../../../../components/ui/input.js";
import { Label } from "../../../../../../../components/ui/label.js";
import { RadioGroup, RadioGroupItem } from "../../../../../../../components/ui/radio-group.js";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../../../../../components/ui/select.js";
import { Textarea } from "../../../../../../../components/ui/textarea.js";
export default function CreateManualRecordDialog({
  open,
  onOpenChange,
  classrooms,
  onCreate,
  isCreating,
  onSearchStudent
}) {
  const [selectedClassroomId, setSelectedClassroomId] = useState("");
  const [studentSearch, setStudentSearch] = useState("");
  const [foundStudents, setFoundStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [operationType, setOperationType] = useState("add");
  const [pointsAmount, setPointsAmount] = useState("");
  const [reason, setReason] = useState("");
  const [isSearchingStudent, setIsSearchingStudent] = useState(false);
  const [showStudentList, setShowStudentList] = useState(false);
  const [showSearchInput, setShowSearchInput] = useState(true);

  // 重置表单
  useEffect(() => {
    if (open) {
      setSelectedClassroomId("");
      setStudentSearch("");
      setFoundStudents([]);
      setSelectedStudent(null);
      setOperationType("add");
      setPointsAmount("");
      setReason("");
      setShowStudentList(false);
      setShowSearchInput(true);
    }
  }, [open]);

  // 搜索学生
  const handleSearchStudent = useCallback(async () => {
    if (!studentSearch.trim() || !selectedClassroomId) {
      setFoundStudents([]);
      setShowStudentList(false);
      return;
    }
    setIsSearchingStudent(true);
    try {
      const students = await onSearchStudent(selectedClassroomId, studentSearch.trim());
      setFoundStudents(students);
      setShowStudentList(students.length > 0);
    } catch (error) {
      console.error("搜索学生失败:", error);
      setFoundStudents([]);
      setShowStudentList(false);
    } finally {
      setIsSearchingStudent(false);
    }
  }, [studentSearch, selectedClassroomId, onSearchStudent]);

  // 选择学生
  const handleSelectStudent = useCallback(student => {
    setSelectedStudent(student);
    setShowStudentList(false);
    setShowSearchInput(false); // 隐藏搜索框
    setFoundStudents([]); // 清空搜索结果
  }, []);

  // 清除选中的学生
  const handleClearStudent = useCallback(() => {
    setSelectedStudent(null);
    setStudentSearch("");
    setShowSearchInput(true); // 显示搜索框
    setFoundStudents([]);
    setShowStudentList(false);
  }, []);

  // 当学生搜索内容或班级改变时自动搜索
  useEffect(() => {
    // 只有在显示搜索框时才进行搜索
    if (!showSearchInput) return;
    const timer = setTimeout(() => {
      if (studentSearch.trim() && selectedClassroomId) {
        handleSearchStudent();
      } else {
        setFoundStudents([]);
        setShowStudentList(false);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [studentSearch, selectedClassroomId, handleSearchStudent, showSearchInput]);

  // 当班级改变时清空学生选择
  useEffect(() => {
    setSelectedStudent(null);
    setStudentSearch("");
    setFoundStudents([]);
    setShowStudentList(false);
    setShowSearchInput(true);
  }, [selectedClassroomId]);
  const handleSubmit = () => {
    if (!selectedClassroomId || !selectedStudent || !pointsAmount || !reason.trim()) {
      return;
    }
    const points = operationType === "add" ? parseInt(pointsAmount) : -parseInt(pointsAmount);
    onCreate({
      classroomId: selectedClassroomId,
      studentId: selectedStudent._id,
      points,
      reason: reason.trim()
    });
  };
  const isFormValid = selectedClassroomId && selectedStudent && pointsAmount && reason.trim();
  return <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-blue-500" />
            新建手动积分记录
          </DialogTitle>
          <DialogDescription>
            请填写积分调整信息，系统将自动更新学生积分并记录变动。
          </DialogDescription>
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

          {/* 学生搜索 */}
          <div className="space-y-2">
            <Label htmlFor="studentSearch">
              学生 <span className="text-red-500">*</span>
            </Label>

            {/* 搜索框 - 只在未选择学生时显示 */}
            {showSearchInput && <div className="relative">
                <Input id="studentSearch" value={studentSearch} onChange={e => setStudentSearch(e.target.value)} placeholder={selectedClassroomId ? "请输入学生姓名或编号搜索" : "请先选择班级"} disabled={!selectedClassroomId} onFocus={() => {
              if (foundStudents.length > 0) {
                setShowStudentList(true);
              }
            }} />

                {/* 学生搜索结果列表 */}
                {showStudentList && foundStudents.length > 0 && <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
                    {foundStudents.map(student => <div key={student._id} className="px-3 py-2 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0" onClick={() => handleSelectStudent(student)}>
                        <div className="font-medium text-sm">
                          {student.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          编号：{student.studentCode}
                        </div>
                      </div>)}
                  </div>}

                {/* 搜索状态提示 */}
                {isSearchingStudent && <div className="text-sm text-gray-500 mt-2">搜索中...</div>}

                {/* 未找到学生提示 */}
                {studentSearch.trim() && !isSearchingStudent && foundStudents.length === 0 && selectedClassroomId && <div className="bg-yellow-50 p-3 rounded-lg mt-2">
                      <div className="text-sm text-yellow-800">
                        未找到匹配的学生，请检查输入的姓名或编号
                      </div>
                    </div>}
              </div>}

            {/* 选中的学生显示 */}
            {selectedStudent && <div className="bg-green-50 p-3 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-green-800">
                    <div className="font-medium">
                      已选择学生：{selectedStudent.name}
                    </div>
                    <div className="text-xs mt-1">
                      学生编号：{selectedStudent.studentCode}
                    </div>
                  </div>
                  <button type="button" onClick={handleClearStudent} className="text-green-600 hover:text-green-800 p-1" title="重新选择学生">
                    ✕
                  </button>
                </div>
              </div>}
          </div>

          {/* 操作类型 */}
          <div className="space-y-2">
            <Label>
              操作类型 <span className="text-red-500">*</span>
            </Label>
            <RadioGroup value={operationType} onValueChange={value => setOperationType(value)} className="flex gap-6">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="add" id="add" />
                <Label htmlFor="add" className="text-green-600">
                  增加积分
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="deduct" id="deduct" />
                <Label htmlFor="deduct" className="text-red-600">
                  减少积分
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* 积分数量 */}
          <div className="space-y-2">
            <Label htmlFor="points">
              积分数量 <span className="text-red-500">*</span>
            </Label>
            <Input id="points" type="number" min="1" value={pointsAmount} onChange={e => setPointsAmount(e.target.value)} placeholder="请输入积分数量" />
          </div>

          {/* 修改原因 */}
          <div className="space-y-2">
            <Label htmlFor="reason">
              修改原因 <span className="text-red-500">*</span>
            </Label>
            <Textarea id="reason" value={reason} onChange={e => setReason(e.target.value)} placeholder="请输入修改原因..." rows={3} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isCreating}>
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={!isFormValid || isCreating}>
            {isCreating ? "创建中..." : "确认创建"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>;
}
