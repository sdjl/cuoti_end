"use client";

import { Plus, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
// 手动积分记录页面，用于查看和管理老师手动为学生调整的积分记录
import { useCallback, useEffect, useState } from "react";
import { CustomPagination } from "../../../../../../components/common/Pagination.js";
import { Button } from "../../../../../../components/ui/button.js";
import WorkHeader from "../../../../../../components/work/layout/WorkHeader.js";
import { useToast } from "../../../../../../hooks/use-toast.js";
import { useAuth } from "../../../../../../hooks/useAuth.js";
import { createManualRecordAction, getAvailableClassroomsAction, getManualRecordsAction, searchStudentsInClassAction, updateManualRecordReasonAction } from "./actions.js";
import CreateManualRecordDialog from "./components/CreateManualRecordDialog.js";
import EditReasonDialog from "./components/EditReasonDialog.js";
import ManualRecordsFilters from "./components/ManualRecordsFilters.js";
import ManualRecordsList from "./components/ManualRecordsList.js";

// 每页显示的记录数量
const PAGE_SIZE = 20;
export default function ManualRecordsPage() {
  const {
    user
  } = useAuth();
  const router = useRouter();
  const {
    toast
  } = useToast();
  const [records, setRecords] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // 班级数据
  const [classrooms, setClassrooms] = useState([]);

  // 过滤器状态
  const [searchText, setSearchText] = useState("");
  const [studentSearch, setStudentSearch] = useState("");
  const [selectedClassId, setSelectedClassId] = useState("all");

  // 新建对话框状态
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // 编辑原因对话框状态
  const [isEditReasonDialogOpen, setIsEditReasonDialogOpen] = useState(false);
  const [editingRecordId, setEditingRecordId] = useState("");
  const [currentReason, setCurrentReason] = useState("");
  const [isSavingReason, setIsSavingReason] = useState(false);

  // 计算总页数
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  // 检查当前校园
  useEffect(() => {
    if (user && !user.workSetting?.currentSchool) {
      router.push("/work/setting/curr-school");
      return;
    }
  }, [user, router]);

  // 获取可查看的班级列表
  const fetchClassrooms = useCallback(async () => {
    try {
      const result = await getAvailableClassroomsAction();
      if (result.success) {
        setClassrooms(result.data);
      } else {
        console.error("获取班级列表失败:", result.error);
      }
    } catch (error) {
      console.error("获取班级列表失败:", error);
    }
  }, []);

  // 获取手动积分记录数据
  const fetchRecords = useCallback(async () => {
    if (!user?.workSetting?.currentSchool || classrooms.length === 0) return;
    setIsLoading(true);
    try {
      // 获取班级ID数组
      const classIds = classrooms.map(classroom => classroom._id);
      const result = await getManualRecordsAction({
        classIds,
        pageNum: currentPage - 1,
        pageSize: PAGE_SIZE,
        selectedClassId,
        searchText,
        studentSearch
      });
      if (result.success) {
        setRecords(result.data);
        setTotalCount(result.totalCount);
      } else {
        toast({
          title: "获取数据失败",
          description: result.error || "获取手动积分记录数据时发生错误",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("获取手动积分记录数据失败:", error);
      toast({
        title: "获取数据失败",
        description: "获取手动积分记录数据时发生错误",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [user?.workSetting?.currentSchool, classrooms, currentPage, selectedClassId, searchText, studentSearch, toast]);

  // 手动刷新数据
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await fetchRecords();
    } finally {
      setIsRefreshing(false);
    }
  }, [fetchRecords]);

  // 重置过滤器
  const handleResetFilters = useCallback(() => {
    setSearchText("");
    setStudentSearch("");
    setSelectedClassId("all");
    setCurrentPage(1);
  }, []);

  // 处理页码变更
  const handlePageChange = useCallback(page => {
    setCurrentPage(page);
  }, []);

  // 搜索学生
  const handleSearchStudent = useCallback(async (classId, searchText) => {
    try {
      const result = await searchStudentsInClassAction({
        classId,
        searchText
      });
      return result.students || [];
    } catch (error) {
      console.error("搜索学生失败:", error);
      return [];
    }
  }, []);

  // 创建手动积分记录
  const handleCreateRecord = useCallback(async data => {
    if (!user?.workSetting?.currentSchool) {
      toast({
        title: "操作失败",
        description: "请先选择当前管理的校园",
        variant: "destructive"
      });
      return;
    }
    setIsCreating(true);
    try {
      const result = await createManualRecordAction({
        schoolId: user.workSetting.currentSchool._id,
        ...data
      });
      if (result.success) {
        toast({
          title: "创建成功",
          description: "手动积分记录已创建"
        });

        // 关闭对话框
        setIsCreateDialogOpen(false);

        // 刷新数据
        await fetchRecords();
      } else {
        toast({
          title: "创建失败",
          description: result.error || "创建手动积分记录时发生错误",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("创建手动积分记录失败:", error);
      toast({
        title: "创建失败",
        description: "创建手动积分记录时发生错误",
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  }, [user?.workSetting?.currentSchool, toast, fetchRecords]);

  // 编辑原因
  const handleEditReason = useCallback((recordId, reason) => {
    setEditingRecordId(recordId);
    setCurrentReason(reason);
    setIsEditReasonDialogOpen(true);
  }, []);

  // 保存原因
  const handleSaveReason = useCallback(async reason => {
    if (!editingRecordId) return;
    setIsSavingReason(true);
    try {
      const result = await updateManualRecordReasonAction({
        recordId: editingRecordId,
        reason
      });
      if (result.success) {
        toast({
          title: "保存成功",
          description: "修改原因已更新"
        });

        // 关闭对话框
        setIsEditReasonDialogOpen(false);
        setEditingRecordId("");
        setCurrentReason("");

        // 刷新数据
        await fetchRecords();
      } else {
        toast({
          title: "保存失败",
          description: result.error || "更新修改原因时发生错误",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("更新修改原因失败:", error);
      toast({
        title: "保存失败",
        description: "更新修改原因时发生错误",
        variant: "destructive"
      });
    } finally {
      setIsSavingReason(false);
    }
  }, [editingRecordId, toast, fetchRecords]);

  // 初始化时获取班级列表
  useEffect(() => {
    if (user?.workSetting?.currentSchool) {
      fetchClassrooms();
    }
  }, [user?.workSetting?.currentSchool, fetchClassrooms]);

  // 当过滤条件或页码变化时，重新获取数据
  useEffect(() => {
    if (user?.workSetting?.currentSchool && classrooms.length > 0) {
      fetchRecords();
    }
  }, [fetchRecords, user?.workSetting?.currentSchool, classrooms]);

  // 当过滤条件变化时，重置到第一页
  useEffect(() => {
    setCurrentPage(1);
  }, [searchText, studentSearch, selectedClassId]);
  return <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <WorkHeader title="手动积分记录" showBackButton={true} backHref="/work/marketing" backText="返回营销管理" rightContent={<div className="flex items-center space-x-2">
            <Button onClick={handleRefresh} disabled={isRefreshing} variant="outline" size="sm">
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
              刷新数据
            </Button>
            <Button onClick={() => setIsCreateDialogOpen(true)} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              新建记录
            </Button>
          </div>} />

      <main className="flex-1 p-6 space-y-6">
        <div className="container mx-auto space-y-4">
          {/* 过滤器 */}
          <ManualRecordsFilters searchText={searchText} setSearchText={setSearchText} studentSearch={studentSearch} setStudentSearch={setStudentSearch} selectedClassId={selectedClassId} setSelectedClassId={setSelectedClassId} classrooms={classrooms} onReset={handleResetFilters} />

          {/* 手动积分记录列表 */}
          <ManualRecordsList records={records} isLoading={isLoading} onEditReason={handleEditReason} />

          {/* 分页 */}
          {totalPages > 1 && <div className="flex justify-center">
              <CustomPagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} pageParamName="manual_page" />
            </div>}

          {/* 统计信息 */}
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="text-sm text-gray-600">
              {searchText || studentSearch || selectedClassId !== "all" ? <>
                  共找到 {totalCount} 条手动积分记录， 当前显示第 {currentPage}{" "}
                  页，共 {totalPages} 页
                </> : <>
                  共有 {totalCount} 条手动积分记录，当前显示第 {currentPage}{" "}
                  页，共 {totalPages} 页
                </>}
            </div>
          </div>
        </div>
      </main>

      {/* 新建记录对话框 */}
      <CreateManualRecordDialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen} classrooms={classrooms} onCreate={handleCreateRecord} isCreating={isCreating} onSearchStudent={handleSearchStudent} />

      {/* 编辑原因对话框 */}
      <EditReasonDialog open={isEditReasonDialogOpen} onOpenChange={setIsEditReasonDialogOpen} currentReason={currentReason} onSave={handleSaveReason} isSaving={isSavingReason} />
    </div>;
}
