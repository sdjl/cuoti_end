"use client";

// 显示班级课程信息并支持切换完成状态的卡片组件
import { BookOpen, CheckCircle, MoreHorizontal, Package, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "../../../../../../../../components/ui/button.js";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../../../../../components/ui/card.js";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../../../../../../../../components/ui/dropdown-menu.js";
import { useToast } from "../../../../../../../../hooks/use-toast.js";
import { updateCourseCompletionAction } from "../actions.js";
export default function CourseInfoCard({
  course,
  classCourse,
  studentCount,
  isLoading,
  updateClassCourse
}) {
  const {
    toast
  } = useToast();
  const [actionLoading, setActionLoading] = useState({});
  const [localClassCourse, setLocalClassCourse] = useState(classCourse);

  // 更新本地状态当外部状态变化时
  useEffect(() => {
    setLocalClassCourse(classCourse);
  }, [classCourse]);

  // 处理课程完成状态切换
  const handleCourseCompletion = async isCompleted => {
    if (!course || !localClassCourse) return;
    const loadingKey = `course-${course._id}`;
    setActionLoading(prev => ({
      ...prev,
      [loadingKey]: true
    }));
    try {
      const {
        success,
        error
      } = await updateCourseCompletionAction(localClassCourse.classId, course._id, isCompleted);
      if (success) {
        // 直接更新本地状态而不刷新页面
        const updatedClassCourse = localClassCourse ? {
          ...localClassCourse,
          isCompleted
        } : null;
        setLocalClassCourse(updatedClassCourse);
        // 通知父组件状态变化
        updateClassCourse(() => updatedClassCourse);
        toast({
          title: "更新成功",
          description: `课程已${isCompleted ? "标记为完成" : "标记为未完成"}`
        });
      } else {
        toast({
          title: "更新失败",
          description: error || "更新课程状态时发生错误",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("更新课程状态失败:", error);
      toast({
        title: "更新失败",
        description: "更新课程状态时发生错误",
        variant: "destructive"
      });
    } finally {
      setActionLoading(prev => ({
        ...prev,
        [loadingKey]: false
      }));
    }
  };

  // 计算完成和未完成的题集数量
  const getCompletionStats = () => {
    if (!course?.questionPacks || !localClassCourse?.completedQuestionPackIds) {
      return {
        completed: 0,
        incomplete: course?.questionPacks?.length || 0
      };
    }
    const totalQuestionPacks = course.questionPacks.length;
    const completedQuestionPacks = localClassCourse.completedQuestionPackIds.length;
    return {
      completed: completedQuestionPacks,
      incomplete: totalQuestionPacks - completedQuestionPacks
    };
  };
  const {
    completed,
    incomplete
  } = getCompletionStats();
  if (isLoading) {
    return <Card className="bg-white">
        <CardContent className="text-center py-8">
          <p className="text-gray-500">加载中...</p>
        </CardContent>
      </Card>;
  }
  if (!course) {
    return <Card className="bg-white">
        <CardContent className="text-center py-8">
          <BookOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-500">课程不存在</p>
        </CardContent>
      </Card>;
  }
  return <Card className="bg-white">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <BookOpen className="h-6 w-6" />
          {course.name}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-5 gap-4">
          <div>
            <p className="text-sm text-gray-600">班级学生人数</p>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-gray-400" />
              <span className="font-medium">{studentCount}</span>
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-600">题集总数</p>
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-gray-400" />
              <span className="font-medium">
                {course.questionPacks?.length || 0}
              </span>
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-600">已完成题集</p>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="font-medium text-green-600">{completed}</span>
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-600">未完成题集</p>
            <div className="flex items-center gap-2">
              <span className="font-medium text-orange-600">{incomplete}</span>
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">课程状态</p>
                <div className="flex items-center gap-2">
                  {localClassCourse?.isCompleted ? <>
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm text-green-600 font-medium">
                        已完成
                      </span>
                    </> : <span className="text-sm text-orange-600 font-medium">
                      进行中
                    </span>}
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" disabled={actionLoading[`course-${course._id}`]}>
                    {localClassCourse?.isCompleted ? "已完成" : "未完成"}
                    <MoreHorizontal className="h-4 w-4 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleCourseCompletion(true)} disabled={localClassCourse?.isCompleted}>
                    设为完成
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleCourseCompletion(false)} disabled={!localClassCourse?.isCompleted}>
                    设为未完成
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>;
}
