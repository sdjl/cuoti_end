"use client";

import { Lock, Plus, Save, Trash2, Unlock, X } from "lucide-react";
// 题型配置组件，用于管理系统中的题型列表，支持添加、编辑、删除和锁定题型
import { useEffect, useState } from "react";
import { updateQuestionTypes } from "../actions.js";
import { Button } from "../../../../../../components/ui/button.js";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../../../../components/ui/card.js";
import { Input } from "../../../../../../components/ui/input.js";
import { Switch } from "../../../../../../components/ui/switch.js";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../../../../components/ui/table.js";
import { useToast } from "../../../../../../hooks/use-toast.js";
export default function QuestionTypesConfig({
  questionTypes: initialQuestionTypes,
  docId
}) {
  const [questionTypes, setQuestionTypes] = useState(initialQuestionTypes);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    toast
  } = useToast();

  // 同步初始数据变化
  useEffect(() => {
    setQuestionTypes(initialQuestionTypes);
  }, [initialQuestionTypes]);

  // 添加新题型
  const addQuestionType = () => {
    const newQuestionType = {
      name: "",
      locked: false
    };
    setQuestionTypes([...questionTypes, newQuestionType]);
    setIsEditing(true);
  };

  // 删除题型
  const removeQuestionType = index => {
    // 检查是否锁定，只有已保存的数据才会检查锁定状态
    if (!isEditing && questionTypes[index].locked) {
      toast({
        title: "无法删除",
        description: "锁定的题型不能被删除",
        variant: "destructive"
      });
      return;
    }
    const newQuestionTypes = [...questionTypes];
    newQuestionTypes.splice(index, 1);
    setQuestionTypes(newQuestionTypes);
    setIsEditing(true);
  };

  // 更新题型字段
  const updateQuestionTypeField = (index, field, value) => {
    // 如果是已保存的数据，且已锁定，则不允许修改
    if (!isEditing && questionTypes[index].locked) {
      if (field === "locked" && value === false) {
        toast({
          title: "无法解锁",
          description: "已保存的锁定题型不能被解锁",
          variant: "destructive"
        });
        return;
      } else if (field !== "locked") {
        toast({
          title: "无法修改",
          description: "锁定的题型不能被修改",
          variant: "destructive"
        });
        return;
      }
    }
    const newQuestionTypes = [...questionTypes];
    newQuestionTypes[index] = {
      ...newQuestionTypes[index],
      [field]: value
    };
    setQuestionTypes(newQuestionTypes);
    setIsEditing(true);
  };

  // 保存题型配置
  const saveQuestionTypes = async () => {
    // 验证数据
    const hasEmptyFields = questionTypes.some(type => !type.name);
    if (hasEmptyFields) {
      toast({
        title: "验证失败",
        description: "题型名称不能为空",
        variant: "destructive"
      });
      return;
    }

    // 检查名称唯一性
    const names = questionTypes.map(type => type.name);
    if (new Set(names).size !== names.length) {
      toast({
        title: "验证失败",
        description: "题型名称必须唯一",
        variant: "destructive"
      });
      return;
    }
    setIsSubmitting(true);
    try {
      const result = await updateQuestionTypes(questionTypes, docId);
      if (result.success) {
        toast({
          title: "保存成功",
          description: "题型配置已更新"
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
    setQuestionTypes(initialQuestionTypes);
    setIsEditing(false);
  };
  return <Card>
      <CardHeader>
        <CardTitle>题型列表</CardTitle>
        <CardDescription>系统中的所有题型配置</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4 flex justify-end space-x-2">
          <Button variant="outline" size="sm" onClick={addQuestionType}>
            <Plus className="mr-1 h-4 w-4" /> 添加题型
          </Button>
          {isEditing && <>
              <Button variant="outline" size="sm" onClick={cancelEdit}>
                <X className="mr-1 h-4 w-4" /> 取消
              </Button>
              <Button size="sm" onClick={saveQuestionTypes} disabled={isSubmitting}>
                <Save className="mr-1 h-4 w-4" /> 保存
              </Button>
            </>}
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>题型名称</TableHead>
              <TableHead>锁定状态</TableHead>
              <TableHead className="w-[100px]">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {questionTypes.map((type, index) => <TableRow key={index}>
                <TableCell>
                  <Input value={type.name} onChange={e => updateQuestionTypeField(index, "name", e.target.value)} disabled={!isEditing && type.locked} />
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <Switch checked={type.locked} onCheckedChange={checked => updateQuestionTypeField(index, "locked", checked)} />
                    <span className="ml-2">
                      {type.locked ? <Lock className="h-4 w-4 text-orange-500" /> : <Unlock className="h-4 w-4 text-green-500" />}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" onClick={() => removeQuestionType(index)} disabled={!isEditing && type.locked}>
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </TableCell>
              </TableRow>)}
          </TableBody>
        </Table>
      </CardContent>
    </Card>;
}
