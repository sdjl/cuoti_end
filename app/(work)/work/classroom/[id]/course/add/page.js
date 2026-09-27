"use client";

// 班级选课页面，负责加载可用课程并支持筛选分页添加
import { RefreshCw } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useDeferredValue, useEffect, useState } from "react";
import { CustomPagination } from "../../../../../../../components/common/Pagination.js";
import { Button } from "../../../../../../../components/ui/button.js";
import WorkHeader from "../../../../../../../components/work/layout/WorkHeader.js";
import { useToast } from "../../../../../../../hooks/use-toast.js";
import { useAuth } from "../../../../../../../hooks/useAuth.js";
import { addCourseToClassAction, getAvailableCoursesAction, getAvailableCoursesCountAction, getClassRoomInfoAction } from "./actions.js";
import AvailableCourseFilters from "./components/AvailableCourseFilters.js";
import AvailableCourseList from "./components/AvailableCourseList.js";
export default function AddCoursePage() {
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

  // 分页状态
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const pageSize = 20;

  // 过滤器状态
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("all");

  // 使用 useDeferredValue 延迟搜索关键词，减少频繁的API调用
  const deferredSearchTerm = useDeferredValue(searchTerm);

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
      const [coursesData, count] = await Promise.all([getAvailableCoursesAction(classId, {
        pageNum: currentPage,
        pageSize,
        keyword: deferredSearchTerm,
        subject: selectedSubject === "all" ? "" : selectedSubject,
        status: "使用中"
      }), getAvailableCoursesCountAction(classId, {
        keyword: deferredSearchTerm,
        subject: selectedSubject === "all" ? "" : selectedSubject,
        status: "使用中"
      })]);
      setCourses(coursesData);
      setTotalPages(Math.ceil(count / pageSize));
    } catch (error) {
      console.error("获取可添加课程数据失败:", error);
      toast({
        title: "获取数据失败",
        description: "获取可添加课程数据时发生错误",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [classId, currentPage, deferredSearchTerm, selectedSubject, toast]);

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

  // 当页码或过滤条件变化时重新获取课程数据
  useEffect(() => {
    if (currentPage > 0 || deferredSearchTerm || selectedSubject !== "all") {
      fetchCourses();
    }
  }, [currentPage, deferredSearchTerm, selectedSubject, fetchCourses]);

  // 手动刷新数据
  const handleRefresh = useCallback(() => {
    fetchAllData(true);
  }, [fetchAllData]);

  // 重置过滤器
  const handleResetFilters = useCallback(() => {
    setSearchTerm("");
    setSelectedSubject("all");
    setCurrentPage(0);
  }, []);

  // 页码变化（转换为1基索引）
  const handlePageChange = useCallback(page => {
    setCurrentPage(page - 1); // CustomPagination使用1基索引，需要转换为0基索引
  }, []);

  // 处理添加课程
  const handleAddCourse = useCallback(async courseId => {
    if (!classId) return false;
    try {
      const {
        success,
        error
      } = await addCourseToClassAction(classId, courseId);
      if (success) {
        // 刷新课程列表，移除已添加的课程
        await fetchCourses();
        return true;
      } else {
        throw new Error(error || "添加课程失败");
      }
    } catch (error) {
      console.error("添加课程失败:", error);
      throw error;
    }
  }, [classId, fetchCourses]);
  return <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <WorkHeader title={`添加班级课程${classRoom ? ` - ${classRoom.name}` : ""}`} showBackButton={true} backHref={`/work/classroom/${classId}/course`} backText="返回班级课程管理" rightContent={<div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing} className="flex items-center">
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
              刷新数据
            </Button>
          </div>} />

      <main className="flex-1 p-6 space-y-6">
        <div className="container mx-auto space-y-4">
          {/* 过滤器 */}
          <AvailableCourseFilters searchTerm={searchTerm} setSearchTerm={setSearchTerm} selectedSubject={selectedSubject} setSelectedSubject={setSelectedSubject} onResetFilters={handleResetFilters} />

          {/* 课程列表 */}
          <AvailableCourseList courses={courses} isLoading={isLoading} onAddCourse={handleAddCourse} />

          {/* 分页 */}
          {totalPages > 1 && <div className="flex justify-center mt-6">
              <CustomPagination currentPage={currentPage + 1} // 转换为1基索引显示
          totalPages={totalPages} onPageChange={handlePageChange} pageParamName="course_page" />
            </div>}
        </div>
      </main>
    </div>;
}
