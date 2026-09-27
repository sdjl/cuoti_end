"use client";

import BaseImage from "../../../../../../components/common/BaseImage.js";
import { Badge } from "../../../../../../components/ui/badge.js";
// 题目信息展示组件，用于显示题目的基本信息、内容、坐标信息、关联试卷和详细信息等
import { Card, CardContent, CardHeader, CardTitle } from "../../../../../../components/ui/card.js";
import { Separator } from "../../../../../../components/ui/separator.js";
export default function QuestionDisplay({
  data
}) {
  const {
    question,
    examPaper
  } = data;
  const getDifficultyColor = difficulty => {
    switch (difficulty) {
      case "简单":
        return "bg-green-100 text-green-800";
      case "中等":
        return "bg-yellow-100 text-yellow-800";
      case "困难":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };
  return <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          题目信息
          <Badge variant="secondary">question</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 基本信息 */}
        <div>
          <h3 className="font-semibold text-lg mb-2">基本信息</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-muted-foreground">ID:</span>
              <p className="font-mono text-sm">{question._id}</p>
            </div>
            <div>
              <span className="text-muted-foreground">试卷ID:</span>
              <p className="font-mono text-sm">{question.examPaperId}</p>
            </div>
            <div>
              <span className="text-muted-foreground">题目序号:</span>
              <p className="text-lg font-semibold text-blue-600">
                {question.questionNumber}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">难度:</span>
              {question.difficulty && <Badge className={getDifficultyColor(question.difficulty)}>
                  {question.difficulty}
                </Badge>}
            </div>
          </div>
        </div>

        <Separator />

        {/* 题目内容 */}
        <div>
          <h3 className="font-semibold text-lg mb-2">题目内容</h3>
          <div className="space-y-3">
            {question.questionText && <div>
                <span className="text-muted-foreground">题目描述:</span>
                <p className="text-sm mt-1 bg-gray-50 p-3 rounded-md">
                  {question.questionText}
                </p>
              </div>}

            {question.imageUrl && <div>
                <span className="text-muted-foreground">题目图片:</span>
                <div className="mt-2 border rounded-md overflow-hidden">
                  <BaseImage src={question.imageUrl} alt="题目图片" width={400} height={300} className="w-full h-auto max-w-md" />
                </div>
              </div>}
          </div>
        </div>

        {/* 坐标信息 */}
        {question.leftTop && question.rightBottom && <>
            <Separator />
            <div>
              <h3 className="font-semibold text-lg mb-2">坐标信息</h3>
              <div className="bg-blue-50 p-4 rounded-md">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">
                      左上角 (x, y):
                    </span>
                    <p className="font-mono">
                      ({question.leftTop.x}, {question.leftTop.y})
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">
                      右下角 (x, y):
                    </span>
                    <p className="font-mono">
                      ({question.rightBottom.x}, {question.rightBottom.y})
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </>}

        {/* 关联试卷信息 */}
        {examPaper && <>
            <Separator />
            <div>
              <h3 className="font-semibold text-lg mb-2">所属试卷</h3>
              <div className="bg-green-50 p-4 rounded-md">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-muted-foreground">试卷名称:</span>
                    <p className="font-semibold">{examPaper.title}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">科目:</span>
                    <p>{examPaper.subject}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">切题状态:</span>
                    <Badge variant="secondary">{examPaper.cuttingStatus}</Badge>
                  </div>
                  <div>
                    <span className="text-muted-foreground">总题目数:</span>
                    <p className="text-blue-600 font-semibold">
                      {examPaper.questionCount || 0}
                    </p>
                  </div>
                </div>
                <div className="mt-2">
                  <span className="text-muted-foreground">试卷ID:</span>
                  <p className="font-mono text-sm">{examPaper._id}</p>
                </div>
              </div>
            </div>
          </>}

        <Separator />

        {/* 题目详细信息 */}
        <div>
          <h3 className="font-semibold text-lg mb-2">题目详细信息</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            {question.questionType && <div>
                <span className="text-muted-foreground">题目类型:</span>
                <p>{question.questionType}</p>
              </div>}
            {question.answer && question.answer.length > 0 && <div>
                <span className="text-muted-foreground">标准答案:</span>
                <p className="text-green-600 font-semibold">
                  {question.answer.join(", ")}
                </p>
              </div>}
          </div>
        </div>
      </CardContent>
    </Card>;
}
