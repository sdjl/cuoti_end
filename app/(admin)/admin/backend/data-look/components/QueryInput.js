"use client";

// 数据查询输入组件，提供数据类型选择和ID输入功能，用于查询不同类型的数据记录
import { useState } from "react";
import { Button } from "../../../../../../components/ui/button.js";
import { Card, CardContent } from "../../../../../../components/ui/card.js";
import { Input } from "../../../../../../components/ui/input.js";
import { Label } from "../../../../../../components/ui/label.js";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../../../../components/ui/select.js";
import { DISPLAY_TEXT } from "../../../../../../lib/config/constants.js";
const DATA_TYPE_OPTIONS = [{
  value: "exam_paper",
  label: "试卷"
}, {
  value: "question",
  label: "题目"
}, {
  value: "question_pack",
  label: "题集"
}, {
  value: "school",
  label: "校园"
}, {
  value: "classroom",
  label: "班级"
}, {
  value: "student",
  label: "学生"
}, {
  value: "course",
  label: "课程"
}, {
  value: "mistake_point",
  label: DISPLAY_TEXT.ERROR_ATTRIBUTION
}, {
  value: "user",
  label: "用户"
}, {
  value: "wx_user",
  label: "微信用户"
}];
export default function QueryInput({
  onQuery,
  loading
}) {
  const [dataType, setDataType] = useState("");
  const [id, setId] = useState("");
  const handleSubmit = e => {
    e.preventDefault();
    if (dataType && id.trim()) {
      onQuery(dataType, id.trim());
    }
  };
  return <Card className="w-full">
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="flex items-end gap-4">
          <div className="flex-1">
            <Label htmlFor="dataType" className="text-sm font-medium">
              数据类型
            </Label>
            <Select value={dataType} onValueChange={value => setDataType(value)}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="选择数据类型" />
              </SelectTrigger>
              <SelectContent>
                {DATA_TYPE_OPTIONS.map(option => <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1">
            <Label htmlFor="id" className="text-sm font-medium">
              ID
            </Label>
            <Input id="id" type="text" placeholder="输入要查询的ID" value={id} onChange={e => setId(e.target.value)} className="mt-1" />
          </div>

          <Button type="submit" disabled={!dataType || !id.trim() || loading} className="px-8">
            {loading ? "查询中..." : "查询"}
          </Button>
        </form>
      </CardContent>
    </Card>;
}
