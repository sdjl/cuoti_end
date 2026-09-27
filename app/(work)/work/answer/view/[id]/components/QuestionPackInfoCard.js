"use client";

import { BookOpen } from "lucide-react";
import { Badge } from "../../../../../../../components/ui/badge.js";
// 题集信息统计卡片，展示题集基础信息与错题数量概览
import { Card, CardContent, CardHeader, CardTitle } from "../../../../../../../components/ui/card.js";
export default function QuestionPackInfoCard({
  questionPack,
  errorCount
}) {
  return <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="w-5 h-5" />
          题集信息
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-600">题集名称：</span>
          <span className="text-sm font-medium">{questionPack.name}</span>
          <Badge variant="outline">{questionPack.type}</Badge>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-600">题集描述：</span>
          <span className="text-sm text-gray-600">
            {questionPack.description || "无"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-600">总题目数：</span>
          <span className="text-sm">{questionPack.questionIds.length} 道</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-600">错题数：</span>
          <span className="text-sm text-red-600 font-medium">
            {errorCount} 道
          </span>
        </div>
      </CardContent>
    </Card>;
}
