"use client";

import { RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
// 分享访问统计页面，用于查看和统计班级或学生的分享访问数据
import { useEffect, useState } from "react";
import { Button } from "../../../../../../components/ui/button.js";
import WorkHeader from "../../../../../../components/work/layout/WorkHeader.js";
import { useToast } from "../../../../../../hooks/use-toast.js";
import { useAuth } from "../../../../../../hooks/useAuth.js";
import { getClassRoomStudentsAction, getClassRoomsAction, getClassroomShareStatisticsAction, getStudentShareStatisticsAction } from "./actions.js";
import ShareStatDisplay from "./components/ShareStatDisplay.js";
import ShareStatFilters from "./components/ShareStatFilters.js";
export default function ShareStatsPage() {
  const {
    user
  } = useAuth();
  const router = useRouter();
  const {
    toast
  } = useToast();

  // 筛选状态
  const [filterState, setFilterState] = useState({
    scope: "classroom",
    timeRange: "all"
  });

  // 数据状态
  const [classRooms, setClassRooms] = useState([]);
  const [students, setStudents] = useState([]);
  const [classroomData, setClassroomData] = useState();
  const [studentData, setStudentData] = useState();

  // 加载状态
  const [loadingClassRooms, setLoadingClassRooms] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [querying, setQuerying] = useState(false);

  // 结果状态
  const [hasQueried, setHasQueried] = useState(false);
  const [queryError, setQueryError] = useState();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // 检查当前校园
  useEffect(() => {
    if (user && !user.workSetting?.currentSchool) {
      router.push("/work/setting/curr-school");
      return;
    }
  }, [user, router]);

  // 加载班级列表
  useEffect(() => {
    const loadClassRooms = async () => {
      setLoadingClassRooms(true);
      try {
        const response = await getClassRoomsAction();
        if (response.success && response.data) {
          setClassRooms(response.data);
        } else {
          toast({
            title: "加载失败",
            description: response.error || "获取班级列表失败",
            variant: "destructive"
          });
        }
      } catch (error) {
        console.error("加载班级列表失败:", error);
        toast({
          title: "加载失败",
          description: "获取班级列表失败",
          variant: "destructive"
        });
      } finally {
        setLoadingClassRooms(false);
      }
    };
    loadClassRooms();
  }, [toast]);

  // 加载学生列表
  const handleLoadStudents = async classRoomId => {
    setLoadingStudents(true);
    try {
      const response = await getClassRoomStudentsAction(classRoomId);
      if (response.success && response.data) {
        setStudents(response.data);
      } else {
        toast({
          title: "加载失败",
          description: response.error || "获取学生列表失败",
          variant: "destructive"
        });
        setStudents([]);
      }
    } catch (error) {
      console.error("加载学生列表失败:", error);
      toast({
        title: "加载失败",
        description: "获取学生列表失败",
        variant: "destructive"
      });
      setStudents([]);
    } finally {
      setLoadingStudents(false);
    }
  };

  // 执行查询
  const handleQuery = async (showRefreshLoading = false) => {
    if (showRefreshLoading) {
      setIsRefreshing(true);
    }
    setQuerying(true);
    setQueryError(undefined);
    setClassroomData(undefined);
    setStudentData(undefined);
    try {
      if (filterState.scope === "classroom") {
        // 按班级统计
        const response = await getClassroomShareStatisticsAction(filterState);
        if (response.success && response.data) {
          setClassroomData(response.data);
        } else {
          setQueryError(response.error || "获取班级分享统计数据失败");
        }
      } else if (filterState.scope === "student") {
        // 按学生统计
        const response = await getStudentShareStatisticsAction(filterState);
        if (response.success && response.data) {
          setStudentData(response.data);
        } else {
          setQueryError(response.error || "获取学生分享统计数据失败");
        }
      }
      setHasQueried(true);
    } catch (error) {
      console.error("查询失败:", error);
      setQueryError("查询分享统计数据失败");
    } finally {
      setQuerying(false);
      setIsRefreshing(false);
    }
  };

  // 手动刷新数据
  const handleRefresh = () => {
    if (hasQueried) {
      handleQuery(true);
    }
  };
  return <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <WorkHeader title="分享访问统计" showBackButton={true} backHref="/work/marketing" backText="返回营销管理" rightContent={hasQueried && <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing} className="flex items-center">
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
              刷新数据
            </Button>} />

      <main className="flex-1 p-6 space-y-6">
        <div className="container mx-auto space-y-6">
          {/* 筛选条件 */}
          <ShareStatFilters filterState={filterState} onFilterChange={setFilterState} classRooms={classRooms} students={students} loadingClassRooms={loadingClassRooms} loadingStudents={loadingStudents} onLoadStudents={handleLoadStudents} onQuery={() => handleQuery(false)} querying={querying} />

          {/* 统计结果显示 */}
          {hasQueried && <ShareStatDisplay scope={filterState.scope} classroomData={classroomData} studentData={studentData} loading={querying} error={queryError} />}
        </div>
      </main>
    </div>;
}
