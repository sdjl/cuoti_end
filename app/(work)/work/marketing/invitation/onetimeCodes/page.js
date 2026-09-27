"use client";

// 一次性邀请码管理页面，用于创建、编辑和管理一次性邀请码
import { Plus, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { CustomPagination } from "../../../../../../components/common/Pagination.js";
import { Button } from "../../../../../../components/ui/button.js";
import WorkHeader from "../../../../../../components/work/layout/WorkHeader.js";
import { useToast } from "../../../../../../hooks/use-toast.js";
import { useAuth } from "../../../../../../hooks/useAuth.js";
import { createOnetimeInvitationCodesAction, deleteUnusedInvitationCodesAction, exportUnusedInvitationCodesAction, getInvitationCodeByIdAction, getOnetimeInvitationCodesAction, updateInvitationCodeAction } from "./actions.js";
import OnetimeCodeDialog from "./components/OnetimeCodeDialog.js";
import OnetimeCodeFilters from "./components/OnetimeCodeFilters.js";
import OnetimeCodeList from "./components/OnetimeCodeList.js";

// 每页显示的邀请码数量
const PAGE_SIZE = 20;
export default function OnetimeCodesPage() {
  const {
    user
  } = useAuth();
  const router = useRouter();
  const {
    toast
  } = useToast();
  const [invitationCodes, setInvitationCodes] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // 过滤器状态
  const [searchCode, setSearchCode] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedIsUsed, setSelectedIsUsed] = useState("all");

  // 对话框状态
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingInvitationCode, setEditingInvitationCode] = useState(null);

  // 计算总页数
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  // 检查当前校园
  useEffect(() => {
    if (user && !user.workSetting?.currentSchool) {
      router.push("/work/setting/curr-school");
      return;
    }
  }, [user, router]);

  // 获取邀请码数据
  const fetchInvitationCodes = useCallback(async () => {
    if (!user?.workSetting?.currentSchool) return;
    setIsLoading(true);
    try {
      const result = await getOnetimeInvitationCodesAction({
        schoolId: user.workSetting.currentSchool._id,
        pageNum: currentPage - 1,
        pageSize: PAGE_SIZE,
        code: searchCode,
        status: selectedStatus,
        isUsed: selectedIsUsed
      });
      if (result.success) {
        setInvitationCodes(result.data);
        setTotalCount(result.totalCount);
      } else {
        toast({
          title: "获取数据失败",
          description: result.error || "获取邀请码数据时发生错误",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("获取邀请码数据失败:", error);
      toast({
        title: "获取数据失败",
        description: "获取邀请码数据时发生错误",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [user?.workSetting?.currentSchool, currentPage, searchCode, selectedStatus, selectedIsUsed, toast]);

  // 手动刷新数据
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await fetchInvitationCodes();
    } finally {
      setIsRefreshing(false);
    }
  }, [fetchInvitationCodes]);

  // 重置过滤器
  const handleResetFilters = useCallback(() => {
    setSearchCode("");
    setSelectedStatus("all");
    setSelectedIsUsed("all");
    setCurrentPage(1);
  }, []);

  // 处理页码变更
  const handlePageChange = useCallback(page => {
    setCurrentPage(page);
  }, []);

  // 当过滤条件或页码变化时，重新获取数据
  useEffect(() => {
    if (user?.workSetting?.currentSchool) {
      fetchInvitationCodes();
    }
  }, [fetchInvitationCodes, user?.workSetting?.currentSchool]);

  // 当过滤条件变化时，重置到第一页
  useEffect(() => {
    setCurrentPage(1);
  }, [searchCode, selectedStatus, selectedIsUsed]);

  // 处理新建邀请码
  const handleAddInvitationCode = useCallback(() => {
    setEditingInvitationCode(null);
    setDialogOpen(true);
  }, []);

  // 处理编辑邀请码
  const handleEditInvitationCode = useCallback(async invitationCodeId => {
    try {
      const result = await getInvitationCodeByIdAction(invitationCodeId, invitationCodes);
      if (!result.success) {
        toast({
          title: "获取邀请码信息失败",
          description: result.error,
          variant: "destructive"
        });
        return;
      }
      setEditingInvitationCode(result.invitationCode);
      setDialogOpen(true);
    } catch (error) {
      console.error("获取邀请码信息失败:", error);
      toast({
        title: "获取邀请码信息失败",
        description: "获取邀请码信息时发生错误",
        variant: "destructive"
      });
    }
  }, [toast, invitationCodes]);

  // 处理保存邀请码（编辑）
  const handleSaveInvitationCode = useCallback(async invitationCodeData => {
    try {
      if (!editingInvitationCode) return;
      const result = await updateInvitationCodeAction(editingInvitationCode._id, invitationCodeData);
      if (!result.success) {
        toast({
          title: "保存失败",
          description: result.error || "保存邀请码信息时发生错误",
          variant: "destructive"
        });
        return;
      }
      toast({
        title: "保存成功",
        description: "邀请码信息已成功更新"
      });

      // 刷新数据
      await fetchInvitationCodes();
    } catch (error) {
      console.error("保存邀请码失败:", error);
      toast({
        title: "保存失败",
        description: "保存邀请码信息时发生错误",
        variant: "destructive"
      });
    }
  }, [editingInvitationCode, toast, fetchInvitationCodes]);

  // 处理批量创建邀请码
  const handleBatchCreateInvitationCodes = useCallback(async batchData => {
    try {
      const result = await createOnetimeInvitationCodesAction({
        schoolId: user?.workSetting?.currentSchool?._id || "",
        ...batchData
      });
      if (!result.success) {
        toast({
          title: "批量生成失败",
          description: result.error || "批量生成邀请码时发生错误",
          variant: "destructive"
        });
        return;
      }
      toast({
        title: "批量生成成功",
        description: `成功生成 ${result.count} 个邀请码`
      });

      // 刷新数据
      await fetchInvitationCodes();
    } catch (error) {
      console.error("批量生成邀请码失败:", error);
      toast({
        title: "批量生成失败",
        description: "批量生成邀请码时发生错误",
        variant: "destructive"
      });
    }
  }, [user?.workSetting?.currentSchool, toast, fetchInvitationCodes]);

  // 处理删除未使用邀请码
  const handleDeleteUnused = useCallback(async () => {
    setIsDeleting(true);
    try {
      const result = await deleteUnusedInvitationCodesAction({
        schoolId: user?.workSetting?.currentSchool?._id || "",
        code: searchCode,
        status: selectedStatus,
        isUsed: selectedIsUsed
      });
      if (!result.success) {
        toast({
          title: "删除失败",
          description: result.error || "删除未使用邀请码时发生错误",
          variant: "destructive"
        });
        return;
      }
      toast({
        title: "删除成功",
        description: `成功删除 ${result.deletedCount} 个未使用的邀请码`
      });

      // 刷新数据
      await fetchInvitationCodes();
    } catch (error) {
      console.error("删除未使用邀请码失败:", error);
      toast({
        title: "删除失败",
        description: "删除未使用邀请码时发生错误",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
    }
  }, [user?.workSetting?.currentSchool, searchCode, selectedStatus, selectedIsUsed, toast, fetchInvitationCodes]);

  // 处理导出未使用邀请码
  const handleExportUnused = useCallback(async () => {
    setIsExporting(true);
    try {
      const result = await exportUnusedInvitationCodesAction({
        schoolId: user?.workSetting?.currentSchool?._id || "",
        code: searchCode,
        status: selectedStatus,
        isUsed: selectedIsUsed
      });
      if (!result.success) {
        toast({
          title: "导出失败",
          description: result.error || "导出未使用邀请码时发生错误",
          variant: "destructive"
        });
        return;
      }
      if (result.codes.length === 0) {
        toast({
          title: "导出提示",
          description: "没有找到符合条件的未使用邀请码"
        });
        return;
      }

      // 创建下载文件
      const content = result.codes.join("\n");
      const blob = new Blob([content], {
        type: "text/plain;charset=utf-8"
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "邀请码.txt";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast({
        title: "导出成功",
        description: `成功导出 ${result.codes.length} 个未使用的邀请码`
      });
    } catch (error) {
      console.error("导出未使用邀请码失败:", error);
      toast({
        title: "导出失败",
        description: "导出未使用邀请码时发生错误",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  }, [user?.workSetting?.currentSchool, searchCode, selectedStatus, selectedIsUsed, toast]);
  return <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <WorkHeader title="一次性邀请码管理" showBackButton={true} backHref="/work/marketing" backText="返回营销管理" rightContent={<div className="flex items-center space-x-2">
            <Button onClick={handleRefresh} disabled={isRefreshing} variant="outline" size="sm">
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
              刷新数据
            </Button>
            <Button onClick={handleAddInvitationCode} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              批量生成
            </Button>
          </div>} />

      <main className="flex-1 p-6 space-y-6">
        <div className="container mx-auto space-y-4">
          {/* 过滤器 */}
          <OnetimeCodeFilters searchCode={searchCode} setSearchCode={setSearchCode} selectedStatus={selectedStatus} setSelectedStatus={setSelectedStatus} selectedIsUsed={selectedIsUsed} setSelectedIsUsed={setSelectedIsUsed} onReset={handleResetFilters} onDeleteUnused={handleDeleteUnused} onExportUnused={handleExportUnused} isDeleting={isDeleting} isExporting={isExporting} />

          {/* 邀请码列表 */}
          <OnetimeCodeList invitationCodes={invitationCodes} isLoading={isLoading} onEditInvitationCode={handleEditInvitationCode} />

          {/* 分页 */}
          {totalPages > 1 && <div className="flex justify-center">
              <CustomPagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} pageParamName="onetime_page" />
            </div>}

          {/* 统计信息 */}
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="text-sm text-gray-600">
              {searchCode || selectedStatus !== "all" || selectedIsUsed !== "all" ? <>
                  共找到 {totalCount} 个一次性邀请码， 当前显示第 {currentPage}{" "}
                  页，共 {totalPages} 页
                </> : <>
                  共有 {totalCount} 个一次性邀请码，当前显示第 {currentPage}{" "}
                  页，共 {totalPages} 页
                </>}
            </div>
          </div>
        </div>
      </main>

      {/* 新建/编辑邀请码对话框 */}
      <OnetimeCodeDialog open={dialogOpen} onOpenChange={setDialogOpen} invitationCode={editingInvitationCode} onSave={handleSaveInvitationCode} onBatchCreate={handleBatchCreateInvitationCodes} />
    </div>;
}
