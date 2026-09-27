"use client";

import { closestCenter, DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Loader2, Plus, Save, Trash2 } from "lucide-react";
// 未登录介绍配置组件，用于配置未登录用户看到的视频号ID、轮播视频和视频列表
import { useEffect, useState } from "react";
import { Alert, AlertDescription } from "../../../../../../components/ui/alert.js";
import { Button } from "../../../../../../components/ui/button.js";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../../../../components/ui/card.js";
import { Input } from "../../../../../../components/ui/input.js";
import { Label } from "../../../../../../components/ui/label.js";
import { useToast } from "../../../../../../hooks/use-toast.js";
import { updateUnloggedIntroductionConfig } from "../actions.js";

// 视频项数据结构

// 从数据库读取的视频项数据结构

// 可拖动的视频项组件
function SortableVideoItem({
  video,
  index,
  onUpdate,
  onRemove,
  disabled,
  prefix
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
          <Label htmlFor={`${prefix}-title-${index}`} className="text-xs text-gray-600 whitespace-nowrap">
            标题
          </Label>
          <Input id={`${prefix}-title-${index}`} type="text" placeholder="视频标题" value={video.title} onChange={e => onUpdate(index, "title", e.target.value)} disabled={disabled} maxLength={50} className="h-8 text-sm" />
        </div>
      </div>

      {/* 视频ID输入框 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <Label htmlFor={`${prefix}-videoId-${index}`} className="text-xs text-gray-600 whitespace-nowrap">
            视频ID
          </Label>
          <Input id={`${prefix}-videoId-${index}`} type="text" placeholder="视频ID" value={video.videoId} onChange={e => onUpdate(index, "videoId", e.target.value)} disabled={disabled} maxLength={1000} className="h-8 text-sm" />
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
export default function UnloggedIntroductionConfig({
  config,
  onConfigChange
}) {
  const [videoAccountId, setVideoAccountId] = useState("");
  const [carouselVideos, setCarouselVideos] = useState([]);
  const [listVideos, setListVideos] = useState([]);
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
    setVideoAccountId(config.unloggedIntroduction?.videoAccountId || "");

    // 为现有视频添加ID
    const carouselVideosWithId = (config.unloggedIntroduction?.carouselVideos || []).map(video => ({
      ...video,
      id: video.id || generateId()
    }));
    const listVideosWithId = (config.unloggedIntroduction?.listVideos || []).map(video => ({
      ...video,
      id: video.id || generateId()
    }));
    setCarouselVideos(carouselVideosWithId);
    setListVideos(listVideosWithId);
    setHasChanges(false);
  }, [config]);

  // 检查是否有变化
  useEffect(() => {
    const originalVideoAccountId = config.unloggedIntroduction?.videoAccountId || "";
    const originalCarouselVideos = config.unloggedIntroduction?.carouselVideos || [];
    const originalListVideos = config.unloggedIntroduction?.listVideos || [];
    const videoAccountIdChanged = videoAccountId !== originalVideoAccountId;
    const carouselVideosChanged = JSON.stringify(carouselVideos.map(({
      id: _,
      ...video
    }) => video)) !== JSON.stringify(originalCarouselVideos);
    const listVideosChanged = JSON.stringify(listVideos.map(({
      id: _,
      ...video
    }) => video)) !== JSON.stringify(originalListVideos);
    setHasChanges(videoAccountIdChanged || carouselVideosChanged || listVideosChanged);
  }, [videoAccountId, carouselVideos, listVideos, config]);

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
      const listVideosToSave = listVideos.map(({
        id: _id,
        ...video
      }) => video);
      const result = await updateUnloggedIntroductionConfig({
        videoAccountId,
        carouselVideos: carouselVideosToSave,
        listVideos: listVideosToSave
      });
      if (result.success) {
        // 更新本地配置
        const updatedConfig = {
          ...config,
          unloggedIntroduction: {
            videoAccountId,
            carouselVideos: carouselVideosToSave,
            listVideos: listVideosToSave
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
      console.error("保存未登录介绍配置失败:", error);
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
    setVideoAccountId(config.unloggedIntroduction?.videoAccountId || "");

    // 为现有视频添加ID
    const carouselVideosWithId = (config.unloggedIntroduction?.carouselVideos || []).map(video => ({
      ...video,
      id: video.id || generateId()
    }));
    const listVideosWithId = (config.unloggedIntroduction?.listVideos || []).map(video => ({
      ...video,
      id: video.id || generateId()
    }));
    setCarouselVideos(carouselVideosWithId);
    setListVideos(listVideosWithId);
    setHasChanges(false);
  };

  // 拖动结束处理
  const handleDragEnd = (event, type) => {
    const {
      active,
      over
    } = event;
    if (over && active.id !== over.id) {
      if (type === "carousel") {
        setCarouselVideos(items => {
          const oldIndex = items.findIndex(item => item.id === active.id);
          const newIndex = items.findIndex(item => item.id === over.id);
          return arrayMove(items, oldIndex, newIndex);
        });
      } else {
        setListVideos(items => {
          const oldIndex = items.findIndex(item => item.id === active.id);
          const newIndex = items.findIndex(item => item.id === over.id);
          return arrayMove(items, oldIndex, newIndex);
        });
      }
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

  // 添加列表视频
  const addListVideo = () => {
    setListVideos([...listVideos, {
      id: generateId(),
      title: "",
      videoId: ""
    }]);
  };

  // 删除列表视频
  const removeListVideo = index => {
    setListVideos(listVideos.filter((_, i) => i !== index));
  };

  // 更新列表视频
  const updateListVideo = (index, field, value) => {
    const updated = [...listVideos];
    updated[index] = {
      ...updated[index],
      [field]: value
    };
    setListVideos(updated);
  };
  return <div className="space-y-6">
      <Alert>
        <AlertDescription>
          配置未登录用户看到的介绍内容，包括轮播视频和视频列表。修改后需要点击&ldquo;保存&rdquo;按钮才能生效。
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>未登录介绍配置</CardTitle>
          <CardDescription>
            设置未登录用户看到的视频号ID和视频列表，用于展示产品介绍和功能演示。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 视频号ID */}
          <div className="space-y-2">
            <Label htmlFor="videoAccountId">视频号ID</Label>
            <Input id="videoAccountId" type="text" placeholder="请输入视频号ID" value={videoAccountId} onChange={e => setVideoAccountId(e.target.value)} disabled={saving} maxLength={1000} />
            <p className="text-sm text-muted-foreground">
              用于关联视频号的唯一标识符。
            </p>
          </div>

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
              </p> : <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={event => handleDragEnd(event, "carousel")}>
                <SortableContext items={carouselVideos.map(video => video.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-2">
                    {carouselVideos.map((video, index) => <SortableVideoItem key={video.id} video={video} index={index} onUpdate={updateCarouselVideo} onRemove={removeCarouselVideo} disabled={saving} prefix="carousel" />)}
                  </div>
                </SortableContext>
              </DndContext>}
          </div>

          {/* 列表视频列表 */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>列表视频列表</Label>
              <Button type="button" variant="outline" size="sm" onClick={addListVideo} disabled={saving} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                添加视频
              </Button>
            </div>

            {listVideos.length === 0 ? <p className="text-sm text-muted-foreground">
                暂无列表视频，点击上方按钮添加
              </p> : <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={event => handleDragEnd(event, "list")}>
                <SortableContext items={listVideos.map(video => video.id)} strategy={verticalListSortingStrategy}>
                  <div className="space-y-2">
                    {listVideos.map((video, index) => <SortableVideoItem key={video.id} video={video} index={index} onUpdate={updateListVideo} onRemove={removeListVideo} disabled={saving} prefix="list" />)}
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
