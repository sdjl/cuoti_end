"use client";

// 批量填写科目和考试名称组件
import { useState } from "react";
import { Button } from "../../../../../../../components/ui/button.js";
import { Card } from "../../../../../../../components/ui/card.js";
import { Input } from "../../../../../../../components/ui/input.js";
import { Label } from "../../../../../../../components/ui/label.js";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../../../../../components/ui/select.js";
export default function BatchFillSection({
  subjects,
  onBatchFill
}) {
  const [batchSubject, setBatchSubject] = useState("");
  const [batchExamName, setBatchExamName] = useState("");
  const handleBatchFillSubject = () => {
    if (batchSubject && batchSubject !== "none") {
      onBatchFill("subject", batchSubject);
    }
  };
  const handleBatchFillExamName = () => {
    if (batchExamName.trim()) {
      onBatchFill("examName", batchExamName.trim());
    }
  };
  return <Card className="bg-blue-50 p-3 mb-4">
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium text-blue-900 whitespace-nowrap">
          批量填写
        </span>

        {/* 批量填写科目 */}
        <div className="flex items-center gap-2">
          <Label htmlFor="batchSubject" className="text-sm whitespace-nowrap">
            科目
          </Label>
          <Select value={batchSubject || "none"} onValueChange={value => setBatchSubject(value)}>
            <SelectTrigger id="batchSubject" className="w-[140px]">
              <SelectValue placeholder="选择科目" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">选择科目</SelectItem>
              {subjects.map(subject => <SelectItem key={subject.name} value={subject.name}>
                  {subject.name}
                </SelectItem>)}
            </SelectContent>
          </Select>
          <Button onClick={handleBatchFillSubject} disabled={!batchSubject || batchSubject === "none"} size="sm">
            填写
          </Button>
        </div>

        {/* 批量填写考试名称 */}
        <div className="flex items-center gap-2">
          <Label htmlFor="batchExamName" className="text-sm whitespace-nowrap">
            考试名称
          </Label>
          <Input id="batchExamName" placeholder="输入考试名称" value={batchExamName} onChange={e => setBatchExamName(e.target.value)} className="w-[180px]" />
          <Button onClick={handleBatchFillExamName} disabled={!batchExamName.trim()} size="sm">
            填写
          </Button>
        </div>
      </div>
    </Card>;
}
