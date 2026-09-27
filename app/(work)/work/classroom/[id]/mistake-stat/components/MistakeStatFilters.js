"use client";

// 班级错题统计筛选条，支持按学生与统计类型过滤
import { RotateCcw } from "lucide-react";
import { Button } from "../../../../../../../components/ui/button.js";
import { Input } from "../../../../../../../components/ui/input.js";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../../../../../components/ui/select.js";
import { DISPLAY_TEXT } from "../../../../../../../lib/config/constants.js";
export default function MistakeStatFilters({
  searchTerm,
  setSearchTerm,
  selectedType,
  setSelectedType,
  onReset
}) {
  return <div className="bg-white p-4 rounded-lg shadow-sm space-y-4">
      <div className="flex flex-col lg:flex-row gap-4">
        {/* 搜索框 - 实时过滤 */}
        <div className="flex-1">
          <Input placeholder="搜索学生姓名..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="flex-1" />
        </div>

        {/* 筛选器 */}
        <div className="flex flex-col sm:flex-row gap-3 lg:flex-shrink-0">
          {/* 统计类型筛选 */}
          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger className="w-full sm:w-[160px]">
              <SelectValue placeholder="统计类型" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="course">
                {DISPLAY_TEXT.COURSE_MISTAKE}统计
              </SelectItem>
              <SelectItem value="self">
                {DISPLAY_TEXT.SELF_UPLOAD_MISTAKE}统计
              </SelectItem>
            </SelectContent>
          </Select>

          {/* 重置按钮 */}
          <Button variant="outline" onClick={onReset} className="px-3">
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>;
}
