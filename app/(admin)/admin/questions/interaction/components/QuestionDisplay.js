"use client";

import { AlertTriangle, BookOpen, FileText, Target } from "lucide-react";
import { Badge } from "../../../../../../components/ui/badge.js";
// 题目信息显示组件，用于展示题目的详细信息，包括图片、文本、答案、解析等
import { Card, CardContent, CardHeader, CardTitle } from "../../../../../../components/ui/card.js";
export default function QuestionDisplay({
  question
}) {
  return <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          题目信息
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 基础信息 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <div className="text-sm font-medium text-muted-foreground">
              页码
            </div>
            <div className="text-lg">第 {question.pageNumber} 页</div>
          </div>
          <div>
            <div className="text-sm font-medium text-muted-foreground">
              题号
            </div>
            <div className="text-lg">第 {question.questionNumber} 题</div>
          </div>
          {question.questionType && <div>
              <div className="text-sm font-medium text-muted-foreground">
                题型
              </div>
              <Badge variant="secondary">{question.questionType}</Badge>
            </div>}
          {question.difficulty && <div>
              <div className="text-sm font-medium text-muted-foreground">
                难度
              </div>
              <Badge variant={question.difficulty === "容易" ? "default" : question.difficulty === "中等" ? "secondary" : question.difficulty === "困难" ? "destructive" : "outline"}>
                {question.difficulty}
              </Badge>
            </div>}
        </div>

        {/* 题目图片 */}
        {question.imageUrl && <div className="border rounded-lg p-4 bg-muted/20">
            <div className="text-sm font-medium text-muted-foreground mb-2">
              题目图片
            </div>
            {}
            <img src={question.imageUrl} alt={`第${question.pageNumber}页第${question.questionNumber}题`} className="max-w-full h-auto rounded border bg-white" style={{
          maxHeight: "400px"
        }} />
          </div>}

        {/* 题目文本 */}
        {question.questionText && <div className="space-y-2">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-600">
                题目文本
              </span>
            </div>
            <div className="bg-blue-50 rounded-lg p-3">
              <pre className="text-sm whitespace-pre-wrap text-blue-900">
                {question.questionText}
              </pre>
            </div>
          </div>}

        {/* 答案 */}
        {question.answer && question.answer.length > 0 && <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-600">
                参考答案
              </span>
            </div>
            <div className="bg-green-50 rounded-lg p-3">
              <div className="text-sm text-green-900">
                {question.answer.join(" ")}
              </div>
            </div>
          </div>}

        {/* 解析 */}
        {question.parse && question.parse.length > 0 && <div className="space-y-2">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium text-purple-600">
                题目解析
              </span>
            </div>
            <div className="bg-purple-50 rounded-lg p-3">
              <div className="text-sm text-purple-900">
                {question.parse.join(" ")}
              </div>
            </div>
          </div>}

        {/* 知识点 */}
        {question.knowledgePoints && question.knowledgePoints.length > 0 && <div className="space-y-2">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-indigo-600" />
              <span className="text-sm font-medium text-indigo-600">
                相关知识点
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {question.knowledgePoints.map((point, index) => <Badge key={index} variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">
                  {point}
                </Badge>)}
            </div>
          </div>}

        {/* 易错原因 */}
        {question.easyToMistakeDetail && question.easyToMistakeDetail.length > 0 && <div className="space-y-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <span className="text-sm font-medium text-amber-600">
                  易错原因
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {question.easyToMistakeDetail.map((detail, index) => <Badge key={index} variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                    {detail}
                  </Badge>)}
              </div>
            </div>}
      </CardContent>
    </Card>;
}
