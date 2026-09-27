"use client";

import { FileText, RefreshCw, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
// 错题批量任务列表页，汇总展示所有任务并支持批量操作
import { useCallback, useEffect, useState } from "react";
import { Badge } from "../../../../../../components/ui/badge.js";
import { Button } from "../../../../../../components/ui/button.js";
import { Checkbox } from "../../../../../../components/ui/checkbox.js";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../../../../../components/ui/dialog.js";
import WorkHeader from "../../../../../../components/work/layout/WorkHeader.js";
import { useToast } from "../../../../../../hooks/use-toast.js";
import { useSubjects } from "../../../../../../hooks/useAdminConfig.js";
import { useAuth } from "../../../../../../hooks/useAuth.js";
import { batchCleanTaskFilesAction, getMistakeBatchTasksAction } from "./actions.js";
import MistakeBatchFilters from "./components/MistakeBatchFilters.js";
import MistakeBatchList from "./components/MistakeBatchList.js";
// 控制是否显示"1秒钟前"按钮（用于开发调试）
const SHOW_ONE_SECOND_AGO_BUTTON = false;
export default function MistakeBatchListPage() {
  const {
    user
  } = useAuth();
  const router = useRouter();
  const {
    toast
  } = useToast();
  const {
    subjects: subjectConfigs
  } = useSubjects();
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // 过滤器状态
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedSubject, setSelectedSubject] = useState("all");

  // 勾选状态
  const [selectedTaskIds, setSelectedTaskIds] = useState(new Set());
  const [isBatchCleaning, setIsBatchCleaning] = useState(false);
  const [batchCleanConfirmOpen, setBatchCleanConfirmOpen] = useState(false);

  // 时间筛选清理
  const [timeFilterDialogOpen, setTimeFilterDialogOpen] = useState(false);
  const [timeFilteredTasks, setTimeFilteredTasks] = useState([]);
  const [timeFilterMonths, setTimeFilterMonths] = useState(1);
  const [timeFilterLoading, setTimeFilterLoading] = useState(false);
  const [timeFilterSelectedIds, setTimeFilterSelectedIds] = useState(new Set());

  // 检查当前校园
  useEffect(() => {
    if (user && !user.workSetting?.currentSchool) {
      router.push("/work/setting/curr-school");
      return;
    }
  }, [user, router]);

  // 获取任务数据
  const fetchTasks = useCallback(async () => {
    setIsLoading(true);
    try {
      const keyword = searchTerm.trim();
      const status = selectedStatus !== "all" ? selectedStatus : "all";
      const subject = selectedSubject !== "all" ? selectedSubject : "all";
      const tasksData = await getMistakeBatchTasksAction({
        keyword,
        status,
        subject
      });
      setTasks(tasksData);
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
  }, [searchTerm, selectedStatus, selectedSubject, toast]);

  // 获取所有数据（初始加载和手动刷新）
  const fetchAllData = useCallback(async (showRefreshLoading = false) => {
    if (showRefreshLoading) {
      setIsRefreshing(true);
    }
    try {
      await fetchTasks();
    } catch (error) {
      console.error("获取数据失败:", error);
    } finally {
      setIsRefreshing(false);
    }
  }, [fetchTasks]);

  // 初始加载数据
  useEffect(() => {
    fetchAllData(false);
  }, [fetchAllData]);

  // 手动刷新数据
  const handleRefresh = useCallback(() => {
    fetchAllData(true);
  }, [fetchAllData]);

  // 重置过滤器
  const handleResetFilters = useCallback(() => {
    setSearchTerm("");
    setSelectedStatus("all");
    setSelectedSubject("all");
  }, []);

  // 处理批量清理
  const handleBatchClean = useCallback(async () => {
    setBatchCleanConfirmOpen(false);
    setIsBatchCleaning(true);
    try {
      const result = await batchCleanTaskFilesAction(Array.from(selectedTaskIds));
      if (result.success) {
        toast({
          title: "批量清理成功",
          description: `已成功提交 ${result.count} 个任务的清理请求`
        });
        setSelectedTaskIds(new Set());
        fetchAllData(false);
      } else {
        toast({
          title: "批量清理失败",
          description: result.error || "批量清理任务失败",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("批量清理失败:", error);
      toast({
        title: "批量清理失败",
        description: "发生未知错误",
        variant: "destructive"
      });
    } finally {
      setIsBatchCleaning(false);
    }
  }, [selectedTaskIds, toast, fetchAllData]);

  // 处理按时间筛选
  const handleTimeFilter = useCallback(async seconds => {
    // 将秒数转换为月数（用于显示）
    const months = seconds < 60 ? 0 : Math.round(seconds / (30 * 24 * 60 * 60));
    setTimeFilterMonths(months);
    setTimeFilterLoading(true);
    setTimeFilterDialogOpen(true);
    try {
      const targetDate = new Date();
      targetDate.setTime(targetDate.getTime() - seconds * 1000);
      const targetTimestamp = targetDate.getTime();
      const allTasks = await getMistakeBatchTasksAction({
        keyword: "",
        status: "all",
        subject: "all"
      });
      const filteredTasks = allTasks.filter(task => task.created < targetTimestamp);
      setTimeFilteredTasks(filteredTasks);
      // 默认全选
      setTimeFilterSelectedIds(new Set(filteredTasks.map(t => t._id)));
    } catch (error) {
      console.error("获取历史任务失败:", error);
      toast({
        title: "获取任务失败",
        description: "获取历史任务时发生错误",
        variant: "destructive"
      });
    } finally {
      setTimeFilterLoading(false);
    }
  }, [toast]);

  // 处理时间筛选清理确认
  const handleTimeFilterClean = useCallback(async () => {
    setTimeFilterDialogOpen(false);
    setIsBatchCleaning(true);
    try {
      const result = await batchCleanTaskFilesAction(Array.from(timeFilterSelectedIds));
      if (result.success) {
        toast({
          title: "批量清理成功",
          description: `已成功提交 ${result.count} 个任务的清理请求`
        });
        setTimeFilterSelectedIds(new Set());
        setTimeFilteredTasks([]);
        fetchAllData(false);
      } else {
        toast({
          title: "批量清理失败",
          description: result.error || "批量清理任务失败",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("批量清理失败:", error);
      toast({
        title: "批量清理失败",
        description: "发生未知错误",
        variant: "destructive"
      });
    } finally {
      setIsBatchCleaning(false);
    }
  }, [timeFilterSelectedIds, toast, fetchAllData]);
  return <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <WorkHeader title="错题集任务列表" showBackButton backHref="/work/create-pack" backText="返回" rightContent={<div className="flex items-center gap-2">
            {selectedTaskIds.size > 0 && <Button variant="destructive" size="sm" onClick={() => setBatchCleanConfirmOpen(true)} disabled={isBatchCleaning} className="flex items-center">
                <Trash2 className="h-4 w-4 mr-2 text-white" />
                <span className="text-white">
                  批量清理 ({selectedTaskIds.size})
                </span>
              </Button>}
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing} className="flex items-center">
              <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
              刷新数据
            </Button>
          </div>} />

      <main className="flex-1 p-6 space-y-6">
        <div className="container mx-auto space-y-4">
          {/* 过滤器 */}
          <MistakeBatchFilters searchTerm={searchTerm} setSearchTerm={setSearchTerm} selectedStatus={selectedStatus} setSelectedStatus={setSelectedStatus} selectedSubject={selectedSubject} setSelectedSubject={setSelectedSubject} subjects={subjectConfigs.map(s => s.name)} onReset={handleResetFilters} />

          {/* 统计信息和时间筛选清理 */}
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                共找到{" "}
                <span className="font-medium text-gray-900">
                  {tasks.length}
                </span>{" "}
                个任务
                {selectedTaskIds.size > 0 && <span className="ml-2 text-blue-600">
                    (已选中 {selectedTaskIds.size} 个)
                  </span>}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">按时间清理：</span>
                {SHOW_ONE_SECOND_AGO_BUTTON && <Button variant="outline" size="sm" onClick={() => handleTimeFilter(1)} disabled={timeFilterLoading}>
                    1秒钟前
                  </Button>}
                <Button variant="outline" size="sm" onClick={() => handleTimeFilter(30 * 24 * 60 * 60)} disabled={timeFilterLoading}>
                  1个月前
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleTimeFilter(90 * 24 * 60 * 60)} disabled={timeFilterLoading}>
                  3个月前
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleTimeFilter(180 * 24 * 60 * 60)} disabled={timeFilterLoading}>
                  6个月前
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleTimeFilter(365 * 24 * 60 * 60)} disabled={timeFilterLoading}>
                  1年前
                </Button>
              </div>
            </div>
          </div>

          {/* 任务列表 */}
          <MistakeBatchList tasks={tasks} isLoading={isLoading} onRefresh={handleRefresh} selectedTaskIds={selectedTaskIds} onSelectionChange={setSelectedTaskIds} />
        </div>
      </main>

      {/* 批量清理确认对话框 */}
      <Dialog open={batchCleanConfirmOpen} onOpenChange={setBatchCleanConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认批量清理</DialogTitle>
            <DialogDescription>
              确定要清理选中的 {selectedTaskIds.size} 个任务吗？
              <br />
              <br />
              此操作将清理这些任务的所有文件（包括学生PDF、班级ZIP、任务ZIP）。清理完成后才能删除任务。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBatchCleanConfirmOpen(false)}>
              取消
            </Button>
            <Button variant="destructive" onClick={handleBatchClean}>
              <Trash2 className="h-4 w-4 mr-2 text-white" />
              <span className="text-white">确认清理</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 时间筛选清理对话框 */}
      <Dialog open={timeFilterDialogOpen} onOpenChange={setTimeFilterDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              清理{" "}
              {timeFilterMonths === 0 ? "1秒钟" : `${timeFilterMonths} 个月`}
              前创建的任务
            </DialogTitle>
            <DialogDescription>
              找到 {timeFilteredTasks.length} 个任务，请确认要清理的任务
            </DialogDescription>
          </DialogHeader>

          {timeFilterLoading ? <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-gray-400" />
              <p className="text-gray-500">正在加载任务...</p>
            </div> : timeFilteredTasks.length > 0 ? <div className="space-y-2 max-h-96 overflow-y-auto">
              <div className="flex items-center gap-2 p-2 bg-gray-50 rounded sticky top-0">
                <Checkbox checked={timeFilterSelectedIds.size === timeFilteredTasks.length} onCheckedChange={checked => {
              if (checked) {
                setTimeFilterSelectedIds(new Set(timeFilteredTasks.map(t => t._id)));
              } else {
                setTimeFilterSelectedIds(new Set());
              }
            }} />
                <span className="text-sm font-medium">全选</span>
              </div>
              {timeFilteredTasks.map(task => <div key={task._id} className="flex items-center gap-2 p-2 border rounded hover:bg-gray-50">
                  <Checkbox checked={timeFilterSelectedIds.has(task._id)} onCheckedChange={checked => {
              const newSet = new Set(timeFilterSelectedIds);
              if (checked) {
                newSet.add(task._id);
              } else {
                newSet.delete(task._id);
              }
              setTimeFilterSelectedIds(newSet);
            }} />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{task.taskName}</div>
                    <div className="text-xs text-gray-500">
                      {new Date(task.created).toLocaleDateString("zh-CN")} •{" "}
                      {task.subject} • {task.classes.length} 个班级
                    </div>
                  </div>
                  <Badge variant="outline">{task.status}</Badge>
                </div>)}
            </div> : <div className="text-center py-8">
              <FileText className="h-12 w-12 mx-auto mb-2 text-gray-400" />
              <p className="text-gray-500">未找到符合条件的任务</p>
            </div>}

          <DialogFooter>
            <Button variant="outline" onClick={() => setTimeFilterDialogOpen(false)}>
              取消
            </Button>
            <Button variant="destructive" onClick={handleTimeFilterClean} disabled={timeFilterSelectedIds.size === 0}>
              <Trash2 className="h-4 w-4 mr-2 text-white" />
              <span className="text-white">
                清理选中的 {timeFilterSelectedIds.size} 个任务
              </span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>;
}
