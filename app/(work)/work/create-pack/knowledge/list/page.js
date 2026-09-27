"use client";

import { RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
// 最近创建定制题集的学生列表页面，用于查看和管理最近为学生创建定制题集的记录
import { useCallback, useEffect, useState } from "react";
import { Button } from "../../../../../../components/ui/button.js";
import WorkHeader from "../../../../../../components/work/layout/WorkHeader.js";
import { useToast } from "../../../../../../hooks/use-toast.js";
import { useAuth } from "../../../../../../hooks/useAuth.js";
import { getRecentStudentsAction } from "./actions.js";
import StudentPackList from "./components/StudentPackList.js";
export default function KnowledgePackListPage() {
  const {
    user
  } = useAuth();
  const router = useRouter();
  const {
    toast
  } = useToast();
  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // 检查当前校园
  useEffect(() => {
    if (user && !user.workSetting?.currentSchool) {
      router.push("/work/setting/curr-school");
      return;
    }
  }, [user, router]);

  // 获取学生数据
  const fetchStudents = useCallback(async () => {
    setIsLoading(true);
    try {
      const studentsData = await getRecentStudentsAction();
      setStudents(studentsData);
    } catch (error) {
      console.error("获取学生数据失败:", error);
      toast({
        title: "获取数据失败",
        description: "获取学生数据时发生错误",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // 获取所有数据（初始加载和手动刷新）
  const fetchAllData = useCallback(async (showRefreshLoading = false) => {
    if (showRefreshLoading) {
      setIsRefreshing(true);
    }
    try {
      await fetchStudents();
    } catch (error) {
      console.error("获取数据失败:", error);
    } finally {
      setIsRefreshing(false);
    }
  }, [fetchStudents]);

  // 初始加载数据
  useEffect(() => {
    fetchAllData(false);
  }, [fetchAllData]);

  // 手动刷新数据
  const handleRefresh = useCallback(() => {
    fetchAllData(true);
  }, [fetchAllData]);

  // 查看学生的定制题集
  const handleViewStudent = useCallback((classRoomId, studentId) => {
    window.open(`/work/create-pack/knowledge/${classRoomId}/${studentId}/list`, "_blank", "noopener,noreferrer");
  }, []);
  return <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <WorkHeader title="最近创建定制题集的学生" showBackButton backHref="/work/create-pack" backText="返回" rightContent={<Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing} className="flex items-center">
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
            刷新数据
          </Button>} />

      <main className="flex-1 p-6 space-y-6">
        <div className="container mx-auto space-y-4">
          {/* 统计信息 */}
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                共找到{" "}
                <span className="font-medium text-gray-900">
                  {students.length}
                </span>{" "}
                个学生
                <span className="text-gray-400 ml-2">
                  （显示最近 50 个学生）
                </span>
              </div>
            </div>
          </div>

          {/* 学生列表 */}
          <StudentPackList students={students} isLoading={isLoading} onViewStudent={handleViewStudent} />
        </div>
      </main>
    </div>;
}
