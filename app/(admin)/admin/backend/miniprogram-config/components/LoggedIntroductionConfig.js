"use client";

import { closestCenter, DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Loader2, Plus, Save, Trash2 } from "lucide-react";
// 已登录介绍配置组件，用于配置已登录用户看到的轮播视频列表
import { useEffect, useState } from "react";
import { Alert, AlertDescription } from "../../../../../../components/ui/alert.js";
import { Button } from "../../../../../../components/ui/button.js";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../../../../components/ui/card.js";
import { Input } from "../../../../../../components/ui/input.js";
import { Label } from "../../../../../../components/ui/label.js";
import { useToast } from "../../../../../../hooks/use-toast.js";
import { updateLoggedIntroductionConfig } from "../actions.js";

// 视频项数据结构

// 从数据库读取的视频项数据结构

// 可拖动的视频项组件
function SortableVideoItem({
  video,
  index,
  onUpdate,
  onRemove,
  disabled
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({
    id: video.id
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  };
  return <div ref={setNodeRef} style={style} className={`flex items-center gap-3 p-3 border rounded-lg bg-white ${isDragging ? "shadow-lg" : ""}`}>
      {/* 拖动手柄 */}
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-1 hover:bg-gray-100 rounded" title="拖动排序">
        <GripVertical className="h-4 w-4 text-gray-400" />
      </div>

      {/* 视频标题输入框 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <Label htmlFor={`title-${index}`} className="text-xs text-gray-600 whitespace-nowrap">
            标题
          </Label>
          <Input id={`title-${index}`} type="text" placeholder="视频标题" value={video.title} onChange={e => onUpdate(index, "title", e.target.value)} disabled={disabled} maxLength={50} className="h-8 text-sm" />
        </div>
      </div>

      {/* 视频ID输入框 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <Label htmlFor={`videoId-${index}`} className="text-xs text-gray-600 whitespace-nowrap">
            视频ID
          </Label>
          <Input id={`videoId-${index}`} type="text" placeholder="视频ID" value={video.videoId} onChange={e => onUpdate(index, "videoId", e.target.value)} disabled={disabled} maxLength={1000} className="h-8 text-sm" />
        </div>
      </div>

      {/* 删除按钮 */}
      <Button type="button" variant="outline" size="sm" onClick={() => onRemove(index)} disabled={disabled} className="text-destructive hover:text-destructive h-8 w-8 p-0">
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>;
}

// 生成唯一ID（移到组件外部，避免每次渲染重新创建）
const generateId = () => Math.random().toString(36).slice(2, 11);
export default function LoggedIntroductionConfig({
  config,
  onConfigChange
}) {
  const [carouselVideos, setCarouselVideos] = useState([]);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const {
    toast
  } = useToast();

  // 拖动传感器
  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, {
    coordinateGetter: sortableKeyboardCoordinates
  }));

  // 初始化表单数据
  useEffect(() => {
    // 为现有视频添加ID
    const carouselVideosWithId = (config.loggedIntroduction?.carouselVideos || []).map(video => ({
      ...video,
      id: video.id || generateId()
    }));
    setCarouselVideos(carouselVideosWithId);
    setHasChanges(false);
  }, [config]);

  // 检查是否有变化
  useEffect(() => {
    const originalCarouselVideos = config.loggedIntroduction?.carouselVideos || [];
    const carouselVideosChanged = JSON.stringify(carouselVideos.map(({
      id: _,
      ...video
    }) => video)) !== JSON.stringify(originalCarouselVideos);
    setHasChanges(carouselVideosChanged);
  }, [carouselVideos, config]);

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
      // 保存时移除ID字段

      const carouselVideosToSave = carouselVideos.map(({
        id: _id,
        ...video
      }) => video);
      const result = await updateLoggedIntroductionConfig({
        carouselVideos: carouselVideosToSave
      });
      if (result.success) {
        // 更新本地配置
        const updatedConfig = {
          ...config,
          loggedIntroduction: {
            carouselVideos: carouselVideosToSave
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
      console.error("保存已登录介绍配置失败:", error);
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
    // 为现有视频添加ID
    const carouselVideosWithId = (config.loggedIntroduction?.carouselVideos || []).map(video => ({
      ...video,
      id: video.id || generateId()
    }));
    setCarouselVideos(carouselVideosWithId);
    setHasChanges(false);
  };

  // 拖动结束处理
  const handleDragEnd = event => {
    const {
      active,
      over
    } = event;
    if (over && active.id !== over.id) {
      setCarouselVideos(items => {
        const oldIndex = items.findIndex(item => item.id === active.id);
        const newIndex = items.findIndex(item => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  // 添加轮播视频
  const addCarouselVideo = () => {
    setCarouselVideos([...carouselVideos, {
      id: generateId(),
      title: "",
      videoId: ""
    }]);
  };

  // 删除轮播视频
  const removeCarouselVideo = index => {
    setCarouselVideos(carouselVideos.filter((_, i) => i !== index));
  };

  // 更新轮播视频
  const updateCarouselVideo = (index, field, value) => {
    const updated = [...carouselVideos];
    updated[index] = {
      ...updated[index],
      [field]: value
    };
    setCarouselVideos(updated);
  };
  return <div className="space-y-6">
      <Alert>
        <AlertDescription>
          配置已登录用户看到的介绍内容，包括轮播视频。修改后需要点击&ldquo;保存&rdquo;按钮才能生效。
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>已登录介绍配置</CardTitle>
          <CardDescription>
            设置已登录用户看到的轮播视频列表，用于展示产品介绍和功能演示。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 轮播图视频列表 */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>轮播图视频列表</Label>
              <Button type="button" variant="outline" size="sm" onClick={addCarouselVideo} disabled={saving} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                添加视频
              </Button>
            </div>

            {carouselVideos.length === 0 ? <p className="text-sm text-muted-foreground">
                暂无轮播图视频，点击上方按钮添加
              </p> : <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={carouselVideos.map(video => video.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-2">
                    {carouselVideos.map((video, index) => <SortableVideoItem key={video.id} video={video} index={index} onUpdate={updateCarouselVideo} onRemove={removeCarouselVideo} disabled={saving} />)}
                  </div>
                </SortableContext>
              </DndContext>}
          </div>

          <div className="flex items-center gap-3 pt-4">
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
