"use client";

import { User } from "lucide-react";
import { Badge } from "../../../../../../../components/ui/badge.js";
// 展示学生基本信息和关联课程答卷概况的卡片组件
import { Card, CardContent, CardHeader, CardTitle } from "../../../../../../../components/ui/card.js";
export default function StudentInfoCard({
  student,
  classRoom,
  course,
  studentAnswer
}) {
  const formatDate = timestamp => {
    return new Date(timestamp).toLocaleString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    });
  };
  return <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="w-5 h-5" />
          学生答卷信息
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-600">
                学生姓名：
              </span>
              <span className="text-sm">{student.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-600">
                学生编号：
              </span>
              <span className="text-sm">{student.studentCode}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-600">年级：</span>
              <span className="text-sm">{classRoom.grade}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-600">班级：</span>
              <span className="text-sm">{classRoom.name}</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-600">课程：</span>
              <span className="text-sm">{course.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-600">科目：</span>
              <Badge variant="secondary">{course.subject}</Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-600">
                提交时间：
              </span>
              <span className="text-sm">
                {formatDate(studentAnswer.created)}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>;
}
