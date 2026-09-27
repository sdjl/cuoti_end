"use client";

import { closestCenter, DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Edit, GripVertical, Plus, Save, Trash2, X } from "lucide-react";
// 年级管理页面，用于设置和管理校园的年级列表，支持拖拽排序和重命名
import { useCallback, useEffect, useState } from "react";
import { Button } from "../../../../../components/ui/button.js";
import { Input } from "../../../../../components/ui/input.js";
import WorkHeader from "../../../../../components/work/layout/WorkHeader.js";
import { useToast } from "../../../../../hooks/use-toast.js";
import { useAuth } from "../../../../../hooks/useAuth.js";
import { getGradeListAction, renameGradeAction, updateGradeListAction } from "./actions.js";
// 检查年级名称是否重复
function checkDuplicateGrade(grades, newName, excludeId) {
  return grades.some(grade => grade.id !== excludeId && grade.name === newName);
}

// 可排序的年级项组件
function SortableGradeItem({
  grade,
  allGrades,
  onEdit,
  onDelete,
  onStartEdit,
  onCancelEdit
}) {
  const [editValue, setEditValue] = useState(grade.name);
  const [error, setError] = useState("");
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({
    id: grade.id
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  };

  // 当grade.name变化时，同步更新editValue
  useEffect(() => {
    setEditValue(grade.name);
    setError("");
  }, [grade.name]);
  const handleSave = () => {
    const trimmedValue = editValue.trim();
    if (!trimmedValue) {
      setError("年级名称不能为空");
      return;
    }
    if (checkDuplicateGrade(allGrades, trimmedValue, grade.id)) {
      setError("年级名称已存在");
      return;
    }
    onEdit(grade.id, trimmedValue);
    setError("");
  };
  const handleCancel = () => {
    setEditValue(grade.name);
    setError("");
    onCancelEdit(grade.id);
  };
  const handleKeyDown = e => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      handleCancel();
    }
  };

  // 检查实时输入是否重复
  const handleInputChange = e => {
    const newValue = e.target.value;
    setEditValue(newValue);
    if (newValue.trim() && checkDuplicateGrade(allGrades, newValue.trim(), grade.id)) {
      setError("年级名称已存在");
    } else {
      setError("");
    }
  };
  return <div ref={setNodeRef} style={style} className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg">
      <div className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600" {...attributes} {...listeners}>
        <GripVertical className="w-5 h-5" />
      </div>

      {grade.isEditing ? <div className="flex-1 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Input value={editValue} onChange={handleInputChange} onKeyDown={handleKeyDown} className={`flex-1 ${error ? "border-red-500" : ""}`} placeholder="请输入年级名称" autoFocus />
            <Button size="sm" onClick={handleSave} disabled={!editValue.trim() || !!error}>
              <Save className="w-4 h-4" />
            </Button>
            <Button size="sm" variant="outline" onClick={handleCancel}>
              <X className="w-4 h-4" />
            </Button>
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
        </div> : <div className="flex-1 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">
              {grade.originalName && grade.originalName !== grade.name ? <span className="text-orange-600">
                  {grade.originalName} → {grade.name}
                </span> : grade.name}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => onStartEdit(grade.id)} className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
              <Edit className="w-4 h-4" />
            </Button>
            <Button size="sm" variant="outline" onClick={() => onDelete(grade.id)} className="text-red-600 hover:text-red-700 hover:bg-red-50">
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>}
    </div>;
}
export default function GradeListPage() {
  const {
    isPrincipal
  } = useAuth();
  const {
    toast
  } = useToast();
  const [grades, setGrades] = useState([]);
  const [originalGrades, setOriginalGrades] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [newGradeName, setNewGradeName] = useState("");
  const [newGradeError, setNewGradeError] = useState("");
  const userIsPrincipal = isPrincipal();
  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, {
    coordinateGetter: sortableKeyboardCoordinates
  }));

  // 加载年级列表
  const loadGrades = useCallback(async () => {
    setIsLoading(true);
    try {
      const {
        grades: gradeList,
        error
      } = await getGradeListAction();
      if (error) {
        toast({
          title: "加载失败",
          description: error,
          variant: "destructive"
        });
      } else {
        // 转换为GradeItem格式
        const gradeItems = gradeList.map((name, index) => ({
          id: `grade-${index}`,
          name,
          originalName: name,
          isEditing: false
        }));
        setGrades(gradeItems);
        setOriginalGrades([...gradeList]);
      }
    } catch (error) {
      console.error("加载年级列表失败:", error);
      toast({
        title: "加载失败",
        description: "加载年级列表时发生错误",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // 保存年级列表
  const saveGrades = async () => {
    if (!userIsPrincipal) {
      toast({
        title: "权限不足",
        description: "只有校长才能修改年级列表",
        variant: "destructive"
      });
      return;
    }
    setIsSaving(true);
    try {
      const gradeNames = grades.map(grade => grade.name);

      // 检查是否有重复的年级名称
      const uniqueNames = [...new Set(gradeNames)];
      if (uniqueNames.length !== gradeNames.length) {
        toast({
          title: "保存失败",
          description: "年级列表中不能有重复项",
          variant: "destructive"
        });
        setIsSaving(false);
        return;
      }

      // 检查是否有需要重命名的年级
      const renamePromises = [];
      for (const grade of grades) {
        if (grade.originalName && grade.originalName !== grade.name) {
          // 需要重命名
          renamePromises.push(renameGradeAction(grade.originalName, grade.name, originalGrades));
        }
      }

      // 如果有重命名操作，先执行重命名
      if (renamePromises.length > 0) {
        const renameResults = await Promise.all(renamePromises);
        for (const result of renameResults) {
          if (!result.success) {
            toast({
              title: "重命名失败",
              description: result.error || "重命名年级失败",
              variant: "destructive"
            });
            setIsSaving(false);
            return;
          }
        }
      }

      // 更新年级列表（处理顺序变化和新增的年级）
      const {
        success,
        error
      } = await updateGradeListAction(gradeNames);
      if (success) {
        toast({
          title: "保存成功",
          description: "年级列表已更新"
        });
        // 重新加载年级列表
        await loadGrades();
      } else {
        toast({
          title: "保存失败",
          description: error || "保存年级列表失败",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("保存年级列表失败:", error);
      toast({
        title: "保存失败",
        description: "保存年级列表时发生错误",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };
  useEffect(() => {
    loadGrades();
  }, [loadGrades]);

  // 拖拽结束处理
  const handleDragEnd = event => {
    const {
      active,
      over
    } = event;
    if (active.id !== over?.id) {
      setGrades(items => {
        const oldIndex = items.findIndex(item => item.id === active.id);
        const newIndex = items.findIndex(item => item.id === over?.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  // 检查新增年级名称是否重复
  const handleNewGradeNameChange = e => {
    const newValue = e.target.value;
    setNewGradeName(newValue);
    if (newValue.trim() && checkDuplicateGrade(grades, newValue.trim())) {
      setNewGradeError("年级名称已存在");
    } else {
      setNewGradeError("");
    }
  };

  // 添加年级
  const addGrade = () => {
    const trimmedName = newGradeName.trim();
    if (!trimmedName) {
      setNewGradeError("年级名称不能为空");
      return;
    }
    if (checkDuplicateGrade(grades, trimmedName)) {
      setNewGradeError("年级名称已存在");
      return;
    }
    const newGrade = {
      id: `grade-${Date.now()}`,
      name: trimmedName,
      originalName: undefined,
      // 新增的年级没有原始名称
      isEditing: false
    };
    setGrades([...grades, newGrade]);
    setNewGradeName("");
    setNewGradeError("");
  };

  // 编辑年级
  const editGrade = (id, name) => {
    setGrades(grades.map(grade => grade.id === id ? {
      ...grade,
      name,
      isEditing: false
    } : grade));
  };

  // 开始编辑年级
  const startEditGrade = id => {
    setGrades(grades.map(grade => grade.id === id ? {
      ...grade,
      isEditing: true
    } : {
      ...grade,
      isEditing: false
    }));
  };

  // 取消编辑年级
  const cancelEditGrade = id => {
    setGrades(grades.map(grade => grade.id === id ? {
      ...grade,
      isEditing: false
    } : grade));
  };

  // 删除年级
  const deleteGrade = id => {
    setGrades(grades.filter(grade => grade.id !== id));
  };

  // 处理键盘事件
  const handleKeyDown = e => {
    if (e.key === "Enter") {
      addGrade();
    }
  };
  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>;
  }
  if (!userIsPrincipal) {
    return <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">权限不足，只有校长才能管理年级</p>
        </div>
      </div>;
  }
  return <div className="flex flex-col min-h-screen bg-gray-50">
      <WorkHeader title="年级管理" showBackButton backHref="/work/setting" backText="返回设置" />

      <main className="flex-1 p-6">
        <div className="container mx-auto max-w-2xl">
          {/* 页面标题 */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">年级管理</h1>
            <p className="text-gray-600">
              管理校园的年级设置，支持拖拽排序。年级顺序将影响班级管理中的显示顺序。
            </p>
          </div>

          {/* 添加年级 */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              添加年级
            </h2>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <Input value={newGradeName} onChange={handleNewGradeNameChange} onKeyDown={handleKeyDown} placeholder="请输入年级名称，如：一年级、七年级等" className={`flex-1 ${newGradeError ? "border-red-500" : ""}`} />
                <Button onClick={addGrade} disabled={!newGradeName.trim() || !!newGradeError} className="shrink-0">
                  <Plus className="w-4 h-4 mr-2" />
                  添加
                </Button>
              </div>
              {newGradeError && <p className="text-sm text-red-500">{newGradeError}</p>}
            </div>
          </div>

          {/* 年级列表 */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                年级列表 ({grades.length})
              </h2>
              <Button onClick={saveGrades} disabled={isSaving} className="shrink-0">
                {isSaving ? "保存中..." : "保存更改"}
              </Button>
            </div>

            {grades.length === 0 ? <div className="text-center py-8 text-gray-500">
                <p>暂无年级，请先添加年级</p>
              </div> : <div className="space-y-3">
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext items={grades.map(grade => grade.id)} strategy={verticalListSortingStrategy}>
                    {grades.map(grade => <SortableGradeItem key={grade.id} grade={grade} allGrades={grades} onEdit={editGrade} onDelete={deleteGrade} onStartEdit={startEditGrade} onCancelEdit={cancelEditGrade} />)}
                  </SortableContext>
                </DndContext>
              </div>}
          </div>

          {/* 使用说明 */}
          <div className="bg-blue-50 rounded-lg p-4 mt-6">
            <h3 className="text-sm font-medium text-blue-900 mb-2">使用说明</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• 点击编辑按钮可以修改年级名称</li>
              <li>• 拖拽左侧的图标可以调整年级顺序</li>
              <li>• 修改完成后请点击&ldquo;保存更改&rdquo;按钮</li>
              <li>• 年级删除后需要把这个年级的所有班级手动改为其他年级</li>
              <li>• 年级名称修改后，相关班级的年级字段会自动同步更新</li>
            </ul>
          </div>
        </div>
      </main>
    </div>;
}
