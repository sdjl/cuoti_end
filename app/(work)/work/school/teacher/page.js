"use client";

import { RefreshCw, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
// 教师管理页面，用于查看和管理校园内的所有教师
import { useCallback, useEffect, useMemo, useState } from "react";
import AdministratorList from "./components/AdministratorList.js";
import TeacherFilters from "./components/TeacherFilters.js";
import TeacherList from "./components/TeacherList.js";
import { Button } from "../../../../../components/ui/button.js";
import WorkHeader from "../../../../../components/work/layout/WorkHeader.js";
import { useToast } from "../../../../../hooks/use-toast.js";
import { useAuth } from "../../../../../hooks/useAuth.js";
import { getAllSchoolStaffAction, removeTeacherAction } from "./actions.js";
export default function TeacherPage() {
  const {
    user,
    isPrincipal
  } = useAuth();
  const router = useRouter();
  const {
    toast
  } = useToast();
  const [administrators, setAdministrators] = useState([]);
  const [allTeachers, setAllTeachers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // 过滤器状态
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGender, setSelectedGender] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedRole, setSelectedRole] = useState("all");

  // 当前用户是否是校长
  const userIsPrincipal = isPrincipal();

  // 检查当前校园
  useEffect(() => {
    if (user && !user.workSetting?.currentSchool) {
      router.push("/work/setting/curr-school");
      return;
    }
  }, [user, router]);

  // 过滤逻辑
  const filteredTeachers = useMemo(() => {
    return allTeachers.filter(teacher => {
      // 搜索过滤
      if (searchTerm.trim()) {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = [teacher.openid, teacher.name, teacher.nickname, teacher.phone, teacher.email, teacher.address].some(field => field?.toLowerCase().includes(searchLower));
        if (!matchesSearch) return false;
      }

      // 性别过滤
      if (selectedGender !== "all") {
        if (selectedGender === "empty") {
          if (teacher.gender) return false;
        } else {
          if (teacher.gender !== selectedGender) return false;
        }
      }

      // 状态过滤
      if (selectedStatus !== "all") {
        if (teacher.status !== selectedStatus) return false;
      }

      // 角色过滤
      if (selectedRole !== "all") {
        if (!teacher.roles.includes(selectedRole)) {
          return false;
        }
      }
      return true;
    });
  }, [allTeachers, searchTerm, selectedGender, selectedStatus, selectedRole]);

  // 获取所有数据（初始加载和手动刷新）
  const fetchAllData = useCallback(async (showRefreshLoading = false) => {
    if (showRefreshLoading) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    try {
      const {
        administrators,
        teachers
      } = await getAllSchoolStaffAction();
      setAdministrators(administrators);
      setAllTeachers(teachers);
    } catch (error) {
      console.error("获取教师数据失败:", error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // 初始加载数据
  useEffect(() => {
    fetchAllData(false);
  }, [fetchAllData]);

  // 手动刷新数据
  const handleRefresh = useCallback(() => {
    fetchAllData(true);
  }, [fetchAllData]);

  // 重置过滤器
  const handleResetFilters = useCallback(() => {
    setSearchTerm("");
    setSelectedGender("all");
    setSelectedStatus("all");
    setSelectedRole("all");
  }, []);

  // 处理添加教师
  const handleAddTeacher = useCallback(() => {
    if (!userIsPrincipal) {
      return;
    }
    router.push("/work/school/teacher/add");
  }, [userIsPrincipal, router]);

  // 处理编辑教师
  const handleEditTeacher = useCallback(teacherId => {
    if (!userIsPrincipal) {
      return;
    }
    router.push(`/work/school/teacher/${teacherId}/edit`);
  }, [userIsPrincipal, router]);

  // 处理删除教师
  const handleDeleteTeacher = useCallback(async teacherId => {
    if (!userIsPrincipal) {
      console.log("非校长用户，无法删除教师");
      return;
    }

    // 找到要删除的教师
    const teacher = allTeachers.find(t => t._id === teacherId);
    if (!teacher) {
      toast({
        title: "删除失败",
        description: "找不到要删除的教师",
        variant: "destructive"
      });
      return;
    }
    try {
      const {
        success,
        error
      } = await removeTeacherAction(teacher.openid);
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
          description: `已将 ${teacher.name || teacher.nickname || "该教师"} 从教师队伍中移除`
        });

        // 重新加载数据
        await fetchAllData(false);
      }
    } catch (error) {
      console.error("删除教师失败:", error);
      toast({
        title: "删除失败",
        description: "删除教师时发生错误",
        variant: "destructive"
      });
    }
  }, [userIsPrincipal, allTeachers, toast, fetchAllData]);
  return <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <WorkHeader title="教师管理" showBackButton={true} backHref="/work/school" backText="返回校园" rightContent={<>
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing} className="flex items-center">
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
              刷新数据
            </Button>
            {userIsPrincipal && <Button size="sm" onClick={handleAddTeacher} className="flex items-center">
                <UserPlus className="h-4 w-4 mr-2" />
                添加教师
              </Button>}
          </>} />

      <main className="flex-1 p-6 space-y-6">
        <div className="container mx-auto space-y-4">
          {/* 校长列表 */}
          <AdministratorList administrators={administrators} isLoading={isLoading} />

          {/* 教师列表标题 */}
          <div className="flex items-center">
            <h2 className="text-lg font-semibold text-gray-800">
              教师列表
              <span className="text-sm text-gray-500 ml-2">
                (共{filteredTeachers.length}人)
              </span>
            </h2>
          </div>

          {/* 教师过滤器 */}
          <TeacherFilters searchTerm={searchTerm} setSearchTerm={setSearchTerm} selectedGender={selectedGender} setSelectedGender={setSelectedGender} selectedStatus={selectedStatus} setSelectedStatus={setSelectedStatus} selectedRole={selectedRole} setSelectedRole={setSelectedRole} onReset={handleResetFilters} />

          {/* 教师列表 */}
          <TeacherList teachers={filteredTeachers} isLoading={isLoading} isPrincipal={userIsPrincipal} onAddTeacher={handleAddTeacher} onEditTeacher={handleEditTeacher} onDeleteTeacher={handleDeleteTeacher} />

          {/* 统计信息 */}
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="text-sm text-gray-600">
              共找到 {administrators.length} 个校长，{filteredTeachers.length}{" "}
              个教师
            </div>
          </div>
        </div>
      </main>
    </div>;
}
