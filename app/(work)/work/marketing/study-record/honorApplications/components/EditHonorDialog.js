"use client";

// 编辑荣誉信息对话框组件，用于修改荣誉申请的科目、分数、评语等信息
import { useEffect, useState } from "react";
import { Button } from "../../../../../../../components/ui/button.js";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../../../../../../components/ui/dialog.js";
import { Input } from "../../../../../../../components/ui/input.js";
import { Label } from "../../../../../../../components/ui/label.js";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../../../../../components/ui/select.js";
import { Switch } from "../../../../../../../components/ui/switch.js";
import { useSubjects } from "../../../../../../../hooks/useAdminConfig.js";
export default function EditHonorDialog({
  open,
  onOpenChange,
  application,
  onSave,
  isSaving
}) {
  const {
    subjects
  } = useSubjects();
  const [showInSchoolHonorBoard, setShowInSchoolHonorBoard] = useState(false);
  const [subject, setSubject] = useState("");
  const [examScore, setExamScore] = useState("");
  const [examName, setExamName] = useState("");
  const [teacherRemark, setTeacherRemark] = useState("");
  useEffect(() => {
    if (open && application) {
      setShowInSchoolHonorBoard(application.showInSchoolHonorBoard || false);
      setSubject(application.subject || "");
      setExamScore(application.examScore !== undefined && application.examScore !== null ? String(application.examScore) : "");
      setExamName(application.examName || "");
      setTeacherRemark(application.teacherRemark || "");
    }
  }, [open, application]);
  const handleSave = async () => {
    await onSave({
      showInSchoolHonorBoard,
      subject,
      examScore: examScore ? parseFloat(examScore) : null,
      examName,
      teacherRemark
    });
  };
  return <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>编辑荣誉信息</DialogTitle>
          <DialogDescription>修改荣誉的相关信息</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="showInSchoolHonorBoard">展示在荣誉榜</Label>
            <Switch id="showInSchoolHonorBoard" checked={showInSchoolHonorBoard} onCheckedChange={setShowInSchoolHonorBoard} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">科目</Label>
            <Select value={subject || "none"} onValueChange={value => setSubject(value === "none" ? "" : value)}>
              <SelectTrigger>
                <SelectValue placeholder="选择科目" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">选择科目</SelectItem>
                {subjects.map(subj => <SelectItem key={subj.name} value={subj.name}>
                    {subj.name}
                  </SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="examScore">分数</Label>
            <Input id="examScore" type="number" value={examScore} onChange={e => setExamScore(e.target.value)} placeholder="请输入分数" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="examName">考试名称</Label>
            <Input id="examName" value={examName} onChange={e => setExamName(e.target.value)} placeholder="请输入考试名称" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="teacherRemark">
              老师评语
              <span className="text-xs text-gray-500 ml-2">
                （会在全校荣誉榜中展示）
              </span>
            </Label>
            <Input id="teacherRemark" value={teacherRemark} onChange={e => setTeacherRemark(e.target.value)} placeholder="请输入评语信息..." />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            取消
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "保存中..." : "保存"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>;
}
