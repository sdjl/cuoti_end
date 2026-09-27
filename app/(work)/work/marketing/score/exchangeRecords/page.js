/**
 * 积分兑换页面
 *
 * 支持通过 URL 参数 studentId 查询指定学生的数据
 * 例如: /work/marketing/score/exchangeRecords?studentId=xxx
 */
"use client";

import { RefreshCw } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { CustomPagination } from "../../../../../../components/common/Pagination.js";
import { Button } from "../../../../../../components/ui/button.js";
import WorkHeader from "../../../../../../components/work/layout/WorkHeader.js";
import { useToast } from "../../../../../../hooks/use-toast.js";
import { useAuth } from "../../../../../../hooks/useAuth.js";
import { getExchangeRecordByIdAction, getExchangeRecordsAction, processExchangeRecordAction, updateExchangeRecordRemarkAction } from "./actions.js";
import EditRemarkDialog from "./components/EditRemarkDialog.js";
import ExchangeRecordsFilters from "./components/ExchangeRecordsFilters.js";
import ExchangeRecordsList from "./components/ExchangeRecordsList.js";
import ProcessExchangeDialog from "./components/ProcessExchangeDialog.js";

// 每页显示的记录数量
const PAGE_SIZE = 20;
export default function ExchangeRecordsPage() {
  const {
    user
  } = useAuth();
  const router = useRouter();
  const {
    toast
  } = useToast();
  const searchParams = useSearchParams();
  const studentIdFromUrl = searchParams.get("studentId");
  const [records, setRecords] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // 过滤器状态
  const [searchText, setSearchText] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [targetStudentId, setTargetStudentId] = useState(null);

  // 处理对话框状态
  const [isProcessDialogOpen, setIsProcessDialogOpen] = useState(false);
  const [processingRecord, setProcessingRecord] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // 编辑备注对话框状态
  const [isEditRemarkDialogOpen, setIsEditRemarkDialogOpen] = useState(false);
  const [editingRecordId, setEditingRecordId] = useState("");
  const [currentRemark, setCurrentRemark] = useState("");
  const [isSavingRemark, setIsSavingRemark] = useState(false);

  // 计算总页数
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  // 检查当前校园
  useEffect(() => {
    if (user && !user.workSetting?.currentSchool) {
      router.push("/work/setting/curr-school");
      return;
    }
  }, [user, router]);

  // 获取积分兑换记录数据
  const fetchRecords = useCallback(async () => {
    if (!user?.workSetting?.currentSchool) return;
    setIsLoading(true);
    try {
      const result = await getExchangeRecordsAction({
        schoolId: user.workSetting.currentSchool._id,
        pageNum: currentPage - 1,
        pageSize: PAGE_SIZE,
        searchText,
        status: selectedStatus,
        targetStudentId
      });
      if (result.success) {
        setRecords(result.data);
        setTotalCount(result.totalCount);
      } else {
        toast({
          title: "获取数据失败",
          description: result.error || "获取积分兑换记录数据时发生错误",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("获取积分兑换记录数据失败:", error);
      toast({
        title: "获取数据失败",
        description: "获取积分兑换记录数据时发生错误",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [user?.workSetting?.currentSchool, currentPage, searchText, selectedStatus, targetStudentId, toast]);

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
    setSelectedStatus("all");
    setCurrentPage(1);
  }, []);

  // 处理页码变更
  const handlePageChange = useCallback(page => {
    setCurrentPage(page);
  }, []);

  // 处理兑换记录
  const handleProcessRecord = useCallback(async recordId => {
    try {
      const result = await getExchangeRecordByIdAction(recordId);
      if (result.success && result.exchangeRecord) {
        setProcessingRecord(result.exchangeRecord);
        setIsProcessDialogOpen(true);
      } else {
        toast({
          title: "获取记录失败",
          description: result.error || "获取兑换记录详情失败",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("获取兑换记录详情失败:", error);
      toast({
        title: "获取记录失败",
        description: "获取兑换记录详情时发生错误",
        variant: "destructive"
      });
    }
  }, [toast]);

  // 编辑备注
  const handleEditRemark = useCallback((recordId, remark) => {
    setEditingRecordId(recordId);
    setCurrentRemark(remark);
    setIsEditRemarkDialogOpen(true);
  }, []);

  // 保存备注
  const handleSaveRemark = useCallback(async remark => {
    if (!editingRecordId) return;
    setIsSavingRemark(true);
    try {
      const result = await updateExchangeRecordRemarkAction({
        exchangeId: editingRecordId,
        teacherRemark: remark
      });
      if (result.success) {
        toast({
          title: "保存成功",
          description: "老师备注已更新"
        });

        // 关闭对话框
        setIsEditRemarkDialogOpen(false);
        setEditingRecordId("");
        setCurrentRemark("");

        // 刷新数据
        await fetchRecords();
      } else {
        toast({
          title: "保存失败",
          description: result.error || "更新老师备注时发生错误",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("更新老师备注失败:", error);
      toast({
        title: "保存失败",
        description: "更新老师备注时发生错误",
        variant: "destructive"
      });
    } finally {
      setIsSavingRemark(false);
    }
  }, [editingRecordId, toast, fetchRecords]);

  // 提交处理结果
  const handleSubmitProcess = useCallback(async data => {
    if (!processingRecord) return;
    setIsProcessing(true);
    try {
      const result = await processExchangeRecordAction({
        exchangeId: processingRecord._id,
        newStatus: data.newStatus,
        teacherRemark: data.teacherRemark
      });
      if (result.success) {
        toast({
          title: "处理成功",
          description: `兑换记录已${data.newStatus === "completed" ? "完成" : "取消"}`
        });

        // 关闭对话框
        setIsProcessDialogOpen(false);
        setProcessingRecord(null);

        // 刷新数据
        await fetchRecords();
      } else {
        toast({
          title: "处理失败",
          description: result.error || "处理兑换记录时发生错误",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("处理兑换记录失败:", error);
      toast({
        title: "处理失败",
        description: "处理兑换记录时发生错误",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  }, [processingRecord, toast, fetchRecords]);

  // 初始化URL参数中的学生ID
  useEffect(() => {
    if (studentIdFromUrl) {
      setTargetStudentId(studentIdFromUrl);
    }
  }, [studentIdFromUrl]);

  // 当过滤条件或页码变化时，重新获取数据
  useEffect(() => {
    if (user?.workSetting?.currentSchool) {
      fetchRecords();
    }
  }, [fetchRecords, user?.workSetting?.currentSchool]);

  // 当过滤条件变化时，重置到第一页
  useEffect(() => {
    setCurrentPage(1);
  }, [searchText, selectedStatus]);
  return <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <WorkHeader title="积分兑换记录" showBackButton={true} backHref="/work/marketing" backText="返回营销管理" rightContent={<div className="flex items-center space-x-2">
            <Button onClick={handleRefresh} disabled={isRefreshing} variant="outline" size="sm">
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
              刷新数据
            </Button>
          </div>} />

      <main className="flex-1 p-6 space-y-6">
        <div className="container mx-auto space-y-4">
          {/* 过滤器 */}
          <ExchangeRecordsFilters searchText={searchText} setSearchText={setSearchText} selectedStatus={selectedStatus} setSelectedStatus={setSelectedStatus} onReset={handleResetFilters} />

          {/* 积分兑换记录列表 */}
          <ExchangeRecordsList records={records} isLoading={isLoading} onProcess={handleProcessRecord} onEditRemark={handleEditRemark} />

          {/* 分页 */}
          {totalPages > 1 && <div className="flex justify-center">
              <CustomPagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} pageParamName="exchange_page" />
            </div>}

          {/* 统计信息 */}
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="text-sm text-gray-600">
              {searchText || selectedStatus !== "all" ? <>
                  共找到 {totalCount} 条兑换记录， 当前显示第 {currentPage}{" "}
                  页，共 {totalPages} 页
                </> : <>
                  共有 {totalCount} 条兑换记录，当前显示第 {currentPage} 页，共{" "}
                  {totalPages} 页
                </>}
            </div>
          </div>
        </div>
      </main>

      {/* 处理对话框 */}
      <ProcessExchangeDialog open={isProcessDialogOpen} onOpenChange={setIsProcessDialogOpen} exchangeRecord={processingRecord} onProcess={handleSubmitProcess} isProcessing={isProcessing} />

      {/* 编辑备注对话框 */}
      <EditRemarkDialog open={isEditRemarkDialogOpen} onOpenChange={setIsEditRemarkDialogOpen} currentRemark={currentRemark} onSave={handleSaveRemark} isSaving={isSavingRemark} />
    </div>;
}
