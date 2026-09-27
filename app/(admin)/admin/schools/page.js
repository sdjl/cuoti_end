"use client";

import { useRouter, useSearchParams } from "next/navigation";
// 校园管理页面，用于查看、筛选、创建、编辑和删除校园记录
import { useCallback, useDeferredValue, useEffect, useState } from "react";
import SchoolFilters from "./components/SchoolFilters.js";
import SchoolList from "./components/SchoolList.js";
import { useToast } from "../../../../hooks/use-toast.js";
import { useRegions } from "../../../../hooks/useAdminConfig.js";
import { deleteSchoolAction, getSchoolsAction, getSchoolsCountAction } from "./actions.js";

// 每页显示的学校数量
const PAGE_SIZE = 20;
export default function SchoolsPage() {
  const {
    toast
  } = useToast();
  const {
    regions
  } = useRegions();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [schools, setSchools] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isFilterChanged, setIsFilterChanged] = useState(false);

  // 使用 useDeferredValue 延迟搜索关键词，减少频繁的API调用
  const deferredSearchTerm = useDeferredValue(searchTerm);

  // 判断搜索是否还在延迟中
  const isSearchPending = searchTerm !== deferredSearchTerm;
  const searchParams = useSearchParams();
  const router = useRouter();

  // 计算总页数
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  // 从URL参数初始化页码
  useEffect(() => {
    const pageParam = searchParams.get("school_page");
    const pageFromUrl = pageParam ? parseInt(pageParam) : 1;
    setCurrentPage(pageFromUrl);
  }, [searchParams]);

  // 更新URL参数
  const updateUrlParams = useCallback(page => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("school_page", page.toString());
    router.push(`/admin/schools?${params.toString()}`);
  }, [searchParams, router]);

  // 获取学校数据
  const fetchSchools = useCallback(async () => {
    setIsLoading(true);
    try {
      const keyword = deferredSearchTerm.trim();
      const region = selectedRegion !== "all" ? selectedRegion : "";
      const status = selectedStatus !== "all" ? selectedStatus : undefined;

      // 注意：API调用中pageNum应从0开始，而展示给用户的页码从1开始
      const pageNum = currentPage - 1;
      const [schoolsResult, countResult] = await Promise.all([getSchoolsAction({
        pageNum,
        pageSize: PAGE_SIZE,
        keyword,
        region,
        status
      }), getSchoolsCountAction({
        keyword,
        region,
        status
      })]);
      if (schoolsResult.success && countResult.success) {
        setSchools(schoolsResult.data || []);
        setTotalCount(countResult.data || 0);
      } else {
        toast({
          title: "获取数据失败",
          description: schoolsResult.error || countResult.error,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("获取学校数据失败:", error);
      toast({
        title: "获取数据失败",
        description: "请稍后重试",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [deferredSearchTerm, selectedRegion, selectedStatus, currentPage, toast]);

  // 当页码或筛选条件变更时获取数据
  useEffect(() => {
    fetchSchools();
  }, [fetchSchools]);

  // 当筛选条件发生变化时，标记需要重置页码
  useEffect(() => {
    setIsFilterChanged(true);
  }, [deferredSearchTerm, selectedRegion, selectedStatus]);

  // 处理筛选条件变化后的页码重置
  useEffect(() => {
    if (isFilterChanged && currentPage !== 1) {
      setCurrentPage(1);
      updateUrlParams(1);
    }
    setIsFilterChanged(false);
  }, [isFilterChanged, currentPage, updateUrlParams]);

  // 处理搜索
  const handleSearch = useCallback(() => {
    // 搜索时不需要额外操作，筛选条件变化会自动触发重置
  }, []);

  // 处理页码变更
  const handlePageChange = useCallback(page => {
    setCurrentPage(page);
    updateUrlParams(page);
  }, [updateUrlParams]);

  // 重置筛选
  const resetFilters = useCallback(() => {
    setSearchTerm("");
    setSelectedRegion("all");
    setSelectedStatus("all");
    setCurrentPage(1);
    updateUrlParams(1);
  }, [updateUrlParams]);

  // 处理删除学校
  const handleDeleteSchool = useCallback(async (schoolId, schoolName) => {
    try {
      const result = await deleteSchoolAction(schoolId, schoolName);
      if (result.success) {
        toast({
          title: "删除成功",
          description: result.message
        });
        // 删除成功后重新获取数据
        await fetchSchools();
      } else {
        toast({
          title: "删除失败",
          description: result.error,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("删除学校失败:", error);
      toast({
        title: "删除失败",
        description: "请稍后重试",
        variant: "destructive"
      });
      throw error;
    }
  }, [fetchSchools, toast]);
  return <div className="space-y-6">
      <SchoolFilters searchTerm={searchTerm} setSearchTerm={setSearchTerm} selectedRegion={selectedRegion} setSelectedRegion={setSelectedRegion} selectedStatus={selectedStatus} setSelectedStatus={setSelectedStatus} onSearch={handleSearch} onReset={resetFilters} isSearchPending={isSearchPending} regions={regions} />

      <SchoolList schools={schools} isLoading={isLoading || isSearchPending} totalCount={totalCount} totalPages={totalPages} currentPage={currentPage} onPageChange={handlePageChange} onDeleteSchool={handleDeleteSchool} />
    </div>;
}
