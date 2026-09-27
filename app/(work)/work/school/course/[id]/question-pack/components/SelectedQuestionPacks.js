"use client";

// 已选题集组件，用于展示课程中已添加的题集（包括原有题集和新选题集）并提供移除功能
import { BookOpen, CheckCircle, Clock, X } from "lucide-react";
import { Badge } from "../../../../../../../../components/ui/badge.js";
import { Button } from "../../../../../../../../components/ui/button.js";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../../../../../components/ui/card.js";
export default function SelectedQuestionPacks({
  originalQuestionPacks,
  selectedQuestionPacks,
  onRemoveSelected
}) {
  // 格式化时间
  const formatTime = timestamp => {
    const date = new Date(timestamp);
    return date.toLocaleDateString("zh-CN");
  };

  // 渲染题集卡片
  const renderQuestionPackCard = (questionPack, isOriginal) => <Card key={questionPack._id} className={isOriginal ? "border-green-200 bg-green-50" : "border-blue-200 bg-blue-50"}>
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
              {isOriginal ? <Badge variant="default" className="text-xs bg-green-600">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  原有题集
                </Badge> : <Badge variant="default" className="text-xs bg-blue-600">
                  新选题集
                </Badge>}
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => onRemoveSelected(questionPack._id)} className="ml-2 text-red-600 hover:text-red-700 hover:bg-red-50">
            <X className="h-4 w-4 mr-1" />
            移除
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {questionPack.description && <p className="text-gray-600 text-sm mb-3 line-clamp-2">
            {questionPack.description}
          </p>}

        <div className="flex items-center gap-4 text-sm text-gray-500">
          <div className="flex items-center gap-1">
            <BookOpen className="h-4 w-4" />
            <span>{questionPack.questionIds.length} 道题目</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>{formatTime(questionPack.created)}</span>
          </div>
        </div>
      </CardContent>
    </Card>;

  // 如果没有任何题集，显示空状态
  if (originalQuestionPacks.length === 0 && selectedQuestionPacks.length === 0) {
    return <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-8">
          <BookOpen className="h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-500 text-center">
            请从左侧选择要添加到课程的题集
          </p>
        </CardContent>
      </Card>;
  }
  return <div className="space-y-4">
      {/* 显示所有题集 */}
      {originalQuestionPacks.map(questionPack => renderQuestionPackCard(questionPack, true))}

      {selectedQuestionPacks.map(questionPack => renderQuestionPackCard(questionPack, false))}
    </div>;
}
