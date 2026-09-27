"use client";

/**
 * 学生加入的班级列表组件
 *
 * 依赖的 Server Action: app/(work)/work/dashboard/student/actions.ts (getStudentClassroomsAction)
 */
import { ExternalLink, Users } from "lucide-react";
import { Badge } from "../../../../../../components/ui/badge.js";
import { Button } from "../../../../../../components/ui/button.js";
export default function StudentClassroomsList({
  studentId,
  classrooms,
  subject
}) {
  const handleViewReport = (classroomId, subject) => {
    const url = `/mobile/student/${studentId}/classroom/${classroomId}/report?subject=${encodeURIComponent(subject)}`;
    window.open(url, "_blank");
  };
  if (classrooms.length === 0) {
    return <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-5 h-5 text-blue-600" />
          <h2 className="text-xl font-bold">加入的班级</h2>
        </div>
        <div className="text-center py-8 text-gray-500">
          该学生暂未加入任何班级
        </div>
      </div>;
  }
  return <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <Users className="w-5 h-5 text-blue-600" />
        <h2 className="text-xl font-bold">加入的班级</h2>
        <span className="text-sm text-gray-500 ml-2">
          共 {classrooms.length} 个班级
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {classrooms.map(classroom => <div key={classroom._id} className={`border rounded-lg p-4 hover:shadow-md transition-shadow ${classroom.status === "退学" ? "border-gray-300 bg-gray-50" : "border-gray-200"}`}>
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-lg text-gray-900">
                    {classroom.name}
                  </h3>
                  <Badge variant={classroom.status === "在读" ? "default" : "secondary"} className={classroom.status === "在读" ? "bg-green-100 text-green-700 hover:bg-green-100" : "bg-gray-200 text-gray-600 hover:bg-gray-200"}>
                    {classroom.status === "在读" ? "正常" : "退学"}
                  </Badge>
                </div>
                <p className="text-sm text-gray-500">{classroom.grade}</p>
              </div>
            </div>

            <Button onClick={() => handleViewReport(classroom._id, subject)} className="w-full" variant="outline" size="sm">
              <ExternalLink className="w-4 h-4 mr-2" />
              查看综合报告
            </Button>
          </div>)}
      </div>
    </div>;
}
