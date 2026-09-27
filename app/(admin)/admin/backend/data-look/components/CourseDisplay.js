"use client";

import { Badge } from "../../../../../../components/ui/badge.js";
// 课程信息展示组件，用于显示课程的基本信息、状态、题集、所属校园和使用班级等详细信息
import { Card, CardContent, CardHeader, CardTitle } from "../../../../../../components/ui/card.js";
import { Separator } from "../../../../../../components/ui/separator.js";
export default function CourseDisplay({
  data
}) {
  const {
    course,
    school,
    classrooms
  } = data;
  const formatDate = timestamp => {
    return new Date(timestamp).toLocaleString("zh-CN");
  };
  const getStatusColor = status => {
    switch (status) {
      case "使用中":
        return "bg-green-100 text-green-800";
      case "已停用":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };
  return <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          课程信息
          <Badge variant="secondary">course</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="font-semibold text-lg mb-2">基本信息</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-muted-foreground">ID:</span>
              <p className="font-mono text-sm">{course._id}</p>
            </div>
            <div>
              <span className="text-muted-foreground">课程名称:</span>
              <p className="font-semibold">{course.name}</p>
            </div>
            <div>
              <span className="text-muted-foreground">学校ID:</span>
              <p className="font-mono text-sm">{course.schoolId}</p>
            </div>
            <div>
              <span className="text-muted-foreground">科目:</span>
              <p>{course.subject}</p>
            </div>
          </div>
        </div>

        <Separator />

        <div>
          <h3 className="font-semibold text-lg mb-2">状态信息</h3>
          <Badge className={getStatusColor(course.status)}>
            {course.status}
          </Badge>
        </div>

        <Separator />

        <div>
          <h3 className="font-semibold text-lg mb-2">题集信息</h3>
          <div>
            <span className="text-muted-foreground">包含题集数量:</span>
            <p className="text-lg font-semibold text-blue-600">
              {course.questionPackIds.length}
            </p>
          </div>
          {course.questionPackIds.length > 0 && <div className="mt-2">
              <span className="text-muted-foreground">题集ID列表:</span>
              <div className="bg-gray-50 p-4 rounded-md max-h-40 overflow-y-auto mt-1">
                {course.questionPackIds.map((id, index) => <div key={index} className="font-mono text-sm py-1">
                    {index + 1}. {id}
                  </div>)}
              </div>
            </div>}
        </div>

        <Separator />

        {/* 校园信息 */}
        {school && <>
            <div>
              <h3 className="font-semibold text-lg mb-2">所属校园</h3>
              <div className="bg-blue-50 p-4 rounded-md">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-muted-foreground">校园名称:</span>
                    <p className="font-semibold">{school.name}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">区域:</span>
                    <p>{school.region}</p>
                  </div>
                </div>
              </div>
            </div>
            <Separator />
          </>}

        {/* 使用班级 */}
        {classrooms.length > 0 && <>
            <div>
              <h3 className="font-semibold text-lg mb-2">使用该课程的班级</h3>
              <div className="space-y-2">
                {classrooms.map(classroom => <div key={classroom._id} className="bg-green-50 p-3 rounded-md">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-muted-foreground">班级名称:</span>
                        <p className="font-semibold">{classroom.name}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">班级状态:</span>
                        <Badge variant="secondary">{classroom.status}</Badge>
                      </div>
                    </div>
                    <div className="mt-2">
                      <span className="text-muted-foreground">班级ID:</span>
                      <p className="font-mono text-sm">{classroom._id}</p>
                    </div>
                  </div>)}
              </div>
            </div>
            <Separator />
          </>}

        <div>
          <h3 className="font-semibold text-lg mb-2">时间信息</h3>
          <div>
            <span className="text-muted-foreground">创建时间:</span>
            <p>{formatDate(course.created)}</p>
          </div>
        </div>

        {course.description && <>
            <Separator />
            <div>
              <span className="text-muted-foreground">课程描述:</span>
              <p className="text-sm mt-1 bg-gray-50 p-3 rounded-md">
                {course.description}
              </p>
            </div>
          </>}
      </CardContent>
    </Card>;
}
