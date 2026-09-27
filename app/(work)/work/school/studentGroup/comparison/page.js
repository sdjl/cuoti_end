"use client";

import { useRouter } from "next/navigation";
// 学生分组对比页面，展示所有学生分组的错题重练对比统计数据
import { useCallback, useEffect, useState } from "react";
import WorkHeader from "../../../../../../components/work/layout/WorkHeader.js";
import { useToast } from "../../../../../../hooks/use-toast.js";
import { useAuth } from "../../../../../../hooks/useAuth.js";
import { getGroupComparisonStatisticsAction } from "./actions.js";
import ComparisonChart from "./components/ComparisonChart.js";
import ComparisonFilters from "./components/ComparisonFilters.js";
import ComparisonTable from "./components/ComparisonTable.js";
import { SCORE_TYPES } from "./constants.js";
export default function GroupComparisonPage() {
  const {
    user
  } = useAuth();
  const router = useRouter();
  const {
    toast
  } = useToast();
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);

  // 过滤器状态
  const [filterState, setFilterState] = useState({
    timeRange: "all"
  });
  const [querying, setQuerying] = useState(false);

  // 加载统计数据
  const loadStatistics = useCallback(async filter => {
    setLoadingStats(true);
    try {
      const result = await getGroupComparisonStatisticsAction(filter);
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
      setLoadingStats(false);
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
      await loadStatistics(filter);
    } finally {
      setQuerying(false);
    }
  }, [filterState, loadStatistics]);

  // 检查当前校园
  useEffect(() => {
    if (user && !user.workSetting?.currentSchool) {
      router.push("/work/setting/curr-school");
      return;
    }
  }, [user, router]);

  // 初始加载
  useEffect(() => {
    if (user?.workSetting?.currentSchool) {
      setLoading(false);
      // 不自动加载数据，等待用户点击查询按钮
    }
  }, [user]);
  if (loading) {
    return <div className="flex flex-col min-h-screen bg-gray-50">
        <WorkHeader title="学生分组对比" showBackButton={true} backHref="/work/school" backText="返回校园首页" />
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

  // 默认情况：显示过滤器和统计结果
  return <div className="flex flex-col min-h-screen bg-gray-50">
      <WorkHeader title="学生分组对比" showBackButton={true} backHref="/work/school" backText="返回校园首页" />

      <main className="flex-1 p-6">
        <div className="container mx-auto max-w-7xl">
          {/* 过滤器组件 */}
          <div className="mb-6">
            <ComparisonFilters filterState={filterState} onFilterChange={setFilterState} onQuery={handleQuery} querying={querying} />
          </div>

          {statistics && <>
              {/* 总体统计卡片 */}
              <div className="mb-6 bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    总体统计数据
                  </h3>
                  <div className="text-xs text-gray-500">
                    积分统计类型：
                    {SCORE_TYPES.map((type, index) => <span key={type}>
                        {index > 0 && "、"}
                        <span className="text-purple-600 font-medium">
                          {type}
                        </span>
                      </span>)}
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-gray-900">
                      {statistics.totalStats.groupCount}
                    </div>
                    <div className="text-xs text-gray-600">分组总数</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-gray-900">
                      {statistics.totalStats.totalStudents}
                    </div>
                    <div className="text-xs text-gray-600">学生总数</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-gray-900">
                      {statistics.totalStats.totalMistakes}
                    </div>
                    <div className="text-xs text-gray-600">错题总数</div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {statistics.totalStats.totalCorrected}
                    </div>
                    <div className="text-xs text-gray-600">通过总数</div>
                  </div>
                  <div className="bg-red-50 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {statistics.totalStats.totalUncorrected}
                    </div>
                    <div className="text-xs text-gray-600">未通过总数</div>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {statistics.totalStats.averageCorrectionRate.toFixed(1)}%
                    </div>
                    <div className="text-xs text-gray-600">平均通过率</div>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {statistics.totalStats.totalScoreIncrease}
                    </div>
                    <div className="text-xs text-gray-600">积分总增量</div>
                  </div>
                  <div className="bg-amber-50 rounded-lg p-3 text-center">
                    <div className="text-2xl font-bold text-amber-600">
                      {statistics.totalStats.averageScorePerStudent.toFixed(1)}
                    </div>
                    <div className="text-xs text-gray-600">平均积分增量</div>
                  </div>
                </div>
              </div>

              {/* 柱状图对比 */}
              <div className="mb-6">
                <ComparisonChart data={statistics.groupStats} loading={loadingStats} />
              </div>

              {/* 对比表格 */}
              <div>
                <ComparisonTable data={statistics.groupStats} loading={loadingStats} />
              </div>
            </>}

          {/* 如果没有统计数据 */}
          {!statistics && hasValidFilter() && !loadingStats && <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
              <p className="text-gray-500 text-lg">暂无统计数据</p>
              <p className="text-gray-400 text-sm mt-2">
                请点击查询按钮加载数据
              </p>
            </div>}
        </div>
      </main>
    </div>;
}
