"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "../../../../../../../components/ui/button.js";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../../../../components/ui/card.js";

/**
 * 题目导航组件
 * 显示所有题目列表，支持快速切换题目
 */

export default function QuestionNavigation({
  answerItems,
  questionPack,
  currentIndex,
  onQuestionSelect
}) {
  // 获取题目在题集中的序号
  const getQuestionNumber = questionId => {
    const index = questionPack.questionIds.indexOf(questionId);
    return index >= 0 ? index + 1 : 0;
  };

  // 按照题目在题集中的序号排序answerItems
  const sortedAnswerItems = [...answerItems].map((item, originalIndex) => ({
    ...item,
    originalIndex,
    // 保存原始索引，用于onQuestionSelect回调
    questionNumber: getQuestionNumber(item.questionId)
  })).sort((a, b) => a.questionNumber - b.questionNumber);

  // 检查题目是否缺少答案
  const isMissingAnswer = item => {
    return item.answerValue.length === 0 || item.answerValue.every(answer => answer.trim() === "");
  };

  // 检查题目是否缺少解析
  const isMissingParse = item => {
    return !item.parse || item.parse.length === 0;
  };

  // 切换到上一题
  const handlePrevious = () => {
    if (currentIndex > 0) {
      onQuestionSelect(currentIndex - 1);
    }
  };

  // 切换到下一题
  const handleNext = () => {
    if (currentIndex < answerItems.length - 1) {
      onQuestionSelect(currentIndex + 1);
    }
  };
  return <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          {/* 左侧：标题 */}
          <div className="flex items-center">
            <span>错题导航</span>
          </div>

          {/* 右侧：上一题下一题按钮 */}
          <div className="flex items-center gap-2">
            <Button onClick={handlePrevious} variant="outline" size="sm" disabled={currentIndex === 0} title="使用键盘左箭头可快速切换">
              <ChevronLeft className="w-4 h-4 mr-2" />
              上一题
            </Button>

            <div className="text-sm text-gray-600 mx-2">
              {currentIndex + 1} / {answerItems.length}
            </div>

            <Button onClick={handleNext} variant="outline" size="sm" disabled={currentIndex === answerItems.length - 1} title="使用键盘右箭头可快速切换">
              下一题
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* 题目序号列表 */}
          <div className="flex flex-wrap gap-2">
            {sortedAnswerItems.map(sortedItem => {
            const isActive = sortedItem.originalIndex === currentIndex;
            const missingAnswer = isMissingAnswer(sortedItem);
            const missingParse = isMissingParse(sortedItem);
            return <div key={sortedItem._id} className="relative">
                  <Button variant={isActive ? "default" : "outline"} size="sm" className={`min-w-[60px] ${isActive ? "bg-blue-600 hover:bg-blue-700 text-white" : "hover:bg-blue-50"}`} onClick={() => onQuestionSelect(sortedItem.originalIndex)}>
                    第{sortedItem.questionNumber}题
                  </Button>
                  {/* 状态指示器 */}
                  <div className="absolute -top-1 -right-1 flex gap-1">
                    {missingAnswer && <div className="w-2 h-2 rounded-full bg-orange-500" title="缺少答案" />}
                    {missingParse && <div className="w-2 h-2 rounded-full bg-red-500" title="缺少解析" />}
                  </div>
                </div>;
          })}
          </div>
        </div>
      </CardContent>
    </Card>;
}
