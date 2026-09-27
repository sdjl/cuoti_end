"use client";

import { BookOpen, CheckCircle, ChevronDown, ChevronUp, Clock, Target } from "lucide-react";
import BaseImage from "../../../../../../../../components/common/BaseImage.js";
import { Button } from "../../../../../../../../components/ui/button.js";
import { Card } from "../../../../../../../../components/ui/card.js";
export default function QuestionInfoCard({
  problemQuestion,
  isExpanded,
  onToggleExpand,
  onImageClick
}) {
  const imageUrl = problemQuestion.imageUrl;
  return <Card className="glass-card mb-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-blue-500" />
          <span className="font-medium text-gray-800">题目信息</span>
        </div>
        <Button variant="ghost" size="sm" onClick={onToggleExpand} className="h-8 w-8 p-0">
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </Button>
      </div>

      {/* 题目图片 */}
      {imageUrl && <div className="mb-3">
          <div className="w-full rounded-lg shadow-sm cursor-pointer hover:shadow-md transition-shadow relative" onClick={onImageClick}>
            <BaseImage src={imageUrl} alt="题目图片" width={400} height={300} className="w-full rounded-lg" style={{
          objectFit: "contain"
        }} />
          </div>
        </div>}

      {/* 可折叠的详细信息 */}
      {isExpanded && <div className="space-y-3">
          {/* 科目与难度 */}
          <div className="flex gap-2 flex-wrap">
            {problemQuestion.subject && <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                {problemQuestion.subject}
              </span>}
            {problemQuestion.difficulty && <span className="inline-flex items-center px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
                <Target className="w-3 h-3 mr-1" />
                {problemQuestion.difficulty}
              </span>}
          </div>

          {/* 知识点 */}
          {problemQuestion.knowledgePoints && problemQuestion.knowledgePoints.length > 0 && <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  关联知识点
                </h4>
                <div className="flex gap-1 flex-wrap">
                  {problemQuestion.knowledgePoints.map((point, index) => <span key={index} className="inline-block px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                      {point}
                    </span>)}
                </div>
              </div>}

          {/* 掌握状态 */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-200">
            <div className="flex items-center gap-2">
              {problemQuestion.isStudentMaster ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Clock className="w-4 h-4 text-orange-500" />}
              <span className="text-sm text-gray-600">
                {problemQuestion.isStudentMaster ? "已掌握" : "待掌握"}
              </span>
            </div>
            {problemQuestion.masteredTime && <span className="text-xs text-gray-500">
                掌握时间:{" "}
                {new Date(problemQuestion.masteredTime).toLocaleDateString()}
              </span>}
          </div>
        </div>}
    </Card>;
}
