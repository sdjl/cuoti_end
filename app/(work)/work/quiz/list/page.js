"use client";

import { Plus, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
// 口述核心知识点列表页面，用于查看、搜索和管理所有口述核心知识点
import { useCallback, useEffect, useState } from "react";
import { CustomPagination } from "../../../../../components/common/Pagination.js";
import { Button } from "../../../../../components/ui/button.js";
import WorkHeader from "../../../../../components/work/layout/WorkHeader.js";
import { useToast } from "../../../../../hooks/use-toast.js";
import { useAuth } from "../../../../../hooks/useAuth.js";
import { DISPLAY_TEXT } from "../../../../../lib/config/constants.js";
import { deleteQuizAction, getQuizParticipantCountsAction, getQuizzesAction, getQuizzesCountAction, updateQuizStatusAction } from "./actions.js";
import QuizFilters from "./components/QuizFilters.js";
import QuizList from "./components/QuizList.js";

// 每页显示的口述核心知识点数量
const PAGE_SIZE = 20;
export default function QuizListPage() {
  const {
    user
  } = useAuth();
  const router = useRouter();
  const {
    toast
  } = useToast();
  const [quizzes, setQuizzes] = useState([]);
  const [participantCounts, setParticipantCounts] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  // 过滤器状态
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("all");
  const [selectedGrade, setSelectedGrade] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedTeamEnabled, setSelectedTeamEnabled] = useState("all");
  const [selectedActivityStatus, setSelectedActivityStatus] = useState("all");

  // 计算总页数
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  // 检查当前校园
  useEffect(() => {
    if (user && !user.workSetting?.currentSchool) {
      router.push("/work/setting/curr-school");
      return;
    }
  }, [user, router]);

  // 获取口述核心知识点数据
  const fetchQuizzes = useCallback(async () => {
    setIsLoading(true);
    try {
      const keyword = searchTerm.trim();

      // 注意：API调用中pageNum应从0开始，而展示给用户的页码从1开始
      const pageNum = currentPage - 1;
      const [quizzesData, count] = await Promise.all([getQuizzesAction({
        pageNum,
        pageSize: PAGE_SIZE,
        keyword,
        subject: selectedSubject,
        grade: selectedGrade,
        status: selectedStatus,
        teamEnabled: selectedTeamEnabled,
        activityStatus: selectedActivityStatus
      }), getQuizzesCountAction({
        keyword,
        subject: selectedSubject,
        grade: selectedGrade,
        status: selectedStatus,
        teamEnabled: selectedTeamEnabled,
        activityStatus: selectedActivityStatus
      })]);
      setQuizzes(quizzesData);
      setTotalCount(count);

      // 获取参与人数
      if (quizzesData.length > 0) {
        const quizIds = quizzesData.map(quiz => quiz._id);
        const counts = await getQuizParticipantCountsAction(quizIds);
        setParticipantCounts(counts);
      }
    } catch (error) {
      console.error(`获取${DISPLAY_TEXT.ORAL_KNOWLEDGE_QUIZ}数据失败:`, error);
      toast({
        title: "获取数据失败",
        description: `获取${DISPLAY_TEXT.ORAL_KNOWLEDGE_QUIZ}数据时发生错误`,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, selectedSubject, selectedGrade, selectedStatus, selectedTeamEnabled, selectedActivityStatus, currentPage, toast]);

  // 获取所有数据（初始加载和手动刷新）
  const fetchAllData = useCallback(async (showRefreshLoading = false) => {
    if (showRefreshLoading) {
      setIsRefreshing(true);
    }
    try {
      await fetchQuizzes();
    } catch (error) {
      console.error(`获取${DISPLAY_TEXT.ORAL_KNOWLEDGE_QUIZ}数据失败:`, error);
    } finally {
      setIsRefreshing(false);
    }
  }, [fetchQuizzes]);

  // 初始加载数据
  useEffect(() => {
    fetchAllData(false);
  }, [fetchAllData]);

  // 当筛选条件变化时，重置到第一页
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedSubject, selectedGrade, selectedStatus, selectedTeamEnabled, selectedActivityStatus]);

  // 手动刷新数据
  const handleRefresh = useCallback(() => {
    fetchAllData(true);
  }, [fetchAllData]);

  // 重置过滤器
  const handleResetFilters = useCallback(() => {
    setSearchTerm("");
    setSelectedSubject("all");
    setSelectedGrade("all");
    setSelectedStatus("all");
    setSelectedTeamEnabled("all");
    setSelectedActivityStatus("all");
    setCurrentPage(1);
  }, []);

  // 处理页码变更
  const handlePageChange = useCallback(page => {
    setCurrentPage(page);
  }, []);

  // 处理创建口述核心知识点
  const handleCreateQuiz = useCallback(() => {
    router.push("/work/quiz/new");
  }, [router]);

  // 处理删除口述核心知识点
  const handleDeleteQuiz = useCallback(async quizId => {
    try {
      const {
        success,
        error
      } = await deleteQuizAction(quizId);
      if (success) {
        toast({
          title: "删除成功",
          description: `${DISPLAY_TEXT.ORAL_KNOWLEDGE_QUIZ}已成功删除`
        });
        // 刷新数据
        await fetchAllData();
      } else {
        toast({
          title: "删除失败",
          description: error || `删除${DISPLAY_TEXT.ORAL_KNOWLEDGE_QUIZ}时发生错误`,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error(`删除${DISPLAY_TEXT.ORAL_KNOWLEDGE_QUIZ}失败:`, error);
      toast({
        title: "删除失败",
        description: `删除${DISPLAY_TEXT.ORAL_KNOWLEDGE_QUIZ}时发生错误`,
        variant: "destructive"
      });
    }
  }, [toast, fetchAllData]);

  // 处理锁定/解锁口述核心知识点
  const handleToggleQuizStatus = useCallback(async (quizId, newStatus) => {
    try {
      const {
        success,
        error
      } = await updateQuizStatusAction(quizId, newStatus);
      if (success) {
        const statusText = newStatus === "locked" ? "锁定" : newStatus === "closed" ? "关闭" : "解锁";
        toast({
          title: `${statusText}成功`,
          description: `${DISPLAY_TEXT.ORAL_KNOWLEDGE_QUIZ}已成功${statusText}`
        });
        // 刷新数据
        await fetchAllData();
      } else {
        toast({
          title: "操作失败",
          description: error || `更新${DISPLAY_TEXT.ORAL_KNOWLEDGE_QUIZ}状态时发生错误`,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error(`更新${DISPLAY_TEXT.ORAL_KNOWLEDGE_QUIZ}状态失败:`, error);
      toast({
        title: "操作失败",
        description: `更新${DISPLAY_TEXT.ORAL_KNOWLEDGE_QUIZ}状态时发生错误`,
        variant: "destructive"
      });
    }
  }, [toast, fetchAllData]);
  return <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <WorkHeader title={`${DISPLAY_TEXT.ORAL_KNOWLEDGE_QUIZ}管理`} showBackButton={true} backHref="/work/records" backText="返回记录" rightContent={<div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing} className="flex items-center">
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
              刷新数据
            </Button>
            <Button onClick={handleCreateQuiz} size="sm" className="flex items-center">
              <Plus className="h-4 w-4 mr-2" />
              创建{DISPLAY_TEXT.ORAL_KNOWLEDGE_QUIZ}
            </Button>
          </div>} />

      <main className="flex-1 p-6 space-y-6">
        <div className="container mx-auto space-y-4">
          {/* 过滤器 */}
          <QuizFilters searchTerm={searchTerm} setSearchTerm={setSearchTerm} selectedSubject={selectedSubject} setSelectedSubject={setSelectedSubject} selectedGrade={selectedGrade} setSelectedGrade={setSelectedGrade} selectedStatus={selectedStatus} setSelectedStatus={setSelectedStatus} selectedTeamEnabled={selectedTeamEnabled} setSelectedTeamEnabled={setSelectedTeamEnabled} selectedActivityStatus={selectedActivityStatus} setSelectedActivityStatus={setSelectedActivityStatus} onResetFilters={handleResetFilters} />

          {/* 口述核心知识点列表 */}
          <QuizList quizzes={quizzes} participantCounts={participantCounts} isLoading={isLoading} onDeleteQuiz={handleDeleteQuiz} onToggleStatus={handleToggleQuizStatus} />

          {/* 统计信息 */}
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                共找到{" "}
                <span className="font-medium text-gray-900">{totalCount}</span>{" "}
                个{DISPLAY_TEXT.ORAL_KNOWLEDGE_QUIZ}
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
