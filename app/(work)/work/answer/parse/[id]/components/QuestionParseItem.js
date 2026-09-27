"use client";

import { AlertTriangle, Brain, FileText, Loader2, Save } from "lucide-react";
import { useMemo } from "react";
import BaseImage from "../../../../../../../components/common/BaseImage.js";
import { Badge } from "../../../../../../../components/ui/badge.js";
import { Button } from "../../../../../../../components/ui/button.js";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../../../../components/ui/card.js";
import { Label } from "../../../../../../../components/ui/label.js";
import { Textarea } from "../../../../../../../components/ui/textarea.js";
import { DISPLAY_TEXT } from "../../../../../../../lib/config/constants.js";
/**
 * 题目解析编辑组件
 * 用于显示和编辑单个错题的答案、解析和错误归因
 */
import MistakePointSelectorWithAdd from "./MistakePointSelectorWithAdd.js";
export default function QuestionParseItem({
  answerItem,
  questionNumber,
  isAnalyzing = false,
  isSaving = false,
  allMistakePoints,
  subject,
  aiRecommendedMistakePointIds = [],
  onAnswerUpdate,
  onParseUpdate,
  onMistakePointsUpdate,
  onMistakePointAdded,
  onCreateMistakePoint,
  onAIAnalyze,
  onSave
}) {
  const {
    question
  } = answerItem;

  // 错误归因相关状态
  const selectedMistakePointIds = useMemo(() => {
    // 注意：现在mistakePointIds通过父组件管理，不再从answerItem中获取
    return answerItem.mistakePointIds || [];
  }, [answerItem.mistakePointIds]);

  // 已选择的错误归因
  const selectedMistakePoints = useMemo(() => {
    return allMistakePoints.filter(point => selectedMistakePointIds.includes(point._id));
  }, [allMistakePoints, selectedMistakePointIds]);

  // 获取题目类型颜色
  const getQuestionTypeColor = type => {
    const typeColors = {
      选择题: "bg-blue-100 text-blue-800",
      填空题: "bg-green-100 text-green-800",
      解答题: "bg-purple-100 text-purple-800",
      算术题: "bg-orange-100 text-orange-800"
    };
    return typeColors[type] || "bg-gray-100 text-gray-800";
  };

  // 获取难度颜色
  const getDifficultyColor = difficulty => {
    const difficultyColors = {
      容易: "bg-green-100 text-green-800",
      中等: "bg-yellow-100 text-yellow-800",
      困难: "bg-orange-100 text-orange-800",
      超难: "bg-red-100 text-red-800",
      未知: "bg-gray-100 text-gray-800"
    };
    return difficultyColors[difficulty] || "bg-gray-100 text-gray-800";
  };

  // 处理学生答案变更
  const handleAnswerChange = value => {
    // 首先应用文本替换
    const processedValue = value.replace(/\\n/g, "\n").replace(/[；;]/g, "\n");
    const newAnswer = processedValue.split("\n");
    onAnswerUpdate(newAnswer);
  };

  // 处理解析变更
  const handleParseChange = value => {
    // 首先应用文本替换
    const processedValue = value.replace(/\\n/g, "\n").replace(/[；;]/g, "\n");
    const newParse = processedValue.split("\n");
    onParseUpdate(newParse);
  };

  // 预处理数组内容，确保显示和保存一致
  const processTextArray = textArray => {
    return textArray.map(line => line.replace(/\\n/g, "\n").replace(/[；;]/g, "\n")).flatMap(line => line.split("\n"));
  };

  // 获取处理后的答案文本
  const getAnswerText = () => {
    const processedAnswer = processTextArray(answerItem.answerValue);
    return processedAnswer.join("\n");
  };

  // 获取处理后的解析文本
  const getParseText = () => {
    const processedParse = processTextArray(answerItem.parse || []);
    return processedParse.join("\n");
  };
  return <Card className="border-l-4 border-l-orange-500">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-orange-600" />
              <span className="text-lg font-semibold">
                第 {questionNumber} 题
              </span>
            </div>
            <div className="flex items-center gap-2">
              {question.questionType && <Badge className={getQuestionTypeColor(question.questionType)}>
                  {question.questionType}
                </Badge>}
              <Badge className={getDifficultyColor(question.difficulty)}>
                {question.difficulty}
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="default" size="sm" onClick={onAIAnalyze} disabled={isAnalyzing || !answerItem.imageUrl} className="bg-blue-600 hover:bg-blue-700">
              {isAnalyzing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Brain className="w-4 h-4 mr-2" />}
              {isAnalyzing ? "分析中" : "AI分析"}
            </Button>
            <Button variant="outline" size="sm" onClick={onSave} disabled={isSaving}>
              {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              {isSaving ? "保存中" : "保存"}
            </Button>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* 学生答案图片 */}
        {answerItem.imageUrl && <div className="space-y-3">
            <h4 className="font-medium text-gray-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-500" />
              学生答题图片
            </h4>
            <div className="bg-orange-50 p-4 rounded-lg">
              <BaseImage src={answerItem.imageUrl} alt={`学生答案-第${questionNumber}题`} width={600} height={300} className="max-w-full h-auto rounded border" />
            </div>
          </div>}

        {/* 学生答案文字（可编辑） */}
        <div className="space-y-3">
          <Label htmlFor={`answer-${answerItem._id}`} className="font-medium text-gray-900 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-orange-500" />
            学生答案
          </Label>
          <Textarea id={`answer-${answerItem._id}`} value={getAnswerText()} onChange={e => handleAnswerChange(e.target.value)} placeholder="输入学生的答案内容，每行一个答案" className="min-h-[80px]" rows={3} />
          <p className="text-xs text-gray-500">
            提示：每行输入一个答案，支持多行输入
          </p>
        </div>

        {/* 答案解析（可编辑） */}
        <div className="space-y-3">
          <Label htmlFor={`parse-${answerItem._id}`} className="font-medium text-gray-900 flex items-center gap-2">
            <Brain className="w-4 h-4 text-blue-600" />
            答案解析
          </Label>
          <Textarea id={`parse-${answerItem._id}`} value={getParseText()} onChange={e => handleParseChange(e.target.value)} placeholder="输入对学生答案的分析和解析，包括错误原因、正确解法等" className="min-h-[120px]" rows={6} />
          <p className="text-xs text-gray-500">
            提示：可以分析学生的错误原因、提供正确解法、给出学习建议等
          </p>
        </div>

        {/* 错误归因编辑器 - 使用新的组件 */}
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            {DISPLAY_TEXT.ERROR_ATTRIBUTION}编辑
          </h4>

          <MistakePointSelectorWithAdd mistakePoints={allMistakePoints} selectedMistakePointIds={selectedMistakePointIds} subject={subject} aiRecommendedMistakePointIds={aiRecommendedMistakePointIds} onMistakePointsChange={onMistakePointsUpdate} onMistakePointAdded={onMistakePointAdded} onCreateMistakePoint={onCreateMistakePoint} />

          {/* 已选择的错误归因说明 */}
          {selectedMistakePoints.length > 0 && <div className="mt-3 p-3 bg-red-50 rounded-lg border border-red-200">
              <h5 className="text-sm font-medium text-red-800 mb-2">
                {DISPLAY_TEXT.ERROR_ATTRIBUTION}说明：
              </h5>
              <div className="space-y-1">
                {selectedMistakePoints.map(point => <div key={point._id} className="text-sm text-red-700">
                    <span className="font-medium">{point.name}：</span>
                    {point.description}
                  </div>)}
              </div>
            </div>}
        </div>
      </CardContent>
    </Card>;
}
