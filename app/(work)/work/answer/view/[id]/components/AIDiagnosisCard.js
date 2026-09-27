"use client";

// 答题查看页的AI诊断卡片，用于展示学生总体表现与提升建议
import { Award, BookOpen, Bot, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../../../../components/ui/card.js";
export default function AIDiagnosisCard({
  aiDiagnosis
}) {
  // 如果没有AI诊断数据，则不显示组件
  if (!aiDiagnosis) {
    return null;
  }
  return <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-purple-600" />
          AI综合诊断
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-blue-600" />
            <h4 className="font-semibold text-blue-800">总体表现</h4>
          </div>
          <p className="text-sm text-blue-700 leading-relaxed">
            {aiDiagnosis.overallPerformance}
          </p>
        </div>

        <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-r-lg">
          <div className="flex items-center gap-2 mb-2">
            <Award className="w-4 h-4 text-green-600" />
            <h4 className="font-semibold text-green-800">优势保持</h4>
          </div>
          <p className="text-sm text-green-700 leading-relaxed">
            {aiDiagnosis.strength}
          </p>
        </div>

        <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded-r-lg">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="w-4 h-4 text-orange-600" />
            <h4 className="font-semibold text-orange-800">重点提升</h4>
          </div>
          <p className="text-sm text-orange-700 leading-relaxed">
            {aiDiagnosis.improvement}
          </p>
        </div>
      </CardContent>
    </Card>;
}
