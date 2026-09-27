"use client";

import { BookOpen, Edit, Package, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "../../../../../../components/ui/alert-dialog.js";
import { Button } from "../../../../../../components/ui/button.js";
// 课程列表组件，展示课程信息并提供编辑、删除、题集管理等功能
import { Card, CardContent } from "../../../../../../components/ui/card.js";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../../../../components/ui/table.js";
import { dateToString, getTimeFromId } from "../../../../../../lib/common/time.js";
export default function CourseList({
  courses,
  isLoading,
  userIsPrincipal,
  onEditCourse,
  onDeleteCourse
}) {
  const router = useRouter();

  // 获取状态标记
  const getStatusBadge = status => {
    const statusConfig = {
      使用中: {
        color: "bg-green-100 text-green-800",
        text: "使用中"
      },
      已停用: {
        color: "bg-red-100 text-red-800",
        text: "已停用"
      }
    };
    const config = statusConfig[status] || statusConfig.使用中;
    return <div className={`text-xs px-2 py-1 rounded-full inline-block ${config.color}`}>
        {config.text}
      </div>;
  };

  // 处理跳转到题集页面
  const handleGoToQuestionPacks = courseId => {
    router.push(`/work/school/course/${courseId}/question-pack`);
  };
  if (isLoading) {
    return <Card className="bg-white">
        <CardContent className="text-center py-8">
          <p className="text-gray-500">加载中...</p>
        </CardContent>
      </Card>;
  }
  if (courses.length === 0) {
    return <Card className="bg-white">
        <CardContent className="text-center py-8">
          <BookOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-500">暂无课程数据</p>
        </CardContent>
      </Card>;
  }
  return <Card className="bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>课程名称</TableHead>
            <TableHead>科目</TableHead>
            <TableHead>课程描述</TableHead>
            <TableHead>课程状态</TableHead>
            <TableHead>题集数量</TableHead>
            <TableHead>创建时间</TableHead>
            <TableHead className="text-right">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {courses.map(course => <TableRow key={course._id}>
              <TableCell>
                <div className="font-medium">{course.name}</div>
              </TableCell>
              <TableCell>
                <div className="text-sm text-blue-600 font-medium">
                  {course.subject || "未设置"}
                </div>
              </TableCell>
              <TableCell>
                <div className="text-sm text-gray-600 max-w-32 truncate" title={course.description || ""}>
                  {course.description || "无描述"}
                </div>
              </TableCell>
              <TableCell>{getStatusBadge(course.status)}</TableCell>
              <TableCell>
                <div className="flex items-center space-x-1">
                  <Package className="h-4 w-4 text-gray-400" />
                  <span className="text-sm">
                    {course.questionPackIds?.length || 0}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <div className="text-sm text-gray-600">
                  {dateToString(getTimeFromId(course._id))}
                </div>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" size="sm" disabled={course.status === "已停用"} onClick={() => handleGoToQuestionPacks(course._id)} title={course.status === "已停用" ? "已停用的课程不支持编辑题集" : "管理题集"}>
                    <Package className="h-3 w-3" />
                  </Button>
                  <Button variant="outline" size="sm" disabled={!userIsPrincipal} onClick={() => onEditCourse(course._id)} title={!userIsPrincipal ? "只有校长才能编辑课程" : "编辑课程"}>
                    <Edit className="h-3 w-3" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm" disabled={!userIsPrincipal} title={!userIsPrincipal ? "只有校长才能删除课程" : ""} className="text-white">
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>确认删除课程</AlertDialogTitle>
                        <AlertDialogDescription>
                          确定要删除课程 &quot;{course.name}&quot; 吗？
                          此操作将影响使用该课程的班级，且无法撤销。
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>取消</AlertDialogCancel>
                        <AlertDialogAction onClick={() => onDeleteCourse(course._id)} className="bg-red-600 hover:bg-red-700">
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
