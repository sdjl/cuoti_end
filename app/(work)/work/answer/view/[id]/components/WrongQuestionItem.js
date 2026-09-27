"use client";

import { Brain, FileText, Target, User } from "lucide-react";
import BaseImage from "../../../../../../../components/common/BaseImage.js";
import { Badge } from "../../../../../../../components/ui/badge.js";
// 展示单道错题的题干、作答情况与错因分析
import { Card, CardContent, CardHeader, CardTitle } from "../../../../../../../components/ui/card.js";
import { DISPLAY_TEXT } from "../../../../../../../lib/config/constants.js";
export default function WrongQuestionItem({
  item,
  questionNumber
}) {
  return <div className="border rounded-lg p-4 bg-gray-50 space-y-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="destructive" className="text-white">
            第 {questionNumber} 题
          </Badge>
          <Badge variant="outline">{item.questionType}</Badge>
          <Badge variant={item.question.difficulty === "容易" ? "secondary" : item.question.difficulty === "中等" ? "default" : item.question.difficulty === "困难" ? "destructive" : "outline"}>
            {item.question.difficulty}
          </Badge>
        </div>
      </div>

      {/* 题目信息区域 */}
      <Card className="bg-white">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600" />
            题目信息
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 题目图片 */}
          <div>
            <div className="text-sm font-medium text-gray-600 mb-2">
              题目图片：
            </div>
            {item.question.imageUrl ? <div className="border rounded-lg overflow-hidden bg-white">
                <BaseImage src={item.question.imageUrl} alt={`第${questionNumber}题`} width={item.question.imageWidth || 600} height={item.question.imageHeight || 400} className="w-full h-auto" />
              </div> : <span className="text-sm text-gray-400">无</span>}
          </div>

          {/* 题目内容 */}
          <div>
            <div className="text-sm font-medium text-gray-600 mb-2">
              题目内容：
            </div>
            {item.question.questionText ? <div className="text-sm text-gray-800 bg-white p-3 rounded border">
                {item.question.questionText}
              </div> : <span className="text-sm text-gray-400">无</span>}
          </div>

          {/* 正确答案 */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-gray-600">
                正确答案：
              </span>
            </div>
            {item.question.answer && item.question.answer.length > 0 ? <div className="flex flex-wrap gap-3 ml-6">
                {item.question.answer.map((answer, idx) => <Badge key={idx} variant="outline" className="text-green-700 border-green-300">
                    {answer}
                  </Badge>)}
              </div> : <span className="text-sm text-gray-400 ml-6">无</span>}
          </div>

          {/* 题目解析 */}
          <div>
            <div className="text-sm font-medium text-gray-600 mb-2">
              题目解析：
            </div>
            {item.question.parse && item.question.parse.length > 0 ? <div className="text-sm text-gray-700 bg-blue-50 p-3 rounded border border-blue-200">
                {item.question.parse.map((parseText, idx) => <div key={idx} className="mb-1 last:mb-0">
                    {parseText}
                  </div>)}
              </div> : <span className="text-sm text-gray-400">无</span>}
          </div>

          {/* 知识点 */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Brain className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-gray-600">
                关联知识点：
              </span>
            </div>
            {item.question.knowledgePoints && item.question.knowledgePoints.length > 0 ? <div className="flex flex-wrap gap-1 ml-6">
                {item.question.knowledgePoints.map((point, idx) => <Badge key={idx} variant="outline" className="text-blue-700 border-blue-300">
                    {point}
                  </Badge>)}
              </div> : <span className="text-sm text-gray-400 ml-6">无</span>}
          </div>
        </CardContent>
      </Card>

      {/* 学生答卷信息区域 */}
      <Card className="bg-white">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <User className="w-4 h-4 text-red-600" />
            学生答卷信息
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 错题图片 */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-medium text-gray-600">
                错题图片：
              </span>
            </div>
            {item.imageUrl ? <div className="border rounded-lg overflow-hidden bg-white ml-6">
                <BaseImage src={item.imageUrl} alt={`第${questionNumber}题错题图片`} width={800} height={600} className="w-full h-auto" />
              </div> : <span className="text-sm text-gray-400">无</span>}
          </div>

          {/* 学生答案 */}
          <div>
            <div className="text-sm font-medium text-gray-600 mb-2">
              学生答案：
            </div>
            {item.answerValue.length > 0 ? <div className="text-sm text-gray-700 bg-red-50 p-3 rounded border border-red-200">
                {item.answerValue.map((answer, idx) => <div key={idx} className="mb-1 last:mb-0">
                    {answer || <span className="text-gray-400">(空行)</span>}
                  </div>)}
              </div> : <span className="text-sm text-gray-400 ml-6">无</span>}
          </div>

          {/* 学生犯错解析 */}
          <div>
            <div className="text-sm font-medium text-gray-600 mb-2">
              犯错解析：
            </div>
            {item.parse && item.parse.length > 0 ? <div className="text-sm text-gray-700 bg-red-50 p-3 rounded border border-red-200">
                {item.parse.map((parseText, idx) => <div key={idx} className="mb-1 last:mb-0">
                    {parseText || <span className="text-gray-400">(空行)</span>}
                  </div>)}
              </div> : <span className="text-sm text-gray-400">无</span>}
          </div>

          {/* 错误归因 */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-sm font-medium text-gray-600">
                犯{DISPLAY_TEXT.ERROR_ATTRIBUTION}：
              </span>
            </div>
            {item.mistakePoints.length > 0 ? <div className="space-y-2 ml-6">
                {item.mistakePoints.map(point => <div key={point._id} className="border-l-2 border-orange-200 pl-3">
                    <div className="text-sm font-medium text-gray-800">
                      {point.name}
                    </div>
                    {point.description && <div className="text-xs text-gray-600 mt-1">
                        {point.description}
                      </div>}
                  </div>)}
              </div> : <span className="text-sm text-gray-400">无</span>}
          </div>
        </CardContent>
      </Card>
    </div>;
}
