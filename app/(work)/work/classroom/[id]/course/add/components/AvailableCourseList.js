"use client";

// 展示可添加课程列表并支持一键加入班级
import { BookOpen, CheckCircle, Package, Plus } from "lucide-react";
import { useState } from "react";
import { Button } from "../../../../../../../../components/ui/button.js";
import { Card, CardContent } from "../../../../../../../../components/ui/card.js";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../../../../../../components/ui/table.js";
import { useToast } from "../../../../../../../../hooks/use-toast.js";
import { dateToString, getTimeFromId } from "../../../../../../../../lib/common/time.js";
export default function AvailableCourseList({
  courses,
  isLoading,
  onAddCourse
}) {
  const {
    toast
  } = useToast();
  const [addingCourseIds, setAddingCourseIds] = useState(new Set());
  const [addedCourseIds, setAddedCourseIds] = useState(new Set());
  const handleAddCourse = async courseId => {
    if (addingCourseIds.has(courseId) || addedCourseIds.has(courseId)) {
      return;
    }
    setAddingCourseIds(prev => new Set(prev.add(courseId)));
    try {
      const success = await onAddCourse(courseId);
      if (success) {
        setAddedCourseIds(prev => new Set(prev.add(courseId)));
        toast({
          title: "添加成功",
          description: "课程已成功添加到班级"
        });
      }
    } catch (error) {
      console.error("添加课程失败:", error);
      toast({
        title: "添加失败",
        description: error instanceof Error ? error.message : "添加课程失败",
        variant: "destructive"
      });
    } finally {
      setAddingCourseIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(courseId);
        return newSet;
      });
    }
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
          <p className="text-gray-500">没有找到可添加的课程</p>
          <p className="text-sm text-gray-400 mt-1">
            请尝试调整搜索条件或学科筛选
          </p>
        </CardContent>
      </Card>;
  }
  return <div className="space-y-6">
      {/* 课程列表 */}
      <Card className="bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>课程名称</TableHead>
              <TableHead>科目</TableHead>
              <TableHead>课程描述</TableHead>
              <TableHead>题集数量</TableHead>
              <TableHead>创建时间</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {courses.map(course => {
            const isAdding = addingCourseIds.has(course._id);
            const isAdded = addedCourseIds.has(course._id);
            return <TableRow key={course._id}>
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
                    <Button size="sm" onClick={() => handleAddCourse(course._id)} disabled={isAdding || isAdded} className={isAdded ? "bg-green-600 hover:bg-green-700" : ""}>
                      {isAdding ? <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          添加中...
                        </> : isAdded ? <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          已添加
                        </> : <>
                          <Plus className="h-4 w-4 mr-2" />
                          添加到班级
                        </>}
                    </Button>
                  </TableCell>
                </TableRow>;
          })}
          </TableBody>
        </Table>
      </Card>
    </div>;
}
