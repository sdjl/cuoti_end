"use client";

import { closestCenter, DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Loader2, Plus, Save, Upload, X } from "lucide-react";
// 积分抽奖配置组件，用于配置积分抽奖功能的相关设置和奖品管理
import { useEffect, useState } from "react";
import BaseImage from "../../../../../../../components/common/BaseImage.js";
import { Alert, AlertDescription } from "../../../../../../../components/ui/alert.js";
import { Button } from "../../../../../../../components/ui/button.js";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../../../../../components/ui/card.js";
import { Input } from "../../../../../../../components/ui/input.js";
import { Label } from "../../../../../../../components/ui/label.js";
import { Switch } from "../../../../../../../components/ui/switch.js";
import { useToast } from "../../../../../../../hooks/use-toast.js";
import { deleteImage, updateLotteryPointsConfig, updateLotteryPrizeImage, uploadImage } from "../actions.js";

// 奖品项数据结构

// 可拖拽的奖品项组件
function SortablePrizeItem({
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
          <Label className="text-sm mb-1 block">奖品图片</Label>
          {item.image ? <div className="relative w-32 h-32 group cursor-pointer" onClick={() => item.image?.imageUrl && window.open(item.image.imageUrl, "_blank")}>
              <div className="w-full h-full border rounded-md overflow-hidden bg-gray-100 flex items-center justify-center">
                <BaseImage src={item.image?.imageUrl || ""} alt={item?.name || "奖品图片"} fill className="object-contain" sizes="128px" />
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
          }} className="hidden" id={`prize-image-${item.id}`} disabled={disabled} />
              <label htmlFor={`prize-image-${item.id}`} className="cursor-pointer flex flex-col items-center gap-2 text-gray-400 hover:text-gray-600 transition-colors p-4">
                <Upload className="h-6 w-6" />
                <span className="text-sm text-center">
                  点击上传
                  <br />
                  奖品图片
                </span>
              </label>
            </div>}
        </div>

        {/* 右侧：其他内容 */}
        <div className="flex-1 space-y-3">
          {/* 第一行：奖品名称(70%) + 中奖概率(30%) */}
          <div className="grid grid-cols-10 gap-3">
            <div className="col-span-7">
              <Label htmlFor={`prize-name-${item.id}`}>奖品名称</Label>
              <Input id={`prize-name-${item.id}`} value={item.name} onChange={e => onUpdate(item.id, "name", e.target.value)} placeholder="奖品名称" disabled={disabled} />
            </div>
            <div className="col-span-3">
              <Label htmlFor={`prize-probability-${item.id}`}>
                中奖概率 (%)
              </Label>
              <Input id={`prize-probability-${item.id}`} type="number" min="0" max="100" step="0.1" value={item.probability} onChange={e => onUpdate(item.id, "probability", parseFloat(e.target.value) || 0)} placeholder="5.5" disabled={disabled} />
            </div>
          </div>

          {/* 第二行：奖品描述 */}
          <div>
            <Label htmlFor={`prize-description-${item.id}`}>奖品描述</Label>
            <Input id={`prize-description-${item.id}`} value={item.description} onChange={e => onUpdate(item.id, "description", e.target.value)} placeholder="奖品的详细描述" disabled={disabled} />
          </div>
        </div>
      </div>
      <Button type="button" variant="ghost" size="sm" onClick={() => onRemove(item.id)} disabled={disabled} className="text-destructive hover:text-destructive mt-6">
        <X className="h-4 w-4" />
      </Button>
    </div>;
}
export default function LotteryPointsConfig({
  config,
  onConfigChange
}) {
  const [formData, setFormData] = useState({
    enabled: false,
    pointsPerDraw: 10,
    prizes: []
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
    const lotteryConfig = config?.pointsSystem?.lottery;
    const prizesData = (lotteryConfig?.prizes || []).filter(prize => prize && typeof prize === "object").map((prize, index) => ({
      id: `prize-${index}-${Date.now()}`,
      name: prize?.name || "",
      image: prize?.image || undefined,
      description: prize?.description || "",
      probability: prize?.probability || 0
    }));
    setFormData({
      enabled: lotteryConfig?.enabled ?? false,
      pointsPerDraw: lotteryConfig?.pointsPerDraw ?? 10,
      prizes: prizesData
    });
    setHasChanges(false);
  }, [config]);

  // 检查是否有变化
  useEffect(() => {
    const originalConfig = config?.pointsSystem?.lottery;
    const currentPrizes = formData.prizes.map(item => ({
      name: item?.name || "",
      image: item?.image || undefined,
      description: item?.description || "",
      probability: item?.probability || 0
    }));
    const originalPrizes = (originalConfig?.prizes || []).filter(prize => prize && typeof prize === "object").map(prize => ({
      name: prize?.name || "",
      image: prize?.image || undefined,
      description: prize?.description || "",
      probability: prize?.probability || 0
    }));
    const hasChanged = formData.enabled !== (originalConfig?.enabled ?? false) || formData.pointsPerDraw !== (originalConfig?.pointsPerDraw ?? 10) || JSON.stringify(currentPrizes) !== JSON.stringify(originalPrizes);
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

  // 添加奖品
  const addPrize = () => {
    const newItem = {
      id: generateId(),
      name: "",
      description: "",
      probability: 0
    };
    setFormData(prev => ({
      ...prev,
      prizes: [...prev.prizes, newItem]
    }));
  };

  // 删除奖品
  const removePrize = id => {
    setFormData(prev => ({
      ...prev,
      prizes: prev.prizes.filter(item => item.id !== id)
    }));
  };

  // 更新奖品内容
  const updatePrize = (id, field, value) => {
    setFormData(prev => ({
      ...prev,
      prizes: prev.prizes.map(item => item.id === id ? {
        ...item,
        [field]: value
      } : item)
    }));
  };

  // 处理图片上传
  const handleImageUpload = async (prizeId, file) => {
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
          prizes: prev.prizes.map(item => item.id === prizeId ? {
            ...item,
            image: result.data
          } : item)
        }));

        // 找到奖品在数组中的索引
        const prizeIndex = formData.prizes.findIndex(p => p.id === prizeId);
        if (prizeIndex !== -1) {
          // 直接更新数据库中该奖品的图片字段
          const updateResult = await updateLotteryPrizeImage(prizeIndex, result.data);
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
  const handleImageDelete = async prizeId => {
    const prize = formData.prizes.find(p => p.id === prizeId);
    if (!prize?.image) return;
    try {
      setSaving(true);

      // 先删除云存储中的文件
      const deleteResult = await deleteImage(prize.image.imageFileId);
      if (deleteResult.success) {
        // 更新本地状态
        setFormData(prev => ({
          ...prev,
          prizes: prev.prizes.map(item => item.id === prizeId ? {
            ...item,
            image: undefined
          } : item)
        }));

        // 找到奖品在数组中的索引
        const prizeIndex = formData.prizes.findIndex(p => p.id === prizeId);
        if (prizeIndex !== -1) {
          // 直接更新数据库，删除图片字段
          const updateResult = await updateLotteryPrizeImage(prizeIndex, null);
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
        const oldIndex = prev.prizes.findIndex(item => item.id === active.id);
        const newIndex = prev.prizes.findIndex(item => item.id === over?.id);
        return {
          ...prev,
          prizes: arrayMove(prev.prizes, oldIndex, newIndex)
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

    // 验证字段
    if (formData.pointsPerDraw < 0) {
      toast({
        variant: "destructive",
        title: "验证失败",
        description: "每次抽奖消耗积分不能为负数"
      });
      return;
    }

    // 验证奖品概率总和
    const totalProbability = formData.prizes.reduce((sum, prize) => sum + prize.probability, 0);
    if (formData.enabled && totalProbability > 100) {
      toast({
        variant: "destructive",
        title: "验证失败",
        description: "所有奖品的中奖概率总和不能超过100%"
      });
      return;
    }
    setSaving(true);
    try {
      // 转换为保存格式
      const saveData = {
        enabled: formData.enabled,
        pointsPerDraw: formData.pointsPerDraw,
        prizes: formData.prizes.map(item => ({
          name: item.name,
          image: item.image,
          description: item.description,
          probability: item.probability
        }))
      };
      const result = await updateLotteryPointsConfig(saveData);
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
            lottery: saveData,
            exchange: config?.pointsSystem?.exchange || {
              enabled: false,
              items: []
            },
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
      console.error("保存积分抽奖配置失败:", error);
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
    const lotteryConfig = config?.pointsSystem?.lottery;
    const prizesData = (lotteryConfig?.prizes || []).filter(prize => prize && typeof prize === "object").map((prize, index) => ({
      id: `prize-${index}-${Date.now()}`,
      name: prize?.name || "",
      image: prize?.image || undefined,
      description: prize?.description || "",
      probability: prize?.probability || 0
    }));
    setFormData({
      enabled: lotteryConfig?.enabled ?? false,
      pointsPerDraw: lotteryConfig?.pointsPerDraw ?? 10,
      prizes: prizesData
    });
    setHasChanges(false);
  };
  return <div className="space-y-6">
      <Alert>
        <AlertDescription>
          配置积分抽奖功能的相关设置。学生可以消耗积分进行抽奖，获得不同的奖品。修改后需要点击&ldquo;保存&rdquo;按钮才能生效。
        </AlertDescription>
      </Alert>

      {/* 功能开关 */}
      <Card>
        <CardHeader>
          <CardTitle>功能开关</CardTitle>
          <CardDescription>控制积分抽奖功能是否启用</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between space-x-2">
            <div className="space-y-1">
              <Label htmlFor="enabled" className="text-sm font-medium">
                启用积分抽奖功能
              </Label>
              <p className="text-sm text-muted-foreground">
                开启后，学生可以使用积分进行抽奖
              </p>
            </div>
            <Switch id="enabled" checked={formData.enabled} onCheckedChange={checked => updateField("enabled", checked)} disabled={saving} />
          </div>
        </CardContent>
      </Card>

      {/* 基础配置 */}
      <Card>
        <CardHeader>
          <CardTitle>基础配置</CardTitle>
          <CardDescription>设置抽奖的基本参数</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="pointsPerDraw">每次抽奖消耗积分</Label>
            <Input id="pointsPerDraw" type="number" min="0" placeholder="10" value={formData.pointsPerDraw} onChange={e => updateField("pointsPerDraw", parseInt(e.target.value) || 0)} disabled={saving} />
            <p className="text-sm text-muted-foreground">
              学生每次抽奖需要消耗的积分数量
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 奖品配置 */}
      <Card>
        <CardHeader>
          <CardTitle>奖品配置</CardTitle>
          <CardDescription>设置抽奖奖品列表，支持拖拽排序</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                概率总和：
                {formData.prizes.reduce((sum, prize) => sum + prize.probability, 0).toFixed(1)}
                %
                {formData.prizes.reduce((sum, prize) => sum + prize.probability, 0) > 100 && <span className="text-red-500 ml-2">（超过100%）</span>}
              </p>
            </div>
            <Button type="button" variant="outline" size="sm" onClick={addPrize} disabled={saving} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              添加奖品
            </Button>
          </div>

          {formData.prizes.length > 0 ? <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={formData.prizes.map(item => item.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-3">
                  {formData.prizes.map((item, index) => <SortablePrizeItem key={item.id} item={item} index={index} onUpdate={updatePrize} onRemove={removePrize} onImageUpload={handleImageUpload} onImageDelete={handleImageDelete} disabled={saving} />)}
                </div>
              </SortableContext>
            </DndContext> : <div className="text-center py-8 text-muted-foreground">
              暂无奖品，点击&ldquo;添加奖品&rdquo;按钮创建
            </div>}
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
