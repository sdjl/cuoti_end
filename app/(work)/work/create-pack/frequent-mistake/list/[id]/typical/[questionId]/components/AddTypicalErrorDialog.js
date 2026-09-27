"use client";

// 高频错题典型错题弹窗，支持搜索筛选并批量添加学生作答
import { Plus, Search, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import BaseImage from "../../../../../../../../../../components/common/BaseImage.js";
import { Button } from "../../../../../../../../../../components/ui/button.js";
import { Checkbox } from "../../../../../../../../../../components/ui/checkbox.js";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../../../../../../../../../components/ui/dialog.js";
import { Input } from "../../../../../../../../../../components/ui/input.js";
import { useToast } from "../../../../../../../../../../hooks/use-toast.js";
import { addTypicalErrorsAction, fetchAvailableTypicalErrors } from "../actions.js";
export default function AddTypicalErrorDialog({
  open,
  onOpenChange,
  frequentMistakeId,
  questionId,
  existingItemIds,
  onSuccess
}) {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [searchValue, setSearchValue] = useState("");
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [submitting, setSubmitting] = useState(false);
  const {
    toast
  } = useToast();

  // 加载可添加的典型错题列表
  const loadItems = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchAvailableTypicalErrors(questionId);
      // 过滤掉已添加的典型错题
      const filteredData = data.filter(item => !existingItemIds.includes(item.studentAnswerItem._id));
      setItems(filteredData);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "加载失败",
        description: error instanceof Error ? error.message : "加载典型错题列表失败"
      });
    } finally {
      setLoading(false);
    }
  }, [questionId, existingItemIds, toast]);
  useEffect(() => {
    if (open) {
      loadItems();
    } else {
      // 关闭时清空状态
      setSearchValue("");
      setSelectedIds(new Set());
    }
  }, [open, loadItems]);

  // 前端搜索过滤
  const filteredItems = useMemo(() => {
    if (!searchValue.trim()) {
      return items;
    }
    const keyword = searchValue.toLowerCase();
    return items.filter(item => {
      // 搜索answerValue
      const answerMatch = item.studentAnswerItem.answerValue?.some(ans => ans.toLowerCase().includes(keyword));

      // 搜索parse
      const parseMatch = item.studentAnswerItem.parse?.some(p => p.toLowerCase().includes(keyword));

      // 搜索学生姓名
      const studentNameMatch = item.student.name.toLowerCase().includes(keyword);

      // 搜索班级名称
      const classroomNameMatch = item.classroom.name.toLowerCase().includes(keyword);
      return answerMatch || parseMatch || studentNameMatch || classroomNameMatch;
    });
  }, [items, searchValue]);

  // 切换选中状态
  const toggleSelection = itemId => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  // 提交添加
  const handleSubmit = async () => {
    if (selectedIds.size === 0) {
      toast({
        variant: "destructive",
        title: "请选择典型错题",
        description: "至少选择一个典型错题"
      });
      return;
    }
    setSubmitting(true);
    try {
      const result = await addTypicalErrorsAction(frequentMistakeId, questionId, Array.from(selectedIds));
      if (result.success) {
        toast({
          title: "添加成功",
          description: `已添加 ${selectedIds.size} 个典型错题`
        });
        onSuccess();
        onOpenChange(false);
      } else {
        toast({
          variant: "destructive",
          title: "添加失败",
          description: result.message || "添加典型错题失败"
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "添加失败",
        description: error instanceof Error ? error.message : "添加典型错题失败"
      });
    } finally {
      setSubmitting(false);
    }
  };
  return <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0" onInteractOutside={e => e.preventDefault()}>
        {/* 标题行 */}
        <DialogHeader className="px-6 py-4 border-b flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle>添加典型错题</DialogTitle>
            <Button onClick={handleSubmit} disabled={submitting || selectedIds.size === 0} size="sm" className="mr-6">
              <Plus className="w-4 h-4 mr-1" />
              添加 {selectedIds.size > 0 && `(${selectedIds.size})`}
            </Button>
          </div>
        </DialogHeader>

        {/* 搜索框 */}
        <div className="px-6 py-2 flex-shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input placeholder="搜索答案、解析、学生姓名或班级..." value={searchValue} onChange={e => setSearchValue(e.target.value)} className="pl-10 pr-10" />
            {searchValue && <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7" onClick={() => setSearchValue("")}>
                <X className="w-4 h-4" />
              </Button>}
          </div>
        </div>

        {/* 列表区域 */}
        <div className="flex-1 overflow-y-auto px-6 pb-4">
          {loading ? <div className="text-center py-8 text-gray-500">加载中...</div> : filteredItems.length === 0 ? <div className="text-center py-8 text-gray-500">
              {searchValue ? "没有找到匹配的典型错题" : "没有可添加的典型错题"}
            </div> : <div className="space-y-3">
              {filteredItems.map(item => {
            const isSelected = selectedIds.has(item.studentAnswerItem._id);
            return <div key={item.studentAnswerItem._id} className={`border rounded-lg p-4 transition-all cursor-pointer ${isSelected ? "border-primary border-2 bg-blue-50" : "border-gray-200 hover:bg-gray-50"}`} onClick={() => toggleSelection(item.studentAnswerItem._id)}>
                    {/* 图片区域 - 整行 */}
                    {item.studentAnswerItem.imageUrl && <div className="mb-3">
                        <a href={item.studentAnswerItem.imageUrl} target="_blank" rel="noopener noreferrer" className="block" onClick={e => e.stopPropagation()}>
                          <BaseImage src={item.studentAnswerItem.imageUrl} alt="错题图片" width={800} height={600} className="w-full h-auto rounded border" />
                        </a>
                      </div>}

                    {/* 内容区域 */}
                    <div className="flex items-start gap-3">
                      {/* 复选框 */}
                      <Checkbox checked={isSelected} onCheckedChange={() => toggleSelection(item.studentAnswerItem._id)} onClick={e => e.stopPropagation()} className="mt-1" />

                      <div className="flex-1 space-y-2">
                        {/* 学生信息 */}
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span>
                            <span className="font-medium">学生：</span>
                            {item.student.name}
                          </span>
                          <span>
                            <span className="font-medium">班级：</span>
                            {item.classroom.name}
                          </span>
                        </div>

                        {/* 答案 */}
                        {item.studentAnswerItem.answerValue && item.studentAnswerItem.answerValue.length > 0 && <div className="text-sm">
                              <span className="font-medium text-gray-700">
                                学生答案：
                              </span>
                              <span className="text-gray-600">
                                {item.studentAnswerItem.answerValue.join("；")}
                              </span>
                            </div>}

                        {/* 解析 */}
                        {item.studentAnswerItem.parse && item.studentAnswerItem.parse.length > 0 && <div className="text-sm">
                              <span className="font-medium text-gray-700">
                                错误解析：
                              </span>
                              <span className="text-gray-600">
                                {item.studentAnswerItem.parse.join("；")}
                              </span>
                            </div>}
                      </div>
                    </div>
                  </div>;
          })}
            </div>}
        </div>
      </DialogContent>
    </Dialog>;
}
