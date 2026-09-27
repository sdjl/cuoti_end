"use client";

// 题集列表组件，用于展示可选择的公共题集并提供添加功能
import { BookOpen, Clock, Plus } from "lucide-react";
import { Badge } from "../../../../../../../../components/ui/badge.js";
import { Button } from "../../../../../../../../components/ui/button.js";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../../../../../components/ui/card.js";
export default function QuestionPackList({
  questionPacks,
  selectedIds,
  onToggleSelect,
  isLoading = false
}) {
  // 格式化时间
  const formatTime = timestamp => {
    const date = new Date(timestamp);
    return date.toLocaleDateString("zh-CN");
  };
  if (isLoading) {
    return <div className="space-y-4">
        {[1, 2, 3, 4, 5].map(i => <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>)}
      </div>;
  }
  if (questionPacks.length === 0) {
    return <Card>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <BookOpen className="h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-500 text-center">暂无符合条件的题集</p>
        </CardContent>
      </Card>;
  }
  return <div className="space-y-4">
      {questionPacks.map(questionPack => {
      const isSelected = selectedIds.includes(questionPack._id);
      return <Card key={questionPack._id} className="transition-colors hover:bg-gray-50">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg font-medium leading-tight">
                    {questionPack.name}
                  </CardTitle>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="secondary" className="text-xs">
                      {questionPack.subject}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {questionPack.type}
                    </Badge>
                  </div>
                </div>
                <Button variant="default" size="sm" onClick={() => onToggleSelect(questionPack._id)} disabled={isSelected} className="ml-2">
                  <Plus className="h-4 w-4 mr-1" />
                  {isSelected ? "已添加" : "添加"}
                </Button>
              </div>
            </CardHeader>

            <CardContent className="pt-0">
              {questionPack.description && <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                  {questionPack.description}
                </p>}

              <div className="flex items-center justify-between text-sm text-gray-500">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <BookOpen className="h-4 w-4" />
                    <span>{questionPack.questionIds.length} 道题目</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{formatTime(questionPack.created)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>;
    })}
    </div>;
}
