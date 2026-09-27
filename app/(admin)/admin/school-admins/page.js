"use client";

import { useRouter, useSearchParams } from "next/navigation";
// 校园校长管理页面，用于查看和管理各校园的校长配置
import { useCallback, useDeferredValue, useEffect, useState } from "react";
import SchoolAdminFilters from "./components/SchoolAdminFilters.js";
import SchoolAdminList from "./components/SchoolAdminList.js";
import { useToast } from "../../../../hooks/use-toast.js";
import { useRegions } from "../../../../hooks/useAdminConfig.js";
import { getSchoolAdminsAction, getSchoolAdminsCountAction } from "./actions.js";

// 每页显示的学校数量
const PAGE_SIZE = 20;

// 扩展学校数据，包含校长信息

export default function SchoolAdminsPage() {
  const {
    toast
  } = useToast();
  const {
    regions
  } = useRegions();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [adminFilter, setAdminFilter] = useState("all"); // 校长筛选：all, hasAdmin, noAdmin
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
    const pageParam = searchParams.get("admin_page");
    const pageFromUrl = pageParam ? parseInt(pageParam) : 1;
    setCurrentPage(pageFromUrl);
  }, [searchParams]);

  // 更新URL参数
  const updateUrlParams = useCallback(page => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("admin_page", page.toString());
    router.push(`/admin/school-admins?${params.toString()}`);
  }, [searchParams, router]);

  // 获取学校校长数据
  const fetchSchoolAdmins = useCallback(async () => {
    setIsLoading(true);
    try {
      const keyword = deferredSearchTerm.trim();
      const region = selectedRegion !== "all" ? selectedRegion : "";
      const status = selectedStatus !== "all" ? selectedStatus : undefined;

      // 注意：API调用中pageNum应从0开始，而展示给用户的页码从1开始
      const pageNum = currentPage - 1;
      const [schoolsResult, countResult] = await Promise.all([getSchoolAdminsAction({
        pageNum,
        pageSize: PAGE_SIZE,
        keyword,
        region,
        status,
        adminFilter
      }), getSchoolAdminsCountAction({
        keyword,
        region,
        status,
        adminFilter
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
      console.error("获取学校校长数据失败:", error);
      toast({
        title: "获取数据失败",
        description: "请稍后重试",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [deferredSearchTerm, selectedRegion, selectedStatus, adminFilter, currentPage, toast]);

  // 当页码或筛选条件变更时获取数据
  useEffect(() => {
    fetchSchoolAdmins();
  }, [fetchSchoolAdmins]);

  // 当筛选条件发生变化时，标记需要重置页码
  useEffect(() => {
    setIsFilterChanged(true);
  }, [deferredSearchTerm, selectedRegion, selectedStatus, adminFilter]);

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
    setAdminFilter("all");
    setCurrentPage(1);
    updateUrlParams(1);
  }, [updateUrlParams]);
  return <div className="space-y-6">
      <SchoolAdminFilters searchTerm={searchTerm} setSearchTerm={setSearchTerm} selectedRegion={selectedRegion} setSelectedRegion={setSelectedRegion} selectedStatus={selectedStatus} setSelectedStatus={setSelectedStatus} adminFilter={adminFilter} setAdminFilter={setAdminFilter} onSearch={handleSearch} onReset={resetFilters} isSearchPending={isSearchPending} regions={regions} />

      <SchoolAdminList schools={schools} isLoading={isLoading || isSearchPending} totalCount={totalCount} totalPages={totalPages} currentPage={currentPage} onPageChange={handlePageChange} onRefresh={fetchSchoolAdmins} />
    </div>;
}
