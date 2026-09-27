"use client";

import { RefreshCw, RotateCcw } from "lucide-react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
// 错题批量任务详情页，集中展示班级压缩包与学生 PDF 状态
import { useCallback, useEffect, useState } from "react";
import { Button } from "../../../../../../../components/ui/button.js";
import WorkHeader from "../../../../../../../components/work/layout/WorkHeader.js";
import { useToast } from "../../../../../../../hooks/use-toast.js";
import { useAuth } from "../../../../../../../hooks/useAuth.js";
import { countFailedTasksAction, getTaskClassTasksAction, getTaskDetailAction, getTaskStudentPdfsAction, retryAllCleanFailedTasksAction, retryAllFailedTasksAction } from "./actions.js";
import ClassZipStatus from "./components/ClassZipStatus.js";
import StudentPdfFilters from "./components/StudentPdfFilters.js";
import StudentPdfList from "./components/StudentPdfList.js";
export default function TaskDetailPage() {
  const {
    user
  } = useAuth();
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const {
    toast
  } = useToast();
  const taskId = params.taskId;
  const studentIdFromUrl = searchParams.get("studentId");
  const [task, setTask] = useState(null);
  const [classTasks, setClassTasks] = useState([]);
  const [allStudentPdfs, setAllStudentPdfs] = useState([]);
  const [filteredStudentPdfs, setFilteredStudentPdfs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isRetryingFailed, setIsRetryingFailed] = useState(false);
  const [isRetryingCleanFailed, setIsRetryingCleanFailed] = useState(false);
  const [failedCounts, setFailedCounts] = useState({
    failedCount: 0,
    cleanFailedCount: 0
  });

  // 检查当前校园
  useEffect(() => {
    if (user && !user.workSetting?.currentSchool) {
      router.push("/work/setting/curr-school");
      return;
    }
  }, [user, router]);

  // 获取数据
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [taskData, classTasksData, studentPdfsData, failedCountsData] = await Promise.all([getTaskDetailAction(taskId), getTaskClassTasksAction(taskId), getTaskStudentPdfsAction(taskId), countFailedTasksAction(taskId)]);
      if (!taskData) {
        toast({
          title: "任务不存在",
          description: "未找到该任务",
          variant: "destructive"
        });
        router.push("/work/create-pack/mistake-batch/list");
        return;
      }
      setTask(taskData);
      setClassTasks(classTasksData);
      setAllStudentPdfs(studentPdfsData);
      setFilteredStudentPdfs(studentPdfsData);
      setFailedCounts(failedCountsData);
    } catch (error) {
      console.error("获取任务数据失败:", error);
      toast({
        title: "获取数据失败",
        description: "获取任务数据时发生错误",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [taskId, toast, router]);

  // 获取所有数据（初始加载和手动刷新）
  const fetchAllData = useCallback(async (showRefreshLoading = false) => {
    if (showRefreshLoading) {
      setIsRefreshing(true);
    }
    try {
      await fetchData();
    } catch (error) {
      console.error("获取数据失败:", error);
    } finally {
      setIsRefreshing(false);
    }
  }, [fetchData]);

  // 初始加载数据
  useEffect(() => {
    fetchAllData(false);
  }, [fetchAllData]);

  // 手动刷新数据
  const handleRefresh = useCallback(() => {
    fetchAllData(true);
  }, [fetchAllData]);

  // 处理过滤
  const handleFilter = useCallback(filtered => {
    setFilteredStudentPdfs(filtered);
  }, []);

  // 批量重试失败的任务
  const handleRetryAllFailed = useCallback(async () => {
    setIsRetryingFailed(true);
    try {
      const result = await retryAllFailedTasksAction(taskId);
      if (result.success) {
        toast({
          title: "操作成功",
          description: `已将 ${result.count} 个失败任务重新排队`
        });
        handleRefresh();
      } else {
        toast({
          title: "操作失败",
          description: result.error || "批量重试失败任务失败",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("批量重试失败任务失败:", error);
      toast({
        title: "操作失败",
        description: "批量重试失败任务时发生错误",
        variant: "destructive"
      });
    } finally {
      setIsRetryingFailed(false);
    }
  }, [taskId, toast, handleRefresh]);

  // 批量重试清理失败的任务
  const handleRetryAllCleanFailed = useCallback(async () => {
    setIsRetryingCleanFailed(true);
    try {
      const result = await retryAllCleanFailedTasksAction(taskId);
      if (result.success) {
        toast({
          title: "操作成功",
          description: `已将 ${result.count} 个清理失败任务重新排队`
        });
        handleRefresh();
      } else {
        toast({
          title: "操作失败",
          description: result.error || "批量重试清理失败任务失败",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("批量重试清理失败任务失败:", error);
      toast({
        title: "操作失败",
        description: "批量重试清理失败任务时发生错误",
        variant: "destructive"
      });
    } finally {
      setIsRetryingCleanFailed(false);
    }
  }, [taskId, toast, handleRefresh]);
  return <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <WorkHeader title={task ? `任务详情：${task.taskName}` : "任务详情"} showBackButton backHref="/work/create-pack/mistake-batch/list" backText="返回任务列表" rightContent={<Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing} className="flex items-center">
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
            刷新数据
          </Button>} />

      <main className="flex-1 p-6 space-y-6">
        <div className="container mx-auto space-y-6">
          {/* 任务基本信息 */}
          {task && <div className="bg-white p-4 rounded-lg shadow-sm space-y-4">
              {/* 任务名称和描述 */}
              <div className="space-y-2">
                <div>
                  <div className="font-medium text-lg">{task.taskName}</div>
                </div>
                {task.taskDescription && <div>{task.taskDescription}</div>}
              </div>

              {/* 统计数据 */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2 border-t">
                <div>
                  <div className="text-sm text-gray-600">科目</div>
                  <div className="font-medium">{task.subject}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">学生总数</div>
                  <div className="font-medium">{task.totalStudents}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">已完成</div>
                  <div className="font-medium text-green-600">
                    {task.completedStudents}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">失败</div>
                  <div className="font-medium text-red-600">
                    {task.failedStudents}
                  </div>
                </div>
              </div>
            </div>}

          {/* 打包文件状态（如果有学生ID参数，则不显示） */}
          {task && !studentIdFromUrl && <ClassZipStatus task={task} classTasks={classTasks} onRefresh={fetchData} />}

          {/* 过滤器 */}
          <StudentPdfFilters studentPdfs={allStudentPdfs} onFilter={handleFilter} initialStudentId={studentIdFromUrl} />

          {/* 统计信息 */}
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                共{" "}
                <span className="font-medium text-gray-900">
                  {allStudentPdfs.length}
                </span>{" "}
                个学生，当前显示{" "}
                <span className="font-medium text-gray-900">
                  {filteredStudentPdfs.length}
                </span>{" "}
                个
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleRetryAllFailed} disabled={isRetryingFailed || failedCounts.failedCount === 0} className="flex items-center">
                  <RotateCcw className={`h-4 w-4 mr-2 ${isRetryingFailed ? "animate-spin" : ""}`} />
                  {isRetryingFailed ? "重试中..." : `重试失败任务 (${failedCounts.failedCount})`}
                </Button>
                <Button variant="outline" size="sm" onClick={handleRetryAllCleanFailed} disabled={isRetryingCleanFailed || failedCounts.cleanFailedCount === 0} className="flex items-center">
                  <RotateCcw className={`h-4 w-4 mr-2 ${isRetryingCleanFailed ? "animate-spin" : ""}`} />
                  {isRetryingCleanFailed ? "重试中..." : `重试清理失败 (${failedCounts.cleanFailedCount})`}
                </Button>
              </div>
            </div>
          </div>

          {/* 学生PDF列表 */}
          <StudentPdfList studentPdfs={filteredStudentPdfs} isLoading={isLoading} onRefresh={handleRefresh} />
        </div>
      </main>
    </div>;
}
