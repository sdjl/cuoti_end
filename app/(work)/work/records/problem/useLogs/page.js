"use client";

/**
 * 自主上传错题使用日志页面
 *
 * URL参数支持：
 * - classId: 班级ID，用于过滤特定班级的数据
 * - studentId: 学生ID，用于过滤特定学生的数据
 *
 * 使用示例：
 * - /work/records/problem/useLogs?classId=xxx&studentId=yyy
 */
import { RefreshCw } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { CustomPagination } from "../../../../../../components/common/Pagination.js";
import { Button } from "../../../../../../components/ui/button.js";
import WorkHeader from "../../../../../../components/work/layout/WorkHeader.js";
import { useToast } from "../../../../../../hooks/use-toast.js";
import { useAuth } from "../../../../../../hooks/useAuth.js";
import { DISPLAY_TEXT } from "../../../../../../lib/config/constants.js";
import { deleteAIQuestionLogAction, getAIQuestionLogsAction, getAIQuestionLogsCountAction } from "./actions.js";
import AIQuestionFilters from "./components/AIQuestionFilters.js";
import AIQuestionList from "./components/AIQuestionList.js";
// 每页显示的记录数量
const PAGE_SIZE = 20;
export default function AIQuestionLogsPage() {
  const {
    user
  } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    toast
  } = useToast();
  const [aiQuestionLogs, setAIQuestionLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  // 从URL参数中读取 classId 和 studentId
  const urlClassId = searchParams.get("classId") || undefined;
  const urlStudentId = searchParams.get("studentId") || undefined;

  // 过滤器状态
  const [studentSearch, setStudentSearch] = useState("");
  const [classroomName, setClassroomName] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [sortOrder, setSortOrder] = useState("newest");
  const [masteryStatus, setMasteryStatus] = useState("all");

  // 计算总页数
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  // 检查当前校园
  useEffect(() => {
    if (user && !user.workSetting?.currentSchool) {
      router.push("/work/setting/curr-school");
      return;
    }
  }, [user, router]);

  // 获取自主上传错题日志数据
  const fetchAIQuestionLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      // 注意：API调用中pageNum应从0开始，而展示给用户的页码从1开始
      const pageNum = currentPage - 1;
      const [logsData, count] = await Promise.all([getAIQuestionLogsAction({
        pageNum,
        pageSize: PAGE_SIZE,
        studentSearch: studentSearch.trim(),
        classroomName: classroomName.trim(),
        startTime,
        endTime,
        sortOrder: sortOrder,
        masteryStatus: masteryStatus,
        classId: urlClassId,
        studentId: urlStudentId
      }), getAIQuestionLogsCountAction({
        studentSearch: studentSearch.trim(),
        classroomName: classroomName.trim(),
        startTime,
        endTime,
        masteryStatus: masteryStatus,
        classId: urlClassId,
        studentId: urlStudentId
      })]);
      setAIQuestionLogs(logsData);
      setTotalCount(count);
    } catch (error) {
      console.error(`获取${DISPLAY_TEXT.SELF_UPLOAD_MISTAKE}日志失败:`, error);
      toast({
        title: "获取数据失败",
        description: `获取${DISPLAY_TEXT.SELF_UPLOAD_MISTAKE}日志时发生错误`,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [studentSearch, classroomName, startTime, endTime, sortOrder, masteryStatus, currentPage, toast, urlClassId, urlStudentId]);

  // 获取所有数据（初始加载和手动刷新）
  const fetchAllData = useCallback(async (showRefreshLoading = false) => {
    if (showRefreshLoading) {
      setIsRefreshing(true);
    }
    try {
      await fetchAIQuestionLogs();
    } catch (error) {
      console.error(`获取${DISPLAY_TEXT.SELF_UPLOAD_MISTAKE}日志失败:`, error);
    } finally {
      setIsRefreshing(false);
    }
  }, [fetchAIQuestionLogs]);

  // 初始加载数据
  useEffect(() => {
    fetchAllData(false);
  }, [fetchAllData]);

  // 当筛选条件变化时，重置到第一页
  useEffect(() => {
    setCurrentPage(1);
  }, [studentSearch, classroomName, startTime, endTime, sortOrder, masteryStatus]);

  // 手动刷新数据
  const handleRefresh = useCallback(() => {
    fetchAllData(true);
  }, [fetchAllData]);

  // 重置过滤器
  const handleResetFilters = useCallback(() => {
    setStudentSearch("");
    setClassroomName("");
    setStartTime("");
    setEndTime("");
    setSortOrder("newest");
    setMasteryStatus("all");
    setCurrentPage(1);
  }, []);

  // 处理页码变更
  const handlePageChange = useCallback(page => {
    setCurrentPage(page);
  }, []);

  // 查看详情
  const handleViewDetails = useCallback(sessionId => {
    window.open(`/work/records/problem/useLogs/${sessionId}/details`, "_blank");
  }, []);

  // 查看学生端聊天记录
  const handleViewStudentChat = useCallback(problemQuestionId => {
    window.open(`/mobile/records/problems/${problemQuestionId}/useLogs`, "_blank");
  }, []);

  // 处理学生点击
  const handleStudentClick = useCallback((_type, value) => {
    setStudentSearch(value);
    setCurrentPage(1); // 重置到第一页
  }, []);

  // 处理删除
  const handleDelete = useCallback(async sessionId => {
    try {
      const result = await deleteAIQuestionLogAction(sessionId);
      if (result.success) {
        toast({
          description: result.message
        });
        // 删除成功后刷新数据
        await fetchAllData();
      } else {
        toast({
          description: result.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("删除失败:", error);
      toast({
        description: "删除失败，请重试",
        variant: "destructive"
      });
    }
  }, [fetchAllData, toast]);
  return <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <WorkHeader title={`${DISPLAY_TEXT.SELF_UPLOAD_MISTAKE}使用日志`} showBackButton={true} backHref="/work/records" backText="返回AI学习记录" rightContent={<Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing} className="flex items-center">
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
            刷新数据
          </Button>} />

      <main className="flex-1 p-6 space-y-6">
        <div className="container mx-auto space-y-4">
          {/* 过滤器 */}
          <AIQuestionFilters studentSearch={studentSearch} setStudentSearch={setStudentSearch} classroomName={classroomName} setClassroomName={setClassroomName} startTime={startTime} setStartTime={setStartTime} endTime={endTime} setEndTime={setEndTime} sortOrder={sortOrder} setSortOrder={setSortOrder} masteryStatus={masteryStatus} setMasteryStatus={setMasteryStatus} onReset={handleResetFilters} />

          {/* 统计信息 */}
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                共找到{" "}
                <span className="font-medium text-gray-900">{totalCount}</span>{" "}
                条记录
              </div>
              <div className="text-sm text-gray-500">
                第 {currentPage} 页，共 {totalPages} 页
              </div>
            </div>
          </div>

          {/* 自主上传错题日志列表 */}
          <AIQuestionList aiQuestionLogs={aiQuestionLogs} isLoading={isLoading} onViewDetails={handleViewDetails} onViewStudentChat={handleViewStudentChat} onStudentClick={handleStudentClick} onDelete={handleDelete} />

          {/* 分页 */}
          {totalPages > 1 && <div className="flex justify-center">
              <CustomPagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} pageParamName="ai_question_page" />
            </div>}
        </div>
      </main>
    </div>;
}
