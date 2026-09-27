"use client";

/**
 * 课程错题使用日志页面
 *
 * URL参数支持：
 * - classId: 班级ID，用于过滤特定班级的数据
 * - studentId: 学生ID，用于过滤特定学生的数据
 *
 * 使用示例：
 * - /work/records/mistake-practice/useLogs?classId=xxx&studentId=yyy
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
import { deleteMistakePracticeLogAction, getMistakePracticeLogsAction, getMistakePracticeLogsCountAction } from "./actions.js";
import MistakePracticeFilters from "./components/MistakePracticeFilters.js";
import MistakePracticeList from "./components/MistakePracticeList.js";
// 每页显示的记录数量
const PAGE_SIZE = 20;
export default function MistakePracticeLogsPage() {
  const {
    user
  } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    toast
  } = useToast();
  const [mistakeLogs, setMistakeLogs] = useState([]);
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
  const [studentRating, setStudentRating] = useState("all");

  // 计算总页数
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  // 检查当前校园
  useEffect(() => {
    if (user && !user.workSetting?.currentSchool) {
      router.push("/work/setting/curr-school");
      return;
    }
  }, [user, router]);

  // 获取课程错题日志数据
  const fetchMistakeLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      // 注意：API调用中pageNum应从0开始，而展示给用户的页码从1开始
      const pageNum = currentPage - 1;
      const [logsData, count] = await Promise.all([getMistakePracticeLogsAction({
        pageNum,
        pageSize: PAGE_SIZE,
        studentSearch: studentSearch.trim(),
        classroomName: classroomName.trim(),
        startTime,
        endTime,
        sortOrder: sortOrder,
        studentRating: studentRating,
        classId: urlClassId,
        studentId: urlStudentId
      }), getMistakePracticeLogsCountAction({
        studentSearch: studentSearch.trim(),
        classroomName: classroomName.trim(),
        startTime,
        endTime,
        studentRating: studentRating,
        classId: urlClassId,
        studentId: urlStudentId
      })]);
      setMistakeLogs(logsData);
      setTotalCount(count);
    } catch (error) {
      console.error(`获取${DISPLAY_TEXT.COURSE_MISTAKE}日志失败:`, error);
      toast({
        title: "获取数据失败",
        description: `获取${DISPLAY_TEXT.COURSE_MISTAKE}日志时发生错误`,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [studentSearch, classroomName, startTime, endTime, sortOrder, studentRating, currentPage, toast, urlClassId, urlStudentId]);

  // 获取所有数据（初始加载和手动刷新）
  const fetchAllData = useCallback(async (showRefreshLoading = false) => {
    if (showRefreshLoading) {
      setIsRefreshing(true);
    }
    try {
      await fetchMistakeLogs();
    } catch (error) {
      console.error(`获取${DISPLAY_TEXT.COURSE_MISTAKE}日志失败:`, error);
    } finally {
      setIsRefreshing(false);
    }
  }, [fetchMistakeLogs]);

  // 初始加载数据
  useEffect(() => {
    fetchAllData(false);
  }, [fetchAllData]);

  // 当筛选条件变化时，重置到第一页
  useEffect(() => {
    setCurrentPage(1);
  }, [studentSearch, classroomName, startTime, endTime, sortOrder, studentRating]);

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
    setStudentRating("all");
    setCurrentPage(1);
  }, []);

  // 处理页码变更
  const handlePageChange = useCallback(page => {
    setCurrentPage(page);
  }, []);

  // 查看详情
  const handleViewDetails = useCallback(studentAnswerItemId => {
    window.open(`/work/records/mistake-practice/useLogs/${studentAnswerItemId}/details`, "_blank");
  }, []);

  // 查看学生端聊天记录
  const handleViewStudentChat = useCallback(studentAnswerItemId => {
    window.open(`/mobile/records/mistake-practice/${studentAnswerItemId}/useLogs`, "_blank");
  }, []);

  // 处理学生点击
  const handleStudentClick = useCallback((_type, value) => {
    setStudentSearch(value);
    setCurrentPage(1); // 重置到第一页
  }, []);

  // 处理删除
  const handleDelete = useCallback(async studentAnswerItemId => {
    try {
      const result = await deleteMistakePracticeLogAction(studentAnswerItemId);
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
      <WorkHeader title={`${DISPLAY_TEXT.COURSE_MISTAKE}使用日志`} showBackButton={true} backHref="/work/records" backText="返回AI学习记录" rightContent={<Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing} className="flex items-center">
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
            刷新数据
          </Button>} />

      <main className="flex-1 p-6 space-y-6">
        <div className="container mx-auto space-y-4">
          {/* 过滤器 */}
          <MistakePracticeFilters studentSearch={studentSearch} setStudentSearch={setStudentSearch} classroomName={classroomName} setClassroomName={setClassroomName} startTime={startTime} setStartTime={setStartTime} endTime={endTime} setEndTime={setEndTime} sortOrder={sortOrder} setSortOrder={setSortOrder} studentRating={studentRating} setStudentRating={setStudentRating} onReset={handleResetFilters} />

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

          {/* 课程错题日志列表 */}
          <MistakePracticeList mistakeLogs={mistakeLogs} isLoading={isLoading} onViewDetails={handleViewDetails} onViewStudentChat={handleViewStudentChat} onStudentClick={handleStudentClick} onDelete={handleDelete} />

          {/* 分页 */}
          {totalPages > 1 && <div className="flex justify-center">
              <CustomPagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} pageParamName="mistake_practice_page" />
            </div>}
        </div>
      </main>
    </div>;
}
