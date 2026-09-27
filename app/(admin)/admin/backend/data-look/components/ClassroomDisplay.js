"use client";

import { Badge } from "../../../../../../components/ui/badge.js";
// 班级信息展示组件，用于显示班级的详细信息，包括基本信息、班主任信息、统计信息等
import { Card, CardContent, CardHeader, CardTitle } from "../../../../../../components/ui/card.js";
import { Separator } from "../../../../../../components/ui/separator.js";
export default function ClassroomDisplay({
  data
}) {
  const {
    classroom,
    school,
    courses
  } = data;
  const formatDate = timestamp => {
    return new Date(timestamp).toLocaleString("zh-CN");
  };
  const getStatusColor = status => {
    switch (status) {
      case "正常":
        return "bg-green-100 text-green-800";
      case "毕业":
        return "bg-blue-100 text-blue-800";
      case "停用":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };
  return <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          班级信息
          <Badge variant="secondary">classroom</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 基本信息 */}
        <div>
          <h3 className="font-semibold text-lg mb-2">基本信息</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-muted-foreground">ID:</span>
              <p className="font-mono text-sm">{classroom._id}</p>
            </div>
            <div>
              <span className="text-muted-foreground">班级名称:</span>
              <p>{classroom.name}</p>
            </div>
            <div>
              <span className="text-muted-foreground">学校ID:</span>
              <p className="font-mono text-sm">{classroom.schoolId}</p>
            </div>
            <div>
              <span className="text-muted-foreground">班级状态:</span>
              <Badge className={getStatusColor(classroom.status)}>
                {classroom.status}
              </Badge>
            </div>
          </div>
        </div>

        <Separator />

        {/* 班主任信息 */}
        <div>
          <h3 className="font-semibold text-lg mb-2">班主任信息</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-muted-foreground">班主任姓名:</span>
              <p>{classroom.headTeacher || "未设置"}</p>
            </div>
            <div>
              <span className="text-muted-foreground">班主任电话:</span>
              <p>{classroom.headTeacherPhone || "未设置"}</p>
            </div>
          </div>
        </div>

        <Separator />

        {/* 统计信息 */}
        <div>
          <h3 className="font-semibold text-lg mb-2">统计信息</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-muted-foreground">学生数量:</span>
              <p className="text-lg font-semibold text-blue-600">
                {classroom.studentCount}
              </p>
            </div>
            <div>
              <span className="text-muted-foreground">任课老师数量:</span>
              <p className="text-lg font-semibold text-purple-600">
                {classroom.teacherOpenids.length}
              </p>
            </div>
          </div>
        </div>

        {/* 老师列表 */}
        {classroom.teacherOpenids.length > 0 && <>
            <Separator />
            <div>
              <h3 className="font-semibold text-lg mb-2">任课老师OpenID列表</h3>
              <div className="bg-gray-50 p-4 rounded-md max-h-40 overflow-y-auto">
                {classroom.teacherOpenids.map((openid, index) => <div key={index} className="font-mono text-sm py-1">
                    {index + 1}. {openid}
                  </div>)}
              </div>
            </div>
          </>}

        <Separator />

        {/* 时间信息 */}
        <div>
          <h3 className="font-semibold text-lg mb-2">时间信息</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">创建时间:</span>
              <p>{formatDate(classroom.created)}</p>
            </div>
            <div>
              <span className="text-muted-foreground">更新时间:</span>
              <p>{formatDate(classroom.updated)}</p>
            </div>
          </div>
        </div>

        {/* 校园信息 */}
        {school && <>
            <Separator />
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
          </>}

        {/* 课程信息 */}
        {courses.length > 0 && <>
            <Separator />
            <div>
              <h3 className="font-semibold text-lg mb-2">班级课程</h3>
              <div className="space-y-2">
                {courses.map(course => <div key={course._id} className="bg-green-50 p-3 rounded-md">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-muted-foreground">课程名称:</span>
                        <p className="font-semibold">{course.name}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">科目:</span>
                        <p>{course.subject}</p>
                      </div>
                    </div>
                    <div className="mt-2">
                      <span className="text-muted-foreground">课程ID:</span>
                      <p className="font-mono text-sm">{course._id}</p>
                    </div>
                  </div>)}
              </div>
            </div>
          </>}

        {/* 描述信息 */}
        {classroom.description && <>
            <Separator />
            <div>
              <span className="text-muted-foreground">班级描述:</span>
              <p className="text-sm mt-1 bg-gray-50 p-3 rounded-md">
                {classroom.description}
              </p>
            </div>
          </>}
      </CardContent>
    </Card>;
}
