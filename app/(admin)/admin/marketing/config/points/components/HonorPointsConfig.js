"use client";

import { closestCenter, DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Loader2, Plus, Save, X } from "lucide-react";
// 荣誉积分配置组件，用于配置荣誉积分功能的相关设置和荣誉项管理
import { useEffect, useState } from "react";
import { Alert, AlertDescription } from "../../../../../../../components/ui/alert.js";
import { Button } from "../../../../../../../components/ui/button.js";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../../../../../components/ui/card.js";
import { Input } from "../../../../../../../components/ui/input.js";
import { Label } from "../../../../../../../components/ui/label.js";
import { Switch } from "../../../../../../../components/ui/switch.js";
import { Textarea } from "../../../../../../../components/ui/textarea.js";
import { useToast } from "../../../../../../../hooks/use-toast.js";
import { updateHonorPointsConfig } from "../actions.js";

// 荣誉项数据结构

// 可拖拽的荣誉项组件
function SortableHonorItem({
  item,
  onUpdate,
  onRemove,
  disabled
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition
  } = useSortable({
    id: item.id
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  };
  return <div ref={setNodeRef} style={style} className="flex items-start gap-2 p-3 bg-muted/50 rounded-md">
      <div {...attributes} {...listeners} className="cursor-grab hover:cursor-grabbing pt-2">
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="flex-1 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <Label htmlFor={`honor-name-${item.id}`}>荣誉名称</Label>
            <Input id={`honor-name-${item.id}`} value={item.name} onChange={e => onUpdate(item.id, "name", e.target.value)} placeholder="荣誉名称" disabled={disabled} />
          </div>
          <div>
            <Label htmlFor={`honor-points-${item.id}`}>申请获得积分</Label>
            <Input id={`honor-points-${item.id}`} type="number" min="0" value={item.points} onChange={e => onUpdate(item.id, "points", parseInt(e.target.value) || 0)} placeholder="50" disabled={disabled} />
          </div>
        </div>
        <div>
          <Label htmlFor={`honor-description-${item.id}`}>荣誉描述</Label>
          <Textarea id={`honor-description-${item.id}`} value={item.description} onChange={e => onUpdate(item.id, "description", e.target.value)} placeholder="荣誉的详细解释、申请条件、申请流程等" disabled={disabled} rows={3} />
        </div>
      </div>
      <Button type="button" variant="ghost" size="sm" onClick={() => onRemove(item.id)} disabled={disabled} className="text-destructive hover:text-destructive mt-6">
        <X className="h-4 w-4" />
      </Button>
    </div>;
}
export default function HonorPointsConfig({
  config,
  onConfigChange
}) {
  const [formData, setFormData] = useState({
    enabled: false,
    honors: []
  });
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const {
    toast
  } = useToast();

  // 生成随机ID
  const generateId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  };

  // 初始化表单数据
  useEffect(() => {
    const honorConfig = config?.pointsSystem?.honor;
    const honorsData = (honorConfig?.honors || []).filter(honor => honor && typeof honor === "object").map((honor, index) => ({
      id: `honor-${index}-${Date.now()}`,
      name: honor?.name || "",
      description: honor?.description || "",
      points: honor?.points || 0
    }));
    setFormData({
      enabled: honorConfig?.enabled ?? false,
      honors: honorsData
    });
    setHasChanges(false);
  }, [config]);

  // 检查是否有变化
  useEffect(() => {
    const originalConfig = config?.pointsSystem?.honor;
    const currentHonors = formData.honors.map(item => ({
      name: item?.name || "",
      description: item?.description || "",
      points: item?.points || 0
    }));
    const originalHonors = (originalConfig?.honors || []).filter(honor => honor && typeof honor === "object").map(honor => ({
      name: honor?.name || "",
      description: honor?.description || "",
      points: honor?.points || 0
    }));
    const hasChanged = formData.enabled !== (originalConfig?.enabled ?? false) || JSON.stringify(currentHonors) !== JSON.stringify(originalHonors);
    setHasChanges(hasChanged);
  }, [formData, config]);

  // 拖拽传感器配置
  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, {
    coordinateGetter: sortableKeyboardCoordinates
  }));

  // 更新表单字段
  const updateField = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // 添加荣誉项
  const addHonor = () => {
    const newItem = {
      id: generateId(),
      name: "",
      description: "",
      points: 0
    };
    setFormData(prev => ({
      ...prev,
      honors: [...prev.honors, newItem]
    }));
  };

  // 删除荣誉项
  const removeHonor = id => {
    setFormData(prev => ({
      ...prev,
      honors: prev.honors.filter(item => item.id !== id)
    }));
  };

  // 更新荣誉项内容
  const updateHonor = (id, field, value) => {
    setFormData(prev => ({
      ...prev,
      honors: prev.honors.map(item => item.id === id ? {
        ...item,
        [field]: value
      } : item)
    }));
  };

  // 处理拖拽结束
  const handleDragEnd = event => {
    const {
      active,
      over
    } = event;
    if (active.id !== over?.id) {
      setFormData(prev => {
        const oldIndex = prev.honors.findIndex(item => item.id === active.id);
        const newIndex = prev.honors.findIndex(item => item.id === over?.id);
        return {
          ...prev,
          honors: arrayMove(prev.honors, oldIndex, newIndex)
        };
      });
    }
  };

  // 处理保存
  const handleSave = async () => {
    if (!hasChanges) {
      toast({
        title: "提示",
        description: "没有需要保存的更改"
      });
      return;
    }
    setSaving(true);
    try {
      // 转换为保存格式
      const saveData = {
        enabled: formData.enabled,
        honors: formData.honors.map(item => ({
          name: item.name,
          description: item.description,
          points: item.points
        }))
      };
      const result = await updateHonorPointsConfig(saveData);
      if (result.success) {
        // 更新本地配置
        const updatedConfig = {
          ...config,
          pointsSystem: {
            invitation: config?.pointsSystem?.invitation || {
              pointsPerUse: 10
            },
            sharing: config?.pointsSystem?.sharing || {
              pointsPerShare: 5,
              dailyLimit: 50,
              cooldownDays: 1,
              sameWechatLimit: 100,
              shareDays: 7
            },
            personalMistake: config?.pointsSystem?.personalMistake || {
              pointsPerUpload: 2,
              dailyLimit: 20
            },
            lottery: config?.pointsSystem?.lottery || {
              enabled: false,
              pointsPerDraw: 10,
              prizes: []
            },
            exchange: config?.pointsSystem?.exchange || {
              enabled: false,
              items: []
            },
            honor: saveData
          }
        };
        onConfigChange(updatedConfig);
        toast({
          title: "保存成功",
          description: result.message
        });
        setHasChanges(false);
      } else {
        toast({
          variant: "destructive",
          title: "保存失败",
          description: result.message
        });
      }
    } catch (error) {
      console.error("保存荣誉积分配置失败:", error);
      toast({
        variant: "destructive",
        title: "保存失败",
        description: `客户端错误: ${error instanceof Error ? error.message : String(error)}`
      });
    } finally {
      setSaving(false);
    }
  };

  // 重置表单
  const handleReset = () => {
    const honorConfig = config?.pointsSystem?.honor;
    const honorsData = (honorConfig?.honors || []).filter(honor => honor && typeof honor === "object").map((honor, index) => ({
      id: `honor-${index}-${Date.now()}`,
      name: honor?.name || "",
      description: honor?.description || "",
      points: honor?.points || 0
    }));
    setFormData({
      enabled: honorConfig?.enabled ?? false,
      honors: honorsData
    });
    setHasChanges(false);
  };
  return <div className="space-y-6">
      <Alert>
        <AlertDescription>
          配置荣誉积分功能的相关设置。学生可以申请各种荣誉称号并获得积分奖励。修改后需要点击&ldquo;保存&rdquo;按钮才能生效。
        </AlertDescription>
      </Alert>

      {/* 功能开关 */}
      <Card>
        <CardHeader>
          <CardTitle>功能开关</CardTitle>
          <CardDescription>控制荣誉积分功能是否启用</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between space-x-2">
            <div className="space-y-1">
              <Label htmlFor="enabled" className="text-sm font-medium">
                启用荣誉积分功能
              </Label>
              <p className="text-sm text-muted-foreground">
                开启后，学生可以申请荣誉称号并获得积分奖励
              </p>
            </div>
            <Switch id="enabled" checked={formData.enabled} onCheckedChange={checked => updateField("enabled", checked)} disabled={saving} />
          </div>
        </CardContent>
      </Card>

      {/* 荣誉配置 */}
      <Card>
        <CardHeader>
          <CardTitle>荣誉配置</CardTitle>
          <CardDescription>设置可申请的荣誉列表，支持拖拽排序</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                共 {formData.honors.length} 个荣誉
              </p>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={addHonor} disabled={saving} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              添加荣誉
            </Button>
          </div>

          {formData.honors.length > 0 ? <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={formData.honors.map(item => item.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-3">
                  {formData.honors.map((item, index) => <SortableHonorItem key={item.id} item={item} index={index} onUpdate={updateHonor} onRemove={removeHonor} disabled={saving} />)}
                </div>
              </SortableContext>
            </DndContext> : <div className="text-center py-8 text-muted-foreground">
              暂无荣誉，点击&ldquo;添加荣誉&rdquo;按钮创建
            </div>}
        </CardContent>
      </Card>

      {/* 使用说明 */}
      <Card>
        <CardHeader>
          <CardTitle>使用说明</CardTitle>
          <CardDescription>荣誉积分的工作原理</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>• 学生可以查看可申请的荣誉列表和申请条件</p>
            <p>• 学生提交荣誉申请后，需要管理员审核</p>
            <p>• 审核通过后，学生获得荣誉称号和相应积分</p>
            <p>• 荣誉称号将显示在学生的个人资料中</p>
            <p>• 可以设置学习成就、行为表现、特殊贡献等不同类型的荣誉</p>
          </div>
        </CardContent>
      </Card>

      {/* 保存按钮区域 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <Button onClick={handleSave} disabled={!hasChanges || saving} className="flex items-center gap-2">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {saving ? "保存中..." : "保存配置"}
            </Button>

            {hasChanges && <Button variant="outline" onClick={handleReset} disabled={saving}>
                重置
              </Button>}

            {!hasChanges && <span className="text-sm text-muted-foreground">
                已保存最新配置
              </span>}
          </div>
        </CardContent>
      </Card>
    </div>;
}
