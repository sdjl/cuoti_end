"use client";

// 学生信息卡片组件，用于错题导出页面显示学生的基本信息
import { FileText, GraduationCap, User } from "lucide-react";
import { Card, CardContent } from "../../../../../../../../../components/ui/card.js";
export function StudentInfoCard({
  studentInfo
}) {
  return <Card className="mb-6 bg-white shadow-sm border border-gray-200">
      <CardContent className="p-6 space-y-4">
        {/* 第一行：学生姓名、性别、学生编号 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center space-x-3">
            <User className="h-5 w-5 text-blue-600" />
            <div>
              <span className="text-sm text-gray-500">学生姓名</span>
              <p className="font-medium text-gray-900">
                {studentInfo.studentName}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="h-5 w-5 flex items-center justify-center">
              <span className="text-blue-600 font-medium text-sm">性</span>
            </div>
            <div>
              <span className="text-sm text-gray-500">性别</span>
              <p className="font-medium text-gray-900">
                {studentInfo.studentGender}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="h-5 w-5 flex items-center justify-center">
              <span className="text-blue-600 font-medium text-sm">#</span>
            </div>
            <div>
              <span className="text-sm text-gray-500">学生编号</span>
              <p className="font-medium text-gray-900">
                {studentInfo.studentCode}
              </p>
            </div>
          </div>
        </div>

        {/* 第二行：学校名称、班级名称、错题总数 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center space-x-3">
            <GraduationCap className="h-5 w-5 text-green-600" />
            <div>
              <span className="text-sm text-gray-500">学校名称</span>
              <p className="font-medium text-gray-900">
                {studentInfo.schoolName}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="h-5 w-5 flex items-center justify-center">
              <span className="text-green-600 font-medium text-sm">班</span>
            </div>
            <div>
              <span className="text-sm text-gray-500">班级名称</span>
              <p className="font-medium text-gray-900">
                {studentInfo.className}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <FileText className="h-5 w-5 text-orange-600" />
            <div>
              <span className="text-sm text-gray-500">错题总数</span>
              <p className="font-medium text-gray-900">
                {studentInfo.questionCount} 题
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>;
}
