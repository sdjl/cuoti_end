"use client";

import { useParams, useRouter } from "next/navigation";
// 学生分组统计页面，展示学生分组的错题重练通过统计数据
import { useCallback, useEffect, useState } from "react";
import WorkHeader from "../../../../../../components/work/layout/WorkHeader.js";
import { useToast } from "../../../../../../hooks/use-toast.js";
import { useAuth } from "../../../../../../hooks/useAuth.js";
import { getStudentGroupStatisticsAction } from "./actions.js";
import StudentGroupStatFilters from "./components/StudentGroupStatFilters.js";
import StudentGroupStatTable from "./components/StudentGroupStatTable.js";
export default function StudentGroupStatPage() {
  const {
    user
  } = useAuth();
  const router = useRouter();
  const params = useParams();
  const {
    toast
  } = useToast();
  const [loading, setLoading] = useState(true);
  const [statistics, setStatistics] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);

  // 获取学生分组ID
  const studentGroupId = params.id;

  // 过滤器状态
  const [filterState, setFilterState] = useState({
    timeRange: "all"
  });
  const [querying, setQuerying] = useState(false);

  // 加载统计数据
  const loadStatistics = useCallback(async filter => {
    setLoadingStats(true);
    try {
      const result = await getStudentGroupStatisticsAction(studentGroupId, filter);
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
  }, [studentGroupId, toast]);

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
    if (user?.workSetting?.currentSchool && studentGroupId) {
      setLoading(false);
      // 不自动加载数据，等待用户点击查询按钮
    }
  }, [user, studentGroupId]);
  if (loading) {
    return <div className="flex flex-col min-h-screen bg-gray-50">
        <WorkHeader title="学生分组统计" showBackButton={true} backHref="/work/school/studentGroup" backText="返回分组管理" />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600">加载统计数据中...</p>
          </div>
        </main>
      </div>;
  }
  if (!studentGroupId) {
    return <div className="flex flex-col min-h-screen bg-gray-50">
        <WorkHeader title="学生分组统计" showBackButton={true} backHref="/work/school/studentGroup" backText="返回分组管理" />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-600">学生分组ID无效</p>
          </div>
        </main>
      </div>;
  }

  // 默认情况：显示过滤器和统计结果
  return <div className="flex flex-col min-h-screen bg-gray-50">
      <WorkHeader title="学生分组统计" showBackButton={true} backHref="/work/school/studentGroup" backText="返回分组管理" />

      <main className="flex-1 p-6">
        <div className="container mx-auto max-w-6xl">
          {/* 过滤器组件 */}
          <div className="mb-6">
            <StudentGroupStatFilters filterState={filterState} onFilterChange={setFilterState} onQuery={handleQuery} querying={querying} studentGroupName={statistics?.studentGroup.name || "学生分组"} />
          </div>

          {statistics ? <>
              {/* 基本信息卡片 */}
              <div className="mb-6 bg-white rounded-lg shadow-sm border p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      分组信息
                    </h3>
                    <div className="space-y-1 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">分组名称：</span>
                        {statistics.studentGroup.name}
                      </div>
                      <div>
                        <span className="font-medium">老师姓名：</span>
                        {statistics.studentGroup.teacherName}
                      </div>
                      <div>
                        <span className="font-medium">学生人数：</span>
                        {statistics.studentGroup.students.length} 人
                      </div>
                      {statistics.studentGroup.notes && <div>
                          <span className="font-medium">备注：</span>
                          {statistics.studentGroup.notes}
                        </div>}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      团队统计数据
                    </h3>
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div className="bg-gray-50 rounded-lg p-3">
                        <div className="text-2xl font-bold text-gray-900">
                          {statistics.teamStats.totalMistakes}
                        </div>
                        <div className="text-xs text-gray-600">错题总数</div>
                      </div>
                      <div className="bg-green-50 rounded-lg p-3">
                        <div className="text-2xl font-bold text-green-600">
                          {statistics.teamStats.totalCorrected}
                        </div>
                        <div className="text-xs text-gray-600">通过总数</div>
                      </div>
                      <div className="bg-red-50 rounded-lg p-3">
                        <div className="text-2xl font-bold text-red-600">
                          {statistics.teamStats.totalUncorrected}
                        </div>
                        <div className="text-xs text-gray-600">未通过总数</div>
                      </div>
                      <div className="bg-blue-50 rounded-lg p-3">
                        <div className="text-2xl font-bold text-blue-600">
                          {statistics.teamStats.correctionRate.toFixed(1)}%
                        </div>
                        <div className="text-xs text-gray-600">通过率</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 学生统计表格 */}
              <div>
                <StudentGroupStatTable data={statistics.studentStats} loading={loadingStats} />
              </div>
            </> : (/* 没有数据时显示提示 */
        <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
              <p className="text-gray-500 text-lg">暂无统计数据</p>
              <p className="text-gray-400 text-sm mt-2">
                请选择时间范围后点击查询按钮加载数据
              </p>
            </div>)}
        </div>
      </main>
    </div>;
}
