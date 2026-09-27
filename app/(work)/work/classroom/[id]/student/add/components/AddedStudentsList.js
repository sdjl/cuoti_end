"use client";

import { CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../../../../../components/ui/card.js";

/**
 * 已添加学生列表
 * 显示当前会话中已成功添加到班级的学生
 */

export function AddedStudentsList({
  addedStudents
}) {
  if (addedStudents.length === 0) return null;
  return <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-green-600">
          <CheckCircle className="h-5 w-5" />
          已添加的学生 ({addedStudents.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {addedStudents.map((student, index) => <Card key={index} className="border-green-200 bg-green-50">
              <CardContent className="p-4">
                <div className="space-y-2">
                  <p className="font-medium text-sm">{student.name}</p>
                  <p className="text-xs text-gray-600">
                    编号: {student.studentCode}
                  </p>
                  <p className="text-xs text-gray-600">
                    性别: {student.gender}
                  </p>
                </div>
              </CardContent>
            </Card>)}
        </div>
      </CardContent>
    </Card>;
}
