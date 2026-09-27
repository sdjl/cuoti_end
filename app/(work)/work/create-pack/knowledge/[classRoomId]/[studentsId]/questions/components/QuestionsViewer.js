"use client";

import { FileText } from "lucide-react";
import BaseImage from "../../../../../../../../../components/common/BaseImage.js";
import { Badge } from "../../../../../../../../../components/ui/badge.js";
// 题目查看器组件，用于显示题集中的所有题目及其详细信息
import { Card, CardContent, CardHeader, CardTitle } from "../../../../../../../../../components/ui/card.js";
export default function QuestionsViewer({
  questionPack,
  questions,
  loading = false
}) {
  if (loading) {
    return <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            题目查看
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="text-gray-500">加载中...</div>
          </div>
        </CardContent>
      </Card>;
  }
  if (questions.length === 0) {
    return <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            题目查看
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="text-gray-500">该题集暂无题目</div>
            <p className="text-sm text-gray-400 mt-2">
              题集可能已被清空或题目已被删除
            </p>
          </div>
        </CardContent>
      </Card>;
  }
  return <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          题目查看
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 题集信息区域 */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div>
                <h3 className="font-medium text-lg text-gray-900">
                  {questionPack.name}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {questionPack.description}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-1/2 justify-end">
              <Badge variant="outline">{questionPack.subject}</Badge>
              <span className="text-gray-600">
                共 <Badge variant="default">{questions.length}</Badge> 道题目
              </span>
            </div>
          </div>
        </div>

        {/* 题目列表 */}
        <div className="space-y-4 max-h-[600px] overflow-y-auto">
          {questions.map((question, index) => <div key={question._id} className="border rounded-lg overflow-hidden">
              {/* 题目图片区域 */}
              <div className="relative">
                {question.imageUrl ? <div className="w-full bg-gray-100">
                    <BaseImage src={question.imageUrl} alt={`题目 ${index + 1}`} width={800} height={600} className="w-full h-auto object-contain" />
                  </div> : <div className="w-full h-48 bg-gray-100 flex items-center justify-center">
                    <FileText className="w-16 h-16 text-gray-400" />
                    <span className="ml-2 text-gray-500">暂无图片</span>
                  </div>}
              </div>

              {/* 题目信息区域 */}
              <div className="p-4 bg-gray-50">
                {/* 序号、知识点、类型、难度 - 单行显示 */}
                <div className="flex flex-wrap items-center gap-3 text-xs">
                  {/* 序号 */}
                  <div className="text-xs text-gray-700 font-medium">
                    #{index + 1}
                  </div>

                  {/* 知识点标签 */}
                  {question.knowledgePoints && question.knowledgePoints.length > 0 && <div className="flex items-center gap-1">
                        <span className="text-gray-500">知识点：</span>
                        <div className="flex flex-wrap gap-1">
                          {question.knowledgePoints.map((point, idx) => <Badge key={idx} variant="outline" className="text-xs">
                              {point}
                            </Badge>)}
                        </div>
                      </div>}

                  {/* 题目类型 */}
                  {question.questionType && <div className="flex items-center gap-1">
                      <span className="text-gray-500">类型：</span>
                      <Badge variant="secondary" className="text-xs">
                        {question.questionType}
                      </Badge>
                    </div>}

                  {/* 题目难度 */}
                  <div className="flex items-center gap-1">
                    <span className="text-gray-500">难度：</span>
                    <Badge variant="default" className="text-xs">
                      {question.difficulty}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>)}
        </div>
      </CardContent>
    </Card>;
}
