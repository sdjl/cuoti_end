"use client";

// 班级课程管理页面，负责查看、筛选与移除班课
import { RefreshCw } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Button } from "../../../../../../components/ui/button.js";
import WorkHeader from "../../../../../../components/work/layout/WorkHeader.js";
import { useToast } from "../../../../../../hooks/use-toast.js";
import { useAuth } from "../../../../../../hooks/useAuth.js";
import { getClassCoursesAction, getClassRoomInfoAction, removeClassCourseAction } from "./actions.js";
import ClassCourseFilters from "./components/ClassCourseFilters.js";
import ClassCourseList from "./components/ClassCourseList.js";
export default function ClassCoursePage() {
  const {
    user
  } = useAuth();
  const router = useRouter();
  const params = useParams();
  const classId = params.id;
  const {
    toast
  } = useToast();
  const [classRoom, setClassRoom] = useState(null);
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // 过滤器状态
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("all");

  // 检查当前校园
  useEffect(() => {
    if (user && !user.workSetting?.currentSchool) {
      router.push("/work/setting/curr-school");
      return;
    }
  }, [user, router]);

  // 获取班级信息
  const fetchClassRoomInfo = useCallback(async () => {
    if (!classId) return;
    try {
      const {
        classRoom,
        error
      } = await getClassRoomInfoAction(classId);
      if (error) {
        toast({
          title: "获取班级信息失败",
          description: error,
          variant: "destructive"
        });
        return;
      }
      setClassRoom(classRoom);
    } catch (error) {
      console.error("获取班级信息失败:", error);
      toast({
        title: "获取班级信息失败",
        description: "获取班级信息时发生错误",
        variant: "destructive"
      });
    }
  }, [classId, toast]);

  // 获取课程数据
  const fetchCourses = useCallback(async () => {
    if (!classId) return;
    setIsLoading(true);
    try {
      const coursesData = await getClassCoursesAction(classId);
      setCourses(coursesData);
    } catch (error) {
      console.error("获取班级课程数据失败:", error);
      toast({
        title: "获取数据失败",
        description: "获取班级课程数据时发生错误",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [classId, toast]);

  // 获取所有数据（初始加载和手动刷新）
  const fetchAllData = useCallback(async (showRefreshLoading = false) => {
    if (showRefreshLoading) {
      setIsRefreshing(true);
    }
    try {
      await Promise.all([fetchClassRoomInfo(), fetchCourses()]);
    } catch (error) {
      console.error("获取数据失败:", error);
    } finally {
      setIsRefreshing(false);
    }
  }, [fetchClassRoomInfo, fetchCourses]);

  // 初始加载数据
  useEffect(() => {
    fetchAllData(false);
  }, [fetchAllData]);

  // 手动刷新数据
  const handleRefresh = useCallback(() => {
    fetchAllData(true);
  }, [fetchAllData]);

  // 重置过滤器
  const handleResetFilters = useCallback(() => {
    setSearchTerm("");
    setSelectedSubject("all");
  }, []);

  // 处理删除课程
  const handleDeleteCourse = useCallback(async courseId => {
    if (!classId) return;
    try {
      const {
        success,
        error
      } = await removeClassCourseAction(classId, courseId);
      if (success) {
        toast({
          title: "删除成功",
          description: "课程已从班级中移除"
        });
        // 刷新数据
        await fetchAllData();
      } else {
        toast({
          title: "删除失败",
          description: error || "删除课程时发生错误",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("删除班级课程失败:", error);
      toast({
        title: "删除失败",
        description: "删除课程时发生错误",
        variant: "destructive"
      });
    }
  }, [classId, toast, fetchAllData]);

  // 过滤课程数据
  const filteredCourses = courses.filter(course => {
    const matchesSearch = !searchTerm.trim() || course.name.toLowerCase().includes(searchTerm.toLowerCase()) || course.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSubject = selectedSubject === "all" || course.subject === selectedSubject;
    return matchesSearch && matchesSubject;
  });
  return <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <WorkHeader title={`班级课程管理${classRoom ? ` - ${classRoom.name}` : ""}`} showBackButton={true} backHref="/work/classroom" backText="返回我的班级" rightContent={<div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing} className="flex items-center">
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
              刷新数据
            </Button>
            <Button size="sm" onClick={() => router.push(`/work/classroom/${classId}/course/add`)} className="flex items-center">
              添加班级课程
            </Button>
          </div>} />

      <main className="flex-1 p-6 space-y-6">
        <div className="container mx-auto space-y-4">
          {/* 过滤器 */}
          <ClassCourseFilters searchTerm={searchTerm} setSearchTerm={setSearchTerm} selectedSubject={selectedSubject} setSelectedSubject={setSelectedSubject} onResetFilters={handleResetFilters} />

          {/* 统计信息 */}
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                班级共有{" "}
                <span className="font-medium text-gray-900">
                  {courses.length}
                </span>{" "}
                个课程，显示{" "}
                <span className="font-medium text-gray-900">
                  {filteredCourses.length}
                </span>{" "}
                个
              </div>
            </div>
          </div>

          {/* 课程列表 */}
          <ClassCourseList courses={filteredCourses} isLoading={isLoading} classId={classId} onDeleteCourse={handleDeleteCourse} onRefresh={handleRefresh} />
        </div>
      </main>
    </div>;
}
