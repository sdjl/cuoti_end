"use client";

import { Plus, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
// 课程管理页面，提供课程的查看、添加、编辑、删除等功能
import { useCallback, useEffect, useState } from "react";
import AddCourseModal from "./components/AddCourseModal.js";
import CourseFilters from "./components/CourseFilters.js";
import CourseList from "./components/CourseList.js";
import EditCourseModal from "./components/EditCourseModal.js";
import { CustomPagination } from "../../../../../components/common/Pagination.js";
import { Button } from "../../../../../components/ui/button.js";
import WorkHeader from "../../../../../components/work/layout/WorkHeader.js";
import { useToast } from "../../../../../hooks/use-toast.js";
import { useAuth } from "../../../../../hooks/useAuth.js";
import { addCourseAction, deleteCourseAction, getCoursesAction, getCoursesCountAction, updateCourseAction } from "./actions.js";

// 每页显示的课程数量
const PAGE_SIZE = 20;
export default function CoursePage() {
  const {
    user,
    isPrincipal
  } = useAuth();
  const router = useRouter();
  const {
    toast
  } = useToast();
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  // 过滤器状态
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");

  // 模态框状态
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);

  // 当前用户是否是校长
  const userIsPrincipal = isPrincipal();

  // 计算总页数
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  // 检查当前校园
  useEffect(() => {
    if (user && !user.workSetting?.currentSchool) {
      router.push("/work/setting/curr-school");
      return;
    }
  }, [user, router]);

  // 获取课程数据
  const fetchCourses = useCallback(async () => {
    setIsLoading(true);
    try {
      const keyword = searchTerm.trim();

      // 注意：API调用中pageNum应从0开始，而展示给用户的页码从1开始
      const pageNum = currentPage - 1;
      const [coursesData, count] = await Promise.all([getCoursesAction({
        pageNum,
        pageSize: PAGE_SIZE,
        keyword,
        subject: selectedSubject,
        status: selectedStatus
      }), getCoursesCountAction({
        keyword,
        subject: selectedSubject,
        status: selectedStatus
      })]);
      setCourses(coursesData);
      setTotalCount(count);
    } catch (error) {
      console.error("获取课程数据失败:", error);
      toast({
        title: "获取数据失败",
        description: "获取课程数据时发生错误",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, selectedSubject, selectedStatus, currentPage, toast]);

  // 获取所有数据（初始加载和手动刷新）
  const fetchAllData = useCallback(async (showRefreshLoading = false) => {
    if (showRefreshLoading) {
      setIsRefreshing(true);
    }
    try {
      await fetchCourses();
    } catch (error) {
      console.error("获取课程数据失败:", error);
    } finally {
      setIsRefreshing(false);
    }
  }, [fetchCourses]);

  // 初始加载数据
  useEffect(() => {
    fetchAllData(false);
  }, [fetchAllData]);

  // 当筛选条件变化时，重置到第一页
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedSubject, selectedStatus]);

  // 手动刷新数据
  const handleRefresh = useCallback(() => {
    fetchAllData(true);
  }, [fetchAllData]);

  // 重置过滤器
  const handleResetFilters = useCallback(() => {
    setSearchTerm("");
    setSelectedSubject("all");
    setSelectedStatus("all");
    setCurrentPage(1);
  }, []);

  // 处理页码变更
  const handlePageChange = useCallback(page => {
    setCurrentPage(page);
  }, []);

  // 处理添加课程
  const handleAddCourse = useCallback(() => {
    if (!userIsPrincipal) {
      return;
    }
    setShowAddModal(true);
  }, [userIsPrincipal]);

  // 处理编辑课程
  const handleEditCourse = useCallback(courseId => {
    if (!userIsPrincipal) {
      return;
    }
    const course = courses.find(c => c._id === courseId);
    if (course) {
      setEditingCourse(course);
      setShowEditModal(true);
    }
  }, [userIsPrincipal, courses]);

  // 处理删除课程
  const handleDeleteCourse = useCallback(async courseId => {
    if (!userIsPrincipal) {
      return;
    }
    try {
      const {
        success,
        error
      } = await deleteCourseAction(courseId);
      if (success) {
        toast({
          title: "删除成功",
          description: "课程已成功删除"
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
      console.error("删除课程失败:", error);
      toast({
        title: "删除失败",
        description: "删除课程时发生错误",
        variant: "destructive"
      });
    }
  }, [userIsPrincipal, toast, fetchAllData]);

  // 处理添加课程提交
  const handleAddCourseSubmit = useCallback(async data => {
    try {
      const {
        success,
        error
      } = await addCourseAction(data);
      if (success) {
        toast({
          title: "添加成功",
          description: "课程已成功添加"
        });
        setShowAddModal(false);
        await fetchAllData();
      } else {
        toast({
          title: "添加失败",
          description: error || "添加课程时发生错误",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("添加课程失败:", error);
      toast({
        title: "添加失败",
        description: "添加课程时发生错误",
        variant: "destructive"
      });
    }
  }, [toast, fetchAllData]);

  // 处理编辑课程提交
  const handleEditCourseSubmit = useCallback(async data => {
    if (!editingCourse) return;
    try {
      const {
        success,
        error
      } = await updateCourseAction(editingCourse._id, data);
      if (success) {
        toast({
          title: "更新成功",
          description: "课程已成功更新"
        });
        setShowEditModal(false);
        setEditingCourse(null);
        await fetchAllData();
      } else {
        toast({
          title: "更新失败",
          description: error || "更新课程时发生错误",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("更新课程失败:", error);
      toast({
        title: "更新失败",
        description: "更新课程时发生错误",
        variant: "destructive"
      });
    }
  }, [editingCourse, toast, fetchAllData]);
  return <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <WorkHeader title="课程管理" showBackButton={true} backHref="/work/school" backText="返回校园" rightContent={<div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing} className="flex items-center">
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
              刷新数据
            </Button>
            {userIsPrincipal && <Button onClick={handleAddCourse} size="sm" className="flex items-center">
                <Plus className="h-4 w-4 mr-2" />
                添加课程
              </Button>}
          </div>} />

      <main className="flex-1 p-6 space-y-6">
        <div className="container mx-auto space-y-4">
          {/* 过滤器 */}
          <CourseFilters searchTerm={searchTerm} setSearchTerm={setSearchTerm} selectedSubject={selectedSubject} setSelectedSubject={setSelectedSubject} selectedStatus={selectedStatus} setSelectedStatus={setSelectedStatus} onResetFilters={handleResetFilters} />

          {/* 课程列表 */}
          <CourseList courses={courses} isLoading={isLoading} userIsPrincipal={userIsPrincipal} onEditCourse={handleEditCourse} onDeleteCourse={handleDeleteCourse} />

          {/* 统计信息 */}
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                共找到{" "}
                <span className="font-medium text-gray-900">{totalCount}</span>{" "}
                个课程
              </div>
              <div className="text-sm text-gray-500">
                第 {currentPage} 页，共 {totalPages} 页
              </div>
            </div>
          </div>

          {/* 分页 */}
          {totalPages > 1 && <div className="flex justify-center">
              <CustomPagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
            </div>}
        </div>
      </main>

      {/* 添加课程模态框 */}
      <AddCourseModal open={showAddModal} onOpenChange={setShowAddModal} onSubmit={handleAddCourseSubmit} />

      {/* 编辑课程模态框 */}
      <EditCourseModal open={showEditModal} onOpenChange={setShowEditModal} course={editingCourse} onSubmit={handleEditCourseSubmit} />
    </div>;
}
