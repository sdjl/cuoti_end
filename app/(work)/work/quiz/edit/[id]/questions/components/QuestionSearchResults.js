"use client";

import BaseImage from "../../../../../../../../components/common/BaseImage.js";
import { Badge } from "../../../../../../../../components/ui/badge.js";
// 题目搜索结果组件，用于展示搜索结果并提供添加题目功能
import { Button } from "../../../../../../../../components/ui/button.js";
export default function QuestionSearchResults({
  searchResults,
  questionStates,
  onAddQuestion
}) {
  if (searchResults.length === 0) {
    return null;
  }
  return <div className="space-y-4">
      {searchResults.map(question => <div key={question._id} className="border rounded-lg bg-white overflow-hidden">
          {/* 第一行：题目图片 - 全宽度 */}
          <div className="w-full">
            {question.imageUrl && <BaseImage src={question.imageUrl} alt="题目图片" width={question.imageWidth || 800} height={question.imageHeight || 600} className="w-full" />}
          </div>

          {/* 第二行：信息和操作按钮 */}
          <div className="p-4 flex justify-between items-center">
            {/* 左侧：难度和知识点 */}
            <div className="flex items-center gap-2">
              <Badge variant="outline">{question.difficulty}</Badge>
              {question.knowledgePoints && question.knowledgePoints.length > 0 && <div className="flex gap-1">
                    {question.knowledgePoints.map((point, idx) => <Badge key={idx} variant="secondary" className="text-xs">
                        {point}
                      </Badge>)}
                  </div>}
            </div>

            {/* 右侧：添加按钮 */}
            <Button size="sm" onClick={() => onAddQuestion(question)} disabled={questionStates.has(question._id) && questionStates.get(question._id)?.action !== "removed"}>
              添加题目
            </Button>
          </div>
        </div>)}
    </div>;
}
