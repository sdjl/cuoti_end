"use client";

import { Card, CardContent, CardHeader, CardTitle } from "../../../../../../../../components/ui/card.js";
import { Label } from "../../../../../../../../components/ui/label.js";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../../../../../../components/ui/select.js";
import { Textarea } from "../../../../../../../../components/ui/textarea.js";

/**
 * 班级关系信息表单
 * 用于编辑学生在特定班级中的状态和备注信息
 */

export function ClassRelationForm({
  classRelationData,
  onClassRelationDataChange
}) {
  return <Card>
      <CardHeader>
        <CardTitle>班级关系信息</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="status">在班状态</Label>
            <Select value={classRelationData.status} onValueChange={value => onClassRelationDataChange("status", value)}>
              <SelectTrigger>
                <SelectValue placeholder="请选择状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="在读">在读</SelectItem>
                <SelectItem value="退学">退学</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="classNotes">班级备注</Label>
          <Textarea id="classNotes" value={classRelationData.notes} onChange={e => onClassRelationDataChange("notes", e.target.value)} placeholder="请输入班级备注信息" rows={3} />
        </div>
      </CardContent>
    </Card>;
}
