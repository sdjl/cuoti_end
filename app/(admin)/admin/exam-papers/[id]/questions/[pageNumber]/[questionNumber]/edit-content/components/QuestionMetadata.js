"use client";

import { Input } from "../../../../../../../../../../components/ui/input.js";
// 题目元数据组件，用于编辑题目的难度、易错点详情和讲解视频ID
import { Label } from "../../../../../../../../../../components/ui/label.js";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../../../../../../../../components/ui/select.js";
import { Textarea } from "../../../../../../../../../../components/ui/textarea.js";
import { DISPLAY_TEXT } from "../../../../../../../../../../lib/config/constants.js";
export function QuestionMetadata({
  difficulty,
  easyToMistakeDetail,
  videoId,
  onDifficultyChange,
  onEasyToMistakeDetailChange,
  onVideoIdChange
}) {
  return <>
      <div className="space-y-2">
        <Label htmlFor="videoId">题目讲解视频ID</Label>
        <Input id="videoId" value={videoId} onChange={e => onVideoIdChange(e.target.value)} placeholder="请输入视频ID（可选）" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="difficulty">难度</Label>
        <Select value={difficulty} onValueChange={onDifficultyChange}>
          <SelectTrigger id="difficulty" className="w-full">
            <SelectValue placeholder="选择难度" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="未知">未知</SelectItem>
            <SelectItem value="容易">容易</SelectItem>
            <SelectItem value="中等">中等</SelectItem>
            <SelectItem value="困难">困难</SelectItem>
            <SelectItem value="超难">超难</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="easyToMistakeDetail">
          {DISPLAY_TEXT.ERROR_ATTRIBUTION}详情
        </Label>
        <Textarea id="easyToMistakeDetail" value={easyToMistakeDetail} onChange={e => onEasyToMistakeDetailChange(e.target.value)} placeholder={`请输入${DISPLAY_TEXT.ERROR_ATTRIBUTION}详情，每行一个`} className="min-h-32" />
      </div>
    </>;
}
