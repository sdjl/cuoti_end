"use client";

import { BarChart3, Edit, Trash2, UsersRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "../../../../../../components/ui/alert-dialog.js";
import { Button } from "../../../../../../components/ui/button.js";
// 学生分组列表组件，展示学生分组信息并提供编辑、删除、查看统计等功能
import { Card, CardContent } from "../../../../../../components/ui/card.js";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../../../../components/ui/table.js";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../../../../../../components/ui/tooltip.js";
export default function StudentGroupList({
  studentGroups,
  isLoading,
  isPrincipal,
  onEditStudentGroup,
  onDeleteStudentGroup
}) {
  const router = useRouter();
  // 格式化时间
  const formatDate = timestamp => {
    return new Date(timestamp).toLocaleDateString("zh-CN");
  };

  // 获取学生姓名列表用于提示
  const getStudentNamesText = students => {
    return students.map(student => student.name).join("、");
  };
  if (isLoading) {
    return <Card className="bg-white">
        <CardContent className="text-center py-8">
          <p className="text-gray-500">加载中...</p>
        </CardContent>
      </Card>;
  }
  if (studentGroups.length === 0) {
    return <Card className="bg-white">
        <CardContent className="text-center py-8">
          <UsersRound className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-500">暂无学生分组数据</p>
        </CardContent>
      </Card>;
  }
  return <Card className="bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>分组名称</TableHead>
            <TableHead>老师姓名</TableHead>
            <TableHead>备注</TableHead>
            <TableHead>学生人数</TableHead>
            <TableHead>创建时间</TableHead>
            <TableHead className="text-right">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {studentGroups.map(studentGroup => <TableRow key={studentGroup._id}>
              <TableCell>
                <div className="font-medium">{studentGroup.name}</div>
              </TableCell>
              <TableCell>
                <div className="text-sm text-gray-900">
                  {studentGroup.teacherName || "未设置"}
                </div>
              </TableCell>
              <TableCell>
                <div className="text-sm text-gray-600 max-w-32 truncate" title={studentGroup.notes || ""}>
                  {studentGroup.notes || "无备注"}
                </div>
              </TableCell>
              <TableCell>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center space-x-1 cursor-pointer">
                        <UsersRound className="h-4 w-4 text-gray-400" />
                        <span className="text-sm">
                          {studentGroup.students?.length || 0}
                        </span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">
                        {studentGroup.students?.length > 0 ? getStudentNamesText(studentGroup.students) : "暂无学生"}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </TableCell>
              <TableCell>
                <div className="text-sm text-gray-600">
                  {formatDate(studentGroup.created)}
                </div>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end space-x-2">
                  {/* 查看统计按钮 */}
                  <Button variant="outline" size="sm" onClick={() => router.push(`/work/school/studentGroup/${studentGroup._id}`)} title="查看分组统计">
                    <BarChart3 className="h-3 w-3" />
                  </Button>

                  <Button variant="outline" size="sm" disabled={!isPrincipal} onClick={() => onEditStudentGroup(studentGroup._id)} title={!isPrincipal ? "只有校长才能编辑学生分组" : "编辑学生分组"}>
                    <Edit className="h-3 w-3" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm" disabled={!isPrincipal} title={!isPrincipal ? "只有校长才能删除学生分组" : ""} className="text-white">
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>确认删除学生分组</AlertDialogTitle>
                        <AlertDialogDescription>
                          确定要删除学生分组 &quot;{studentGroup.name}&quot;
                          吗？ 此操作将删除该分组的所有数据，且无法撤销。
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>取消</AlertDialogCancel>
                        <AlertDialogAction onClick={() => onDeleteStudentGroup(studentGroup._id)} className="bg-red-600 hover:bg-red-700">
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
