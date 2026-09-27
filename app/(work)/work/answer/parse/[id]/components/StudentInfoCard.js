"use client";

import { BookOpen, Calendar, FileText, School, User } from "lucide-react";
import { Badge } from "../../../../../../../components/ui/badge.js";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../../../../components/ui/card.js";

/**
 * 学生信息卡片
 * 显示学生基本信息、所属班级、课程信息等
 */

export default function StudentInfoCard({
  student,
  classRoom,
  course,
  questionPack,
  studentAnswer
}) {
  // 格式化时间
  const formatDate = timestamp => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleString("zh-CN");
    } catch {
      return "未知时间";
    }
  };
  return <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="w-5 h-5 text-blue-600" />
          学生答卷信息
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* 学生信息 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">
                学生信息
              </span>
            </div>
            <div className="space-y-2">
              <div className="text-lg font-semibold text-gray-900">
                {student.name}
              </div>
              <div className="text-sm text-gray-600">
                学号：{student.studentCode}
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{student.gender}</Badge>
              </div>
            </div>
          </div>

          {/* 班级信息 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <School className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">
                班级信息
              </span>
            </div>
            <div className="space-y-2">
              <div className="text-lg font-semibold text-gray-900">
                {classRoom.name}
              </div>
              {classRoom.headTeacher && <div className="text-sm text-gray-600">
                  班主任：{classRoom.headTeacher}
                </div>}
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{classRoom.status}</Badge>
              </div>
            </div>
          </div>

          {/* 课程信息 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">
                课程信息
              </span>
            </div>
            <div className="space-y-2">
              <div className="text-lg font-semibold text-gray-900">
                {course.name}
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="default">{course.subject}</Badge>
                <Badge variant="outline">{course.status}</Badge>
              </div>
            </div>
          </div>

          {/* 题集信息 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">
                答卷信息
              </span>
            </div>
            <div className="space-y-2">
              <div className="text-lg font-semibold text-gray-900">
                {questionPack.name}
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="default">{questionPack.type}</Badge>
              </div>
              <div className="flex items-center gap-1 text-sm text-gray-600">
                <Calendar className="w-3 h-3" />
                <span>{formatDate(studentAnswer.created)}</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>;
}
