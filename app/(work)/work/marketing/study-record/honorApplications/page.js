/**
 * 荣誉申请页面
 *
 * 支持通过 URL 参数 studentId 查询指定学生的数据
 * 例如: /work/marketing/study-record/honorApplications?studentId=xxx
 */
"use client";

import { CheckCheck, RefreshCw } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "../../../../../../components/ui/alert-dialog.js";
import { Button } from "../../../../../../components/ui/button.js";
import WorkHeader from "../../../../../../components/work/layout/WorkHeader.js";
import { useToast } from "../../../../../../hooks/use-toast.js";
import { useAuth } from "../../../../../../hooks/useAuth.js";
import { batchApproveHonorApplicationsAction, deleteHonorApplicationAction, getAvailableClassroomsAction, getHonorApplicationsAction, processHonorApplicationAction, updateHonorApplicationInfoAction, updateHonorApplicationRemarkAction } from "./actions.js";
import CustomPagination from "./components/CustomPagination.js";
import EditHonorDialog from "./components/EditHonorDialog.js";
import EditRemarkDialog from "./components/EditRemarkDialog.js";
import HonorApplicationFilters from "./components/HonorApplicationFilters.js";
import HonorApplicationList from "./components/HonorApplicationList.js";
import ProcessApplicationDialog from "./components/ProcessApplicationDialog.js";
import ViewApplicationDialog from "./components/ViewApplicationDialog.js";
const PAGE_SIZE = 20;
export default function HonorApplicationsPage() {
  const {
    user
  } = useAuth();
  const {
    toast
  } = useToast();
  const searchParams = useSearchParams();
  const studentIdFromUrl = searchParams.get("studentId");

  // 数据状态
  const [applications, setApplications] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // 分页状态
  const [currentPage, setCurrentPage] = useState(1);

  // 班级数据
  const [classrooms, setClassrooms] = useState([]);
  const [classroomsLoaded, setClassroomsLoaded] = useState(false);

  // 过滤器状态
  const [searchText, setSearchText] = useState("");
  const [studentSearch, setStudentSearch] = useState("");
  const [selectedClassId, setSelectedClassId] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedShowInHonorBoard, setSelectedShowInHonorBoard] = useState("all");
  const [targetStudentId, setTargetStudentId] = useState(null);

  // 选择状态
  const [selectedIds, setSelectedIds] = useState([]);

  // 批量操作状态
  const [isBatchApproving, setIsBatchApproving] = useState(false);
  const [showBatchApproveDialog, setShowBatchApproveDialog] = useState(false);

  // 模态框状态
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [viewingApplication, setViewingApplication] = useState(null);
  const [isEditRemarkDialogOpen, setIsEditRemarkDialogOpen] = useState(false);
  const [currentRemark] = useState("");
  const [isSavingRemark, setIsSavingRemark] = useState(false);
  const [isEditHonorDialogOpen, setIsEditHonorDialogOpen] = useState(false);
  const [editingHonorApplication, setEditingHonorApplication] = useState(null);
  const [isSavingHonor, setIsSavingHonor] = useState(false);
  const [isProcessDialogOpen, setIsProcessDialogOpen] = useState(false);
  const [processingApplication, setProcessingApplication] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingApplication, setDeletingApplication] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // 计算总页数
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  // 获取班级数据
  const fetchClassrooms = useCallback(async () => {
    try {
      const result = await getAvailableClassroomsAction();
      if (result.success) {
        setClassrooms(result.data);
      } else {
        toast({
          title: "获取班级列表失败",
          description: result.error,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("获取班级列表失败:", error);
      toast({
        title: "获取班级列表失败",
        description: "请稍后重试",
        variant: "destructive"
      });
    } finally {
      // 标记班级数据已加载完成（不管成功与否）
      setClassroomsLoaded(true);
    }
  }, [toast]);

  // 获取荣誉申请数据
  const fetchApplications = useCallback(async () => {
    if (!user?.workSetting?.currentSchool) {
      return;
    }
    const classIds = classrooms.map(c => c._id);
    try {
      const result = await getHonorApplicationsAction({
        classIds,
        page: currentPage,
        pageSize: PAGE_SIZE,
        selectedClassId,
        searchText,
        studentSearch,
        selectedStatus,
        selectedShowInHonorBoard,
        targetStudentId
      });
      if (result.success) {
        setApplications(result.data);
        setTotalCount(result.totalCount);
      } else {
        toast({
          title: "获取荣誉申请记录失败",
          description: result.error,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("获取荣誉申请记录失败:", error);
      toast({
        title: "获取荣誉申请记录失败",
        description: "请稍后重试",
        variant: "destructive"
      });
    }
  }, [user?.workSetting?.currentSchool, classrooms, currentPage, selectedClassId, searchText, studentSearch, selectedStatus, selectedShowInHonorBoard, targetStudentId, toast]);

  // 刷新数据
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchApplications();
    setIsRefreshing(false);
  }, [fetchApplications]);

  // 重置过滤条件
  const handleResetFilters = useCallback(() => {
    setSearchText("");
    setStudentSearch("");
    setSelectedClassId("all");
    setSelectedStatus("all");
    setSelectedShowInHonorBoard("all");
    setCurrentPage(1);
  }, []);

  // 处理过滤器搜索
  const handleSearch = useCallback(filters => {
    setSearchText(filters.searchText);
    setStudentSearch(filters.studentSearch);
    setSelectedClassId(filters.selectedClassId);
    setSelectedStatus(filters.selectedStatus);
    setSelectedShowInHonorBoard(filters.selectedShowInHonorBoard);
    setCurrentPage(1);
  }, []);

  // 处理页码变更
  const handlePageChange = useCallback(page => {
    setCurrentPage(page);
  }, []);

  // 查看详情
  const handleViewApplication = useCallback(application => {
    setViewingApplication(application);
    setIsViewDialogOpen(true);
  }, []);

  // 编辑备注（旧版，保留用于简单编辑）
  const handleEditRemark = useCallback(application => {
    setEditingHonorApplication(application);
    setIsEditHonorDialogOpen(true);
  }, []);

  // 保存备注（旧版，已弃用）
  const handleSaveRemark = useCallback(async remark => {
    setIsSavingRemark(true);
    try {
      const result = await updateHonorApplicationRemarkAction({
        applicationId: "",
        teacherRemark: remark
      });
      if (result.success) {
        toast({
          title: "更新成功",
          description: "老师评语已更新"
        });
        setIsEditRemarkDialogOpen(false);
        await fetchApplications();
      } else {
        toast({
          title: "更新失败",
          description: result.error,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("更新老师评语失败:", error);
      toast({
        title: "更新失败",
        description: "请稍后重试",
        variant: "destructive"
      });
    } finally {
      setIsSavingRemark(false);
    }
  }, [toast, fetchApplications]);

  // 保存荣誉信息
  const handleSaveHonor = useCallback(async data => {
    if (!editingHonorApplication) return;
    setIsSavingHonor(true);
    try {
      const result = await updateHonorApplicationInfoAction({
        applicationId: editingHonorApplication._id,
        ...data
      });
      if (result.success) {
        toast({
          title: "保存成功",
          description: "荣誉信息已更新"
        });
        setIsEditHonorDialogOpen(false);
        await fetchApplications();
      } else {
        toast({
          title: "保存失败",
          description: result.error,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("保存荣誉信息失败:", error);
      toast({
        title: "保存失败",
        description: "请稍后重试",
        variant: "destructive"
      });
    } finally {
      setIsSavingHonor(false);
    }
  }, [editingHonorApplication, toast, fetchApplications]);

  // 处理申请
  const handleProcessApplication = useCallback(application => {
    setProcessingApplication(application);
    setIsProcessDialogOpen(true);
  }, []);

  // 提交处理结果
  const handleSubmitProcess = useCallback(async data => {
    if (!user?.workSetting?.currentSchool?._id) {
      toast({
        title: "处理失败",
        description: "无法获取当前校园信息",
        variant: "destructive"
      });
      return;
    }
    setIsProcessing(true);
    try {
      const result = await processHonorApplicationAction({
        ...data,
        schoolId: user.workSetting.currentSchool._id
      });
      if (result.success) {
        toast({
          title: "处理成功",
          description: data.status === "completed" ? "申请已通过，学生积分已增加" : "申请已取消"
        });
        setIsProcessDialogOpen(false);
        await fetchApplications();
      } else {
        toast({
          title: "处理失败",
          description: result.error,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("处理荣誉申请失败:", error);
      toast({
        title: "处理失败",
        description: "请稍后重试",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  }, [user?.workSetting?.currentSchool?._id, toast, fetchApplications]);

  // 删除申请
  const handleDeleteApplication = useCallback(application => {
    setDeletingApplication(application);
    setIsDeleteDialogOpen(true);
  }, []);

  // 确认删除
  const handleConfirmDelete = useCallback(async () => {
    if (!deletingApplication) return;
    setIsDeleting(true);
    try {
      const result = await deleteHonorApplicationAction({
        applicationId: deletingApplication._id
      });
      if (result.success) {
        toast({
          title: "删除成功",
          description: "荣誉申请记录已删除"
        });
        setIsDeleteDialogOpen(false);
        await fetchApplications();
      } else {
        toast({
          title: "删除失败",
          description: result.error,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("删除荣誉申请失败:", error);
      toast({
        title: "删除失败",
        description: "请稍后重试",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
    }
  }, [deletingApplication, toast, fetchApplications]);

  // 批量通过
  const handleBatchApprove = useCallback(() => {
    if (selectedIds.length === 0) {
      toast({
        title: "请选择申请",
        description: "请至少选择一条待审核的申请记录",
        variant: "destructive"
      });
      return;
    }
    setShowBatchApproveDialog(true);
  }, [selectedIds, toast]);

  // 确认批量通过
  const handleConfirmBatchApprove = useCallback(async () => {
    if (selectedIds.length === 0) return;
    setIsBatchApproving(true);
    try {
      const result = await batchApproveHonorApplicationsAction({
        applicationIds: selectedIds
      });
      if (result.success) {
        toast({
          title: "批量通过成功",
          description: `已成功通过 ${result.approvedCount} 条申请`
        });
        setShowBatchApproveDialog(false);
        setSelectedIds([]); // 清空选择
        await fetchApplications();
      } else {
        toast({
          title: "批量通过失败",
          description: result.error,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("批量通过荣誉申请失败:", error);
      toast({
        title: "批量通过失败",
        description: "请稍后重试",
        variant: "destructive"
      });
    } finally {
      setIsBatchApproving(false);
    }
  }, [selectedIds, toast, fetchApplications]);

  // 处理选择变更（当数据刷新时清空选择）
  useEffect(() => {
    setSelectedIds([]);
  }, [currentPage, selectedClassId, searchText, studentSearch, selectedStatus, selectedShowInHonorBoard]);

  // 初始化URL参数中的学生ID
  useEffect(() => {
    if (studentIdFromUrl) {
      setTargetStudentId(studentIdFromUrl);
    }
  }, [studentIdFromUrl]);

  // 初始化数据
  useEffect(() => {
    if (user?.workSetting?.currentSchool) {
      fetchClassrooms();
    }
  }, [user?.workSetting?.currentSchool, fetchClassrooms]);

  useEffect(() => {
    // 只有在班级数据加载完成后才执行查询（即使班级数据为空也要查询）
    if (user?.workSetting?.currentSchool && classroomsLoaded) {
      setIsLoading(true);
      fetchApplications().finally(() => {
        setIsLoading(false);
      });
    }
  }, [user?.workSetting?.currentSchool, classroomsLoaded, currentPage, selectedClassId, searchText, studentSearch, selectedStatus, selectedShowInHonorBoard, fetchApplications]);
  if (!user?.workSetting?.currentSchool) {
    return <div className="p-6 text-center">
        <div className="text-gray-500">请先选择当前校园</div>
      </div>;
  }
  return <div className="min-h-screen bg-gray-50 flex flex-col">
      <WorkHeader title="荣誉申请管理" showBackButton={true} backHref="/work/marketing" backText="返回营销管理" rightContent={<div className="flex items-center space-x-2">
            <Button onClick={handleBatchApprove} disabled={selectedIds.length === 0 || isBatchApproving} variant="default" size="sm" className="bg-green-600 hover:bg-green-700">
              <CheckCheck className="h-4 w-4 mr-2" />
              批量通过 {selectedIds.length > 0 && `(${selectedIds.length})`}
            </Button>
            <Button onClick={handleRefresh} disabled={isRefreshing} variant="outline" size="sm">
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
              刷新数据
            </Button>
          </div>} />

      <main className="flex-1 p-6 space-y-6">
        <div className="container mx-auto space-y-4">
          {/* 过滤器 */}
          <HonorApplicationFilters classrooms={classrooms} searchText={searchText} studentSearch={studentSearch} selectedClassId={selectedClassId} selectedStatus={selectedStatus} selectedShowInHonorBoard={selectedShowInHonorBoard} onSearch={handleSearch} onReset={handleResetFilters} />

          {/* 数据列表 */}
          {isLoading ? <div className="text-center py-8">
              <div className="text-gray-500">加载中...</div>
            </div> : <HonorApplicationList applications={applications} selectedIds={selectedIds} onSelectionChange={setSelectedIds} onView={handleViewApplication} onEdit={handleEditRemark} onProcess={handleProcessApplication} onDelete={handleDeleteApplication} />}

          {/* 分页 */}
          {totalPages > 1 && <div className="flex justify-center">
              <CustomPagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
            </div>}

          {/* 统计信息 */}
          <div className="text-center text-sm text-gray-500">
            {isLoading ? "" : <>
                共有 {totalCount} 条荣誉申请记录，当前显示第 {currentPage}{" "}
                页，共 {totalPages} 页
              </>}
          </div>
        </div>
      </main>

      {/* 模态框 */}
      <ViewApplicationDialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen} application={viewingApplication} />

      <EditRemarkDialog open={isEditRemarkDialogOpen} onOpenChange={setIsEditRemarkDialogOpen} currentRemark={currentRemark} onSave={handleSaveRemark} isSaving={isSavingRemark} />

      <EditHonorDialog open={isEditHonorDialogOpen} onOpenChange={setIsEditHonorDialogOpen} application={editingHonorApplication} onSave={handleSaveHonor} isSaving={isSavingHonor} />

      <ProcessApplicationDialog open={isProcessDialogOpen} onOpenChange={setIsProcessDialogOpen} application={processingApplication} onProcess={handleSubmitProcess} isProcessing={isProcessing} />

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除学生 {deletingApplication?.student?.name} 的荣誉申请吗？
              <br />
              删除后将无法恢复，相关的图片也会被删除。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} disabled={isDeleting} className="bg-red-600 hover:bg-red-700">
              {isDeleting ? "删除中..." : "确认删除"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showBatchApproveDialog} onOpenChange={setShowBatchApproveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认批量通过</AlertDialogTitle>
            <AlertDialogDescription>
              确定要批量通过选中的 {selectedIds.length} 条荣誉申请吗？
              <br />
              通过后将为每位学生创建成长记录并发放相应积分。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isBatchApproving}>
              取消
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmBatchApprove} disabled={isBatchApproving} className="bg-green-600 hover:bg-green-700">
              {isBatchApproving ? "处理中..." : "确认通过"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>;
}
