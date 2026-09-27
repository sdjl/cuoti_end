"use client";

import { BookOpen, CheckCircle, ChevronDown, ChevronUp, Clock, Target } from "lucide-react";
import BaseImage from "../../../../../../../../components/common/BaseImage.js";
import { Button } from "../../../../../../../../components/ui/button.js";
import { Card } from "../../../../../../../../components/ui/card.js";
export default function QuestionInfoCard({
  studentAnswerItem,
  isExpanded,
  onToggleExpand,
  onImageClick
}) {
  const {
    questionData
  } = studentAnswerItem;
  // 优先使用学生答题记录中的图片，如果没有则使用题目原图
  const imageUrl = studentAnswerItem.imageUrl || questionData?.imageUrl;
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
          {/* 题目类型和难度 */}
          <div className="flex gap-2 flex-wrap">
            {studentAnswerItem.questionType && <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                {studentAnswerItem.questionType}
              </span>}
            {questionData?.difficulty && <span className="inline-flex items-center px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
                <Target className="w-3 h-3 mr-1" />
                {questionData.difficulty}
              </span>}
          </div>

          {/* 知识点 */}
          {questionData?.knowledgePoints && questionData.knowledgePoints.length > 0 && <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  关联知识点
                </h4>
                <div className="flex gap-1 flex-wrap">
                  {questionData.knowledgePoints.map((point, index) => <span key={index} className="inline-block px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                      {point}
                    </span>)}
                </div>
              </div>}

          {/* 学生答案 */}
          {studentAnswerItem.answerValue && studentAnswerItem.answerValue.length > 0 && <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  我的答案
                </h4>
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  {studentAnswerItem.answerValue.map((answer, index) => <div key={index} className="text-sm text-red-700">
                      {answer}
                    </div>)}
                </div>
              </div>}

          {/* 错误解析 */}
          {studentAnswerItem.parse && studentAnswerItem.parse.length > 0 && <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                错误解析
              </h4>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                {studentAnswerItem.parse.map((parseText, index) => <div key={index} className="text-sm text-yellow-800 mb-1">
                    {parseText}
                  </div>)}
              </div>
            </div>}

          {/* 题目解析 */}
          {questionData?.parse && questionData.parse.length > 0 && <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                题目解析
              </h4>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                {questionData.parse.map((parseText, index) => <div key={index} className="text-sm text-blue-700 mb-1">
                    {parseText}
                  </div>)}
              </div>
            </div>}

          {/* 掌握状态 */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-200">
            <div className="flex items-center gap-2">
              {studentAnswerItem.isCorrectedByMistakeAgain ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Clock className="w-4 h-4 text-orange-500" />}
              <span className="text-sm text-gray-600">
                {studentAnswerItem.isCorrectedByMistakeAgain ? "已掌握" : "待掌握"}
              </span>
            </div>
            {studentAnswerItem.mistakeMasteredTime && <span className="text-xs text-gray-500">
                掌握时间:{" "}
                {new Date(studentAnswerItem.mistakeMasteredTime).toLocaleDateString()}
              </span>}
          </div>
        </div>}
    </Card>;
}
