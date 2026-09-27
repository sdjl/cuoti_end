"use client";

import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { Eye, FileText, GripVertical } from "lucide-react";
// 错题批量题集选择器，支持拖拽排序与批量勾选预览
import { useEffect, useState } from "react";
import { Button } from "../../../../../../components/ui/button.js";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../../../../components/ui/card.js";
import { Checkbox } from "../../../../../../components/ui/checkbox.js";
import { Label } from "../../../../../../components/ui/label.js";
export default function QuestionPackSelector({
  questionPacks,
  isLoading,
  selectedPackIds,
  onSelectionChange,
  onCreatePreview
}) {
  // 本地维护题集的排序
  const [sortedPacks, setSortedPacks] = useState([]);
  const [draggedIndex, setDraggedIndex] = useState(null);

  // 当题集列表改变时，初始化本地排序
  useEffect(() => {
    if (questionPacks.length > 0) {
      setSortedPacks([...questionPacks]);
      // 自动全选
      if (selectedPackIds.length === 0) {
        onSelectionChange(questionPacks.map(p => p._id));
      }
    }
  }, [questionPacks, selectedPackIds.length, onSelectionChange]);
  // 处理题集选择
  const handlePackToggle = packId => {
    if (selectedPackIds.includes(packId)) {
      onSelectionChange(selectedPackIds.filter(id => id !== packId));
    } else {
      onSelectionChange([...selectedPackIds, packId]);
    }
  };

  // 处理全选/取消全选
  const handleSelectAll = () => {
    if (selectedPackIds.length === sortedPacks.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(sortedPacks.map(p => p._id));
    }
  };

  // 拖拽开始
  const handleDragStart = index => {
    setDraggedIndex(index);
  };

  // 拖拽经过
  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    const newPacks = [...sortedPacks];
    const draggedPack = newPacks[draggedIndex];
    newPacks.splice(draggedIndex, 1);
    newPacks.splice(index, 0, draggedPack);
    setSortedPacks(newPacks);
    setDraggedIndex(index);
  };

  // 拖拽结束
  const handleDragEnd = () => {
    setDraggedIndex(null);
  };
  if (isLoading) {
    return <Card>
        <CardContent className="text-center py-8">
          <p className="text-gray-500">正在查询题集...</p>
        </CardContent>
      </Card>;
  }
  if (questionPacks.length === 0) {
    return <Card>
        <CardHeader>
          <CardTitle>选择题集</CardTitle>
          <CardDescription>
            勾选需要生成错题集的试卷题集，至少选择一个
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center py-8">
          <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-500">
            在选定的班级和时间区间内没有找到符合条件的试卷题集
          </p>
          <p className="text-xs text-gray-400 mt-2">
            请尝试调整班级选择或时间区间后重新查询
          </p>
        </CardContent>
      </Card>;
  }
  return <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>选择题集</CardTitle>
            <CardDescription>
              勾选需要生成错题集的试卷题集，可以拖动排序，生成的PDF将按此顺序排版题目
            </CardDescription>
          </div>
          <div className="text-sm text-gray-600">
            已选择{" "}
            <span className="font-medium text-gray-900">
              {selectedPackIds.length}
            </span>{" "}
            个题集
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 全选选项 */}
        <div className="flex items-center justify-between pb-2 border-b">
          <div className="flex items-center space-x-2">
            <Checkbox id="select-all-packs" checked={sortedPacks.length > 0 && selectedPackIds.length === sortedPacks.length} onCheckedChange={handleSelectAll} />
            <Label htmlFor="select-all-packs" className="text-sm font-medium cursor-pointer">
              全选
            </Label>
          </div>
          <div className="text-sm text-gray-500">
            共找到 {sortedPacks.length} 个题集
          </div>
        </div>

        {/* 题集列表 */}
        <div className="space-y-2">
          {sortedPacks.map((pack, index) => <div key={pack._id} draggable onDragStart={() => handleDragStart(index)} onDragOver={e => handleDragOver(e, index)} onDragEnd={handleDragEnd} className={`flex items-start space-x-3 p-4 rounded-lg border transition-colors ${selectedPackIds.includes(pack._id) ? "bg-blue-50 border-blue-200" : "bg-white border-gray-200 hover:bg-gray-50"} ${draggedIndex === index ? "opacity-50" : ""}`}>
              {/* 拖拽手柄 */}
              <div className="cursor-move mt-1">
                <GripVertical className="h-5 w-5 text-gray-400" />
              </div>

              {/* 复选框 */}
              <Checkbox id={`pack-${pack._id}`} checked={selectedPackIds.includes(pack._id)} onCheckedChange={() => handlePackToggle(pack._id)} className="mt-1" onClick={e => e.stopPropagation()} />

              {/* 题集信息 */}
              <div className="flex-1 cursor-pointer" onClick={() => handlePackToggle(pack._id)}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="font-medium text-sm">{pack.name}</div>
                    {pack.description && <div className="text-xs text-gray-500 mt-1 line-clamp-2">
                        {pack.description}
                      </div>}
                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                      <span>科目：{pack.subject}</span>
                      <span>题目数：{pack.questionIds.length}</span>
                      <span>
                        创建时间：
                        {format(new Date(pack.created), "yyyy年M月d日", {
                      locale: zhCN
                    })}
                      </span>
                    </div>
                  </div>
                  <div className="ml-4 flex items-center">
                    <div className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800">
                      {pack.type}
                    </div>
                  </div>
                </div>
              </div>
            </div>)}
        </div>

        {/* 创建预览按钮 */}
        <div className="flex justify-end pt-4 border-t">
          <Button onClick={onCreatePreview} disabled={selectedPackIds.length === 0} className="min-w-[140px]">
            <Eye className="mr-2 h-4 w-4" />
            创建预览
          </Button>
        </div>
      </CardContent>
    </Card>;
}
