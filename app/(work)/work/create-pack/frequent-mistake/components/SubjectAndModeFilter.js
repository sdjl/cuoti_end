"use client";

// 高频错题集页面顶部科目与筛选模式选择栏
import { useEffect } from "react";
import { Button } from "../../../../../../components/ui/button.js";
import { Label } from "../../../../../../components/ui/label.js";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../../../../components/ui/select.js";
import { Switch } from "../../../../../../components/ui/switch.js";
import { useSubjects } from "../../../../../../hooks/useAdminConfig.js";
export default function SubjectAndModeFilter({
  selectedSubject,
  onSubjectChange,
  filterMode,
  onFilterModeChange,
  excludeExisting,
  onExcludeExistingChange
}) {
  const {
    subjects,
    loading
  } = useSubjects();

  // 当科目列表加载完成且还没有选中科目时，默认选中第一个
  useEffect(() => {
    if (!loading && subjects.length > 0 && !selectedSubject) {
      onSubjectChange(subjects[0].name);
    }
  }, [loading, subjects, selectedSubject, onSubjectChange]);
  if (loading) {
    return <div className="bg-white rounded-lg p-4 shadow-sm border">
        <div className="text-center text-gray-500">加载科目列表中...</div>
      </div>;
  }
  return <div className="bg-white rounded-lg p-4 shadow-sm border">
      <div className="flex items-center gap-6">
        {/* 左：科目选择 */}
        <div className="flex items-center gap-3">
          <Label className="text-sm font-medium whitespace-nowrap">
            科目选择
          </Label>
          <Select value={selectedSubject} onValueChange={onSubjectChange}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="请选择科目" />
            </SelectTrigger>
            <SelectContent>
              {subjects.map(subject => <SelectItem key={subject.name} value={subject.name}>
                  {subject.name}
                </SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* 中：模式选择 */}
        <div className="flex items-center gap-3">
          <Label className="text-sm font-medium whitespace-nowrap">
            筛选模式
          </Label>
          <div className="flex gap-2">
            <Button variant={filterMode === "knowledge" ? "default" : "outline"} size="sm" onClick={() => onFilterModeChange("knowledge")} className="min-w-[100px]">
              根据知识点
            </Button>
            <Button variant={filterMode === "mistake" ? "default" : "outline"} size="sm" onClick={() => onFilterModeChange("mistake")} className="min-w-[100px]">
              根据错误归因
            </Button>
          </div>
        </div>

        {/* 右：排除开关 */}
        <div className="flex items-center gap-3 ml-auto">
          <Switch id="exclude-existing" checked={excludeExisting} onCheckedChange={onExcludeExistingChange} />
          <Label htmlFor="exclude-existing" className="text-sm font-medium cursor-pointer whitespace-nowrap">
            排除已在题集中的题目
          </Label>
        </div>
      </div>
    </div>;
}
