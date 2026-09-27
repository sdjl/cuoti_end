"use client";

// 高频错题列表，支持批量勾选题目并展示题面及统计信息
import { useState } from "react";
import BaseImage from "../../../../../../components/common/BaseImage.js";
import { Badge } from "../../../../../../components/ui/badge.js";
import { Checkbox } from "../../../../../../components/ui/checkbox.js";
export default function MistakeList({
  frequentMistakes,
  onSelectionChange
}) {
  const [selectedIds, setSelectedIds] = useState(new Set());
  const handleCheckboxChange = (questionId, checked) => {
    const newSelectedIds = new Set(selectedIds);
    if (checked) {
      newSelectedIds.add(questionId);
    } else {
      newSelectedIds.delete(questionId);
    }
    setSelectedIds(newSelectedIds);
    onSelectionChange?.(Array.from(newSelectedIds));
  };
  const handleSelectAll = checked => {
    if (checked) {
      const allIds = new Set(frequentMistakes.map(m => m.questionId));
      setSelectedIds(allIds);
      onSelectionChange?.(Array.from(allIds));
    } else {
      setSelectedIds(new Set());
      onSelectionChange?.([]);
    }
  };
  const toggleSelection = questionId => {
    const isSelected = selectedIds.has(questionId);
    handleCheckboxChange(questionId, !isSelected);
  };

  // 难度颜色配置
  const getDifficultyColor = difficulty => {
    const difficultyConfig = {
      容易: {
        color: "bg-green-100 text-green-800",
        text: "容易"
      },
      中等: {
        color: "bg-blue-100 text-blue-800",
        text: "中等"
      },
      困难: {
        color: "bg-orange-100 text-orange-800",
        text: "困难"
      },
      超难: {
        color: "bg-red-100 text-red-800",
        text: "超难"
      },
      未知: {
        color: "bg-gray-100 text-gray-800",
        text: "未知"
      }
    };
    const config = difficultyConfig[difficulty] || difficultyConfig.未知;
    return config.color;
  };

  // 题目类型颜色配置
  const getQuestionTypeColor = questionType => {
    if (!questionType) return "bg-gray-100 text-gray-800";
    const typeConfig = {
      选择题: "bg-blue-100 text-blue-800",
      填空题: "bg-green-100 text-green-800",
      解答题: "bg-purple-100 text-purple-800",
      判断题: "bg-yellow-100 text-yellow-800",
      计算题: "bg-orange-100 text-orange-800"
    };
    return typeConfig[questionType] || "bg-gray-100 text-gray-800";
  };
  if (frequentMistakes.length === 0) {
    return <div className="text-center py-12 text-gray-500">
        暂无高频错题数据，请调整筛选条件后重试
      </div>;
  }
  return <div className="space-y-4">
      {/* 全选和统计信息 */}
      <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
        <div className="flex items-center gap-3">
          <Checkbox id="select-all" checked={selectedIds.size === frequentMistakes.length} onCheckedChange={handleSelectAll} />
          <label htmlFor="select-all" className="text-sm font-medium cursor-pointer">
            全选
          </label>
          <span className="text-sm text-gray-600">
            已选择 {selectedIds.size} / {frequentMistakes.length} 题
          </span>
        </div>
      </div>

      {/* 题目列表 */}
      <div className="space-y-4">
        {frequentMistakes.map((mistake, index) => {
        const isSelected = selectedIds.has(mistake.questionId);
        return <div key={mistake.questionId} className={cn("bg-white rounded-lg p-4 transition-all cursor-pointer", isSelected ? "border-2 border-blue-500 shadow-md" : "border border-gray-200 hover:shadow-sm")} onClick={() => toggleSelection(mistake.questionId)}>
              <div className="flex gap-4">
                {/* 左侧：复选框和序号 */}
                <div className="flex flex-col items-center gap-2 pt-2">
                  <Checkbox id={`question-${mistake.questionId}`} checked={isSelected} onCheckedChange={checked => handleCheckboxChange(mistake.questionId, checked)} onClick={e => e.stopPropagation()} />
                  <span className="text-xs text-gray-500 font-medium">
                    #{index + 1}
                  </span>
                </div>

                {/* 中间：题目图片 */}
                {mistake.question.imageUrl && <div className="flex-1 max-w-[50%]" onClick={e => e.stopPropagation()}>
                    <a href={mistake.question.imageUrl} target="_blank" rel="noopener noreferrer" className="block">
                      <BaseImage src={mistake.question.imageUrl} alt={`题目 ${index + 1}`} width={mistake.question.imageWidth || 800} height={mistake.question.imageHeight || 600} className="w-full h-auto rounded-lg border border-gray-200" style={{
                  maxHeight: "400px",
                  objectFit: "contain"
                }} />
                    </a>
                  </div>}

                {/* 右侧：题目信息 */}
                <div className="flex-1 space-y-3">
                  {/* 错误次数、难度、题目类型 */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="destructive" className="text-xs px-2 py-0.5 text-white">
                      错误 {mistake.mistakeCount} 次
                    </Badge>
                    <Badge className={cn("text-xs px-2 py-0.5", getDifficultyColor(mistake.question.difficulty))}>
                      {mistake.question.difficulty}
                    </Badge>
                    {mistake.question.questionType && <Badge className={cn("text-xs px-2 py-0.5", getQuestionTypeColor(mistake.question.questionType))}>
                        {mistake.question.questionType}
                      </Badge>}
                  </div>

                  {/* 知识点 */}
                  {mistake.question.knowledgePoints && mistake.question.knowledgePoints.length > 0 && <div className="flex items-start gap-2">
                        <span className="text-sm font-medium text-gray-600 whitespace-nowrap">
                          知识点:
                        </span>
                        <div className="flex flex-wrap gap-1">
                          {mistake.question.knowledgePoints.map((kp, idx) => <Badge key={idx} className="text-xs bg-purple-50 text-purple-700 hover:bg-purple-50">
                              {kp}
                            </Badge>)}
                        </div>
                      </div>}

                  {/* 易错点 */}
                  {mistake.question.easyToMistakeDetail && mistake.question.easyToMistakeDetail.length > 0 && <div className="flex items-start gap-2">
                        <span className="text-sm font-medium text-gray-600 whitespace-nowrap">
                          易错点:
                        </span>
                        <div className="flex-1 space-y-1">
                          {mistake.question.easyToMistakeDetail.map((detail, idx) => <div key={idx} className="text-sm text-gray-700">
                                {detail}
                              </div>)}
                        </div>
                      </div>}
                </div>
              </div>
            </div>;
      })}
      </div>
    </div>;
}
function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}
