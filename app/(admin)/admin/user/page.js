"use client";

import { useRouter, useSearchParams } from "next/navigation";
// 用户管理页面，用于筛选用户、查看列表并更新用户状态
import { useCallback, useEffect, useState } from "react";
import UserFilters from "./components/UserFilters.js";
import UserList from "./components/UserList.js";
import { getUsers, getUsersCount, updateUserStatus } from "./actions.js";

// 每页显示的用户数量
const PAGE_SIZE = 20;
export default function UserPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const searchParams = useSearchParams();
  const router = useRouter();
  const pageParam = searchParams.get("user_page");
  const [currentPage, setCurrentPage] = useState(pageParam ? parseInt(pageParam) : 1);

  // 计算总页数
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  // 获取用户数据
  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const keyword = searchTerm.trim();
      const role = selectedRole !== "all" ? selectedRole : "";
      const status = selectedStatus !== "all" ? selectedStatus : "";

      // 注意：API调用中pageNum应从0开始，而展示给用户的页码从1开始
      const pageNum = currentPage - 1;
      const [userList, count] = await Promise.all([getUsers({
        pageNum,
        pageSize: PAGE_SIZE,
        keyword,
        role,
        status
      }), getUsersCount({
        keyword,
        role,
        status
      })]);
      setUsers(userList);
      setTotalCount(count);
    } catch (error) {
      console.error("获取用户数据失败:", error);
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, selectedRole, selectedStatus, currentPage]);

  // 更新URL参数
  const updateUrlParams = useCallback(page => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("user_page", page.toString());
    router.replace(`/admin/user?${params.toString()}`);
  }, [searchParams, router]);

  // 首次加载和筛选条件变更时获取数据
  useEffect(() => {
    fetchUsers();
  }, [currentPage, fetchUsers]);

  // 处理搜索
  const handleSearch = useCallback(() => {
    setCurrentPage(1); // 重置到第一页
    updateUrlParams(1);
    // 不需要手动调用 fetchUsers，useEffect 会自动处理
  }, [updateUrlParams]);

  // 处理页码变更
  const handlePageChange = page => {
    setCurrentPage(page);
    updateUrlParams(page);
  };

  // 重置筛选
  const resetFilters = useCallback(() => {
    setSearchTerm("");
    setSelectedRole("all");
    setSelectedStatus("all");
    setCurrentPage(1);
    updateUrlParams(1);
    // 不需要手动调用 fetchUsers，useEffect 会自动处理
  }, [updateUrlParams]);

  // 处理更新用户状态
  const handleUpdateUserStatus = async (userId, newStatus) => {
    try {
      const success = await updateUserStatus(userId, newStatus);
      if (success) {
        // 更新成功后重新获取数据
        await fetchUsers();
      }
    } catch (error) {
      console.error("更新用户状态失败:", error);
      throw error;
    }
  };
  return <div className="space-y-6">
      <UserFilters searchTerm={searchTerm} setSearchTerm={setSearchTerm} selectedRole={selectedRole} setSelectedRole={setSelectedRole} selectedStatus={selectedStatus} setSelectedStatus={setSelectedStatus} onSearch={handleSearch} onReset={resetFilters} />

      <UserList users={users} isLoading={isLoading} totalCount={totalCount} totalPages={totalPages} currentPage={currentPage} onPageChange={handlePageChange} onUpdateUserStatus={handleUpdateUserStatus} />
    </div>;
}
