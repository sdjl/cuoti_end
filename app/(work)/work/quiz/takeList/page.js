"use client";

import { RefreshCw } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
// 口述核心知识点参与记录列表页面，支持筛选、分页和查看学生提交的答案
import { useCallback, useEffect, useState } from "react";
import { CustomPagination } from "../../../../../components/common/Pagination.js";
import { Button } from "../../../../../components/ui/button.js";
import WorkHeader from "../../../../../components/work/layout/WorkHeader.js";
import { useToast } from "../../../../../hooks/use-toast.js";
import { useAuth } from "../../../../../hooks/useAuth.js";
import { DISPLAY_TEXT } from "../../../../../lib/config/constants.js";
import { getQuizTakesAction, getQuizTakesCountAction } from "./actions.js";
import QuizTakeFilters from "./components/QuizTakeFilters.js";
import QuizTakeList from "./components/QuizTakeList.js";

// 每页显示的记录数量
const PAGE_SIZE = 20;
export default function QuizTakeListPage() {
  const {
    user
  } = useAuth();
  const router = useRouter();
  const {
    toast
  } = useToast();
  const searchParams = useSearchParams();
  const [quizTakes, setQuizTakes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  // 从URL参数获取teamId
  const teamIdFromUrl = searchParams.get("teamId") || null;

  // 过滤器状态
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("all");
  const [selectedGrade, setSelectedGrade] = useState("all");

  // 计算总页数
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  // 检查当前校园
  useEffect(() => {
    if (user && !user.workSetting?.currentSchool) {
      router.push("/work/setting/curr-school");
      return;
    }
  }, [user, router]);

  // 获取口述核心知识点参与记录数据
  const fetchQuizTakes = useCallback(async () => {
    setIsLoading(true);
    try {
      const keyword = searchTerm.trim();

      // 注意：API调用中pageNum应从0开始，而展示给用户的页码从1开始
      const pageNum = currentPage - 1;
      const [quizTakesData, count] = await Promise.all([getQuizTakesAction({
        pageNum,
        pageSize: PAGE_SIZE,
        keyword,
        subject: selectedSubject,
        grade: selectedGrade,
        teamId: teamIdFromUrl
      }), getQuizTakesCountAction({
        keyword,
        subject: selectedSubject,
        grade: selectedGrade,
        teamId: teamIdFromUrl
      })]);
      setQuizTakes(quizTakesData);
      setTotalCount(count);
    } catch (error) {
      console.error(`获取${DISPLAY_TEXT.ORAL_KNOWLEDGE_QUIZ}参与记录失败:`, error);
      toast({
        title: "获取数据失败",
        description: `获取${DISPLAY_TEXT.ORAL_KNOWLEDGE_QUIZ}参与记录时发生错误`,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, selectedSubject, selectedGrade, teamIdFromUrl, currentPage, toast]);

  // 获取所有数据（初始加载和手动刷新）
  const fetchAllData = useCallback(async (showRefreshLoading = false) => {
    if (showRefreshLoading) {
      setIsRefreshing(true);
    }
    try {
      await fetchQuizTakes();
    } catch (error) {
      console.error(`获取${DISPLAY_TEXT.ORAL_KNOWLEDGE_QUIZ}参与记录失败:`, error);
    } finally {
      setIsRefreshing(false);
    }
  }, [fetchQuizTakes]);

  // 初始加载数据
  useEffect(() => {
    fetchAllData(false);
  }, [fetchAllData]);

  // 当筛选条件变化时，重置到第一页
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedSubject, selectedGrade, teamIdFromUrl]);

  // 手动刷新数据
  const handleRefresh = useCallback(() => {
    fetchAllData(true);
  }, [fetchAllData]);

  // 重置过滤器
  const handleResetFilters = useCallback(() => {
    setSearchTerm("");
    setSelectedSubject("all");
    setSelectedGrade("all");
    setCurrentPage(1);
  }, []);

  // 处理页码变更
  const handlePageChange = useCallback(page => {
    setCurrentPage(page);
  }, []);
  return <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <WorkHeader title={teamIdFromUrl ? "队伍答案记录" : "学生提交答案"} showBackButton={true} backHref={teamIdFromUrl ? `/work/quiz/team` : "/work/records"} backText={teamIdFromUrl ? "返回队伍管理" : "返回记录"} rightContent={<div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing} className="flex items-center">
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
              刷新数据
            </Button>
          </div>} />

      <main className="flex-1 p-6 space-y-6">
        <div className="container mx-auto space-y-4">
          {/* 过滤器 */}
          <QuizTakeFilters searchTerm={searchTerm} setSearchTerm={setSearchTerm} selectedSubject={selectedSubject} setSelectedSubject={setSelectedSubject} selectedGrade={selectedGrade} setSelectedGrade={setSelectedGrade} onResetFilters={handleResetFilters} />

          {/* 口述核心知识点参与记录列表 */}
          <QuizTakeList quizTakes={quizTakes} isLoading={isLoading} onRefresh={handleRefresh} />

          {/* 统计信息 */}
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                共找到{" "}
                <span className="font-medium text-gray-900">{totalCount}</span>{" "}
                条{DISPLAY_TEXT.ORAL_KNOWLEDGE_QUIZ}记录
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
