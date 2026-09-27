"use client";

import { Edit, FileText, QrCode, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
// 错题批量任务列表组件，负责展示任务进度并提供管理操作
import { useEffect, useState } from "react";
import BaseImage from "../../../../../../../components/common/BaseImage.js";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "../../../../../../../components/ui/alert-dialog.js";
import { Badge } from "../../../../../../../components/ui/badge.js";
import { Button } from "../../../../../../../components/ui/button.js";
import { Card, CardContent } from "../../../../../../../components/ui/card.js";
import { Checkbox } from "../../../../../../../components/ui/checkbox.js";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../../../../../../components/ui/dialog.js";
import { Input } from "../../../../../../../components/ui/input.js";
import { Label } from "../../../../../../../components/ui/label.js";
import { Popover, PopoverContent, PopoverTrigger } from "../../../../../../../components/ui/popover.js";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../../../../../components/ui/table.js";
import { Textarea } from "../../../../../../../components/ui/textarea.js";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../../../../../../../components/ui/tooltip.js";
import { useToast } from "../../../../../../../hooks/use-toast.js";
import { formatFileSize } from "../../../../../../../lib/common/number.js";
import { generateNormalURL, generateQRCodeDataURL } from "../../../../../../../lib/common/qrcode.js";
import { cleanTaskFilesAction, deleteMistakeBatchTaskAction, updateMistakeBatchTaskAction } from "../actions.js";
export default function MistakeBatchList({
  tasks,
  isLoading,
  onRefresh,
  selectedTaskIds,
  onSelectionChange
}) {
  const router = useRouter();
  const {
    toast
  } = useToast();
  const [selectedTask, setSelectedTask] = useState(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [cleaningIds, setCleaningIds] = useState(new Set());
  const [deletingIds, setDeletingIds] = useState(new Set());
  const [cleanConfirmTaskId, setCleanConfirmTaskId] = useState(null);

  // 编辑任务状态
  const [editingTask, setEditingTask] = useState(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editTaskName, setEditTaskName] = useState("");
  const [editTaskDescription, setEditTaskDescription] = useState("");
  const [editAllowStudentsDownloadAnswers, setEditAllowStudentsDownloadAnswers] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  // 二维码状态
  const [qrCodeData, setQrCodeData] = useState(new Map());

  // 可勾选的任务（waiting, generating, completed, failed）
  const selectableTasks = tasks.filter(task => ["waiting", "generating", "completed", "failed"].includes(task.status));

  // 生成错题任务二维码URL
  const generateMistakeTaskURL = taskId => {
    return generateNormalURL("/mistake-task", [taskId]);
  };

  // 当任务数据变化时，预生成所有二维码
  useEffect(() => {
    const generateAllQRCodes = async () => {
      const newQrCodeData = new Map();
      for (const task of tasks) {
        const url = generateMistakeTaskURL(task._id);
        const qrCode = await generateQRCodeDataURL(url);
        if (qrCode) {
          newQrCodeData.set(task._id, qrCode);
        }
      }
      setQrCodeData(newQrCodeData);
    };
    if (tasks.length > 0) {
      generateAllQRCodes();
    }
  }, [tasks]);

  // 获取当前日期（精确到天）
  const getCurrentDate = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}年${month}月${day}日`;
  };

  // 处理全选/取消全选
  const handleSelectAll = checked => {
    if (checked) {
      const allSelectableIds = new Set(selectableTasks.map(t => t._id));
      onSelectionChange(allSelectableIds);
    } else {
      onSelectionChange(new Set());
    }
  };

  // 处理单个任务的勾选
  const handleTaskSelect = (taskId, checked) => {
    const newSelection = new Set(selectedTaskIds);
    if (checked) {
      newSelection.add(taskId);
    } else {
      newSelection.delete(taskId);
    }
    onSelectionChange(newSelection);
  };

  // 检查是否可以勾选某个任务
  const isTaskSelectable = task => {
    return ["waiting", "generating", "completed", "failed"].includes(task.status);
  };

  // 获取状态标记
  const getStatusBadge = status => {
    const statusConfig = {
      waiting: {
        color: "bg-gray-100 text-gray-800",
        text: "等待执行"
      },
      generating: {
        color: "bg-blue-100 text-blue-800",
        text: "生成中"
      },
      completed: {
        color: "bg-green-100 text-green-800",
        text: "已生成"
      },
      failed: {
        color: "bg-red-100 text-red-800",
        text: "生成失败"
      },
      waiting_clean: {
        color: "bg-gray-100 text-gray-800",
        text: "等待清理"
      },
      cleaning: {
        color: "bg-yellow-100 text-yellow-800",
        text: "文件清理中"
      },
      cleaned: {
        color: "bg-purple-100 text-purple-800",
        text: "文件已清理"
      },
      clean_failed: {
        color: "bg-orange-100 text-orange-800",
        text: "清理失败"
      }
    };
    const config = statusConfig[status];
    return <div className={`text-xs px-2 py-1 rounded-full inline-block ${config.color}`}>
        {config.text}
      </div>;
  };

  // 处理查看详情
  const handleViewDetail = task => {
    setSelectedTask(task);
    setIsDetailDialogOpen(true);
  };

  // 格式化时间
  const formatTime = timestamp => {
    if (!timestamp) return "—";
    const date = new Date(timestamp);
    return date.toLocaleString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  // 处理清理文件
  const handleCleanFiles = async taskId => {
    setCleanConfirmTaskId(null); // 关闭确认对话框

    if (cleaningIds.has(taskId)) {
      return; // 防止重复点击
    }
    setCleaningIds(prev => new Set(prev).add(taskId));
    try {
      const result = await cleanTaskFilesAction(taskId);
      if (result.success) {
        toast({
          title: "清理任务已提交",
          description: "任务文件清理已开始，请等待清理完成"
        });

        // 刷新列表
        if (onRefresh) {
          onRefresh();
        }
      } else {
        toast({
          title: "清理任务失败",
          description: result.error || "未知错误",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("清理任务失败:", error);
      toast({
        title: "清理任务失败",
        description: "发生未知错误",
        variant: "destructive"
      });
    } finally {
      setCleaningIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(taskId);
        return newSet;
      });
    }
  };

  // 处理删除任务
  const handleDeleteTask = async taskId => {
    if (deletingIds.has(taskId)) {
      return; // 防止重复点击
    }
    setDeletingIds(prev => new Set(prev).add(taskId));
    try {
      const result = await deleteMistakeBatchTaskAction(taskId);
      if (result.success) {
        toast({
          title: "删除成功",
          description: "任务及所有关联数据已删除"
        });

        // 刷新列表
        if (onRefresh) {
          onRefresh();
        }
      } else {
        toast({
          title: "删除失败",
          description: result.error || "未知错误",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("删除任务失败:", error);
      toast({
        title: "删除失败",
        description: "发生未知错误",
        variant: "destructive"
      });
    } finally {
      setDeletingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(taskId);
        return newSet;
      });
    }
  };

  // 打开编辑对话框
  const handleOpenEditDialog = task => {
    setEditingTask(task);
    setEditTaskName(task.taskName);
    setEditTaskDescription(task.taskDescription || "");
    setEditAllowStudentsDownloadAnswers(task.allowStudentsDownloadAnswers);
    setIsEditDialogOpen(true);
  };

  // 处理更新任务
  const handleUpdateTask = async () => {
    if (!editingTask || !editTaskName.trim()) {
      toast({
        title: "请输入任务名称",
        variant: "destructive"
      });
      return;
    }
    setIsUpdating(true);
    try {
      const result = await updateMistakeBatchTaskAction(editingTask._id, {
        taskName: editTaskName.trim(),
        taskDescription: editTaskDescription.trim() || undefined,
        allowStudentsDownloadAnswers: editAllowStudentsDownloadAnswers
      });
      if (result.success) {
        toast({
          title: "更新成功",
          description: "任务信息已更新"
        });
        setIsEditDialogOpen(false);
        setEditingTask(null);

        // 刷新列表
        if (onRefresh) {
          onRefresh();
        }
      } else {
        toast({
          title: "更新失败",
          description: result.error || "未知错误",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("更新任务失败:", error);
      toast({
        title: "更新失败",
        description: "发生未知错误",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  // 渲染清理/删除按钮
  const renderCleanOrDeleteButton = task => {
    const isCleaning = cleaningIds.has(task._id);
    const isDeleting = deletingIds.has(task._id);

    // 如果任务状态为cleaned，显示删除按钮
    if (task.status === "cleaned") {
      return <Button variant="destructive" size="sm" onClick={() => handleDeleteTask(task._id)} disabled={isDeleting} title="删除任务及所有关联数据">
          <Trash2 className="h-3 w-3 mr-1 text-white" />
          <span className="text-white">
            {isDeleting ? "删除中..." : "删除任务"}
          </span>
        </Button>;
    }

    // 否则显示清理按钮
    return <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="destructive" size="sm" onClick={() => setCleanConfirmTaskId(task._id)} disabled={isCleaning} title="清理所有文件">
              <span className="text-white">
                {isCleaning ? "清理中..." : "清理所有文件"}
              </span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>需要先清理所有文件才能删除任务</TooltipContent>
        </Tooltip>
      </TooltipProvider>;
  };
  if (isLoading) {
    return <Card className="bg-white">
        <CardContent className="text-center py-8">
          <p className="text-gray-500">加载中...</p>
        </CardContent>
      </Card>;
  }
  if (tasks.length === 0) {
    return <Card className="bg-white">
        <CardContent className="text-center py-8">
          <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-500">暂无任务数据</p>
        </CardContent>
      </Card>;
  }
  return <>
      <Card className="bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox checked={selectableTasks.length > 0 && selectedTaskIds.size === selectableTasks.length} onCheckedChange={handleSelectAll} disabled={selectableTasks.length === 0} />
              </TableHead>
              <TableHead>任务名称</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>科目</TableHead>
              <TableHead>班级</TableHead>
              <TableHead>题集</TableHead>
              <TableHead>已完成学生</TableHead>
              <TableHead>失败学生</TableHead>
              <TableHead>题目总数</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tasks.map(task => <TableRow key={task._id}>
                <TableCell>
                  <Checkbox checked={selectedTaskIds.has(task._id)} onCheckedChange={checked => handleTaskSelect(task._id, checked)} disabled={!isTaskSelectable(task)} />
                </TableCell>
                <TableCell>
                  {task.taskDescription ? <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="cursor-pointer">
                            <div className="font-medium">{task.taskName}</div>
                            <div className="text-xs text-gray-500 max-w-xs truncate">
                              {task.taskDescription}
                            </div>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-sm">
                          <div className="space-y-1">
                            <div className="font-semibold">{task.taskName}</div>
                            <div className="text-sm">
                              {task.taskDescription}
                            </div>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider> : <div className="font-medium">{task.taskName}</div>}
                </TableCell>
                <TableCell>{getStatusBadge(task.status)}</TableCell>
                <TableCell>
                  <Badge variant="outline">{task.subject}</Badge>
                </TableCell>
                <TableCell>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="cursor-pointer">
                          <Badge variant="secondary">
                            {task.classes.length} 个班级
                          </Badge>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        {task.classes.length > 0 ? <ul className="list-disc pl-4">
                            {task.classes.map(cls => <li key={cls._id}>
                                {cls.name}
                                {cls.grade ? ` (${cls.grade})` : ""}
                              </li>)}
                          </ul> : <span>无班级</span>}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableCell>
                <TableCell>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="cursor-pointer">
                          <Badge variant="secondary">
                            {task.questionPacks.length} 个题集
                          </Badge>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        {task.questionPacks.length > 0 ? <ul className="list-disc pl-4">
                            {task.questionPacks.map(qp => <li key={qp._id}>{qp.name}</li>)}
                          </ul> : <span>无题集</span>}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <span className="text-green-600 font-medium">
                      {task.completedStudents}
                    </span>
                    <span className="text-gray-400 text-xs">
                      / {task.totalStudents}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <span className={`font-medium ${task.failedStudents > 0 ? "text-red-600" : "text-gray-400"}`}>
                    {task.failedStudents}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="text-sm font-medium text-blue-600">
                    {task.totalMistakeCount}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" size="sm" onClick={() => handleViewDetail(task)} title="查看任务信息">
                      查看
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => router.push(`/work/create-pack/mistake-batch/list/${task._id}`)} title="查看详细数据">
                      详情
                    </Button>

                    {/* 二维码按钮 */}
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" title="错题集二维码" className="text-green-600 hover:text-green-700 hover:bg-green-50">
                          <QrCode className="h-3 w-3" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent side="left" className="w-auto p-4">
                        <div className="text-center space-y-2">
                          <div className="text-sm font-medium text-gray-900">
                            扫码重新提交错题集答案
                          </div>
                          <div className="text-xs text-gray-600">
                            {task.taskName}
                          </div>
                          {qrCodeData.get(task._id) ? <BaseImage src={qrCodeData.get(task._id) || ""} alt="错题集二维码" width={192} height={192} className="w-48 h-48 mx-auto" /> : <div className="w-48 h-48 mx-auto bg-gray-100 flex items-center justify-center rounded">
                              <span className="text-sm text-gray-500">
                                生成中...
                              </span>
                            </div>}
                          <div className="text-xs text-gray-500">
                            <div>通知时间：{getCurrentDate()}</div>
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>

                    <Button variant="outline" size="sm" onClick={() => handleOpenEditDialog(task)} title="编辑任务">
                      <Edit className="h-3 w-3 mr-1" />
                      编辑
                    </Button>
                    {renderCleanOrDeleteButton(task)}
                  </div>
                </TableCell>
              </TableRow>)}
          </TableBody>
        </Table>
      </Card>

      {/* 清理确认对话框 */}
      <AlertDialog open={cleanConfirmTaskId !== null} onOpenChange={open => !open && setCleanConfirmTaskId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认清理所有文件</AlertDialogTitle>
            <AlertDialogDescription>
              此操作将清理该任务的所有文件（包括学生PDF、班级ZIP、任务ZIP）。清理完成后才能删除任务。
              <br />
              <br />
              确定要继续吗？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
            if (cleanConfirmTaskId) {
              handleCleanFiles(cleanConfirmTaskId);
            }
          }}>
              确认清理
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 编辑对话框 */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>编辑任务</DialogTitle>
            <DialogDescription>编辑任务的基本信息</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* 任务名称 */}
            <div className="space-y-2">
              <Label htmlFor="edit-taskName">
                任务名称 <span className="text-red-500">*</span>
              </Label>
              <Input id="edit-taskName" placeholder="例如：七月错题集" value={editTaskName} onChange={e => setEditTaskName(e.target.value)} />
            </div>

            {/* 任务描述 */}
            <div className="space-y-2">
              <Label htmlFor="edit-taskDescription">任务描述（可选）</Label>
              <Textarea id="edit-taskDescription" placeholder="例如：本月错题汇总，请认真复习" value={editTaskDescription} onChange={e => setEditTaskDescription(e.target.value)} rows={3} />
            </div>

            {/* 是否允许学生下载答案 */}
            <div className="flex items-center space-x-2">
              <Checkbox id="edit-allowStudentsDownloadAnswers" checked={editAllowStudentsDownloadAnswers} onCheckedChange={checked => setEditAllowStudentsDownloadAnswers(checked === true)} />
              <Label htmlFor="edit-allowStudentsDownloadAnswers" className="text-sm font-normal cursor-pointer">
                允许学生下载答案PDF
              </Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} disabled={isUpdating}>
              取消
            </Button>
            <Button onClick={handleUpdateTask} disabled={!editTaskName.trim() || isUpdating}>
              {isUpdating ? "更新中..." : "确认更新"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 详情对话框 */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>任务详情</DialogTitle>
            <DialogDescription>
              {selectedTask?.taskDescription || "—"}
            </DialogDescription>
          </DialogHeader>
          {selectedTask && <div className="space-y-4">
              {/* 第一行：任务名称、状态、科目 */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    任务名称
                  </label>
                  <div className="text-sm text-gray-900">
                    {selectedTask.taskName}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    状态
                  </label>
                  <div className="mt-1">
                    {getStatusBadge(selectedTask.status)}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    科目
                  </label>
                  <div className="text-sm text-gray-900">
                    {selectedTask.subject}
                  </div>
                </div>
              </div>

              {/* 第二行：已完成学生、失败学生、允许学生下载答案 */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    已完成学生
                  </label>
                  <div className="text-sm text-green-600 font-medium">
                    {selectedTask.completedStudents} /{" "}
                    {selectedTask.totalStudents}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    失败学生
                  </label>
                  <div className="text-sm text-red-600 font-medium">
                    {selectedTask.failedStudents}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    允许学生下载答案
                  </label>
                  <div className="text-sm text-gray-900">
                    {selectedTask.allowStudentsDownloadAnswers ? "是" : "否"}
                  </div>
                </div>
              </div>

              {/* 第三行：时间信息 */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    创建时间
                  </label>
                  <div className="text-sm text-gray-900">
                    {formatTime(selectedTask.created)}
                  </div>
                </div>
                {selectedTask.startTime && <div>
                    <label className="text-sm font-medium text-gray-700">
                      开始执行时间
                    </label>
                    <div className="text-sm text-gray-900">
                      {formatTime(selectedTask.startTime)}
                    </div>
                  </div>}
                {selectedTask.completedTime && <div>
                    <label className="text-sm font-medium text-gray-700">
                      完成时间
                    </label>
                    <div className="text-sm text-gray-900">
                      {formatTime(selectedTask.completedTime)}
                    </div>
                  </div>}
              </div>

              {/* 存储信息 */}
              {selectedTask.totalStorageSize && <div>
                  <label className="text-sm font-medium text-gray-700">
                    占用存储空间
                  </label>
                  <div className="text-sm text-gray-900">
                    {formatFileSize(selectedTask.totalStorageSize)}
                  </div>
                </div>}

              {/* 失败原因 */}
              {selectedTask.failureReason && <div>
                  <label className="text-sm font-medium text-gray-700">
                    失败原因
                  </label>
                  <div className="text-sm text-red-600 mt-1">
                    {selectedTask.failureReason}
                  </div>
                </div>}

              {/* 班级列表 */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  班级列表 ({selectedTask.classes.length})
                </label>
                <div className="flex flex-wrap gap-2">
                  {selectedTask.classes.map(cls => <Badge key={cls._id} variant="outline">
                      {cls.name}
                      {cls.grade ? ` (${cls.grade})` : ""}
                    </Badge>)}
                </div>
              </div>

              {/* 题集列表 */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  题集列表 ({selectedTask.questionPacks.length})
                </label>
                <div className="flex flex-wrap gap-2">
                  {selectedTask.questionPacks.map(qp => <Badge key={qp._id} variant="outline">
                      {qp.name}
                    </Badge>)}
                </div>
              </div>
            </div>}
        </DialogContent>
      </Dialog>
    </>;
}
