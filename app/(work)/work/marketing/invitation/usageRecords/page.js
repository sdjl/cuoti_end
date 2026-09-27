"use client";

import { RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
// 邀请码使用记录页面，提供使用记录的查询和分页功能
import { useCallback, useEffect, useState } from "react";
import { CustomPagination } from "../../../../../../components/common/Pagination.js";
import { Button } from "../../../../../../components/ui/button.js";
import WorkHeader from "../../../../../../components/work/layout/WorkHeader.js";
import { useToast } from "../../../../../../hooks/use-toast.js";
import { useAuth } from "../../../../../../hooks/useAuth.js";
import { getInvitationUsageRecordsAction } from "./actions.js";
import UsageRecordsFilters from "./components/UsageRecordsFilters.js";
import UsageRecordsList from "./components/UsageRecordsList.js";

// 每页显示的记录数量
const PAGE_SIZE = 20;
export default function UsageRecordsPage() {
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

  // 过滤器状态
  const [searchText, setSearchText] = useState("");
  const [selectedType, setSelectedType] = useState("all");

  // 计算总页数
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  // 检查当前校园
  useEffect(() => {
    if (user && !user.workSetting?.currentSchool) {
      router.push("/work/setting/curr-school");
      return;
    }
  }, [user, router]);

  // 获取使用记录数据
  const fetchRecords = useCallback(async () => {
    if (!user?.workSetting?.currentSchool) return;
    setIsLoading(true);
    try {
      const result = await getInvitationUsageRecordsAction({
        schoolId: user.workSetting.currentSchool._id,
        pageNum: currentPage - 1,
        pageSize: PAGE_SIZE,
        searchText,
        type: selectedType
      });
      if (result.success) {
        setRecords(result.data);
        setTotalCount(result.totalCount);
      } else {
        toast({
          title: "获取数据失败",
          description: result.error || "获取使用记录数据时发生错误",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("获取使用记录数据失败:", error);
      toast({
        title: "获取数据失败",
        description: "获取使用记录数据时发生错误",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [user?.workSetting?.currentSchool, currentPage, searchText, selectedType, toast]);

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
    setSelectedType("all");
    setCurrentPage(1);
  }, []);

  // 处理页码变更
  const handlePageChange = useCallback(page => {
    setCurrentPage(page);
  }, []);

  // 当过滤条件或页码变化时，重新获取数据
  useEffect(() => {
    if (user?.workSetting?.currentSchool) {
      fetchRecords();
    }
  }, [fetchRecords, user?.workSetting?.currentSchool]);

  // 当过滤条件变化时，重置到第一页
  useEffect(() => {
    setCurrentPage(1);
  }, [searchText, selectedType]);
  return <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <WorkHeader title="邀请码使用记录" showBackButton={true} backHref="/work/marketing" backText="返回营销管理" rightContent={<div className="flex items-center space-x-2">
            <Button onClick={handleRefresh} disabled={isRefreshing} variant="outline" size="sm">
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
              刷新数据
            </Button>
          </div>} />

      <main className="flex-1 p-6 space-y-6">
        <div className="container mx-auto space-y-4">
          {/* 过滤器 */}
          <UsageRecordsFilters searchText={searchText} setSearchText={setSearchText} selectedType={selectedType} setSelectedType={setSelectedType} onReset={handleResetFilters} />

          {/* 使用记录列表 */}
          <UsageRecordsList records={records} isLoading={isLoading} />

          {/* 分页 */}
          {totalPages > 1 && <div className="flex justify-center">
              <CustomPagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} pageParamName="usage_page" />
            </div>}

          {/* 统计信息 */}
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="text-sm text-gray-600">
              {searchText || selectedType !== "all" ? <>
                  共找到 {totalCount} 条使用记录， 当前显示第 {currentPage}{" "}
                  页，共 {totalPages} 页
                </> : <>
                  共有 {totalCount} 条使用记录，当前显示第 {currentPage} 页，共{" "}
                  {totalPages} 页
                </>}
            </div>
          </div>
        </div>
      </main>
    </div>;
}
