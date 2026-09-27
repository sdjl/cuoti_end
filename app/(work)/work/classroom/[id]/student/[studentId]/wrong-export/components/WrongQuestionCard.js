"use client";

// 错题卡片组件，用于错题导出页面显示单个错题的详细信息
import { ImageIcon } from "lucide-react";
import BaseImage from "../../../../../../../../../components/common/BaseImage.js";
import { Card, CardContent } from "../../../../../../../../../components/ui/card.js";
export function WrongQuestionCard({
  item,
  index
}) {
  // 格式化时间
  const formatDate = timestamp => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleString("zh-CN");
    } catch {
      return "未知时间";
    }
  };
  return <Card className="bg-white">
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* 错题信息头部 */}
          <div className="flex items-center justify-between border-b pb-3">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                错题 #{index + 1}
              </h3>
              <p className="text-sm text-gray-600">
                题目类型：{item.question.questionType || "未知"}
              </p>
            </div>
            <div className="text-right text-sm text-gray-500">
              做错时间：{formatDate(item.studentAnswer.created)}
            </div>
          </div>

          {/* 题目图片 */}
          {item.question.imageUrl ? <div className="flex justify-center">
              <BaseImage src={item.question.imageUrl} alt={`错题 ${index + 1}`} width={item.question.imageWidth || 800} height={item.question.imageHeight || 600} className="max-w-full h-auto rounded-lg border" />
            </div> : <div className="flex justify-center p-8 bg-gray-50 rounded-lg">
              <div className="text-center">
                <ImageIcon className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                <p className="text-gray-500">暂无题目图片</p>
              </div>
            </div>}

          {/* 学生答案信息 */}
          {item.studentAnswerItem.answerValue && item.studentAnswerItem.answerValue.length > 0 && <div className="bg-red-50 p-3 rounded-lg">
                <h4 className="text-sm font-medium text-red-800 mb-2">
                  学生答案：
                </h4>
                <div className="flex flex-wrap gap-2">
                  {item.studentAnswerItem.answerValue.map((answer, answerIndex) => <span key={answerIndex} className="px-2 py-1 bg-red-100 text-red-700 text-sm rounded">
                        {answer}
                      </span>)}
                </div>
              </div>}
        </div>
      </CardContent>
    </Card>;
}
