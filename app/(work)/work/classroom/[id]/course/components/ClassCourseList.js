"use client";

// 班级课程列表组件，展示课程状态并提供删除与编辑入口
import { BookOpen, Edit, Package, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "../../../../../../../components/ui/alert-dialog.js";
import { Button } from "../../../../../../../components/ui/button.js";
import { Card, CardContent } from "../../../../../../../components/ui/card.js";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../../../../../components/ui/table.js";
import { dateToString, getTimeFromId } from "../../../../../../../lib/common/time.js";
import EditCourseStatusModal from "./EditCourseStatusModal.js";
export default function ClassCourseList({
  courses,
  isLoading,
  classId,
  onDeleteCourse,
  onRefresh
}) {
  const router = useRouter();
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);

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

  // 获取完成状态标记
  const getCompletionBadge = isCompleted => {
    const config = isCompleted ? {
      color: "bg-blue-100 text-blue-800",
      text: "已完成"
    } : {
      color: "bg-gray-100 text-gray-600",
      text: "未完成"
    };
    return <div className={`text-xs px-2 py-1 rounded-full inline-block ${config.color}`}>
        {config.text}
      </div>;
  };

  // 处理编辑课程状态
  const handleEditCourseStatus = (courseId, courseName) => {
    setSelectedCourse({
      id: courseId,
      name: courseName
    });
    setEditModalOpen(true);
  };

  // 关闭编辑模态框
  const handleCloseEditModal = () => {
    setEditModalOpen(false);
    setSelectedCourse(null);
  };

  // 编辑成功后的回调
  const handleEditSuccess = () => {
    onRefresh();
  };

  // 处理查看题集
  const handleViewQuestionPacks = courseId => {
    router.push(`/work/classroom/${classId}/course/${courseId}`);
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
          <p className="text-gray-500">班级暂无课程数据</p>
        </CardContent>
      </Card>;
  }
  return <>
      <Card className="bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>课程名称</TableHead>
              <TableHead>科目</TableHead>
              <TableHead>课程描述</TableHead>
              <TableHead>课程状态</TableHead>
              <TableHead>完成状态</TableHead>
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
                <TableCell>{getCompletionBadge(course.isCompleted)}</TableCell>
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
                    <Button variant="outline" size="sm" onClick={() => handleViewQuestionPacks(course._id)} title="查看题集">
                      <Package className="h-3 w-3" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleEditCourseStatus(course._id, course.name)} title="编辑课程完成状态">
                      <Edit className="h-3 w-3" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="sm" title="从班级中移除课程" className="text-white">
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>确认移除课程</AlertDialogTitle>
                          <AlertDialogDescription>
                            确定要从班级中移除课程 &quot;{course.name}&quot;
                            吗？
                            此操作不会删除课程本身，只是移除班级与课程的关联。
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>取消</AlertDialogCancel>
                          <AlertDialogAction onClick={() => onDeleteCourse(course._id)} className="bg-red-600 hover:bg-red-700">
                            确认移除
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>)}
          </TableBody>
        </Table>
      </Card>

      {/* 编辑课程状态模态框 */}
      {selectedCourse && <EditCourseStatusModal isOpen={editModalOpen} onClose={handleCloseEditModal} classId={classId} courseId={selectedCourse.id} courseName={selectedCourse.name} onSuccess={handleEditSuccess} />}
    </>;
}
