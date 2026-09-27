"use client";

import { User } from "lucide-react";
// 学生选择器组件，用于在选定班级中选择学生（支持搜索过滤）
import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../../../components/ui/card.js";
import { Input } from "../../../../../../components/ui/input.js";
export default function StudentSelector({
  selectedClassRoom,
  students,
  selectedStudent,
  onStudentSelect,
  studentFilter,
  studentFilterValue,
  onStudentFilterChange,
  isStudentFilterPending,
  loadingStudents
}) {
  // 过滤后的学生列表
  const filteredStudents = useMemo(() => {
    const keyword = studentFilter.toLowerCase().trim();
    if (!keyword) return students;
    return students.filter(student => student.name.toLowerCase().includes(keyword) || student.studentCode.toLowerCase().includes(keyword) || student.homeAddress?.toLowerCase().includes(keyword));
  }, [students, studentFilter]);
  return <Card className={`h-fit ${!selectedClassRoom ? "opacity-50" : ""}`}>
      <CardHeader className="p-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <User className="w-5 h-5" />
            选择学生
          </CardTitle>
          <div className="flex items-center gap-2 w-64">
            <Input placeholder="过滤学生..." value={studentFilterValue} onChange={e => onStudentFilterChange(e.target.value)} disabled={!selectedClassRoom} className="h-9 text-sm" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        {!selectedClassRoom ? <div className="text-center py-8 text-gray-500">
            <User className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>请先选择班级</p>
          </div> : loadingStudents ? <div className="text-center py-8 text-gray-500">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <p>加载学生中...</p>
          </div> : <div className="h-[500px] overflow-y-auto scrollbar-hide">
            <div className="p-1">
              {isStudentFilterPending && <div className="text-center py-2 text-sm text-gray-500">
                  过滤中...
                </div>}
              {filteredStudents.length === 0 ? <div className="text-center py-8 text-gray-500">
                  <User className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  {students.length === 0 ? <div>
                      <p className="text-gray-600 mb-2">该班级还没有学生</p>
                      <p className="text-sm text-gray-500">
                        请先为班级添加学生
                      </p>
                    </div> : <p>没有符合条件的学生</p>}
                </div> : <div className="grid grid-cols-3 gap-2">
                  {filteredStudents.map(student => <Card key={student._id} className={`cursor-pointer transition-all hover:shadow-md ${selectedStudent?._id === student._id ? "ring-2 ring-primary bg-primary/5" : "hover:bg-gray-50"}`} onClick={() => onStudentSelect(student)}>
                      <CardContent className="p-3">
                        <div className="text-center">
                          <h4 className="font-medium text-sm truncate">
                            {student.name}
                          </h4>
                          <p className="text-xs text-gray-600 mt-1 truncate">
                            {student.studentCode}
                          </p>
                        </div>
                      </CardContent>
                    </Card>)}
                </div>}
            </div>
          </div>}
      </CardContent>
    </Card>;
}
