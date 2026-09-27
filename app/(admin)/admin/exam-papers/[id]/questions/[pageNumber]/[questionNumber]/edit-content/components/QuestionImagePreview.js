"use client";

// 题目图片预览组件，用于显示题目的图片内容
import { Card, CardContent, CardHeader, CardTitle } from "../../../../../../../../../../components/ui/card.js";
export function QuestionImagePreview({
  imageUrl,
  questionNumber
}) {
  return <Card className="mb-6">
      <CardHeader>
        <CardTitle>题目图片预览</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative my-3 border rounded-md p-2 bg-muted/20">
          {}
          <img src={imageUrl} alt={`题目 ${questionNumber} 图片`} className="rounded border max-h-[400px] object-contain mx-auto" />
          <div className="mt-2 text-sm text-muted-foreground text-center">
            要修改图片，请使用&ldquo;修改图片&rdquo;功能
          </div>
        </div>
      </CardContent>
    </Card>;
}
