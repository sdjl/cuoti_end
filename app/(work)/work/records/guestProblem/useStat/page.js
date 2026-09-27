"use client";

import { useRouter } from "next/navigation";
// 非登录用户自主上传错题统计页面，展示错题统计数据、图表和学生统计详情
import { useCallback, useEffect, useState } from "react";
import WorkHeader from "../../../../../../components/work/layout/WorkHeader.js";
import { useToast } from "../../../../../../hooks/use-toast.js";
import { useAuth } from "../../../../../../hooks/useAuth.js";
import { DISPLAY_TEXT } from "../../../../../../lib/config/constants.js";
import { getGuestAIQuestionStatisticsAction, getGuestStudentAIQuestionStatisticsAction } from "./actions.js";
import GuestStatCharts from "./components/GuestStatCharts.js";
import GuestStatFilters from "./components/GuestStatFilters.js";
import GuestStudentStatTable from "./components/GuestStudentStatTable.js";
export default function GuestUseStatPage() {
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
    timeRange: "all"
  });
  const [querying, setQuerying] = useState(false);

  // 加载统计数据
  const loadStatistics = useCallback(async filter => {
    setLoading(true);
    try {
      const result = await getGuestAIQuestionStatisticsAction(filter);
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

  // 加载学生统计数据
  const loadStudentStatistics = useCallback(async filter => {
    setLoadingStudentStats(true);
    try {
      const result = await getGuestStudentAIQuestionStatisticsAction(filter);
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
        timeRange: filterState.timeRange,
        startDate: filterState.startDate,
        endDate: filterState.endDate
      };

      // 加载基础统计数据
      await loadStatistics(filter);

      // 同时加载学生统计数据
      const studentFilter = {
        timeRange: filterState.timeRange,
        startDate: filterState.startDate,
        endDate: filterState.endDate
      };
      await loadStudentStatistics(studentFilter);
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
    // 用户存在且有当前校园时，初始化页面
    if (user?.workSetting?.currentSchool) {
      setLoading(false); // 只是初始化页面，不需要loading状态
    }
  }, [user]);
  if (loading) {
    return <div className="flex flex-col min-h-screen bg-gray-50">
        <WorkHeader title={`非登录用户${DISPLAY_TEXT.SELF_UPLOAD_MISTAKE}统计`} showBackButton={true} backHref="/work/records" backText="返回AI学习记录" />
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
    // 如果是自定义时间区间，必须选择开始和结束日期
    if (filterState.timeRange === "custom") {
      if (!filterState.startDate || !filterState.endDate) return false;
    }
    return true;
  };

  // 如果没有统计数据但有有效过滤条件，显示提示
  if (!statistics && hasValidFilter()) {
    return <div className="flex flex-col min-h-screen bg-gray-50">
        <WorkHeader title={`非登录用户${DISPLAY_TEXT.SELF_UPLOAD_MISTAKE}统计`} showBackButton={true} backHref="/work/records" backText="返回AI学习记录" />
        <main className="flex-1 p-6">
          <div className="container mx-auto max-w-6xl">
            <div className="mb-6">
              <GuestStatFilters filterState={filterState} onFilterChange={setFilterState} onQuery={handleQuery} querying={querying} />
            </div>
          </div>
        </main>
      </div>;
  }

  // 默认情况：显示过滤器和提示
  return <div className="flex flex-col min-h-screen bg-gray-50">
      <WorkHeader title={`非登录用户${DISPLAY_TEXT.SELF_UPLOAD_MISTAKE}统计`} showBackButton={true} backHref="/work/records" backText="返回AI学习记录" />

      <main className="flex-1 p-6">
        <div className="container mx-auto max-w-6xl">
          {/* 过滤器组件 */}
          <div className="mb-6">
            <GuestStatFilters filterState={filterState} onFilterChange={setFilterState} onQuery={handleQuery} querying={querying} />
          </div>

          {statistics && <>
              {/* 统计图表组件 */}
              <div className="mb-6">
                <GuestStatCharts data={statistics} />
              </div>

              {/* 概览信息卡片 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">
                    {statistics.totalQuestions}
                  </div>
                  <div className="text-sm text-muted-foreground">题目总数</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    非登录用户提交的所有{DISPLAY_TEXT.SELF_UPLOAD_MISTAKE}题目
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
                  <div className="text-3xl font-bold text-green-600 mb-2">
                    {statistics.masteredQuestions}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    已掌握题目
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    通过{DISPLAY_TEXT.SELF_UPLOAD_MISTAKE}掌握的题目
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
                  <div className="text-3xl font-bold text-orange-600 mb-2">
                    {statistics.unmasteredQuestions}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    未掌握题目
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    还需要继续学习的题目
                  </div>
                </div>
              </div>

              {/* 学生统计表格 */}
              <div className="mt-6">
                <GuestStudentStatTable data={studentStatistics} loading={loadingStudentStats} />
              </div>
            </>}
        </div>
      </main>
    </div>;
}
