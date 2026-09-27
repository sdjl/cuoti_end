"use client";

import { RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
// 学生管理页面，提供学生的查看、编辑、删除等功能
import { useCallback, useEffect, useState } from "react";
import StudentDialog from "./components/StudentDialog.js";
import StudentFilters from "./components/StudentFilters.js";
import StudentList from "./components/StudentList.js";
import { CustomPagination } from "../../../../../components/common/Pagination.js";
import { Button } from "../../../../../components/ui/button.js";
import WorkHeader from "../../../../../components/work/layout/WorkHeader.js";
import { useToast } from "../../../../../hooks/use-toast.js";
import { useAuth } from "../../../../../hooks/useAuth.js";
import { deleteStudentAction, getStudentByIdAction, getStudentsAction, getStudentsBindCountsAction, getStudentsBindingsInfoAction, updateStudentAction } from "./actions.js";
import { filterAndSortStudents } from "./clientActions.js";

// 每页显示的学生数量
const PAGE_SIZE = 20;
export default function StudentPage() {
  const {
    user,
    isPrincipal
  } = useAuth();
  const router = useRouter();
  const {
    toast
  } = useToast();
  const [allStudents, setAllStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [bindCounts, setBindCounts] = useState({});
  const [bindingsInfo, setBindingsInfo] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isFiltering, setIsFiltering] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // 过滤器状态
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGender, setSelectedGender] = useState("all");
  const [selectedSortBy, setSelectedSortBy] = useState("studentCode");
  const [selectedSortOrder, setSelectedSortOrder] = useState("asc");

  // 对话框状态
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);

  // 当前用户是否是校长
  const userIsPrincipal = isPrincipal();

  // 分页显示的学生数据
  const paginatedStudents = filteredStudents.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // 计算总页数
  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / PAGE_SIZE));

  // 检查当前校园
  useEffect(() => {
    if (user && !user.workSetting?.currentSchool) {
      router.push("/work/setting/curr-school");
      return;
    }
  }, [user, router]);

  // 获取所有学生数据（仅在初始加载和刷新时调用）
  const fetchAllStudents = useCallback(async () => {
    if (!user?.workSetting?.currentSchool) return;
    setIsLoading(true);
    try {
      // 获取所有学生数据
      const studentsData = await getStudentsAction({
        pageNum: 0,
        pageSize: 10000,
        // 获取大量数据
        keyword: "",
        gender: "all"
      });
      setAllStudents(studentsData);
      // 初始加载时先显示所有数据，后续会通过 useEffect 触发过滤
      setFilteredStudents(studentsData);

      // 获取所有学生的绑定人数和绑定人信息
      if (studentsData.length > 0) {
        const studentIds = studentsData.map(s => s._id);
        const [counts, bindingsInfoData] = await Promise.all([getStudentsBindCountsAction(studentIds), getStudentsBindingsInfoAction(studentIds)]);
        setBindCounts(counts);
        setBindingsInfo(bindingsInfoData);
      }
    } catch (error) {
      console.error("获取学生数据失败:", error);
      toast({
        title: "获取数据失败",
        description: "获取学生数据时发生错误",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [user?.workSetting?.currentSchool, toast]);

  // 过滤和排序学生数据（使用缓存的数据）
  const filterStudentsData = useCallback(() => {
    if (allStudents.length === 0) return;
    console.log("开始过滤学生数据:", {
      allStudentsCount: allStudents.length,
      selectedGender,
      selectedSortBy,
      selectedSortOrder,
      searchTerm
    });
    setIsFiltering(true);
    try {
      const filteredStudents = filterAndSortStudents(allStudents, searchTerm, selectedGender, selectedSortBy, selectedSortOrder);
      console.log("过滤完成:", {
        originalCount: allStudents.length,
        filteredCount: filteredStudents.length
      });
      setFilteredStudents(filteredStudents);
      // 重置到第一页
      setCurrentPage(1);
    } catch (error) {
      console.error("过滤学生数据失败:", error);
      toast({
        title: "过滤失败",
        description: "过滤学生数据时发生错误",
        variant: "destructive"
      });
    } finally {
      setIsFiltering(false);
    }
  }, [allStudents, searchTerm, selectedGender, selectedSortBy, selectedSortOrder, toast]);

  // 获取所有数据（初始加载和手动刷新）
  const fetchAllData = useCallback(async (showRefreshLoading = false) => {
    if (showRefreshLoading) {
      setIsRefreshing(true);
    }
    try {
      await fetchAllStudents();
    } catch (error) {
      console.error("获取学生数据失败:", error);
    } finally {
      setIsRefreshing(false);
    }
  }, [fetchAllStudents]);

  // 当用户信息加载完成后，获取学生数据
  useEffect(() => {
    if (user?.workSetting?.currentSchool) {
      fetchAllData(false);
    }
  }, [user?.workSetting?.currentSchool, fetchAllData]);

  // 当过滤条件变化时，重新过滤数据
  useEffect(() => {
    filterStudentsData();
  }, [filterStudentsData]);

  // 手动刷新数据
  const handleRefresh = useCallback(() => {
    fetchAllData(true);
  }, [fetchAllData]);

  // 重置过滤器
  const handleResetFilters = useCallback(() => {
    setSearchTerm("");
    setSelectedGender("all");
    setSelectedSortBy("studentCode");
    setSelectedSortOrder("asc");
    setCurrentPage(1);
  }, []);

  // 处理页码变更
  const handlePageChange = useCallback(page => {
    setCurrentPage(page);
  }, []);

  // 处理编辑学生
  const handleEditStudent = useCallback(async studentId => {
    if (!userIsPrincipal) {
      return;
    }
    try {
      const {
        student,
        error
      } = await getStudentByIdAction(studentId);
      if (error) {
        toast({
          title: "获取学生信息失败",
          description: error,
          variant: "destructive"
        });
        return;
      }
      setEditingStudent(student);
      setDialogOpen(true);
    } catch (error) {
      console.error("获取学生信息失败:", error);
      toast({
        title: "获取学生信息失败",
        description: "获取学生信息时发生错误",
        variant: "destructive"
      });
    }
  }, [userIsPrincipal, toast]);

  // 处理删除学生
  const handleDeleteStudent = useCallback(async studentId => {
    if (!userIsPrincipal) {
      return;
    }
    try {
      const {
        success,
        error
      } = await deleteStudentAction(studentId);
      if (!success) {
        toast({
          title: "删除失败",
          description: error || "删除学生时发生错误",
          variant: "destructive"
        });
        return;
      }
      toast({
        title: "删除成功",
        description: "学生已成功删除"
      });

      // 刷新数据
      await fetchAllData();
    } catch (error) {
      console.error("删除学生失败:", error);
      toast({
        title: "删除失败",
        description: "删除学生时发生错误",
        variant: "destructive"
      });
    }
  }, [userIsPrincipal, toast, fetchAllData]);

  // 处理保存学生
  const handleSaveStudent = useCallback(async studentData => {
    try {
      if (!editingStudent) {
        return;
      }
      const {
        success,
        error
      } = await updateStudentAction(editingStudent._id, studentData);
      if (!success) {
        toast({
          title: "保存失败",
          description: error || "保存学生信息时发生错误",
          variant: "destructive"
        });
        return;
      }
      toast({
        title: "保存成功",
        description: "学生信息已成功更新"
      });

      // 刷新数据
      await fetchAllData();
    } catch (error) {
      console.error("保存学生失败:", error);
      toast({
        title: "保存失败",
        description: "保存学生信息时发生错误",
        variant: "destructive"
      });
    }
  }, [editingStudent, toast, fetchAllData]);

  // 处理更新备注
  const handleUpdateNotes = useCallback(async (studentId, notes) => {
    const {
      success,
      error
    } = await updateStudentAction(studentId, {
      notes
    });
    if (!success) {
      throw new Error(error || "更新备注失败");
    }

    // 刷新数据
    await fetchAllData();
  }, [fetchAllData]);
  return <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <WorkHeader title="学生管理" showBackButton={true} backHref="/work/school" backText="返回校园" rightContent={<Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing} className="flex items-center">
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
            刷新数据
          </Button>} />

      <main className="flex-1 p-6 space-y-6">
        <div className="container mx-auto space-y-4">
          {/* 过滤器 */}
          <StudentFilters searchTerm={searchTerm} setSearchTerm={setSearchTerm} selectedGender={selectedGender} setSelectedGender={setSelectedGender} selectedSortBy={selectedSortBy} setSelectedSortBy={setSelectedSortBy} selectedSortOrder={selectedSortOrder} setSelectedSortOrder={setSelectedSortOrder} onReset={handleResetFilters} />

          {/* 学生列表 */}
          <StudentList students={paginatedStudents} isLoading={isLoading || isFiltering} isPrincipal={userIsPrincipal} onEditStudent={handleEditStudent} onDeleteStudent={handleDeleteStudent} onUpdateNotes={handleUpdateNotes} bindCounts={bindCounts} bindingsInfo={bindingsInfo} />

          {/* 分页 */}
          {totalPages > 1 && <div className="flex justify-center">
              <CustomPagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} pageParamName="student_page" />
            </div>}

          {/* 统计信息 */}
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="text-sm text-gray-600">
              {searchTerm || selectedGender !== "all" ? <>
                  共找到 {filteredStudents.length} 个学生（总共{" "}
                  {allStudents.length} 个）， 当前显示第 {currentPage} 页，共{" "}
                  {totalPages} 页
                </> : <>
                  共有 {allStudents.length} 个学生，当前显示第 {currentPage}{" "}
                  页，共 {totalPages} 页
                </>}
            </div>
          </div>
        </div>
      </main>

      {/* 编辑学生对话框 */}
      <StudentDialog open={dialogOpen} onOpenChange={setDialogOpen} student={editingStudent} onSave={handleSaveStudent} />
    </div>;
}
