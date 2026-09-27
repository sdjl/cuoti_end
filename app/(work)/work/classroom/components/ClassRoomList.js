"use client";

// 班级列表主表格，展示各班基础信息与跳转操作入口
import { Award, BarChart3, BookOpen, FileText, GraduationCap, MoreHorizontal, UserPlus, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "../../../../../components/ui/button.js";
import { Card, CardContent } from "../../../../../components/ui/card.js";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../../../../../components/ui/dropdown-menu.js";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../../../components/ui/table.js";
import { DISPLAY_TEXT } from "../../../../../lib/config/constants.js";
export default function ClassRoomList({
  classRooms,
  isLoading,
  courseStats = {}
}) {
  const router = useRouter();

  // 获取状态标记
  const getStatusBadge = status => {
    const statusConfig = {
      正常: {
        color: "bg-green-100 text-green-800",
        text: "正常"
      },
      毕业: {
        color: "bg-blue-100 text-blue-800",
        text: "毕业"
      },
      停用: {
        color: "bg-red-100 text-red-800",
        text: "停用"
      }
    };
    const config = statusConfig[status] || statusConfig.正常;
    return <div className={`text-xs px-2 py-1 rounded-full inline-block ${config.color}`}>
        {config.text}
      </div>;
  };
  if (isLoading) {
    return <Card className="bg-white">
        <CardContent className="text-center py-8">
          <p className="text-gray-500">加载中...</p>
        </CardContent>
      </Card>;
  }
  if (classRooms.length === 0) {
    return <Card className="bg-white">
        <CardContent className="text-center py-8">
          <GraduationCap className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-500">暂无班级数据</p>
        </CardContent>
      </Card>;
  }
  return <Card className="bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>班级名称</TableHead>
            <TableHead>年级</TableHead>
            <TableHead>班主任</TableHead>
            <TableHead>班级描述</TableHead>
            <TableHead>班级状态</TableHead>
            <TableHead>老师数量</TableHead>
            <TableHead>学生数量</TableHead>
            <TableHead>课程数量</TableHead>
            <TableHead className="text-right">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {classRooms.map(classRoom => <TableRow key={classRoom._id}>
              <TableCell>
                <div className="font-medium">{classRoom.name}</div>
              </TableCell>
              <TableCell>
                <div className="text-sm text-gray-900">
                  {classRoom.grade || "未设置"}
                </div>
              </TableCell>
              <TableCell>
                <div>
                  <div className="text-sm text-gray-900">
                    {classRoom.headTeacher || "未设置"}
                  </div>
                  {classRoom.headTeacherPhone && <div className="text-xs text-gray-500">
                      {classRoom.headTeacherPhone}
                    </div>}
                </div>
              </TableCell>
              <TableCell>
                <div className="text-sm text-gray-600 max-w-32 truncate" title={classRoom.description || ""}>
                  {classRoom.description || "无描述"}
                </div>
              </TableCell>
              <TableCell>{getStatusBadge(classRoom.status)}</TableCell>
              <TableCell>
                <div className="flex items-center space-x-1">
                  <Users className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">
                    {classRoom.teacherOpenids.length}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center space-x-1">
                  <GraduationCap className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">{classRoom.studentCount}</span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center space-x-1">
                  <BookOpen className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">
                    {courseStats[classRoom._id] || 0}
                  </span>
                </div>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" size="sm" onClick={() => window.open(`/work/classroom/${classRoom._id}/student`, "_blank")} title="管理班级学生">
                    <UserPlus className="h-3 w-3 mr-1" />
                    学生
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => window.open(`/work/create-pack/mistake-batch/classroom/${classRoom._id}`, "_blank")} title="查看班级错题集">
                    <FileText className="h-3 w-3 mr-1" />
                    错题集
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" title="更多操作">
                        <MoreHorizontal className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => window.open(`/work/classroom/${classRoom._id}/mistake-stat`, "_blank")}>
                        <BarChart3 className="h-4 w-4 mr-2" />
                        {DISPLAY_TEXT.COURSE_MISTAKE}统计
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => router.push(`/work/classroom/${classRoom._id}/multi-honor`)}>
                        <Award className="h-4 w-4 mr-2" />
                        批量添加荣誉
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => window.open(`/work/classroom/${classRoom._id}/course`, "_blank")}>
                        <BookOpen className="h-4 w-4 mr-2" />
                        课程管理
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </TableCell>
            </TableRow>)}
        </TableBody>
      </Table>
    </Card>;
}
