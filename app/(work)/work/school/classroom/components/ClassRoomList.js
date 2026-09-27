"use client";

// 班级列表组件，用于展示班级信息并提供编辑、删除和编辑教师队伍等操作
import { Edit, GraduationCap, Trash2, UserCog, Users } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "../../../../../../components/ui/alert-dialog.js";
import { Button } from "../../../../../../components/ui/button.js";
import { Card, CardContent } from "../../../../../../components/ui/card.js";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../../../../components/ui/table.js";
export default function ClassRoomList({
  classRooms,
  isLoading,
  isPrincipal,
  onEditClassRoom,
  onDeleteClassRoom,
  onEditTeachers
}) {
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
              <TableCell className="text-right">
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" size="sm" disabled={!isPrincipal} onClick={() => onEditTeachers(classRoom._id)} title={!isPrincipal ? "只有校长才能编辑教师队伍" : "编辑教师队伍"}>
                    <UserCog className="h-3 w-3" />
                  </Button>
                  <Button variant="outline" size="sm" disabled={!isPrincipal} onClick={() => onEditClassRoom(classRoom._id)} title={!isPrincipal ? "只有校长才能编辑班级" : "编辑班级"}>
                    <Edit className="h-3 w-3" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm" disabled={!isPrincipal} title={!isPrincipal ? "只有校长才能删除班级" : ""} className="text-white">
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>确认删除班级</AlertDialogTitle>
                        <AlertDialogDescription>
                          确定要删除班级 &quot;{classRoom.name}&quot; 吗？
                          此操作将同时删除该班级下所有学生的班级关系，且无法撤销。
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>取消</AlertDialogCancel>
                        <AlertDialogAction onClick={() => onDeleteClassRoom(classRoom._id)} className="bg-red-600 hover:bg-red-700">
                          确认删除
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </TableCell>
            </TableRow>)}
        </TableBody>
      </Table>
    </Card>;
}
