"use client";

import { CheckCircle, Clock, XCircle } from "lucide-react";
import BaseImage from "../../../../../../../../../components/common/BaseImage.js";
import { Badge } from "../../../../../../../../../components/ui/badge.js";
// 显示题目信息组件，包括题目图片、参考答案、解析和学生选择的答案
import { Card, CardContent, CardHeader, CardTitle } from "../../../../../../../../../components/ui/card.js";
export default function QuestionInfo({
  quizQuestion,
  examQuestion
}) {
  // 获取正确性显示
  const getCorrectnessBadge = isCorrect => {
    if (isCorrect === undefined) {
      return <div className="flex items-center gap-1 text-gray-500">
          <Clock className="h-4 w-4" />
          <span className="text-sm">未提交</span>
        </div>;
    }
    return isCorrect ? <div className="flex items-center gap-1 text-green-600">
        <CheckCircle className="h-4 w-4" />
        <span className="text-sm">答案正确</span>
      </div> : <div className="flex items-center gap-1 text-red-600">
        <XCircle className="h-4 w-4" />
        <span className="text-sm">答案错误</span>
      </div>;
  };
  return <Card className="bg-white">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold">题目信息</CardTitle>
          {getCorrectnessBadge(quizQuestion.isCorrect)}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 题目图片 */}
        {examQuestion?.imageUrl && <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700">题目图片</h4>
            <div>
              <BaseImage src={examQuestion.imageUrl} alt="题目图片" width={examQuestion.imageWidth || 600} height={examQuestion.imageHeight || 400} className="rounded-lg border max-w-full h-auto" />
            </div>
          </div>}

        {/* 参考答案 */}
        {examQuestion?.answer && examQuestion.answer.length > 0 && <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">参考答案</h4>
            <div className="space-y-1">
              {examQuestion.answer.map((ans, idx) => <p key={idx} className="text-sm text-gray-600 whitespace-pre-wrap bg-gray-50 p-2 rounded">
                  {ans}
                </p>)}
            </div>
          </div>}

        {/* 解析 */}
        {examQuestion?.parse && examQuestion.parse.length > 0 && <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">解析</h4>
            <div className="space-y-1">
              {examQuestion.parse.map((p, idx) => <p key={idx} className="text-sm text-gray-600 whitespace-pre-wrap bg-gray-50 p-2 rounded">
                  {p}
                </p>)}
            </div>
          </div>}

        {/* 学生选择的答案 */}
        {quizQuestion.selectedOptions && quizQuestion.selectedOptions.length > 0 && <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                学生选择的答案
              </h4>
              <div className="flex flex-wrap gap-1">
                {quizQuestion.selectedOptions.map((option, idx) => <Badge key={idx} variant="outline" className="text-xs">
                    {option}
                  </Badge>)}
              </div>
            </div>}
      </CardContent>
    </Card>;
}
