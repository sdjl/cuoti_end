"use client";

import { Plus, X } from "lucide-react";
// 学生分组对话框组件，用于添加或编辑学生分组信息
import { useEffect, useState } from "react";
import { Badge } from "../../../../../../components/ui/badge.js";
import { Button } from "../../../../../../components/ui/button.js";
import { Card, CardContent } from "../../../../../../components/ui/card.js";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "../../../../../../components/ui/dialog.js";
import { Input } from "../../../../../../components/ui/input.js";
import { Label } from "../../../../../../components/ui/label.js";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../../../../components/ui/select.js";
import { Textarea } from "../../../../../../components/ui/textarea.js";
import { useToast } from "../../../../../../hooks/use-toast.js";
import { getSchoolClassroomsAction, getStudentsInClassAction } from "../actions.js";
export default function StudentGroupDialog({
  open,
  onOpenChange,
  studentGroup,
  onSave
}) {
  const {
    toast
  } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [classrooms, setClassrooms] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    teacherName: "",
    notes: ""
  });

  // 学生管理状态
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [studentFilterName, setStudentFilterName] = useState("");
  const [allClassStudents, setAllClassStudents] = useState([]);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);

  // 当学生分组数据变化时更新表单
  useEffect(() => {
    if (studentGroup) {
      setFormData({
        name: studentGroup.name || "",
        teacherName: studentGroup.teacherName || "",
        notes: studentGroup.notes || ""
      });
      setSelectedStudents(studentGroup.students || []);
    } else {
      // 新增时重置表单
      setFormData({
        name: "",
        teacherName: "",
        notes: ""
      });
      setSelectedStudents([]);
    }
    setSelectedClassId("");
    setStudentFilterName("");
    setAllClassStudents([]);
  }, [studentGroup, open]);

  // 加载班级列表
  useEffect(() => {
    const loadData = async () => {
      if (!open) return;
      try {
        const classroomsData = await getSchoolClassroomsAction();
        setClassrooms(classroomsData);
      } catch (error) {
        console.error("加载数据失败:", error);
        toast({
          title: "加载数据失败",
          description: "获取班级列表时发生错误",
          variant: "destructive"
        });
      }
    };
    loadData();
  }, [open, toast]);

  // 当选择班级时，加载该班级的所有学生
  useEffect(() => {
    const loadClassStudents = async () => {
      if (!selectedClassId) {
        setAllClassStudents([]);
        return;
      }
      setIsLoadingStudents(true);
      try {
        const students = await getStudentsInClassAction(selectedClassId);
        setAllClassStudents(students);
      } catch (error) {
        console.error("加载班级学生失败:", error);
        toast({
          title: "加载失败",
          description: "加载班级学生时发生错误",
          variant: "destructive"
        });
      } finally {
        setIsLoadingStudents(false);
      }
    };
    loadClassStudents();
  }, [selectedClassId, toast]);

  // 前端过滤学生列表
  const filteredStudents = allClassStudents.filter(student => {
    if (!studentFilterName.trim()) {
      return true;
    }
    return student.name.toLowerCase().includes(studentFilterName.toLowerCase()) || student.studentCode.toLowerCase().includes(studentFilterName.toLowerCase());
  });

  // 添加学生到分组
  const handleAddStudent = student => {
    // 检查是否已经添加过该学生
    const isAlreadyAdded = selectedStudents.some(s => s.studentId === student.studentId);
    if (isAlreadyAdded) {
      toast({
        title: "重复添加",
        description: "该学生已经在分组中",
        variant: "destructive"
      });
      return;
    }
    const newStudent = {
      studentId: student.studentId,
      name: student.name,
      studentCode: student.studentCode,
      className: student.className,
      classId: selectedClassId
    };
    setSelectedStudents(prev => [...prev, newStudent]);
  };

  // 移除学生
  const handleRemoveStudent = studentId => {
    setSelectedStudents(prev => prev.filter(s => s.studentId !== studentId));
  };

  // 处理表单提交
  const handleSubmit = async e => {
    e.preventDefault();

    // 验证必填字段
    if (!formData.name.trim()) {
      toast({
        title: "表单验证失败",
        description: "分组名称不能为空",
        variant: "destructive"
      });
      return;
    }
    if (!formData.teacherName.trim()) {
      toast({
        title: "表单验证失败",
        description: "请选择老师",
        variant: "destructive"
      });
      return;
    }
    setIsSubmitting(true);
    try {
      await onSave({
        name: formData.name.trim(),
        teacherName: formData.teacherName.trim(),
        notes: formData.notes.trim() || undefined,
        students: selectedStudents
      });
      onOpenChange(false);
    } catch (error) {
      // 错误处理由父组件完成
      console.error("保存学生分组失败:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 处理取消
  const handleCancel = () => {
    onOpenChange(false);
  };
  return <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {studentGroup ? "编辑学生分组" : "添加学生分组"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 基本信息 */}
          <div className="grid md:grid-cols-2 gap-4">
            {/* 分组名称 */}
            <div className="space-y-2">
              <Label htmlFor="name">
                分组名称 <span className="text-red-500">*</span>
              </Label>
              <Input id="name" value={formData.name} onChange={e => setFormData({
              ...formData,
              name: e.target.value
            })} placeholder="请输入分组名称" required />
            </div>

            {/* 老师姓名 */}
            <div className="space-y-2">
              <Label htmlFor="teacherName">
                老师姓名 <span className="text-red-500">*</span>
              </Label>
              <Input id="teacherName" value={formData.teacherName} onChange={e => setFormData({
              ...formData,
              teacherName: e.target.value
            })} placeholder="请输入老师姓名" required />
            </div>
          </div>

          {/* 备注 */}
          <div className="space-y-2">
            <Label htmlFor="notes">备注</Label>
            <Textarea id="notes" value={formData.notes} onChange={e => setFormData({
            ...formData,
            notes: e.target.value
          })} placeholder="请输入备注" rows={3} />
          </div>

          {/* 学生管理 */}
          <div className="space-y-4">
            <Label>学生管理</Label>

            {/* 添加学生 */}
            <Card>
              <CardContent className="p-4 space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  {/* 班级选择 */}
                  <div className="space-y-2">
                    <Label>选择班级</Label>
                    <Select value={selectedClassId} onValueChange={value => {
                    setSelectedClassId(value);
                    setStudentFilterName("");
                  }}>
                      <SelectTrigger>
                        <SelectValue placeholder="选择班级" />
                      </SelectTrigger>
                      <SelectContent>
                        {classrooms.map(classroom => <SelectItem key={classroom._id} value={classroom._id}>
                            {classroom.grade} - {classroom.name}
                          </SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* 学生姓名过滤 */}
                  <div className="space-y-2">
                    <Label>过滤学生</Label>
                    <Input value={studentFilterName} onChange={e => setStudentFilterName(e.target.value)} placeholder="输入姓名或学号过滤" disabled={!selectedClassId} />
                  </div>
                </div>

                {/* 学生列表 */}
                {selectedClassId && <div className="space-y-2">
                    {isLoadingStudents ? <div className="text-center text-gray-500 py-4">
                        加载学生中...
                      </div> : filteredStudents.length > 0 ? <>
                        <Label>
                          班级学生（点击添加）
                          {studentFilterName && <span className="text-gray-500 ml-2">
                              - 找到 {filteredStudents.length} 个学生
                            </span>}
                        </Label>
                        <div className="max-h-48 overflow-y-auto border rounded-md p-2">
                          <div className="flex flex-wrap gap-2">
                            {filteredStudents.map(student => <Badge key={student.studentId} variant="outline" className="cursor-pointer hover:bg-primary hover:text-primary-foreground" onClick={() => handleAddStudent(student)}>
                                <Plus className="h-3 w-3 mr-1" />
                                {student.name} ({student.studentCode})
                              </Badge>)}
                          </div>
                        </div>
                      </> : <div className="text-center text-gray-500 py-4">
                        {studentFilterName ? "没有找到匹配的学生" : "该班级暂无学生"}
                      </div>}
                  </div>}
              </CardContent>
            </Card>

            {/* 已选学生列表 */}
            {selectedStudents.length > 0 && <Card>
                <CardContent className="p-4">
                  <Label>已选学生 ({selectedStudents.length})</Label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {selectedStudents.map(student => <Badge key={student.studentId} variant="default" className="flex items-center gap-1">
                        {student.name} ({student.className})
                        <X className="h-3 w-3 cursor-pointer hover:text-red-500" onClick={() => handleRemoveStudent(student.studentId)} />
                      </Badge>)}
                  </div>
                </CardContent>
              </Card>}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleCancel} disabled={isSubmitting}>
              取消
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "保存中..." : "保存"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>;
}
