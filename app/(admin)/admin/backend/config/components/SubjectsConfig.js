"use client";

import { Lock, Plus, Save, Trash2, Unlock, X } from "lucide-react";
// 科目配置组件，用于管理系统中的学科科目列表，支持添加、编辑、删除和锁定科目
import { useEffect, useState } from "react";
import { updateSubjects } from "../actions.js";
import { Button } from "../../../../../../components/ui/button.js";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../../../../components/ui/card.js";
import { Input } from "../../../../../../components/ui/input.js";
import { Switch } from "../../../../../../components/ui/switch.js";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../../../../components/ui/table.js";
import { useToast } from "../../../../../../hooks/use-toast.js";
export default function SubjectsConfig({
  subjects: initialSubjects,
  docId
}) {
  const [subjects, setSubjects] = useState(initialSubjects);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    toast
  } = useToast();

  // 同步初始数据变化
  useEffect(() => {
    setSubjects(initialSubjects);
  }, [initialSubjects]);

  // 添加新科目
  const addSubject = () => {
    const newSubject = {
      name: "",
      color: "#000000",
      locked: false
    };
    setSubjects([...subjects, newSubject]);
    setIsEditing(true);
  };

  // 删除科目
  const removeSubject = index => {
    // 检查是否锁定，只有已保存的数据才会检查锁定状态
    if (!isEditing && subjects[index].locked) {
      toast({
        title: "无法删除",
        description: "锁定的科目不能被删除",
        variant: "destructive"
      });
      return;
    }
    const newSubjects = [...subjects];
    newSubjects.splice(index, 1);
    setSubjects(newSubjects);
    setIsEditing(true);
  };

  // 更新科目字段
  const updateSubjectField = (index, field, value) => {
    // 如果是已保存的数据，且已锁定，则不允许修改
    if (!isEditing && subjects[index].locked) {
      if (field === "locked" && value === false) {
        toast({
          title: "无法解锁",
          description: "已保存的锁定科目不能被解锁",
          variant: "destructive"
        });
        return;
      } else if (field !== "locked") {
        toast({
          title: "无法修改",
          description: "锁定的科目不能被修改",
          variant: "destructive"
        });
        return;
      }
    }
    const newSubjects = [...subjects];
    newSubjects[index] = {
      ...newSubjects[index],
      [field]: value
    };
    setSubjects(newSubjects);
    setIsEditing(true);
  };

  // 保存科目配置
  const saveSubjects = async () => {
    // 验证数据
    const hasEmptyFields = subjects.some(subject => !subject.name);
    if (hasEmptyFields) {
      toast({
        title: "验证失败",
        description: "科目名称不能为空",
        variant: "destructive"
      });
      return;
    }

    // 检查名称唯一性
    const names = subjects.map(subject => subject.name);
    if (new Set(names).size !== names.length) {
      toast({
        title: "验证失败",
        description: "科目名称必须唯一",
        variant: "destructive"
      });
      return;
    }
    setIsSubmitting(true);
    try {
      const result = await updateSubjects(subjects, docId);
      if (result.success) {
        toast({
          title: "保存成功",
          description: "科目配置已更新"
        });
        setIsEditing(false);
      } else {
        toast({
          title: "保存失败",
          description: result.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "保存失败",
        description: `发生错误: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 取消编辑
  const cancelEdit = () => {
    setSubjects(initialSubjects);
    setIsEditing(false);
  };
  return <Card>
      <CardHeader>
        <CardTitle>科目列表</CardTitle>
        <CardDescription>系统中的所有学科科目</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex justify-end space-x-2">
          <Button variant="outline" size="sm" onClick={addSubject}>
            <Plus className="mr-1 h-4 w-4" /> 添加科目
          </Button>
          {isEditing && <>
              <Button variant="outline" size="sm" onClick={cancelEdit}>
                <X className="mr-1 h-4 w-4" /> 取消
              </Button>
              <Button size="sm" onClick={saveSubjects} disabled={isSubmitting}>
                <Save className="mr-1 h-4 w-4" /> 保存
              </Button>
            </>}
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>科目名称</TableHead>
              <TableHead>颜色</TableHead>
              <TableHead>锁定状态</TableHead>
              <TableHead className="w-[100px]">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {subjects.map((subject, index) => <TableRow key={index}>
                <TableCell>
                  <Input value={subject.name} onChange={e => updateSubjectField(index, "name", e.target.value)} disabled={!isEditing && subject.locked} />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-full border" style={{
                  backgroundColor: subject.color
                }}></div>
                    <Input type="color" value={subject.color} onChange={e => updateSubjectField(index, "color", e.target.value)} className="w-16 h-8 p-0" disabled={!isEditing && subject.locked} />
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <Switch checked={subject.locked} onCheckedChange={checked => updateSubjectField(index, "locked", checked)} />
                    <span className="ml-2">
                      {subject.locked ? <Lock className="h-4 w-4 text-orange-500" /> : <Unlock className="h-4 w-4 text-green-500" />}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" onClick={() => removeSubject(index)} disabled={!isEditing && subject.locked}>
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </TableCell>
              </TableRow>)}
          </TableBody>
        </Table>
      </CardContent>
    </Card>;
}
