"use client";

import { Card, CardContent, CardHeader, CardTitle } from "../../../../../../../../components/ui/card.js";

/**
 * 学生搜索结果列表
 * 显示搜索到的学生，支持选择学生添加到班级
 */

export function SearchResultsList({
  searchResults,
  selectedStudent,
  onSelectStudent
}) {
  if (searchResults.length === 0) return null;
  return <Card>
      <CardHeader>
        <CardTitle className="text-blue-600">
          搜索结果 ({searchResults.length})
        </CardTitle>
        <p className="text-sm text-gray-600">
          找到 {searchResults.length} 位学生，请选择要添加的学生
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {searchResults.map(student => <Card key={student._id} className={`cursor-pointer transition-all ${selectedStudent?._id === student._id ? "border-blue-500 bg-blue-50" : student.isInClass ? "border-orange-200 bg-orange-50" : "hover:border-gray-400"}`} onClick={() => {
          if (!student.isInClass) {
            onSelectStudent(student);
          }
        }}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <span className="font-medium text-lg">
                        {student.name}
                      </span>
                      <span className="text-sm text-gray-600">
                        编号: {student.studentCode}
                      </span>
                      {student.isInClass && <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded">
                          已在班级中
                        </span>}
                    </div>
                    <div className="flex gap-4 text-sm text-gray-600">
                      <span>性别: {student.gender}</span>
                      {student.birthDate && <span>出生日期: {student.birthDate}</span>}
                      {student.publicSchoolName && <span>就读: {student.publicSchoolName}</span>}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>)}
        </div>
      </CardContent>
    </Card>;
}
