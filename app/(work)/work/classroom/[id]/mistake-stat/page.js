"use client";

// 班级错题统计页面，切换课程与自上传数据并支持刷新
import { RefreshCw } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "../../../../../../components/ui/button.js";
import WorkHeader from "../../../../../../components/work/layout/WorkHeader.js";
import { useToast } from "../../../../../../hooks/use-toast.js";
import { useAuth } from "../../../../../../hooks/useAuth.js";
import { DISPLAY_TEXT } from "../../../../../../lib/config/constants.js";
import { getClassRoomAction } from "./actions.js";
import CourseMistakeList from "./components/CourseMistakeList.js";
import MistakeStatFilters from "./components/MistakeStatFilters.js";
import SelfUploadMistakeList from "./components/SelfUploadMistakeList.js";
export default function MistakeStatPage() {
  const {
    user
  } = useAuth();
  const {
    toast
  } = useToast();
  const router = useRouter();
  const params = useParams();
  const classId = params.id;
  const [classroom, setClassroom] = useState(null);
  const [courseStats, setCourseStats] = useState([]);
  const [selfStats, setSelfStats] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // 过滤器状态
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("course"); // 默认显示课程错题统计

  // 检查当前校园
  useEffect(() => {
    if (user && !user.workSetting?.currentSchool) {
      router.push("/work/setting/curr-school");
      return;
    }
  }, [user, router]);

  // 获取班级信息
  const fetchClassRoom = useCallback(async () => {
    try {
      const classRoomData = await getClassRoomAction(classId);
      setClassroom(classRoomData);
    } catch (error) {
      console.error("获取班级信息失败:", error);
      toast({
        title: "获取数据失败",
        description: "获取班级信息时发生错误",
        variant: "destructive"
      });
    }
  }, [classId, toast]);

  // 动态导入 actions 函数
  const fetchStats = useCallback(async () => {
    setIsLoading(true);
    try {
      if (selectedType === "course") {
        // 课程错题统计
        const {
          getCourseMistakeStatsAction
        } = await import("./actions");
        const statsData = await getCourseMistakeStatsAction(classId);
        setCourseStats(statsData);
      } else {
        // 自主上传错题统计
        const {
          getSelfUploadMistakeStatsAction
        } = await import("./actions");
        const statsData = await getSelfUploadMistakeStatsAction(classId);
        setSelfStats(statsData);
      }
    } catch (error) {
      console.error("获取统计数据失败:", error);
      toast({
        title: "获取数据失败",
        description: "获取统计数据时发生错误",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [classId, selectedType, toast]);

  // 使用 useMemo 对数据进行前端过滤
  const filteredCourseStats = useMemo(() => {
    if (selectedType !== "course") return [];
    let filtered = courseStats;

    // 按学生姓名搜索
    if (searchTerm.trim()) {
      const keyword = searchTerm.trim().toLowerCase();
      filtered = filtered.filter(stat => stat.studentName.toLowerCase().includes(keyword));
    }
    return filtered;
  }, [courseStats, searchTerm, selectedType]);
  const filteredSelfStats = useMemo(() => {
    if (selectedType !== "self") return [];
    let filtered = selfStats;

    // 按学生姓名搜索
    if (searchTerm.trim()) {
      const keyword = searchTerm.trim().toLowerCase();
      filtered = filtered.filter(stat => stat.studentName.toLowerCase().includes(keyword));
    }
    return filtered;
  }, [selfStats, searchTerm, selectedType]);

  // 获取所有数据（初始加载和手动刷新）
  const fetchAllData = useCallback(async (showRefreshLoading = false) => {
    if (showRefreshLoading) {
      setIsRefreshing(true);
    }
    try {
      await Promise.all([fetchClassRoom(), fetchStats()]);
    } catch (error) {
      console.error("获取数据失败:", error);
    } finally {
      setIsRefreshing(false);
    }
  }, [fetchClassRoom, fetchStats]);

  // 初始加载数据
  useEffect(() => {
    fetchAllData(false);
  }, [fetchAllData]);

  // 当统计类型改变时重新加载数据
  useEffect(() => {
    if (!isLoading) {
      fetchStats();
    }
  }, [selectedType]);

  // 手动刷新数据
  const handleRefresh = useCallback(() => {
    fetchAllData(true);
  }, [fetchAllData]);

  // 重置过滤器
  const handleResetFilters = useCallback(() => {
    setSearchTerm("");
    setSelectedType("course");
  }, []);

  // 计算统计信息
  const statsInfo = useMemo(() => {
    if (selectedType === "course") {
      const total = filteredCourseStats.reduce((sum, stat) => sum + stat.mistakeCount, 0);
      const corrected = filteredCourseStats.reduce((sum, stat) => sum + stat.correctedCount, 0);
      const remaining = filteredCourseStats.reduce((sum, stat) => sum + stat.remainingCount, 0);
      const stubborn = filteredCourseStats.reduce((sum, stat) => sum + stat.stubbornCount, 0);
      const passRate = total > 0 ? corrected / total * 100 : 0;
      return {
        count: filteredCourseStats.length,
        total,
        corrected,
        passRate: passRate.toFixed(1),
        remaining,
        stubborn
      };
    } else {
      const total = filteredSelfStats.reduce((sum, stat) => sum + stat.mistakeCount, 0);
      const mastered = filteredSelfStats.reduce((sum, stat) => sum + stat.masteredCount, 0);
      const unmastered = filteredSelfStats.reduce((sum, stat) => sum + stat.unmasteredCount, 0);
      const masteredRate = total > 0 ? mastered / total * 100 : 0;
      const unmasteredRate = total > 0 ? unmastered / total * 100 : 0;
      return {
        count: filteredSelfStats.length,
        total,
        mastered,
        masteredRate: masteredRate.toFixed(1),
        unmastered,
        unmasteredRate: unmasteredRate.toFixed(1)
      };
    }
  }, [selectedType, filteredCourseStats, filteredSelfStats]);
  return <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <WorkHeader title={`${selectedType === "course" ? DISPLAY_TEXT.COURSE_MISTAKE : DISPLAY_TEXT.SELF_UPLOAD_MISTAKE}统计 - ${classroom?.name || "加载中..."}`} showBackButton={true} backHref="/work/classroom" backText="返回班级列表" rightContent={<Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing} className="flex items-center">
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
            刷新数据
          </Button>} />

      <main className="flex-1 p-6 space-y-6">
        <div className="container mx-auto space-y-4">
          {/* 过滤器 */}
          <MistakeStatFilters searchTerm={searchTerm} setSearchTerm={setSearchTerm} selectedType={selectedType} setSelectedType={setSelectedType} onReset={handleResetFilters} />

          {/* 统计信息 */}
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                {selectedType === "course" ? <>
                    共{" "}
                    <span className="font-medium text-gray-900">
                      {statsInfo.count}
                    </span>{" "}
                    名学生
                    {statsInfo.count > 0 && <>
                        ，总错题数{" "}
                        <span className="font-medium text-red-600">
                          {statsInfo.total}
                        </span>{" "}
                        道，已掌握{" "}
                        <span className="font-medium text-green-600">
                          {statsInfo.corrected}
                        </span>{" "}
                        道，全班通过率{" "}
                        <span className="font-medium text-green-600">
                          {statsInfo.passRate}%
                        </span>
                        ，剩余错题数{" "}
                        <span className="font-medium text-orange-600">
                          {statsInfo.remaining}
                        </span>{" "}
                        道，顽固错题数{" "}
                        <span className="font-medium text-purple-600">
                          {statsInfo.stubborn}
                        </span>{" "}
                        道
                      </>}
                  </> : <>
                    共{" "}
                    <span className="font-medium text-gray-900">
                      {statsInfo.count}
                    </span>{" "}
                    名学生
                    {statsInfo.count > 0 && <>
                        ，总错题数{" "}
                        <span className="font-medium text-red-600">
                          {statsInfo.total}
                        </span>{" "}
                        道，已掌握{" "}
                        <span className="font-medium text-green-600">
                          {statsInfo.mastered}
                        </span>{" "}
                        道，全班掌握率{" "}
                        <span className="font-medium text-green-600">
                          {statsInfo.masteredRate}%
                        </span>
                        ，未掌握{" "}
                        <span className="font-medium text-orange-600">
                          {statsInfo.unmastered}
                        </span>{" "}
                        道，未掌握率{" "}
                        <span className="font-medium text-orange-600">
                          {statsInfo.unmasteredRate}%
                        </span>
                      </>}
                  </>}
              </div>
            </div>
          </div>

          {/* 统计列表 */}
          {selectedType === "course" ? <CourseMistakeList stats={filteredCourseStats} isLoading={isLoading} classId={classId} /> : <SelfUploadMistakeList stats={filteredSelfStats} isLoading={isLoading} classId={classId} />}
        </div>
      </main>
    </div>;
}
