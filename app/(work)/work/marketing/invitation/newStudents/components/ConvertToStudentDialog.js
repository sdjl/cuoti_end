"use client";

// 将新生转为在校生的对话框组件
import { useEffect, useState } from "react";
import { Button } from "../../../../../../../components/ui/button.js";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../../../../../../components/ui/dialog.js";
import { Input } from "../../../../../../../components/ui/input.js";
import { Label } from "../../../../../../../components/ui/label.js";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../../../../../components/ui/select.js";
import { useToast } from "../../../../../../../hooks/use-toast.js";
import { convertToStudent, fetchMyClassRooms } from "../actions.js";
export default function ConvertToStudentDialog({
  open,
  onOpenChange,
  student,
  onSuccess
}) {
  const {
    toast
  } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [classrooms, setClassrooms] = useState([]);

  // 表单状态
  const [formData, setFormData] = useState({
    classRoomId: "",
    schoolId: "",
    studentCode: "",
    name: "",
    gender: "未知"
  });

  // 加载班级列表
  useEffect(() => {
    const loadClassrooms = async () => {
      if (open) {
        try {
          const result = await fetchMyClassRooms();
          if (result.success) {
            setClassrooms(result.data);
          }
        } catch {
          toast({
            title: "加载失败",
            description: "获取班级列表失败",
            variant: "destructive"
          });
        }
      }
    };
    loadClassrooms();
  }, [open, toast]);

  // 当student变化时更新表单数据
  useEffect(() => {
    if (student) {
      setFormData(prev => ({
        ...prev,
        name: student.studentInfo.studentName || ""
      }));
    }
  }, [student]);

  // 当选择班级时更新学校ID
  const handleClassroomChange = classRoomId => {
    const selectedClassroom = classrooms.find(c => c._id === classRoomId);
    setFormData(prev => ({
      ...prev,
      classRoomId,
      schoolId: selectedClassroom?.schoolId || ""
    }));
  };
  const handleSave = async () => {
    if (!student) return;

    // 表单验证
    if (!formData.classRoomId) {
      toast({
        title: "请选择班级",
        description: "必须选择一个班级",
        variant: "destructive"
      });
      return;
    }
    if (!formData.studentCode.trim()) {
      toast({
        title: "请输入学生编号",
        description: "学生编号不能为空",
        variant: "destructive"
      });
      return;
    }
    if (!formData.name.trim()) {
      toast({
        title: "请输入学生姓名",
        description: "学生姓名不能为空",
        variant: "destructive"
      });
      return;
    }
    setIsLoading(true);
    try {
      await convertToStudent(student._id, {
        classRoomId: formData.classRoomId,
        schoolId: formData.schoolId,
        studentCode: formData.studentCode.trim(),
        name: formData.name.trim(),
        gender: formData.gender
      });
      toast({
        title: "转换成功",
        description: `${formData.name} 已成功转为在校生`
      });
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "转换失败",
        description: error instanceof Error ? error.message : "请稍后重试",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  const handleCancel = () => {
    onOpenChange(false);
  };
  if (!student) return null;
  return <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>转为在校生</DialogTitle>
          <DialogDescription>
            将 {student.studentInfo.studentName} 转为正式在校生
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* 选择班级 */}
          <div className="space-y-2">
            <Label htmlFor="classRoomId">班级 *</Label>
            <Select value={formData.classRoomId} onValueChange={handleClassroomChange}>
              <SelectTrigger>
                <SelectValue placeholder="请选择班级" />
              </SelectTrigger>
              <SelectContent>
                {classrooms.map(classroom => <SelectItem key={classroom._id} value={classroom._id}>
                    {classroom.name} - {classroom.grade}
                  </SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* 学生编号 */}
          <div className="space-y-2">
            <Label htmlFor="studentCode">学生编号 *</Label>
            <Input id="studentCode" value={formData.studentCode} onChange={e => setFormData(prev => ({
            ...prev,
            studentCode: e.target.value
          }))} placeholder="请输入学生编号" />
          </div>

          {/* 学生姓名 */}
          <div className="space-y-2">
            <Label htmlFor="name">学生姓名 *</Label>
            <Input id="name" value={formData.name} onChange={e => setFormData(prev => ({
            ...prev,
            name: e.target.value
          }))} placeholder="请输入学生姓名" />
          </div>

          {/* 性别 */}
          <div className="space-y-2">
            <Label htmlFor="gender">性别</Label>
            <Select value={formData.gender} onValueChange={value => setFormData(prev => ({
            ...prev,
            gender: value
          }))}>
              <SelectTrigger>
                <SelectValue placeholder="请选择性别" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="男">男</SelectItem>
                <SelectItem value="女">女</SelectItem>
                <SelectItem value="未知">未知</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel} disabled={isLoading}>
            取消
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            {isLoading ? "转换中..." : "确认转换"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>;
}
