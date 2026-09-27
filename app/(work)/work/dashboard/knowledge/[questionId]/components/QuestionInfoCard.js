"use client";

import BaseImage from "../../../../../../../components/common/BaseImage.js";
import { Badge } from "../../../../../../../components/ui/badge.js";
// 知识点页面的题目信息卡片，展示题目属性与配图详情
import { Card, CardContent } from "../../../../../../../components/ui/card.js";
export default function QuestionInfoCard({
  questionInfo
}) {
  const getDifficultyColor = difficulty => {
    switch (difficulty) {
      case "容易":
        return "bg-green-100 text-green-800";
      case "中等":
        return "bg-yellow-100 text-yellow-800";
      case "困难":
        return "bg-orange-100 text-orange-800";
      case "超难":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };
  return <Card className="bg-white">
      <CardContent className="p-6 space-y-4">
        {/* 题目基本信息 */}
        <div className="flex items-center gap-3 flex-wrap">
          <h3 className="text-lg font-semibold text-gray-900">题目信息</h3>
          {questionInfo.questionType && <Badge variant="outline" className="text-sm">
              {questionInfo.questionType}
            </Badge>}
          <Badge className={getDifficultyColor(questionInfo.difficulty)}>
            {questionInfo.difficulty}
          </Badge>
        </div>

        {/* 知识点 */}
        {questionInfo.knowledgePoints && questionInfo.knowledgePoints.length > 0 && <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700">知识点</h4>
              <div className="flex flex-wrap gap-2">
                {questionInfo.knowledgePoints.map((point, index) => <Badge key={index} variant="secondary" className="text-sm">
                    {point}
                  </Badge>)}
              </div>
            </div>}

        {/* 题目图片 - 独占一行，高度自适应 */}
        {questionInfo.imageUrl && <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700">题目</h4>
            <div className="border rounded-lg overflow-hidden cursor-pointer hover:shadow-lg transition-shadow bg-gray-50" onClick={() => window.open(questionInfo.imageUrl, "_blank")}>
              <BaseImage src={questionInfo.imageUrl} alt="题目图片" width={1200} height={800} className="w-full h-auto" />
            </div>
          </div>}

        {/* 题目文本 */}
        {questionInfo.questionText && !questionInfo.imageUrl && <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700">题目</h4>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-800 whitespace-pre-wrap">
                {questionInfo.questionText}
              </p>
            </div>
          </div>}

        {/* 答案和解析 - 并排显示，高度自适应，自动匹配最高图片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
          {/* 答案 */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700">答案</h4>
            {questionInfo.answerImage ? <div className="border rounded-lg overflow-hidden cursor-pointer hover:shadow-lg transition-shadow bg-blue-50" onClick={() => window.open(questionInfo.answerImage.imageUrl, "_blank")}>
                <BaseImage src={questionInfo.answerImage.imageUrl} alt="答案图片" width={600} height={800} className="w-full h-auto" />
              </div> : questionInfo.answer && questionInfo.answer.length > 0 ? <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-gray-800">
                  {questionInfo.answer.join(" ; ")}
                </p>
              </div> : <div className="bg-gray-50 p-4 rounded-lg flex items-center justify-center py-8">
                <p className="text-gray-400 text-sm">暂无答案</p>
              </div>}
          </div>

          {/* 解析 */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700">解析</h4>
            {questionInfo.parseImage ? <div className="border rounded-lg overflow-hidden cursor-pointer hover:shadow-lg transition-shadow bg-green-50" onClick={() => window.open(questionInfo.parseImage.imageUrl, "_blank")}>
                <BaseImage src={questionInfo.parseImage.imageUrl} alt="解析图片" width={600} height={800} className="w-full h-auto" />
              </div> : questionInfo.parse && questionInfo.parse.length > 0 ? <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-gray-800 whitespace-pre-wrap">
                  {questionInfo.parse.join("\n")}
                </p>
              </div> : <div className="bg-gray-50 p-4 rounded-lg flex items-center justify-center py-8">
                <p className="text-gray-400 text-sm">暂无解析</p>
              </div>}
          </div>
        </div>

        {/* 易错点 */}
        {questionInfo.easyToMistakeDetail && questionInfo.easyToMistakeDetail.length > 0 && <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700">易错点</h4>
              <div className="bg-orange-50 p-4 rounded-lg space-y-2">
                {questionInfo.easyToMistakeDetail.map((detail, index) => <p key={index} className="text-gray-800">
                    • {detail}
                  </p>)}
              </div>
            </div>}
      </CardContent>
    </Card>;
}
