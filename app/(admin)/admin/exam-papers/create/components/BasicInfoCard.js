"use client";

// 基本信息卡片组件，用于创建试卷时填写试卷的基本信息
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../../../../components/ui/card.js";
import { Input } from "../../../../../../components/ui/input.js";
import { Label } from "../../../../../../components/ui/label.js";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../../../../components/ui/select.js";
import { Textarea } from "../../../../../../components/ui/textarea.js";
export function BasicInfoCard({
  title,
  subject,
  description,
  notes,
  subjects,
  isUploading,
  onTitleChange,
  onSubjectChange,
  onDescriptionChange,
  onNotesChange
}) {
  return <Card className="col-span-1">
      <CardHeader>
        <CardTitle>基本信息</CardTitle>
        <CardDescription>
          请填写试卷的基本信息，标题、科目为必填项
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">试卷标题 *</Label>
          <Input id="title" name="title" placeholder="请输入试卷标题" value={title} onChange={e => onTitleChange(e.target.value)} required disabled={isUploading} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="subject">科目 *</Label>
          <Select value={subject} onValueChange={onSubjectChange} disabled={isUploading}>
            <SelectTrigger id="subject">
              <SelectValue placeholder="选择科目" />
            </SelectTrigger>
            <SelectContent>
              {subjects.map(subject => <SelectItem key={subject.name} value={subject.name}>
                  {subject.name}
                </SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">描述</Label>
          <Textarea id="description" name="description" placeholder="请输入试卷描述（选填）" value={description} onChange={e => onDescriptionChange(e.target.value)} rows={3} disabled={isUploading} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">备注</Label>
          <Textarea id="notes" name="notes" placeholder="请输入备注信息（选填）" value={notes} onChange={e => onNotesChange(e.target.value)} rows={3} disabled={isUploading} />
        </div>
      </CardContent>
    </Card>;
}
