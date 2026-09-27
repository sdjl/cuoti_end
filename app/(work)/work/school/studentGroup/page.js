"use client";

import { Plus, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
// 学生分组管理页面，提供学生分组的查看、添加、编辑、删除等功能
import { useCallback, useEffect, useState } from "react";
import { CustomPagination } from "../../../../../components/common/Pagination.js";
import { Button } from "../../../../../components/ui/button.js";
import WorkHeader from "../../../../../components/work/layout/WorkHeader.js";
import { useToast } from "../../../../../hooks/use-toast.js";
import { useAuth } from "../../../../../hooks/useAuth.js";
import { createStudentGroupAction, deleteStudentGroupAction, getStudentGroupsAction, getStudentGroupsCountAction, updateStudentGroupAction } from "./actions.js";
import StudentGroupDialog from "./components/StudentGroupDialog.js";
import StudentGroupFilters from "./components/StudentGroupFilters.js";
import StudentGroupList from "./components/StudentGroupList.js";

// 每页显示的学生分组数量
const PAGE_SIZE = 20;
export default function StudentGroupEditPage() {
  const {
    user,
    isPrincipal
  } = useAuth();
  const router = useRouter();
  const {
    toast
  } = useToast();
  const [studentGroups, setStudentGroups] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  // 过滤器状态
  const [searchTerm, setSearchTerm] = useState("");

  // 对话框状态
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingStudentGroup, setEditingStudentGroup] = useState(null);

  // 当前用户是否是校长
  const userIsPrincipal = isPrincipal();

  // 计算总页数
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  // 检查当前校园
  useEffect(() => {
    if (user && !user.workSetting?.currentSchool) {
      router.push("/work/setting/curr-school");
      return;
    }
  }, [user, router]);

  // 获取学生分组数据
  const fetchStudentGroups = useCallback(async () => {
    setIsLoading(true);
    try {
      const keyword = searchTerm.trim();
      // 注意：API调用中pageNum应从0开始，而展示给用户的页码从1开始
      const pageNum = currentPage - 1;
      const [studentGroupsData, count] = await Promise.all([getStudentGroupsAction({
        pageNum,
        pageSize: PAGE_SIZE,
        keyword
      }), getStudentGroupsCountAction({
        keyword
      })]);
      setStudentGroups(studentGroupsData);
      setTotalCount(count);
    } catch (error) {
      console.error("获取学生分组数据失败:", error);
      toast({
        title: "获取数据失败",
        description: "获取学生分组数据时发生错误",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, currentPage, toast]);

  // 获取所有数据（初始加载和手动刷新）
  const fetchAllData = useCallback(async (showRefreshLoading = false) => {
    if (showRefreshLoading) {
      setIsRefreshing(true);
    }
    try {
      await fetchStudentGroups();
    } catch (error) {
      console.error("获取学生分组数据失败:", error);
    } finally {
      setIsRefreshing(false);
    }
  }, [fetchStudentGroups]);

  // 初始加载数据
  useEffect(() => {
    fetchAllData(false);
  }, [fetchAllData]);

  // 当筛选条件变化时，重置到第一页
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // 手动刷新数据
  const handleRefresh = useCallback(() => {
    fetchAllData(true);
  }, [fetchAllData]);

  // 重置过滤器
  const handleResetFilters = useCallback(() => {
    setSearchTerm("");
    setCurrentPage(1);
  }, []);

  // 处理页码变更
  const handlePageChange = useCallback(page => {
    setCurrentPage(page);
  }, []);

  // 处理添加学生分组
  const handleAddStudentGroup = useCallback(() => {
    if (!userIsPrincipal) {
      return;
    }
    setEditingStudentGroup(null);
    setDialogOpen(true);
  }, [userIsPrincipal]);

  // 处理编辑学生分组
  const handleEditStudentGroup = useCallback(async studentGroupId => {
    if (!userIsPrincipal) {
      return;
    }

    // 查找要编辑的学生分组
    const studentGroup = studentGroups.find(sg => sg._id === studentGroupId);
    if (!studentGroup) {
      toast({
        title: "编辑失败",
        description: "找不到要编辑的学生分组",
        variant: "destructive"
      });
      return;
    }
    setEditingStudentGroup(studentGroup);
    setDialogOpen(true);
  }, [userIsPrincipal, studentGroups, toast]);

  // 处理删除学生分组
  const handleDeleteStudentGroup = useCallback(async studentGroupId => {
    if (!userIsPrincipal) {
      console.log("非校长用户，无法删除学生分组");
      return;
    }

    // 找到要删除的学生分组
    const studentGroup = studentGroups.find(sg => sg._id === studentGroupId);
    if (!studentGroup) {
      toast({
        title: "删除失败",
        description: "找不到要删除的学生分组",
        variant: "destructive"
      });
      return;
    }
    try {
      const {
        success,
        error
      } = await deleteStudentGroupAction(studentGroupId);
      if (error) {
        toast({
          title: "删除失败",
          description: error,
          variant: "destructive"
        });
        return;
      }
      if (success) {
        toast({
          title: "删除成功",
          description: `已成功删除学生分组 "${studentGroup.name}"`
        });

        // 重新加载数据
        await fetchAllData(false);
      }
    } catch (error) {
      console.error("删除学生分组失败:", error);
      toast({
        title: "删除失败",
        description: "删除学生分组时发生错误",
        variant: "destructive"
      });
    }
  }, [userIsPrincipal, studentGroups, toast, fetchAllData]);

  // 处理保存学生分组
  const handleSaveStudentGroup = useCallback(async studentGroupData => {
    try {
      if (editingStudentGroup) {
        // 编辑学生分组
        const {
          success,
          error
        } = await updateStudentGroupAction(editingStudentGroup._id, studentGroupData);
        if (error) {
          toast({
            title: "更新学生分组失败",
            description: error,
            variant: "destructive"
          });
          return;
        }
        if (success) {
          toast({
            title: "更新成功",
            description: `学生分组 "${studentGroupData.name}" 已成功更新`
          });
        }
      } else {
        // 添加学生分组
        const {
          success,
          error
        } = await createStudentGroupAction(studentGroupData);
        if (error) {
          toast({
            title: "创建学生分组失败",
            description: error,
            variant: "destructive"
          });
          return;
        }
        if (success) {
          toast({
            title: "创建成功",
            description: `学生分组 "${studentGroupData.name}" 已成功创建`
          });
        }
      }

      // 重新加载数据
      await fetchAllData(false);
    } catch (error) {
      console.error("保存学生分组失败:", error);
      toast({
        title: "保存失败",
        description: "保存学生分组时发生错误",
        variant: "destructive"
      });
    }
  }, [editingStudentGroup, toast, fetchAllData]);
  return <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <WorkHeader title="学生分组管理" showBackButton={true} backHref="/work/school" backText="返回校园" rightContent={<>
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing} className="flex items-center">
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
              刷新数据
            </Button>
            {userIsPrincipal && <Button size="sm" onClick={handleAddStudentGroup} className="flex items-center">
                <Plus className="h-4 w-4 mr-2" />
                添加分组
              </Button>}
          </>} />

      <main className="flex-1 p-6 space-y-6">
        <div className="container mx-auto space-y-4">
          {/* 过滤器 */}
          <StudentGroupFilters searchTerm={searchTerm} setSearchTerm={setSearchTerm} onReset={handleResetFilters} />

          {/* 学生分组列表 */}
          <StudentGroupList studentGroups={studentGroups} isLoading={isLoading} isPrincipal={userIsPrincipal} onEditStudentGroup={handleEditStudentGroup} onDeleteStudentGroup={handleDeleteStudentGroup} />

          {/* 分页 */}
          {totalPages > 1 && <div className="flex justify-center">
              <CustomPagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} pageParamName="studentgroup_page" />
            </div>}

          {/* 统计信息 */}
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                共找到{" "}
                <span className="font-medium text-gray-900">{totalCount}</span>{" "}
                个学生分组
              </div>
              <div className="text-sm text-gray-500">
                第 {currentPage} 页，共 {totalPages} 页
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* 学生分组对话框 */}
      <StudentGroupDialog open={dialogOpen} onOpenChange={setDialogOpen} studentGroup={editingStudentGroup} onSave={handleSaveStudentGroup} />
    </div>;
}
