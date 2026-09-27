"use client";

import { Award, BookOpen, Bot, TrendingUp } from "lucide-react";
// AI综合诊断卡片组件，用于显示AI对学生的总体表现、优势保持和重点提升建议
import { Card, CardContent, CardHeader, CardTitle } from "../../../../../../../components/ui/card.js";
export default function AIDiagnosisCard({
  aiDiagnosis
}) {
  return <Card className="w-full">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Bot className="w-5 h-5 text-purple-600" />
          AI综合诊断
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-blue-600" />
            <h4 className="font-semibold text-blue-800">总体表现</h4>
          </div>
          <p className="text-sm text-blue-700">
            {aiDiagnosis.overallPerformance}
          </p>
        </div>

        <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-r-lg">
          <div className="flex items-center gap-2 mb-2">
            <Award className="w-4 h-4 text-green-600" />
            <h4 className="font-semibold text-green-800">优势保持</h4>
          </div>
          <p className="text-sm text-green-700">{aiDiagnosis.strength}</p>
        </div>

        <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded-r-lg">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="w-4 h-4 text-orange-600" />
            <h4 className="font-semibold text-orange-800">重点提升</h4>
          </div>
          <p className="text-sm text-orange-700">{aiDiagnosis.improvement}</p>
        </div>
      </CardContent>
    </Card>;
}
