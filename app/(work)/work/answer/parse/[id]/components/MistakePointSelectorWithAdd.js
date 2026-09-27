/**
 * 带添加功能的错误归因选择器组件
 *
 * 功能包括：
 * - 显示所有可选的错误归因列表
 * - 支持通过名称和描述搜索过滤错误归因
 * - 显示已选择的错误归因（带删除功能）
 * - 支持点击错误归因进行选择/取消选择
 * - 当搜索不到内容时，支持直接添加新的错误归因
 */
"use client";

import { Bot, Loader2, Plus, Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import { Badge } from "../../../../../../../components/ui/badge.js";
import { Button } from "../../../../../../../components/ui/button.js";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../../../../../../../components/ui/dialog.js";
import { Input } from "../../../../../../../components/ui/input.js";
import { Label } from "../../../../../../../components/ui/label.js";
import { Textarea } from "../../../../../../../components/ui/textarea.js";
import { useToast } from "../../../../../../../hooks/use-toast.js";
import { DISPLAY_TEXT } from "../../../../../../../lib/config/constants.js";
export default function MistakePointSelectorWithAdd({
  mistakePoints,
  selectedMistakePointIds,
  subject,
  aiRecommendedMistakePointIds = [],
  onMistakePointsChange,
  onMistakePointAdded,
  onCreateMistakePoint
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newMistakePointName, setNewMistakePointName] = useState("");
  const [newMistakePointDescription, setNewMistakePointDescription] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const {
    toast
  } = useToast();
  const filteredMistakePoints = useMemo(() => {
    // 如果没有搜索词，不显示任何数据
    if (!searchTerm.trim()) return [];
    const term = searchTerm.toLowerCase().trim();
    return mistakePoints.filter(point => point.name.toLowerCase().includes(term) || point.description.toLowerCase().includes(term));
  }, [mistakePoints, searchTerm]);
  const selectedMistakePoints = useMemo(() => {
    return mistakePoints.filter(point => selectedMistakePointIds.includes(point._id));
  }, [mistakePoints, selectedMistakePointIds]);
  const handleMistakePointToggle = mistakePointId => {
    const newSelected = selectedMistakePointIds.includes(mistakePointId) ? selectedMistakePointIds.filter(id => id !== mistakePointId) : [...selectedMistakePointIds, mistakePointId];
    onMistakePointsChange(newSelected);
  };
  const handleRemoveMistakePoint = mistakePointId => {
    const newSelected = selectedMistakePointIds.filter(id => id !== mistakePointId);
    onMistakePointsChange(newSelected);
  };
  const clearSearch = () => {
    setSearchTerm("");
  };
  const handleAddMistakePoint = async () => {
    if (!newMistakePointName.trim()) {
      toast({
        title: "错误",
        description: `请输入${DISPLAY_TEXT.ERROR_ATTRIBUTION}名称`,
        variant: "destructive"
      });
      return;
    }
    setIsCreating(true);
    try {
      const result = await onCreateMistakePoint({
        subject,
        name: newMistakePointName.trim(),
        description: newMistakePointDescription.trim()
      });
      if (result.success && result.data) {
        // 添加到错误归因列表
        onMistakePointAdded(result.data);

        // 自动选中新创建的错误归因
        const newSelected = [...selectedMistakePointIds, result.data._id];
        onMistakePointsChange(newSelected);

        // 清空输入并关闭对话框
        setNewMistakePointName("");
        setNewMistakePointDescription("");
        setIsAddDialogOpen(false);

        // 清空搜索框
        setSearchTerm("");
        toast({
          title: "成功",
          description: `${DISPLAY_TEXT.ERROR_ATTRIBUTION}创建成功并已自动选择`
        });
      } else {
        toast({
          title: "错误",
          description: result.error || `创建${DISPLAY_TEXT.ERROR_ATTRIBUTION}失败`,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error(`创建${DISPLAY_TEXT.ERROR_ATTRIBUTION}失败:`, error);
      toast({
        title: "错误",
        description: `创建${DISPLAY_TEXT.ERROR_ATTRIBUTION}失败`,
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };
  const handleOpenAddDialog = () => {
    // 将搜索词作为默认名称
    if (searchTerm.trim()) {
      setNewMistakePointName(searchTerm.trim());
    }
    setIsAddDialogOpen(true);
  };
  const showNoResultsWithAdd = searchTerm.trim() && filteredMistakePoints.length === 0;
  return <div className="space-y-3">
      {/* 标题和搜索框在同一行 */}
      <div className="flex items-center gap-4">
        <h5 className="text-sm font-medium text-gray-700 whitespace-nowrap">
          选择{DISPLAY_TEXT.ERROR_ATTRIBUTION}
        </h5>
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input placeholder={`输入关键词搜索${DISPLAY_TEXT.ERROR_ATTRIBUTION}...`} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10 pr-10 h-8" />
          {searchTerm && <button onClick={clearSearch} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X className="w-4 h-4" />
            </button>}
        </div>
      </div>

      {/* 已选择的错误归因 - 增加背景色 */}
      {selectedMistakePoints.length > 0 && <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
          <h6 className="text-sm font-medium text-blue-900 mb-2">
            已选择的{DISPLAY_TEXT.ERROR_ATTRIBUTION}
          </h6>
          <div className="flex flex-wrap gap-2">
            {selectedMistakePoints.map(point => {
          const isAIRecommended = aiRecommendedMistakePointIds.includes(point._id);
          return <Badge key={point._id} variant="secondary" className={`flex items-center gap-1 ${isAIRecommended ? "bg-green-100 text-green-800 border-green-300" : "bg-blue-100 text-blue-800 border-blue-300"}`}>
                  {isAIRecommended && <Bot className="w-3 h-3" />}
                  {point.name}
                  <X className="w-3 h-3 cursor-pointer hover:text-red-500" onClick={() => handleRemoveMistakePoint(point._id)} />
                </Badge>;
        })}
          </div>
        </div>}

      {/* 可选择的错误归因列表 - 减少内间距 */}
      <div className="space-y-2">
        <div className="max-h-60 overflow-y-auto space-y-1 border rounded-lg p-2">
          {!searchTerm ? <div className="text-center text-gray-500 py-8">
              请在上方输入关键词搜索{DISPLAY_TEXT.ERROR_ATTRIBUTION}
            </div> : showNoResultsWithAdd ? <div className="text-center py-4 space-y-3">
              <div className="text-gray-500">
                未找到匹配的{DISPLAY_TEXT.ERROR_ATTRIBUTION}
              </div>
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" onClick={handleOpenAddDialog} className="bg-green-50 border-green-300 text-green-700 hover:bg-green-100">
                    <Plus className="w-4 h-4 mr-2" />
                    添加新{DISPLAY_TEXT.ERROR_ATTRIBUTION}
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>
                      添加新{DISPLAY_TEXT.ERROR_ATTRIBUTION}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">
                        {DISPLAY_TEXT.ERROR_ATTRIBUTION}名称 *
                      </Label>
                      <Input id="name" value={newMistakePointName} onChange={e => setNewMistakePointName(e.target.value)} placeholder={`请输入${DISPLAY_TEXT.ERROR_ATTRIBUTION}名称`} disabled={isCreating} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">描述</Label>
                      <Textarea id="description" value={newMistakePointDescription} onChange={e => setNewMistakePointDescription(e.target.value)} placeholder={`请输入${DISPLAY_TEXT.ERROR_ATTRIBUTION}描述（可选）`} rows={3} disabled={isCreating} />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} disabled={isCreating}>
                        取消
                      </Button>
                      <Button onClick={handleAddMistakePoint} disabled={isCreating || !newMistakePointName.trim()}>
                        {isCreating ? <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            创建中...
                          </> : <>
                            <Plus className="w-4 h-4 mr-2" />
                            创建
                          </>}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div> : filteredMistakePoints.map(point => {
          const isSelected = selectedMistakePointIds.includes(point._id);
          return <div key={point._id} className={`p-2 border rounded cursor-pointer transition-all hover:shadow-sm ${isSelected ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"}`} onClick={() => handleMistakePointToggle(point._id)} title={point.description || point.name} // hover显示描述
          >
                  <div className="font-medium text-sm text-gray-900">
                    {point.name}
                  </div>
                </div>;
        })}
        </div>
      </div>
    </div>;
}
