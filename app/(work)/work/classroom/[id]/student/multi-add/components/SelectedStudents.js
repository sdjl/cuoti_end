"use client";

// 已选择学生展示组件，显示已选中的学生列表并提供批量添加和清空功能
import { UserPlus, X } from "lucide-react";
import { Badge } from "../../../../../../../../components/ui/badge.js";
import { Button } from "../../../../../../../../components/ui/button.js";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../../../../../components/ui/card.js";
export default function SelectedStudents({
  students,
  onRemove,
  onClearAll,
  onBatchAdd,
  isAdding
}) {
  // students 已经是已选学生的完整数据了，不需要再过滤
  if (students.length === 0) {
    return null;
  }
  return <Card className="border-blue-200 bg-blue-50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-blue-700">
            已选择 {students.length} 位学生
          </CardTitle>
          <div className="flex gap-2">
            <Button onClick={onBatchAdd} disabled={isAdding} size="sm">
              <UserPlus className="h-4 w-4 mr-2" />
              {isAdding ? "添加中..." : "添加到班级"}
            </Button>
            <Button onClick={onClearAll} variant="outline" size="sm" disabled={isAdding}>
              清空选择
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {students.map(student => <Badge key={student._id} variant="secondary" className="text-sm py-1 px-3 flex items-center gap-2">
              <span>
                {student.name} ({student.studentCode})
              </span>
              <button onClick={() => onRemove(student._id)} className="hover:text-red-600" disabled={isAdding}>
                <X className="h-3 w-3" />
              </button>
            </Badge>)}
        </div>
      </CardContent>
    </Card>;
}
