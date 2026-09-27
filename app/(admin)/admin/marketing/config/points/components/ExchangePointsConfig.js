"use client";

import { closestCenter, DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Loader2, Plus, Save, Upload, X } from "lucide-react";
// 积分兑换配置组件，用于配置积分兑换功能的相关设置和兑换项管理
import { useEffect, useState } from "react";
import BaseImage from "../../../../../../../components/common/BaseImage.js";
import { Alert, AlertDescription } from "../../../../../../../components/ui/alert.js";
import { Button } from "../../../../../../../components/ui/button.js";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../../../../../components/ui/card.js";
import { Input } from "../../../../../../../components/ui/input.js";
import { Label } from "../../../../../../../components/ui/label.js";
import { Switch } from "../../../../../../../components/ui/switch.js";
import { useToast } from "../../../../../../../hooks/use-toast.js";
import { deleteImage, updateExchangeItemImage, updateExchangePointsConfig, uploadImage } from "../actions.js";

// 兑换项数据结构

// 可拖拽的兑换项组件
function SortableExchangeItem({
  item,
  onUpdate,
  onRemove,
  onImageUpload,
  onImageDelete,
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
      {/* 左右布局 */}
      <div className="flex-1 flex gap-4">
        {/* 左侧：图片 */}
        <div className="w-32 flex-shrink-0">
          <Label className="text-sm mb-1 block">商品图片</Label>
          {item.image ? <div className="relative w-32 h-32 group cursor-pointer" onClick={() => item.image?.imageUrl && window.open(item.image.imageUrl, "_blank")}>
              <div className="w-full h-full border rounded-md overflow-hidden bg-gray-100 flex items-center justify-center">
                <BaseImage src={item.image?.imageUrl || ""} alt={item?.name || "商品图片"} fill className="object-contain" sizes="128px" />
              </div>
              <Button type="button" variant="destructive" size="sm" className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => {
            e.stopPropagation();
            onImageDelete(item.id);
          }} disabled={disabled}>
                <X className="h-3 w-3" />
              </Button>
            </div> : <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-md flex items-center justify-center hover:border-gray-400 transition-colors">
              <input type="file" accept="image/*" onChange={e => {
            const file = e.target.files?.[0];
            if (file) {
              onImageUpload(item.id, file);
            }
          }} className="hidden" id={`item-image-${item.id}`} disabled={disabled} />
              <label htmlFor={`item-image-${item.id}`} className="cursor-pointer flex flex-col items-center gap-2 text-gray-400 hover:text-gray-600 transition-colors p-4">
                <Upload className="h-6 w-6" />
                <span className="text-sm text-center">
                  点击上传
                  <br />
                  商品图片
                </span>
              </label>
            </div>}
        </div>

        {/* 右侧：其他内容 */}
        <div className="flex-1 space-y-3">
          {/* 第一行：商品名称(70%) + 需要积分(30%) */}
          <div className="grid grid-cols-10 gap-3">
            <div className="col-span-7">
              <Label htmlFor={`item-name-${item.id}`}>商品/服务名称</Label>
              <Input id={`item-name-${item.id}`} value={item.name} onChange={e => onUpdate(item.id, "name", e.target.value)} placeholder="商品或服务名称" disabled={disabled} />
            </div>
            <div className="col-span-3">
              <Label htmlFor={`item-points-${item.id}`}>需要积分</Label>
              <Input id={`item-points-${item.id}`} type="number" min="0" value={item.requiredPoints} onChange={e => onUpdate(item.id, "requiredPoints", parseInt(e.target.value) || 0)} placeholder="100" disabled={disabled} />
            </div>
          </div>

          {/* 第二行：商品描述 */}
          <div>
            <Label htmlFor={`item-description-${item.id}`}>商品/服务描述</Label>
            <Input id={`item-description-${item.id}`} value={item.description} onChange={e => onUpdate(item.id, "description", e.target.value)} placeholder="商品或服务的详细描述" disabled={disabled} />
          </div>
        </div>
      </div>
      <Button type="button" variant="ghost" size="sm" onClick={() => onRemove(item.id)} disabled={disabled} className="text-destructive hover:text-destructive mt-6">
        <X className="h-4 w-4" />
      </Button>
    </div>;
}
export default function ExchangePointsConfig({
  config,
  onConfigChange
}) {
  const [formData, setFormData] = useState({
    enabled: false,
    items: []
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
    const exchangeConfig = config?.pointsSystem?.exchange;
    const itemsData = (exchangeConfig?.items || []).filter(item => item && typeof item === "object").map((item, index) => ({
      id: `item-${index}-${Date.now()}`,
      name: item?.name || "",
      image: item?.image || undefined,
      description: item?.description || "",
      requiredPoints: item?.requiredPoints || 0
    }));
    setFormData({
      enabled: exchangeConfig?.enabled ?? false,
      items: itemsData
    });
    setHasChanges(false);
  }, [config]);

  // 检查是否有变化
  useEffect(() => {
    const originalConfig = config?.pointsSystem?.exchange;
    const currentItems = formData.items.map(item => ({
      name: item?.name || "",
      image: item?.image || undefined,
      description: item?.description || "",
      requiredPoints: item?.requiredPoints || 0
    }));
    const originalItems = (originalConfig?.items || []).filter(item => item && typeof item === "object").map(item => ({
      name: item?.name || "",
      image: item?.image || undefined,
      description: item?.description || "",
      requiredPoints: item?.requiredPoints || 0
    }));
    const hasChanged = formData.enabled !== (originalConfig?.enabled ?? false) || JSON.stringify(currentItems) !== JSON.stringify(originalItems);
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

  // 添加兑换项
  const addItem = () => {
    const newItem = {
      id: generateId(),
      name: "",
      description: "",
      requiredPoints: 0
    };
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }));
  };

  // 删除兑换项
  const removeItem = id => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== id)
    }));
  };

  // 更新兑换项内容
  const updateItem = (id, field, value) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map(item => item.id === id ? {
        ...item,
        [field]: value
      } : item)
    }));
  };

  // 处理图片上传
  const handleImageUpload = async (itemId, file) => {
    try {
      setSaving(true);

      // 创建FormData
      const uploadFormData = new FormData();
      uploadFormData.append("file", file);

      // 调用上传API
      const result = await uploadImage(uploadFormData);
      if (result.success && result.data) {
        // 先更新本地状态
        setFormData(prev => ({
          ...prev,
          items: prev.items.map(item => item.id === itemId ? {
            ...item,
            image: result.data
          } : item)
        }));

        // 找到商品在数组中的索引
        const itemIndex = formData.items.findIndex(i => i.id === itemId);
        if (itemIndex !== -1) {
          // 直接更新数据库中该商品的图片字段
          const updateResult = await updateExchangeItemImage(itemIndex, result.data);
          if (updateResult.success) {
            toast({
              title: "上传成功",
              description: result.message || "图片已上传并保存到数据库"
            });
          } else {
            toast({
              variant: "destructive",
              title: "保存失败",
              description: updateResult.message || "图片上传成功但保存到数据库失败"
            });
          }
        }
      } else {
        toast({
          variant: "destructive",
          title: "上传失败",
          description: result.message || "图片上传失败"
        });
      }
    } catch (error) {
      console.error("图片上传失败:", error);
      toast({
        variant: "destructive",
        title: "上传失败",
        description: error instanceof Error ? error.message : "图片上传失败"
      });
    } finally {
      setSaving(false);
    }
  };

  // 处理图片删除
  const handleImageDelete = async itemId => {
    const item = formData.items.find(i => i.id === itemId);
    if (!item?.image) return;
    try {
      setSaving(true);

      // 先删除云存储中的文件
      const deleteResult = await deleteImage(item.image.imageFileId);
      if (deleteResult.success) {
        // 更新本地状态
        setFormData(prev => ({
          ...prev,
          items: prev.items.map(item => item.id === itemId ? {
            ...item,
            image: undefined
          } : item)
        }));

        // 找到商品在数组中的索引
        const itemIndex = formData.items.findIndex(i => i.id === itemId);
        if (itemIndex !== -1) {
          // 直接更新数据库，删除图片字段
          const updateResult = await updateExchangeItemImage(itemIndex, null);
          if (updateResult.success) {
            toast({
              title: "删除成功",
              description: "图片已删除并从数据库中移除"
            });
          } else {
            toast({
              variant: "destructive",
              title: "删除部分失败",
              description: updateResult.message || "图片文件已删除但数据库更新失败"
            });
          }
        }
      } else {
        toast({
          variant: "destructive",
          title: "删除失败",
          description: deleteResult.message || "图片删除失败"
        });
      }
    } catch (error) {
      console.error("图片删除失败:", error);
      toast({
        variant: "destructive",
        title: "删除失败",
        description: error instanceof Error ? error.message : "图片删除失败"
      });
    } finally {
      setSaving(false);
    }
  };

  // 处理拖拽结束
  const handleDragEnd = event => {
    const {
      active,
      over
    } = event;
    if (active.id !== over?.id) {
      setFormData(prev => {
        const oldIndex = prev.items.findIndex(item => item.id === active.id);
        const newIndex = prev.items.findIndex(item => item.id === over?.id);
        return {
          ...prev,
          items: arrayMove(prev.items, oldIndex, newIndex)
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
        items: formData.items.map(item => ({
          name: item.name,
          image: item.image,
          description: item.description,
          requiredPoints: item.requiredPoints
        }))
      };
      const result = await updateExchangePointsConfig(saveData);
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
            exchange: saveData,
            honor: config?.pointsSystem?.honor || {
              enabled: false,
              honors: []
            }
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
      console.error("保存积分兑换配置失败:", error);
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
    const exchangeConfig = config?.pointsSystem?.exchange;
    const itemsData = (exchangeConfig?.items || []).filter(item => item && typeof item === "object").map((item, index) => ({
      id: `item-${index}-${Date.now()}`,
      name: item?.name || "",
      image: item?.image || undefined,
      description: item?.description || "",
      requiredPoints: item?.requiredPoints || 0
    }));
    setFormData({
      enabled: exchangeConfig?.enabled ?? false,
      items: itemsData
    });
    setHasChanges(false);
  };
  return <div className="space-y-6">
      <Alert>
        <AlertDescription>
          配置积分兑换功能的相关设置。学生可以使用积分兑换商品或服务。修改后需要点击&ldquo;保存&rdquo;按钮才能生效。
        </AlertDescription>
      </Alert>

      {/* 功能开关 */}
      <Card>
        <CardHeader>
          <CardTitle>功能开关</CardTitle>
          <CardDescription>控制积分兑换功能是否启用</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between space-x-2">
            <div className="space-y-1">
              <Label htmlFor="enabled" className="text-sm font-medium">
                启用积分兑换功能
              </Label>
              <p className="text-sm text-muted-foreground">
                开启后，学生可以使用积分兑换商品或服务
              </p>
            </div>
            <Switch id="enabled" checked={formData.enabled} onCheckedChange={checked => updateField("enabled", checked)} disabled={saving} />
          </div>
        </CardContent>
      </Card>

      {/* 兑换项配置 */}
      <Card>
        <CardHeader>
          <CardTitle>兑换项配置</CardTitle>
          <CardDescription>
            设置可兑换的商品或服务列表，支持拖拽排序
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                共 {formData.items.length} 个兑换项
              </p>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={addItem} disabled={saving} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              添加兑换项
            </Button>
          </div>

          {formData.items.length > 0 ? <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={formData.items.map(item => item.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-3">
                  {formData.items.map((item, index) => <SortableExchangeItem key={item.id} item={item} index={index} onUpdate={updateItem} onRemove={removeItem} onImageUpload={handleImageUpload} onImageDelete={handleImageDelete} disabled={saving} />)}
                </div>
              </SortableContext>
            </DndContext> : <div className="text-center py-8 text-muted-foreground">
              暂无兑换项，点击&ldquo;添加兑换项&rdquo;按钮创建
            </div>}
        </CardContent>
      </Card>

      {/* 使用说明 */}
      <Card>
        <CardHeader>
          <CardTitle>使用说明</CardTitle>
          <CardDescription>积分兑换的工作原理</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>• 学生可以使用积分兑换各种商品或服务</p>
            <p>• 兑换时会扣除相应的积分，积分不足时无法兑换</p>
            <p>• 管理员需要线下提供商品或服务</p>
            <p>• 建议设置合理的积分要求，平衡用户激励和成本</p>
            <p>• 可以包括实物商品、优惠券、特权服务等</p>
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
