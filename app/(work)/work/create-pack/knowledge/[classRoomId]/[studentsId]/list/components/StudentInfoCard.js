"use client";

import { School, User, Users } from "lucide-react";
// 学生信息卡片组件，用于在题集列表页面显示学生的基本信息
import { useEffect, useState } from "react";
import { Badge } from "../../../../../../../../../components/ui/badge.js";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../../../../../../components/ui/card.js";
import { getStudentAndClassroomInfo } from "../actions.js";
export default function StudentInfoCard({
  studentId,
  classRoomId
}) {
  const [loading, setLoading] = useState(true);
  const [studentData, setStudentData] = useState(null);
  const [classroomData, setClassroomData] = useState(null);
  const [schoolName, setSchoolName] = useState("");
  const [error, setError] = useState(null);
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const result = await getStudentAndClassroomInfo(studentId, classRoomId);
        if (result.success && result.data) {
          setStudentData(result.data.student);
          setClassroomData(result.data.classroom);
          setSchoolName(result.data.schoolName);
        } else {
          setError(result.error || "获取信息失败");
        }
      } catch (error) {
        console.error("获取学生信息失败:", error);
        setError("获取学生信息失败");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [studentId, classRoomId]);
  if (loading) {
    return <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            学生信息
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <div className="text-gray-500">加载中...</div>
          </div>
        </CardContent>
      </Card>;
  }
  if (error || !studentData || !classroomData) {
    return <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            学生信息
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <div className="text-red-500">{error || "获取信息失败"}</div>
          </div>
        </CardContent>
      </Card>;
  }
  return <div className="bg-white p-3 rounded-lg shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-blue-600" />
            <span className="font-medium text-gray-900">
              {studentData.name}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-green-600" />
            <span className="text-gray-700">{classroomData.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <School className="w-4 h-4 text-purple-600" />
            <span className="text-gray-700">{schoolName}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {classroomData.grade}
          </Badge>
          {studentData.gender && <Badge variant="outline" className="text-xs">
              {studentData.gender}
            </Badge>}
        </div>
      </div>
    </div>;
}
