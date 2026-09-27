"use client";

import { RefreshCw } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
// 队伍管理页面，展示和管理口述核心知识点的组队记录，支持筛选和分页
import { useCallback, useEffect, useState } from "react";
import { CustomPagination } from "../../../../../components/common/Pagination.js";
import { Button } from "../../../../../components/ui/button.js";
import WorkHeader from "../../../../../components/work/layout/WorkHeader.js";
import { useToast } from "../../../../../hooks/use-toast.js";
import { useAuth } from "../../../../../hooks/useAuth.js";
import { DISPLAY_TEXT } from "../../../../../lib/config/constants.js";
import { getQuizzesForFilterAction, getTeamsAction, getTeamsCountAction, getTeamsStatsAction } from "./actions.js";
import TeamFilters from "./components/TeamFilters.js";
import TeamList from "./components/TeamList.js";

// 每页显示的队伍数量
const PAGE_SIZE = 20;
export default function TeamListPage() {
  const {
    user
  } = useAuth();
  const router = useRouter();
  const {
    toast
  } = useToast();
  const searchParams = useSearchParams();
  const [teams, setTeams] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [teamsStats, setTeamsStats] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  // 从URL参数获取quizId
  const quizIdFromUrl = searchParams.get("quizId") || "all";

  // 过滤器状态
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedQuiz, setSelectedQuiz] = useState(quizIdFromUrl);

  // 计算总页数
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  // 检查当前校园
  useEffect(() => {
    if (user && !user.workSetting?.currentSchool) {
      router.push("/work/setting/curr-school");
      return;
    }
  }, [user, router]);

  // 同步URL参数变化
  useEffect(() => {
    const urlQuizId = searchParams.get("quizId") || "all";
    setSelectedQuiz(urlQuizId);
  }, [searchParams]);

  // 获取口述核心知识点列表（用于筛选）
  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        const quizzesList = await getQuizzesForFilterAction();
        setQuizzes(quizzesList);
      } catch (error) {
        console.error(`获取${DISPLAY_TEXT.ORAL_KNOWLEDGE_QUIZ}列表失败:`, error);
      }
    };
    fetchQuizzes();
  }, []);

  // 获取队伍数据
  const fetchTeams = useCallback(async () => {
    setIsLoading(true);
    try {
      const keyword = searchTerm.trim();

      // 注意：API调用中pageNum应从0开始，而展示给用户的页码从1开始
      const pageNum = currentPage - 1;
      const [teamsData, count] = await Promise.all([getTeamsAction({
        pageNum,
        pageSize: PAGE_SIZE,
        keyword,
        quizId: selectedQuiz
      }), getTeamsCountAction({
        keyword,
        quizId: selectedQuiz
      })]);
      setTeams(teamsData);
      setTotalCount(count);

      // 获取队伍统计信息
      if (teamsData.length > 0) {
        const teamIds = teamsData.map(team => team._id);
        const statsData = await getTeamsStatsAction(teamIds);
        setTeamsStats(statsData);
      }
    } catch (error) {
      console.error("获取队伍数据失败:", error);
      toast({
        title: "获取数据失败",
        description: "获取队伍数据时发生错误",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, selectedQuiz, currentPage, toast]);

  // 获取所有数据（初始加载和手动刷新）
  const fetchAllData = useCallback(async (showRefreshLoading = false) => {
    if (showRefreshLoading) {
      setIsRefreshing(true);
    }
    try {
      await fetchTeams();
    } catch (error) {
      console.error("获取队伍数据失败:", error);
    } finally {
      setIsRefreshing(false);
    }
  }, [fetchTeams]);

  // 初始加载数据
  useEffect(() => {
    fetchAllData(false);
  }, [fetchAllData]);

  // 当筛选条件变化时，重置到第一页
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedQuiz]);

  // 手动刷新数据
  const handleRefresh = useCallback(() => {
    fetchAllData(true);
  }, [fetchAllData]);

  // 重置过滤器
  const handleResetFilters = useCallback(() => {
    setSearchTerm("");
    setSelectedQuiz("all");
    setCurrentPage(1);
  }, []);

  // 处理页码变更
  const handlePageChange = useCallback(page => {
    setCurrentPage(page);
  }, []);
  return <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <WorkHeader title="队伍管理" showBackButton={true} backHref="/work/records" backText="返回记录" rightContent={<div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing} className="flex items-center">
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
              刷新数据
            </Button>
          </div>} />

      <main className="flex-1 p-6 space-y-6">
        <div className="container mx-auto space-y-4">
          {/* 过滤器 */}
          <TeamFilters searchTerm={searchTerm} setSearchTerm={setSearchTerm} selectedQuiz={selectedQuiz} setSelectedQuiz={setSelectedQuiz} quizzes={quizzes} onResetFilters={handleResetFilters} />

          {/* 队伍列表 */}
          <TeamList teams={teams} quizzes={quizzes} isLoading={isLoading} teamsStats={teamsStats} />

          {/* 统计信息 */}
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                共找到{" "}
                <span className="font-medium text-gray-900">{totalCount}</span>{" "}
                个队伍
              </div>
              <div className="text-sm text-gray-500">
                第 {currentPage} 页，共 {totalPages} 页
              </div>
            </div>
          </div>

          {/* 分页 */}
          {totalPages > 1 && <div className="flex justify-center">
              <CustomPagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
            </div>}
        </div>
      </main>
    </div>;
}
