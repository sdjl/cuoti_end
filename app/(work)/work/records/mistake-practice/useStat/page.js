"use client";

// 课程错题使用统计页面，提供按班级或学生统计错题掌握情况，展示统计图表和学生详细统计表格
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import WorkHeader from "../../../../../../components/work/layout/WorkHeader.js";
import { useToast } from "../../../../../../hooks/use-toast.js";
import { useAuth } from "../../../../../../hooks/useAuth.js";
import { DISPLAY_TEXT } from "../../../../../../lib/config/constants.js";
import { getClassRoomStudentsAction, getClassRoomsAction, getMistakeStatisticsAction, getStudentStatisticsAction } from "./actions.js";
import StatCharts from "./components/StatCharts.js";
import StatFilters from "./components/StatFilters.js";
import StudentStatTable from "./components/StudentStatTable.js";
export default function UseStatPage() {
  const {
    user
  } = useAuth();
  const router = useRouter();
  const {
    toast
  } = useToast();
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState(null);
  const [studentStatistics, setStudentStatistics] = useState([]);
  const [loadingStudentStats, setLoadingStudentStats] = useState(false);

  // 过滤器状态
  const [filterState, setFilterState] = useState({
    scope: "classroom",
    timeRange: "all"
  });
  const [querying, setQuerying] = useState(false);

  // 班级和学生数据
  const [classRooms, setClassRooms] = useState([]);
  const [students, setStudents] = useState([]);
  const [loadingClassRooms, setLoadingClassRooms] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);

  // 加载统计数据
  const loadStatistics = useCallback(async filter => {
    setLoading(true);
    try {
      const result = await getMistakeStatisticsAction(filter);
      if (result.success && result.data) {
        setStatistics(result.data);
      } else {
        toast({
          title: "加载失败",
          description: result.error,
          variant: "destructive"
        });
      }
    } catch {
      toast({
        title: "加载失败",
        description: "无法加载统计数据",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // 加载班级列表
  const loadClassRooms = useCallback(async () => {
    setLoadingClassRooms(true);
    try {
      const result = await getClassRoomsAction();
      if (result.success) {
        setClassRooms(result.data || []);
      } else {
        toast({
          title: "加载班级失败",
          description: result.error,
          variant: "destructive"
        });
      }
    } catch {
      toast({
        title: "加载班级失败",
        description: "无法加载班级数据",
        variant: "destructive"
      });
    } finally {
      setLoadingClassRooms(false);
    }
  }, [toast]);

  // 加载学生列表
  const loadStudents = useCallback(async classRoomId => {
    setLoadingStudents(true);
    try {
      const result = await getClassRoomStudentsAction(classRoomId);
      if (result.success) {
        setStudents(result.data || []);
      } else {
        toast({
          title: "加载学生失败",
          description: result.error,
          variant: "destructive"
        });
        setStudents([]);
      }
    } catch {
      toast({
        title: "加载学生失败",
        description: "无法加载学生数据",
        variant: "destructive"
      });
      setStudents([]);
    } finally {
      setLoadingStudents(false);
    }
  }, [toast]);

  // 加载学生统计数据
  const loadStudentStatistics = useCallback(async (classRoomId, filter) => {
    setLoadingStudentStats(true);
    try {
      const result = await getStudentStatisticsAction(classRoomId, filter);
      if (result.success) {
        setStudentStatistics(result.data || []);
      } else {
        toast({
          title: "加载学生统计失败",
          description: result.error,
          variant: "destructive"
        });
        setStudentStatistics([]);
      }
    } catch {
      toast({
        title: "加载学生统计失败",
        description: "无法加载学生统计数据",
        variant: "destructive"
      });
      setStudentStatistics([]);
    } finally {
      setLoadingStudentStats(false);
    }
  }, [toast]);

  // 处理查询
  const handleQuery = useCallback(async () => {
    setQuerying(true);
    try {
      const filter = {
        scope: filterState.scope,
        classRoomId: filterState.classRoomId,
        studentId: filterState.studentId,
        timeRange: filterState.timeRange,
        startDate: filterState.startDate,
        endDate: filterState.endDate
      };

      // 加载基础统计数据
      await loadStatistics(filter);

      // 如果是按班级统计且有选择班级，同时加载学生统计数据
      if (filterState.scope === "classroom" && filterState.classRoomId) {
        const studentFilter = {
          timeRange: filterState.timeRange,
          startDate: filterState.startDate,
          endDate: filterState.endDate
        };
        await loadStudentStatistics(filterState.classRoomId, studentFilter);
      } else {
        // 如果不是按班级统计，清空学生统计数据
        setStudentStatistics([]);
      }
    } finally {
      setQuerying(false);
    }
  }, [filterState, loadStatistics, loadStudentStatistics]);

  // 检查当前校园
  useEffect(() => {
    if (user && !user.workSetting?.currentSchool) {
      router.push("/work/setting/curr-school");
      return;
    }
  }, [user, router]);
  useEffect(() => {
    // 只有在用户存在且有当前校园时才加载班级数据，不自动加载统计数据
    if (user?.workSetting?.currentSchool) {
      loadClassRooms();
      setLoading(false); // 只是加载班级数据，不需要loading状态
    }
  }, [user, loadClassRooms]);
  if (loading) {
    return <div className="flex flex-col min-h-screen bg-gray-50">
        <WorkHeader title={`${DISPLAY_TEXT.COURSE_MISTAKE}统计`} showBackButton={true} backHref="/work/records" backText="返回AI学习记录" />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600">加载统计数据中...</p>
          </div>
        </main>
      </div>;
  }

  // 检查是否有有效的过滤条件
  const hasValidFilter = () => {
    // 检查基本条件：必须选择班级
    if (!filterState.classRoomId) return false;

    // 如果是按学生统计，还必须选择学生
    if (filterState.scope === "student" && !filterState.studentId) return false;

    // 如果是自定义时间区间，必须选择开始和结束日期
    if (filterState.timeRange === "custom") {
      if (!filterState.startDate || !filterState.endDate) return false;
    }
    return true;
  };

  // 如果没有统计数据但有有效过滤条件，显示提示
  if (!statistics && hasValidFilter()) {
    return <div className="flex flex-col min-h-screen bg-gray-50">
        <WorkHeader title={`${DISPLAY_TEXT.COURSE_MISTAKE}统计`} showBackButton={true} backHref="/work/records" backText="返回AI学习记录" />
        <main className="flex-1 p-6">
          <div className="container mx-auto max-w-6xl">
            <div className="mb-6">
              <StatFilters filterState={filterState} onFilterChange={setFilterState} classRooms={classRooms} students={students} loadingClassRooms={loadingClassRooms} loadingStudents={loadingStudents} onLoadStudents={loadStudents} onQuery={handleQuery} querying={querying} />
            </div>
          </div>
        </main>
      </div>;
  }

  // 默认情况：显示过滤器和提示
  return <div className="flex flex-col min-h-screen bg-gray-50">
      <WorkHeader title={`${DISPLAY_TEXT.COURSE_MISTAKE}统计`} showBackButton={true} backHref="/work/records" backText="返回AI学习记录" />

      <main className="flex-1 p-6">
        <div className="container mx-auto max-w-6xl">
          {/* 过滤器组件 */}
          <div className="mb-6">
            <StatFilters filterState={filterState} onFilterChange={setFilterState} classRooms={classRooms} students={students} loadingClassRooms={loadingClassRooms} loadingStudents={loadingStudents} onLoadStudents={loadStudents} onQuery={handleQuery} querying={querying} />
          </div>

          {statistics && <>
              {/* 统计图表组件 */}
              <div className="mb-6">
                <StatCharts data={statistics} />
              </div>

              {/* 概览信息卡片 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">
                    {statistics.totalQuestions}
                  </div>
                  <div className="text-sm text-muted-foreground">错题总数</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    学生提交的所有错题
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
                  <div className="text-3xl font-bold text-green-600 mb-2">
                    {statistics.correctedCount}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    已掌握题目
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    通过{DISPLAY_TEXT.COURSE_MISTAKE}掌握的题目
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
                  <div className="text-3xl font-bold text-orange-600 mb-2">
                    {statistics.uncorrectedCount}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    未掌握题目
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    还需要继续练习的题目
                  </div>
                </div>
              </div>

              {/* 学生统计表格 - 仅在按班级统计时显示 */}
              {filterState.scope === "classroom" && <div className="mt-6">
                  <StudentStatTable data={studentStatistics} loading={loadingStudentStats} />
                </div>}
            </>}
        </div>
      </main>
    </div>;
}
