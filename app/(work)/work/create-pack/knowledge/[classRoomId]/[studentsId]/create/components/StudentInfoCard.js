"use client";

import { School, User, Users } from "lucide-react";
// 学生信息卡片组件，用于显示学生的基本信息（姓名、班级、年级等）
import { useEffect, useState } from "react";
import { Badge } from "../../../../../../../../../components/ui/badge.js";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../../../../../../components/ui/card.js";
import { getStudentInfo } from "../actions.js";
export default function StudentInfoCard({
  studentId,
  classRoomId
}) {
  const [studentInfo, setStudentInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  useEffect(() => {
    async function fetchStudentInfo() {
      try {
        setLoading(true);
        const result = await getStudentInfo(studentId, classRoomId);
        if (result.success && result.data) {
          setStudentInfo(result.data);
        } else {
          setError(result.error || "获取学生信息失败");
        }
      } catch (err) {
        setError("获取学生信息失败");
        console.error("获取学生信息失败:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchStudentInfo();
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
  if (error || !studentInfo) {
    return <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            学生信息
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <div className="text-red-500">{error || "未找到学生信息"}</div>
          </div>
        </CardContent>
      </Card>;
  }
  const {
    student,
    classroom
  } = studentInfo;
  return <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="w-5 h-5" />
          学生信息
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 第一列 */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <User className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-600 w-12">
                姓名：
              </span>
              <span className="font-medium">{student.name}</span>
            </div>

            <div className="flex items-center gap-3">
              <Users className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-600 w-12">
                班级：
              </span>
              <span className="font-medium">{classroom.name}</span>
            </div>

            <div className="flex items-center gap-3">
              <School className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-600 w-12">
                年级：
              </span>
              <Badge variant="outline">{classroom.grade}</Badge>
            </div>
          </div>

          {/* 第二列 */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-600 w-12">
                性别：
              </span>
              <Badge variant={student.gender === "男" ? "default" : "secondary"}>
                {student.gender}
              </Badge>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-600 w-12">
                学号：
              </span>
              <Badge variant="outline">{student.studentCode}</Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>;
}
