"use client";

// 学生基本信息组件，展示学生的基本信息和绑定人数
import { User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../../../../../../components/ui/card.js";
import { Label } from "../../../../../../../../../components/ui/label.js";
export default function StudentBasicInfo({
  student,
  classRoom,
  bindCount,
  bindings = []
}) {
  return <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <User className="h-5 w-5 mr-2" />
          学生基本信息
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-sm font-medium">学生姓名</Label>
            <div className="text-lg font-semibold mt-1">{student.name}</div>
          </div>
          <div>
            <Label className="text-sm font-medium">学生编号</Label>
            <div className="text-lg font-semibold mt-1">
              {student.studentCode}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-sm font-medium">性别</Label>
            <div className="mt-1">{student.gender}</div>
          </div>
          <div>
            <Label className="text-sm font-medium">绑定人数</Label>
            <div className="mt-1">{bindCount} 人</div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-sm font-medium">年级</Label>
            <div className="mt-1">{classRoom.grade}</div>
          </div>
          <div>
            <Label className="text-sm font-medium">班级</Label>
            <div className="mt-1">{classRoom.name}</div>
          </div>
        </div>
        <div>
          <Label className="text-sm font-medium">家庭地址</Label>
          <div className="mt-1">{student.homeAddress || "未填写"}</div>
        </div>
        {bindings.length > 0 && <div>
            <Label className="text-sm font-medium">绑定人信息</Label>
            <div className="mt-2 space-y-2">
              {bindings.map((binding, index) => <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-md">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-700">
                      {binding.relationType || "未知关系"}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    {binding.bindPhone || "未填写电话"}
                  </div>
                </div>)}
            </div>
          </div>}
      </CardContent>
    </Card>;
}
