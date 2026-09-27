"use client";

import { Loader2, Save } from "lucide-react";
// 视频对话框组件，用于创建或编辑视频记录，包括标题、视频ID和分类信息
import { useEffect, useState } from "react";
import { Button } from "../../../../../../components/ui/button.js";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../../../../../components/ui/dialog.js";
import { Input } from "../../../../../../components/ui/input.js";
import { Label } from "../../../../../../components/ui/label.js";
import { RadioGroup, RadioGroupItem } from "../../../../../../components/ui/radio-group.js";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../../../../components/ui/select.js";
import { useToast } from "../../../../../../hooks/use-toast.js";
import { createVideo, updateVideo } from "../actions.js";
export default function VideoDialog({
  open,
  onOpenChange,
  video,
  categories,
  onSuccess
}) {
  const {
    toast
  } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [videoId, setVideoId] = useState("");
  const [categoryMode, setCategoryMode] = useState("existing");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const isEditing = !!video;

  // 初始化表单数据
  useEffect(() => {
    if (open) {
      if (video) {
        // 编辑模式
        setTitle(video.title);
        setVideoId(video.videoId);
        if (categories.includes(video.category)) {
          setCategoryMode("existing");
          setSelectedCategory(video.category);
          setNewCategory("");
        } else {
          setCategoryMode("new");
          setSelectedCategory("");
          setNewCategory(video.category);
        }
      } else {
        // 新建模式
        setTitle("");
        setVideoId("");
        setCategoryMode("existing");
        setSelectedCategory("");
        setNewCategory("");
      }
    }
  }, [open, video, categories]);
  const handleSubmit = async e => {
    e.preventDefault();
    if (!title.trim()) {
      toast({
        title: "请输入视频标题",
        variant: "destructive"
      });
      return;
    }
    if (!videoId.trim()) {
      toast({
        title: "请输入视频ID",
        variant: "destructive"
      });
      return;
    }
    const category = categoryMode === "existing" ? selectedCategory : newCategory.trim();
    if (!category) {
      toast({
        title: "请选择或输入视频分类",
        variant: "destructive"
      });
      return;
    }
    setIsLoading(true);
    try {
      const videoData = {
        title: title.trim(),
        videoId: videoId.trim(),
        category
      };
      let result;
      if (isEditing && video) {
        result = await updateVideo(video._id, videoData);
      } else {
        result = await createVideo(videoData);
      }
      if (result.success) {
        toast({
          title: isEditing ? "视频更新成功" : "视频创建成功",
          description: result.message
        });
        onSuccess();
        onOpenChange(false);
      } else {
        toast({
          title: isEditing ? "视频更新失败" : "视频创建失败",
          description: result.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("操作失败:", error);
      toast({
        title: "操作失败",
        description: `客户端错误: ${error instanceof Error ? error.message : String(error)}`,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  return <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? "编辑视频" : "新建视频"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "修改视频信息" : "创建新的视频记录"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 视频标题 */}
          <div className="space-y-2">
            <Label htmlFor="title">视频标题 *</Label>
            <Input id="title" type="text" placeholder="请输入视频标题" value={title} onChange={e => setTitle(e.target.value)} disabled={isLoading} maxLength={100} required />
          </div>

          {/* 视频ID */}
          <div className="space-y-2">
            <Label htmlFor="videoId">视频ID *</Label>
            <Input id="videoId" type="text" placeholder="请输入视频ID" value={videoId} onChange={e => setVideoId(e.target.value)} disabled={isLoading} maxLength={1000} required />
          </div>

          {/* 分类选择模式 */}
          <div className="space-y-3">
            <Label>视频分类 *</Label>
            <RadioGroup value={categoryMode} onValueChange={value => setCategoryMode(value)} disabled={isLoading} className="flex gap-6">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="existing" id="existing" />
                <Label htmlFor="existing">已有分类</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="new" id="new" />
                <Label htmlFor="new">新建分类</Label>
              </div>
            </RadioGroup>

            {/* 根据选择模式显示不同的输入组件 */}
            {categoryMode === "existing" ? <Select value={selectedCategory} onValueChange={setSelectedCategory} disabled={isLoading || categories.length === 0}>
                <SelectTrigger>
                  <SelectValue placeholder="选择分类" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(category => <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>)}
                </SelectContent>
              </Select> : <Input type="text" placeholder="请输入新的分类名称" value={newCategory} onChange={e => setNewCategory(e.target.value)} disabled={isLoading} maxLength={50} />}

            {categoryMode === "existing" && categories.length === 0 && <p className="text-sm text-muted-foreground">
                暂无已有分类，请选择&ldquo;新建分类&rdquo;
              </p>}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              取消
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              {isEditing ? "保存" : "创建"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>;
}
