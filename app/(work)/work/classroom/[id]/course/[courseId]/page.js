"use client";

// 班级课程详情页面，管理题包数据与同步课堂信息
import { RefreshCw } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Button } from "../../../../../../../components/ui/button.js";
import WorkHeader from "../../../../../../../components/work/layout/WorkHeader.js";
import { useToast } from "../../../../../../../hooks/use-toast.js";
import { useAuth } from "../../../../../../../hooks/useAuth.js";
import { getClassRoomInfoAction, getCourseQuestionPacksAction } from "./actions.js";
import CourseInfoCard from "./components/CourseInfoCard.js";
import QuestionPackList from "./components/QuestionPackList.js";
export default function CourseQuestionPacksPage() {
  const {
    user
  } = useAuth();
  const router = useRouter();
  const params = useParams();
  const {
    toast
  } = useToast();

  // 从路径参数中获取班级ID和课程ID
  const classId = params.id;
  const courseId = params.courseId;
  const [classRoom, setClassRoom] = useState(null);
  const [course, setCourse] = useState(null);
  const [classCourse, setClassCourse] = useState(null);
  const [studentAnswerStats, setStudentAnswerStats] = useState({});
  const [studentCount, setStudentCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

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

  // 获取课程题集数据
  const fetchCourseQuestionPacks = useCallback(async () => {
    if (!classId || !courseId) return;
    setIsLoading(true);
    try {
      const {
        course: courseData,
        classCourse: classCourseData,
        studentAnswerStats: statsData,
        studentCount: studentCountData,
        error
      } = await getCourseQuestionPacksAction(classId, courseId);
      if (error) {
        toast({
          title: "获取数据失败",
          description: error,
          variant: "destructive"
        });
        return;
      }
      setCourse(courseData);
      setClassCourse(classCourseData);
      setStudentAnswerStats(statsData || {});
      setStudentCount(studentCountData || 0);
    } catch (error) {
      console.error("获取课程题集数据失败:", error);
      toast({
        title: "获取数据失败",
        description: "获取课程题集数据时发生错误",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [classId, courseId, toast]);

  // 获取所有数据（初始加载和手动刷新）
  const fetchAllData = useCallback(async (showRefreshLoading = false) => {
    if (showRefreshLoading) {
      setIsRefreshing(true);
    }
    try {
      await Promise.all([fetchClassRoomInfo(), fetchCourseQuestionPacks()]);
    } catch (error) {
      console.error("获取数据失败:", error);
    } finally {
      setIsRefreshing(false);
    }
  }, [fetchClassRoomInfo, fetchCourseQuestionPacks]);

  // 初始加载数据
  useEffect(() => {
    fetchAllData(false);
  }, [fetchAllData]);

  // 手动刷新数据
  const handleRefresh = useCallback(() => {
    fetchAllData(true);
  }, [fetchAllData]);

  // 更新 classCourse 状态的回调函数
  const updateClassCourse = useCallback(updater => {
    setClassCourse(updater);
  }, []);
  return <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <WorkHeader title={`课程题集${classRoom && course ? ` - ${classRoom.name} - ${course.name}` : ""}`} showBackButton={true} backHref={`/work/classroom/${classId}/course`} backText="返回班级课程" rightContent={<div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing} className="flex items-center">
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
              刷新数据
            </Button>
          </div>} />

      {/* 主内容区域 */}
      <div className="flex-1 container mx-auto px-4 py-6 space-y-6">
        {/* 课程信息组件 */}
        <CourseInfoCard course={course} classCourse={classCourse} studentCount={studentCount} isLoading={isLoading} updateClassCourse={updateClassCourse} />

        {/* 题集列表组件 */}
        <QuestionPackList course={course} classCourse={classCourse} studentAnswerStats={studentAnswerStats} studentCount={studentCount} isLoading={isLoading} classId={classId} courseId={courseId} updateClassCourse={updateClassCourse} />
      </div>
    </div>;
}
