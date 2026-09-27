"use client";

/**
 * 题目选择器组件
 *
 * 显示题目序号供老师勾选学生的错题：
 * - 以网格形式展示题目序号（1、2、3...）
 * - 支持单个题目选择/取消选择
 * - 提供全选和清空快捷操作
 * - 显示已选择错题的汇总信息
 * - 支持hover显示题目图片预览
 * - 提供图片预览开关控制
 */
import { useEffect, useState } from "react";
import BaseImage from "../../../../../../../../../../components/common/BaseImage.js";
import { Button } from "../../../../../../../../../../components/ui/button.js";
import { Label } from "../../../../../../../../../../components/ui/label.js";
import { Switch } from "../../../../../../../../../../components/ui/switch.js";
import { cn } from "../../../../../../../../../../lib/shadcn/utils.js";
export default function QuestionSelector({
  questionCount,
  selectedQuestions,
  onQuestionsChange,
  questionData = []
}) {
  const [localSelected, setLocalSelected] = useState(selectedQuestions);
  const [showPreview, setShowPreview] = useState(() => {
    // 从localStorage读取设置，默认为true
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("questionPreviewEnabled");
      return saved !== null ? JSON.parse(saved) : true;
    }
    return true;
  });
  const [hoveredQuestion, setHoveredQuestion] = useState(null);
  const [previewPosition, setPreviewPosition] = useState({
    top: 200
  });
  useEffect(() => {
    setLocalSelected(selectedQuestions);
  }, [selectedQuestions]);

  // 保存预览设置到localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("questionPreviewEnabled", JSON.stringify(showPreview));
    }
  }, [showPreview]);
  const handleQuestionToggle = questionNumber => {
    const newSelected = localSelected.includes(questionNumber) ? localSelected.filter(q => q !== questionNumber) : [...localSelected, questionNumber].sort((a, b) => a - b);
    setLocalSelected(newSelected);
    onQuestionsChange(newSelected);
  };
  const handleSelectAll = () => {
    const allQuestions = Array.from({
      length: questionCount
    }, (_, i) => i + 1);
    setLocalSelected(allQuestions);
    onQuestionsChange(allQuestions);
  };
  const handleClearAll = () => {
    setLocalSelected([]);
    onQuestionsChange([]);
  };
  const updatePreviewPosition = () => {
    const container = document.querySelector("[data-question-selector]");
    if (container) {
      const rect = container.getBoundingClientRect();
      setPreviewPosition({
        top: rect.bottom + window.scrollY + 10
      });
    }
  };
  const handleMouseEnter = questionNumber => {
    if (!showPreview) return;
    updatePreviewPosition(); // 更新位置
    setHoveredQuestion(questionNumber);
  };
  const handleMouseLeave = () => {
    setHoveredQuestion(null);
  };
  const getQuestionImage = questionNumber => {
    const questionIndex = questionNumber - 1;
    const question = questionData[questionIndex];
    // 如果题目不存在或为null，返回undefined
    if (!question) return undefined;
    return question.imageUrl || question.imageFileID;
  };
  const getQuestionDimensions = questionNumber => {
    const questionIndex = questionNumber - 1;
    const question = questionData[questionIndex];
    // 如果题目不存在或为null，返回默认尺寸
    if (!question) return {
      width: 400,
      height: 300
    };
    return {
      width: question.imageWidth || 400,
      height: question.imageHeight || 300
    };
  };
  return <div className="space-y-4" data-question-selector>
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-gray-900">选择错题（题目序号）</h4>
        <div className="flex items-center space-x-4">
          {/* 图片预览开关 */}
          <div className="flex items-center space-x-2">
            <Switch id="preview-switch" checked={showPreview} onCheckedChange={setShowPreview} />
            <Label htmlFor="preview-switch" className="text-sm text-gray-600">
              题目预览
            </Label>
          </div>

          {/* 操作按钮 */}
          <div className="space-x-2">
            <Button variant="outline" size="sm" onClick={handleSelectAll}>
              全选
            </Button>
            <Button variant="outline" size="sm" onClick={handleClearAll}>
              清空
            </Button>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 relative">
        {Array.from({
        length: questionCount
      }, (_, index) => {
        const questionNumber = index + 1;
        const isSelected = localSelected.includes(questionNumber);
        return <div key={questionNumber} className={cn("flex items-center justify-center w-10 h-10 border rounded cursor-pointer transition-all hover:shadow-sm relative", isSelected ? "border-red-500 bg-red-50 text-red-700" : "border-gray-200 hover:border-gray-300", showPreview && "hover:border-blue-300")} onClick={() => handleQuestionToggle(questionNumber)} onMouseEnter={() => handleMouseEnter(questionNumber)} onMouseLeave={handleMouseLeave}>
              <span className="text-sm font-medium">{questionNumber}</span>
            </div>;
      })}

        {/* 图片预览弹窗 */}
        {showPreview && hoveredQuestion && getQuestionImage(hoveredQuestion) && <div className="fixed z-[9999] bg-white border border-gray-200 rounded-lg shadow-xl p-4 left-1/2 transform -translate-x-1/2" style={{
        top: `${previewPosition.top}px`,
        maxWidth: "80vw",
        maxHeight: "70vh"
      }}>
              <div className="text-sm text-gray-700 mb-3 text-center font-medium">
                第{hoveredQuestion}题预览
              </div>
              <div className="flex justify-center">
                <BaseImage src={getQuestionImage(hoveredQuestion)} alt={`第${hoveredQuestion}题`} width={Math.min(getQuestionDimensions(hoveredQuestion).width, 800)} height={Math.min(getQuestionDimensions(hoveredQuestion).height, 600)} className="rounded border max-w-full max-h-full" style={{
            maxWidth: "75vw",
            maxHeight: "60vh",
            objectFit: "contain"
          }} />
              </div>
            </div>}
      </div>
    </div>;
}
