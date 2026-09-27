"use client";

import { Plus, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
// 合作伙伴邀请码管理页面，提供邀请码的创建、编辑、查询和分页功能
import { useCallback, useEffect, useState } from "react";
import { CustomPagination } from "../../../../../../components/common/Pagination.js";
import { Button } from "../../../../../../components/ui/button.js";
import WorkHeader from "../../../../../../components/work/layout/WorkHeader.js";
import { useToast } from "../../../../../../hooks/use-toast.js";
import { useAuth } from "../../../../../../hooks/useAuth.js";
import { createInvitationCodeAction, getInvitationCodeByIdAction, getPartnerInvitationCodesAction, updateInvitationCodeAction } from "./actions.js";
import PartnerCodeDialog from "./components/PartnerCodeDialog.js";
import PartnerCodeFilters from "./components/PartnerCodeFilters.js";
import PartnerCodeList from "./components/PartnerCodeList.js";

// 每页显示的邀请码数量
const PAGE_SIZE = 20;
export default function PartnerCodesPage() {
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
      const result = await getPartnerInvitationCodesAction({
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

  // 处理保存邀请码
  const handleSaveInvitationCode = useCallback(async invitationCodeData => {
    try {
      let result;
      if (editingInvitationCode) {
        // 编辑
        result = await updateInvitationCodeAction(editingInvitationCode._id, {
          schoolId: user?.workSetting?.currentSchool?._id || "",
          ...invitationCodeData
        });
      } else {
        // 新建
        result = await createInvitationCodeAction({
          schoolId: user?.workSetting?.currentSchool?._id || "",
          ...invitationCodeData
        });
      }
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
        description: editingInvitationCode ? "邀请码信息已成功更新" : "邀请码已成功创建"
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
  }, [user?.workSetting?.currentSchool, editingInvitationCode, toast, fetchInvitationCodes]);
  return <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <WorkHeader title="合作伙伴邀请码管理" showBackButton={true} backHref="/work/marketing" backText="返回营销管理" rightContent={<div className="flex items-center space-x-2">
            <Button onClick={handleRefresh} disabled={isRefreshing} variant="outline" size="sm">
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
              刷新数据
            </Button>
            <Button onClick={handleAddInvitationCode} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              新建邀请码
            </Button>
          </div>} />

      <main className="flex-1 p-6 space-y-6">
        <div className="container mx-auto space-y-4">
          {/* 过滤器 */}
          <PartnerCodeFilters searchCode={searchCode} setSearchCode={setSearchCode} selectedStatus={selectedStatus} setSelectedStatus={setSelectedStatus} selectedIsUsed={selectedIsUsed} setSelectedIsUsed={setSelectedIsUsed} onReset={handleResetFilters} />

          {/* 邀请码列表 */}
          <PartnerCodeList invitationCodes={invitationCodes} isLoading={isLoading} onEditInvitationCode={handleEditInvitationCode} />

          {/* 分页 */}
          {totalPages > 1 && <div className="flex justify-center">
              <CustomPagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} pageParamName="partner_page" />
            </div>}

          {/* 统计信息 */}
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="text-sm text-gray-600">
              {searchCode || selectedStatus !== "all" || selectedIsUsed !== "all" ? <>
                  共找到 {totalCount} 个合作伙伴邀请码， 当前显示第{" "}
                  {currentPage} 页，共 {totalPages} 页
                </> : <>
                  共有 {totalCount} 个合作伙伴邀请码，当前显示第 {currentPage}{" "}
                  页，共 {totalPages} 页
                </>}
            </div>
          </div>
        </div>
      </main>

      {/* 新建/编辑邀请码对话框 */}
      <PartnerCodeDialog open={dialogOpen} onOpenChange={setDialogOpen} invitationCode={editingInvitationCode} onSave={handleSaveInvitationCode} />
    </div>;
}
