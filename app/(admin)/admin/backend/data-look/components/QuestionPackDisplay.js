"use client";

import BaseImage from "../../../../../../components/common/BaseImage.js";
import { Badge } from "../../../../../../components/ui/badge.js";
// 题集信息展示组件，用于显示题集的基本信息、所属校园、题目列表、题目图片和时间信息等
import { Card, CardContent, CardHeader, CardTitle } from "../../../../../../components/ui/card.js";
import { Separator } from "../../../../../../components/ui/separator.js";
export default function QuestionPackDisplay({
  data
}) {
  const {
    questionPack,
    school,
    questions
  } = data;
  const formatDate = timestamp => {
    return new Date(timestamp).toLocaleString("zh-CN");
  };
  return <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          题集信息
          <Badge variant="secondary">question_pack</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 基本信息 */}
        <div>
          <h3 className="font-semibold text-lg mb-2">基本信息</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-muted-foreground">ID:</span>
              <p className="font-mono text-sm">{questionPack._id}</p>
            </div>
            <div>
              <span className="text-muted-foreground">题集名称:</span>
              <p className="font-semibold">{questionPack.name}</p>
            </div>
            <div>
              <span className="text-muted-foreground">学校ID:</span>
              <p className="font-mono text-sm">
                {questionPack.schoolId || "无"}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">题集类型:</span>
              <Badge className="bg-blue-100 text-blue-800">
                {questionPack.type}
              </Badge>
            </div>
          </div>
        </div>

        <Separator />

        {/* 校园信息 */}
        {school && <>
            <div>
              <h3 className="font-semibold text-lg mb-2">所属校园</h3>
              <div className="bg-blue-50 p-4 rounded-md">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-muted-foreground">校园名称:</span>
                    <p className="font-semibold">{school.name}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">区域:</span>
                    <p>{school.region}</p>
                  </div>
                </div>
              </div>
            </div>
            <Separator />
          </>}

        {/* 题目信息 */}
        <div>
          <h3 className="font-semibold text-lg mb-2">题目信息</h3>
          <div>
            <span className="text-muted-foreground">题目数量:</span>
            <p className="text-lg font-semibold text-blue-600">
              {questionPack.questionIds?.length || 0}
            </p>
          </div>
          {questionPack.questionIds && questionPack.questionIds.length > 0 && <div className="mt-2">
              <span className="text-muted-foreground">题目ID列表:</span>
              <div className="bg-gray-50 p-4 rounded-md max-h-40 overflow-y-auto mt-1">
                {questionPack.questionIds.map((id, index) => <div key={index} className="font-mono text-sm py-1">
                    {index + 1}. {id}
                  </div>)}
              </div>
            </div>}
        </div>

        <Separator />

        {/* 题目图片展示 */}
        {questions.length > 0 && <>
            <div>
              <h3 className="font-semibold text-lg mb-2">题目图片</h3>
              <div className="grid grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                {questions.map((question, index) => <div key={index} className="border rounded-md p-2">
                    <div className="text-sm text-muted-foreground mb-2">
                      题目 {question.questionNumber || index + 1}
                    </div>
                    {question.imageUrl ? <BaseImage src={question.imageUrl} alt={`题目${question.questionNumber || index + 1}图片`} width={200} height={150} className="w-full h-auto rounded border" /> : <div className="w-full h-32 bg-gray-100 rounded border flex items-center justify-center text-gray-500">
                        无图片
                      </div>}
                  </div>)}
              </div>
            </div>
            <Separator />
          </>}

        {/* 时间信息 */}
        <div>
          <h3 className="font-semibold text-lg mb-2">时间信息</h3>
          <div>
            <span className="text-muted-foreground">创建时间:</span>
            <p>{formatDate(questionPack.created)}</p>
          </div>
        </div>

        {/* 描述信息 */}
        {questionPack.description && <>
            <Separator />
            <div>
              <span className="text-muted-foreground">题集描述:</span>
              <p className="text-sm mt-1 bg-gray-50 p-3 rounded-md">
                {questionPack.description}
              </p>
            </div>
          </>}
      </CardContent>
    </Card>;
}
