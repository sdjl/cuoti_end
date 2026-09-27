"use client";

import { Loader2 } from "lucide-react";
// 题目基本信息组件，用于编辑题目的类型和文本内容
import { Label } from "../../../../../../../../../../components/ui/label.js";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../../../../../../../../components/ui/select.js";
import { Textarea } from "../../../../../../../../../../components/ui/textarea.js";
export function QuestionBasicInfo({
  questionType,
  questionText,
  questionTypes,
  questionTypesLoading,
  onQuestionTypeChange,
  onQuestionTextChange
}) {
  return <>
      <div className="space-y-2">
        <Label htmlFor="questionType">题目类型</Label>
        <Select value={questionType} onValueChange={onQuestionTypeChange} disabled={questionTypesLoading}>
          <SelectTrigger id="questionType" className="w-full">
            <SelectValue placeholder="选择题目类型" />
          </SelectTrigger>
          <SelectContent>
            {questionTypesLoading ? <div className="flex items-center justify-center p-2">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div> : questionTypes.map(type => <SelectItem key={type.name} value={type.name}>
                  {type.name}
                </SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="questionText">题目文本</Label>
        <Textarea id="questionText" value={questionText} onChange={e => onQuestionTextChange(e.target.value)} placeholder="请输入题目文本" className="min-h-64" />
      </div>
    </>;
}
