"use client";

import { Plus, Search, X } from "lucide-react";
// 题目分析编辑器组件，用于编辑单道题的答案、解析、难度、易错细节和知识点等信息
import { useCallback, useEffect, useState } from "react";
import { Badge } from "../../../../../../../components/ui/badge.js";
import { Button } from "../../../../../../../components/ui/button.js";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../../../../../components/ui/card.js";
import { Input } from "../../../../../../../components/ui/input.js";
import { Label } from "../../../../../../../components/ui/label.js";
import { Popover, PopoverContent, PopoverTrigger } from "../../../../../../../components/ui/popover.js";
import { ScrollArea } from "../../../../../../../components/ui/scroll-area.js";
import { Textarea } from "../../../../../../../components/ui/textarea.js";
export default function QuestionAnalysisEditor({
  question,
  index,
  allKnowledgePoints,
  onUpdateAnswer,
  onUpdateParse,
  onUpdateDifficulty,
  onUpdateEasyToMistakeDetail,
  onAddKnowledgePoint,
  onRemoveKnowledgePoint,
  forwardRef
}) {
  const [searchText, setSearchText] = useState("");
  const [searchResults, setSearchResults] = useState([]);

  // 搜索知识点
  useEffect(() => {
    if (!searchText.trim()) {
      setSearchResults([]);
      return;
    }
    const results = allKnowledgePoints.filter(point => point.includes(searchText) && !question.knowledgePoints.includes(point));
    setSearchResults(results.slice(0, 10));
  }, [searchText, allKnowledgePoints, question.knowledgePoints]);

  // 检查题目是否存在错误（缺少必要内容）
  const checkQuestionErrors = useCallback(() => {
    const errors = {
      missingAnswer: !question.answer || question.answer.length === 0 || question.answer.filter(item => item.trim()).length === 0,
      missingParse: !question.parse || question.parse.length === 0 || question.parse.filter(item => item.trim()).length === 0,
      missingKnowledgePoints: !question.knowledgePoints || question.knowledgePoints.length === 0,
      invalidKnowledgePoints: question.knowledgePoints?.some(point => !allKnowledgePoints.includes(point)) || false
    };
    return {
      ...errors,
      hasError: Object.values(errors).some(Boolean)
    };
  }, [question, allKnowledgePoints]);
  const errors = checkQuestionErrors();
  return <Card ref={forwardRef}>
      <CardHeader>
        <CardTitle className={`text-lg ${errors.hasError ? "text-red-600" : ""}`}>
          第 {question.questionNumber} 题 (页面 {question.pageNumber})
          {errors.hasError && <span className="ml-2 text-sm font-normal text-red-500">
              （存在缺失内容）
            </span>}
        </CardTitle>
        <CardDescription className="text-sm">
          {question.questionText.length > 100 ? `${question.questionText.substring(0, 100)}...` : question.questionText}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 答案编辑 */}
        <div className="space-y-2">
          <Label htmlFor={`answer-${index}`} className={errors.missingAnswer ? "text-red-600" : ""}>
            答案（每行一个）
            {errors.missingAnswer && <span className="text-red-500"> *缺失</span>}
          </Label>
          <Textarea id={`answer-${index}`} value={question.answer.join("\n")} onChange={e => onUpdateAnswer(e.target.value)} placeholder="请输入答案，每行一个" className={`min-h-20 ${errors.missingAnswer ? "border-red-300 focus:border-red-500 focus:ring-red-500" : ""}`} />
        </div>

        {/* 解析编辑 */}
        <div className="space-y-2">
          <Label htmlFor={`parse-${index}`} className={errors.missingParse ? "text-red-600" : ""}>
            解析
            {errors.missingParse && <span className="text-red-500"> *缺失</span>}
          </Label>
          <Textarea id={`parse-${index}`} value={question.parse.join("\n")} onChange={e => onUpdateParse(e.target.value)} placeholder="请输入解析" className={`min-h-24 ${errors.missingParse ? "border-red-300 focus:border-red-500 focus:ring-red-500" : ""}`} />
        </div>

        {/* 难度编辑 */}
        <div className="space-y-2">
          <Label htmlFor={`difficulty-${index}`}>难度</Label>
          <select id={`difficulty-${index}`} value={question.difficulty || "未知"} onChange={e => onUpdateDifficulty(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="未知">未知</option>
            <option value="容易">容易</option>
            <option value="中等">中等</option>
            <option value="困难">困难</option>
            <option value="超难">超难</option>
          </select>
        </div>

        {/* 易错细节编辑 */}
        <div className="space-y-2">
          <Label htmlFor={`easyToMistakeDetail-${index}`}>
            易错细节（每行一个）
          </Label>
          <Textarea id={`easyToMistakeDetail-${index}`} value={question.easyToMistakeDetail.join("\n")} onChange={e => onUpdateEasyToMistakeDetail(e.target.value)} placeholder="请输入易错细节，每行一个" className="min-h-20" />
        </div>

        {/* 知识点编辑 */}
        <div className="space-y-2">
          <Label className={errors.missingKnowledgePoints || errors.invalidKnowledgePoints ? "text-red-600" : ""}>
            知识点
            {errors.missingKnowledgePoints && <span className="text-red-500"> *缺失</span>}
            {errors.invalidKnowledgePoints && <span className="text-red-500"> *包含无效知识点</span>}
          </Label>
          <div className="flex flex-wrap gap-2 mb-2">
            {question.knowledgePoints.map((point, pointIndex) => {
            // 检查该知识点是否在知识树的备选列表中
            const isValidKnowledgePoint = allKnowledgePoints.includes(point);
            return <Badge key={pointIndex} variant="secondary" className={`pl-2 pr-1 py-1 ${!isValidKnowledgePoint ? "bg-pink-100 text-pink-800 hover:bg-pink-200 border-pink-300" : ""}`} title={!isValidKnowledgePoint ? "此知识点不在系统知识树中，需要人工核验" : ""}>
                  {point}
                  <Button type="button" variant="ghost" size="sm" className="h-4 w-4 p-0 ml-1 text-muted-foreground hover:text-foreground" onClick={() => onRemoveKnowledgePoint(point)}>
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>;
          })}
            {question.knowledgePoints.length === 0 && <p className="text-sm text-muted-foreground">暂无关联知识点</p>}
          </div>

          <Popover>
            <PopoverTrigger asChild>
              <Button type="button" variant="outline" size="sm" className="flex items-center gap-1">
                <Plus className="h-3.5 w-3.5" />
                添加知识点
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0" align="start">
              <div className="p-4 border-b">
                <div className="flex items-center gap-2">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <Input value={searchText} onChange={e => setSearchText(e.target.value)} placeholder="搜索知识点..." className="border-0 focus-visible:ring-0 h-8 px-2" />
                </div>
              </div>
              <ScrollArea className="h-72">
                {searchResults.length > 0 ? <div className="p-2">
                    {searchResults.map((point, pointIndex) => <Button key={pointIndex} type="button" variant="ghost" className="w-full justify-start h-auto py-2 px-4 rounded-sm text-sm" onClick={() => {
                  onAddKnowledgePoint(point);
                  setSearchText("");
                }}>
                        <span className="truncate">{point}</span>
                      </Button>)}
                  </div> : <div className="p-4 text-center text-sm text-muted-foreground">
                    {searchText ? "未找到匹配的知识点" : "请输入关键词搜索知识点"}
                  </div>}
              </ScrollArea>
            </PopoverContent>
          </Popover>
        </div>
      </CardContent>
    </Card>;
}
