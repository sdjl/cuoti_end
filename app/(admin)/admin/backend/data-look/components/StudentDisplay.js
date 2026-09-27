"use client";

import { Badge } from "../../../../../../components/ui/badge.js";
// 学生信息展示组件，用于显示学生的基本信息、个人信息、所属校园、所在班级和时间信息等
import { Card, CardContent, CardHeader, CardTitle } from "../../../../../../components/ui/card.js";
import { Separator } from "../../../../../../components/ui/separator.js";
export default function StudentDisplay({
  data
}) {
  const {
    student,
    school,
    classrooms
  } = data;
  const formatDate = timestamp => {
    return new Date(timestamp).toLocaleString("zh-CN");
  };
  const getGenderColor = gender => {
    switch (gender) {
      case "男":
        return "bg-blue-100 text-blue-800";
      case "女":
        return "bg-pink-100 text-pink-800";
      case "未知":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };
  return <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          学生信息
          <Badge variant="secondary">student</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 基本信息 */}
        <div>
          <h3 className="font-semibold text-lg mb-2">基本信息</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-muted-foreground">ID:</span>
              <p className="font-mono text-sm">{student._id}</p>
            </div>
            <div>
              <span className="text-muted-foreground">学生姓名:</span>
              <p className="font-semibold text-lg">{student.name}</p>
            </div>
            <div>
              <span className="text-muted-foreground">学校ID:</span>
              <p className="font-mono text-sm">{student.schoolId}</p>
            </div>
            <div>
              <span className="text-muted-foreground">学生编号:</span>
              <p className="font-mono">{student.studentCode}</p>
            </div>
          </div>
        </div>

        <Separator />

        {/* 个人信息 */}
        <div>
          <h3 className="font-semibold text-lg mb-2">个人信息</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-muted-foreground">性别:</span>
              <Badge className={getGenderColor(student.gender)}>
                {student.gender}
              </Badge>
            </div>
            <div>
              <span className="text-muted-foreground">出生日期:</span>
              <p>{student.birthDate}</p>
            </div>
            <div>
              <span className="text-muted-foreground">民族:</span>
              <p>{student.ethnicity}</p>
            </div>
            <div>
              <span className="text-muted-foreground">家庭地址:</span>
              <p className="text-sm">{student.homeAddress}</p>
            </div>
          </div>
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

        {/* 班级信息 */}
        {classrooms.length > 0 && <>
            <div>
              <h3 className="font-semibold text-lg mb-2">所在班级</h3>
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

        {/* 时间信息 */}
        <div>
          <h3 className="font-semibold text-lg mb-2">时间信息</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">创建时间:</span>
              <p>{formatDate(student.created)}</p>
            </div>
            <div>
              <span className="text-muted-foreground">更新时间:</span>
              <p>{formatDate(student.updated)}</p>
            </div>
          </div>
        </div>

        {/* 备注信息 */}
        {student.notes && <>
            <Separator />
            <div>
              <span className="text-muted-foreground">备注信息:</span>
              <p className="text-sm mt-1 bg-gray-50 p-3 rounded-md">
                {student.notes}
              </p>
            </div>
          </>}
      </CardContent>
    </Card>;
}
