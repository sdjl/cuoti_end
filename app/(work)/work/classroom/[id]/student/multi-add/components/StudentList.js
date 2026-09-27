"use client";

// 批量添加学生页面的学生列表组件，展示搜索结果并支持多选操作
import { useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../../../../../components/ui/card.js";
import { Checkbox } from "../../../../../../../../components/ui/checkbox.js";
export default function StudentList({
  students,
  selectedStudentIds,
  inClassStudentIds,
  onSelectionChange
}) {
  // 全选/取消全选当前列表的学生
  const handleSelectAll = useCallback(checked => {
    if (checked) {
      // 全选：将当前列表的学生添加到已选列表中
      const currentStudentIds = students.map(s => s._id);
      const newSelected = Array.from(new Set([...selectedStudentIds, ...currentStudentIds]));
      onSelectionChange(newSelected);
    } else {
      // 取消全选：只移除当前列表中的学生
      const currentStudentIds = students.map(s => s._id);
      const newSelected = selectedStudentIds.filter(id => !currentStudentIds.includes(id));
      onSelectionChange(newSelected);
    }
  }, [students, selectedStudentIds, onSelectionChange]);

  // 切换单个学生选择状态
  const handleToggleStudent = useCallback((studentId, checked) => {
    // 如果学生已在班级中，不允许取消选择
    if (inClassStudentIds.includes(studentId)) {
      return;
    }
    if (checked) {
      onSelectionChange([...selectedStudentIds, studentId]);
    } else {
      onSelectionChange(selectedStudentIds.filter(id => id !== studentId));
    }
  }, [selectedStudentIds, inClassStudentIds, onSelectionChange]);

  // 检查当前列表的学生是否全部被选中
  const currentStudentIds = students.map(s => s._id);
  const allSelected = students.length > 0 && currentStudentIds.every(id => selectedStudentIds.includes(id));
  const someSelected = currentStudentIds.some(id => selectedStudentIds.includes(id)) && !allSelected;
  return <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>学生列表 ({students.length}人)</CardTitle>
          <div className="flex items-center gap-2">
            <Checkbox id="select-all" checked={allSelected} onCheckedChange={handleSelectAll} className={someSelected ? "data-[state=checked]:bg-gray-400" : ""} />
            <label htmlFor="select-all" className="text-sm font-medium cursor-pointer">
              全选
            </label>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {students.length === 0 ? <div className="text-center py-12 text-gray-500">
            没有找到符合条件的学生
          </div> : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {students.map(student => {
          const isSelected = selectedStudentIds.includes(student._id);
          const isInClass = inClassStudentIds.includes(student._id);
          return <Card key={student._id} className={`transition-all ${isInClass ? "border-green-500 bg-green-50 cursor-not-allowed" : isSelected ? "border-blue-500 bg-blue-50 cursor-pointer" : "cursor-pointer hover:border-gray-400"}`} onClick={() => !isInClass && handleToggleStudent(student._id, !isSelected)}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <Checkbox checked={isSelected || isInClass} disabled={isInClass} onCheckedChange={checked => handleToggleStudent(student._id, checked)} onClick={e => e.stopPropagation()} />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-base truncate">
                          {student.name}
                        </div>
                        <div className="text-sm text-gray-600">
                          {student.studentCode}
                        </div>
                        {isInClass && <div className="text-xs text-green-700 mt-1">
                            已在班级中
                          </div>}
                      </div>
                    </div>
                  </CardContent>
                </Card>;
        })}
          </div>}
      </CardContent>
    </Card>;
}
