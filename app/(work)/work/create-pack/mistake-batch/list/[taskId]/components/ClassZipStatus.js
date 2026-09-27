"use client";

import { Copy, Download, FileText, Package, RefreshCw, Search, X } from "lucide-react";
import { useState } from "react";
import { Button } from "../../../../../../../../components/ui/button.js";
// 错题批量任务的班级压缩包状态卡片，支持重新打包与下载链接管理
import { Card, CardContent, CardHeader, CardTitle } from "../../../../../../../../components/ui/card.js";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../../../../../../../../components/ui/dialog.js";
import { Input } from "../../../../../../../../components/ui/input.js";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../../../../../../components/ui/table.js";
import { useToast } from "../../../../../../../../hooks/use-toast.js";
import { formatFileSize } from "../../../../../../../../lib/common/number.js";
import { regenerateClassAllStudentsPdfAction, regenerateClassZipAction, regenerateTaskAllZipAction } from "../actions.js";
import StatusBadge from "./StatusBadge.js";
export default function ClassZipStatus({
  task,
  classTasks,
  onRefresh
}) {
  const {
    toast
  } = useToast();
  const [regeneratingIds, setRegeneratingIds] = useState(new Set());
  const [regeneratingTaskAllZip, setRegeneratingTaskAllZip] = useState(false);
  const [selectedClassForRegenerate, setSelectedClassForRegenerate] = useState(null);
  const [classSearchTerm, setClassSearchTerm] = useState("");

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

  // 复制下载链接
  const handleCopyUrl = (url, fileName) => {
    navigator.clipboard.writeText(url).then(() => {
      toast({
        title: "复制成功",
        description: `${fileName} 下载链接已复制到剪贴板`
      });
    });
  };

  // 显示重新生成选项对话框
  const handleShowRegenerateOptions = (classTaskId, className) => {
    setSelectedClassForRegenerate({
      id: classTaskId,
      name: className
    });
  };

  // 重新生成班级打包文件（仅ZIP）
  const handleRegenerateClassZip = async () => {
    if (!selectedClassForRegenerate) return;
    if (regeneratingIds.has(selectedClassForRegenerate.id)) return;
    setSelectedClassForRegenerate(null); // 关闭对话框
    setRegeneratingIds(prev => new Set(prev).add(selectedClassForRegenerate.id));
    try {
      const result = await regenerateClassZipAction(selectedClassForRegenerate.id);
      if (result.success) {
        toast({
          title: "操作成功",
          description: `${selectedClassForRegenerate.name} 的打包文件已重新排队生成`
        });
        onRefresh();
      } else {
        toast({
          title: "操作失败",
          description: result.error || "重新生成打包文件失败",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("重新生成班级打包文件失败:", error);
      toast({
        title: "操作失败",
        description: "重新生成打包文件时发生错误",
        variant: "destructive"
      });
    } finally {
      setRegeneratingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(selectedClassForRegenerate.id);
        return newSet;
      });
    }
  };

  // 批量重新生成班级所有学生PDF
  const handleRegenerateClassAllStudents = async () => {
    if (!selectedClassForRegenerate) return;
    if (regeneratingIds.has(selectedClassForRegenerate.id)) return;
    setSelectedClassForRegenerate(null); // 关闭对话框
    setRegeneratingIds(prev => new Set(prev).add(selectedClassForRegenerate.id));
    try {
      const result = await regenerateClassAllStudentsPdfAction(selectedClassForRegenerate.id);
      if (result.success) {
        toast({
          title: "操作成功",
          description: `${selectedClassForRegenerate.name} 的所有学生PDF已重新排队生成`
        });
        onRefresh();
      } else {
        toast({
          title: "操作失败",
          description: result.error || "批量重新生成学生PDF失败",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("批量重新生成学生PDF失败:", error);
      toast({
        title: "操作失败",
        description: "批量重新生成学生PDF时发生错误",
        variant: "destructive"
      });
    } finally {
      setRegeneratingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(selectedClassForRegenerate.id);
        return newSet;
      });
    }
  };

  // 重新生成任务全部打包文件
  const handleRegenerateTaskAllZip = async () => {
    if (regeneratingTaskAllZip) return;
    setRegeneratingTaskAllZip(true);
    try {
      const result = await regenerateTaskAllZipAction(task._id);
      if (result.success) {
        toast({
          title: "操作成功",
          description: "全部打包文件已重新排队生成"
        });
        onRefresh();
      } else {
        toast({
          title: "操作失败",
          description: result.error || "重新生成全部打包文件失败",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("重新生成全部打包文件失败:", error);
      toast({
        title: "操作失败",
        description: "重新生成全部打包文件时发生错误",
        variant: "destructive"
      });
    } finally {
      setRegeneratingTaskAllZip(false);
    }
  };

  // 过滤班级列表
  const filteredClassTasks = classSearchTerm.trim() ? classTasks.filter(classTask => classTask.className.toLowerCase().includes(classSearchTerm.toLowerCase())) : classTasks;
  return <>
      <Card className="bg-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            打包文件状态
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 班级打包文件表格 */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-medium text-gray-700">
                各班级打包文件
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input placeholder="搜索班级名称" value={classSearchTerm} onChange={e => setClassSearchTerm(e.target.value)} className="pl-8 pr-8 h-8 w-48" />
                  {classSearchTerm && <Button variant="ghost" size="sm" className="absolute right-0 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0" onClick={() => setClassSearchTerm("")}>
                      <X className="h-3 w-3" />
                    </Button>}
                </div>
                {classSearchTerm && <span className="text-xs text-gray-500">
                    找到 {filteredClassTasks.length} 个班级
                  </span>}
              </div>
            </div>

            {filteredClassTasks.length > 0 ? <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>班级名称</TableHead>
                      <TableHead>状态</TableHead>
                      <TableHead>文件大小</TableHead>
                      <TableHead>生成时间</TableHead>
                      <TableHead>完成时间</TableHead>
                      <TableHead className="text-right">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredClassTasks.map(classTask => <TableRow key={classTask._id}>
                        <TableCell>
                          <div className="font-medium">
                            {classTask.className}
                          </div>
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={classTask.status} taskId={classTask._id} startTime={classTask.startTime} retryCount={classTask.retryCount} failureReason={classTask.failureReason} />
                        </TableCell>
                        <TableCell>
                          {classTask.zipFile ? <span className="text-sm">
                              {formatFileSize(classTask.zipFile.fileSize)}
                            </span> : <span className="text-gray-400 text-sm">—</span>}
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-600">
                            {formatTime(classTask.startTime)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-600">
                            {formatTime(classTask.completedTime)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {classTask.status === "completed" && classTask.zipFile ? <>
                                <Button variant="outline" size="sm" onClick={() => handleCopyUrl(classTask.zipFile.fileUrl, classTask.className)}>
                                  <Copy className="h-3 w-3" />
                                </Button>
                                <Button variant="default" size="sm" asChild>
                                  <a href={classTask.zipFile.fileUrl} download target="_blank" rel="noopener noreferrer">
                                    <Download className="h-3 w-3 mr-1" />
                                    下载
                                  </a>
                                </Button>
                              </> : null}

                            <Button variant="outline" size="sm" onClick={() => handleShowRegenerateOptions(classTask._id, classTask.className)} disabled={regeneratingIds.has(classTask._id)}>
                              <RefreshCw className={`h-3 w-3 mr-1 ${regeneratingIds.has(classTask._id) ? "animate-spin" : ""}`} />
                              重新生成
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>)}
                  </TableBody>
                </Table>
              </Card> : <Card className="p-4 text-center text-gray-500">
                <FileText className="mx-auto h-8 w-8 mb-2 text-gray-400" />
                {classSearchTerm ? "未找到匹配的班级" : "暂无班级数据"}
              </Card>}
          </div>

          {/* 任务打包文件状态 */}
          <div>
            <div className="text-sm font-medium text-gray-700 mb-3">
              任务打包文件
            </div>

            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>文件名称</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>文件大小</TableHead>
                    <TableHead>生成时间</TableHead>
                    <TableHead>完成时间</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>
                      <div className="font-medium">全部打包文件</div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={task.status} taskId={task._id} startTime={task.startTime} retryCount={task.retryCount} failureReason={task.failureReason} />
                    </TableCell>
                    <TableCell>
                      {task.allZipFile ? <span className="text-sm">
                          {formatFileSize(task.allZipFile.fileSize)}
                        </span> : <span className="text-gray-400 text-sm">—</span>}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-600">
                        {formatTime(task.startTime)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-600">
                        {formatTime(task.completedTime)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {task.status === "completed" && task.allZipFile ? <>
                            <Button variant="outline" size="sm" onClick={() => handleCopyUrl(task.allZipFile.fileUrl, "全部打包文件")}>
                              <Copy className="h-3 w-3" />
                            </Button>
                            <Button variant="default" size="sm" asChild>
                              <a href={task.allZipFile.fileUrl} download target="_blank" rel="noopener noreferrer">
                                <Download className="h-3 w-3 mr-1" />
                                下载
                              </a>
                            </Button>
                          </> : null}

                        <Button variant="outline" size="sm" onClick={handleRegenerateTaskAllZip} disabled={regeneratingTaskAllZip}>
                          <RefreshCw className={`h-3 w-3 mr-1 ${regeneratingTaskAllZip ? "animate-spin" : ""}`} />
                          重新生成
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </Card>
          </div>

          {/* 失败原因提示 */}
          {(task.status === "failed" || task.status === "clean_failed" || classTasks.some(ct => ct.status === "failed" || ct.status === "clean_failed")) && <div className="border rounded-lg p-4 bg-red-50">
              <div className="text-sm font-medium text-red-900 mb-2">
                部分任务失败
              </div>
              <div className="space-y-1">
                {(task.status === "failed" || task.status === "clean_failed") && <div className="text-sm text-red-700">
                    <span className="font-medium">全部打包文件:</span>{" "}
                    {task.failureReason || "未知错误"}
                  </div>}
                {classTasks.filter(ct => ct.status === "failed" || ct.status === "clean_failed").map(ct => <div key={ct._id} className="text-sm text-red-700">
                      <span className="font-medium">{ct.className}:</span>{" "}
                      {ct.failureReason || "未知错误"}
                    </div>)}
              </div>
            </div>}
        </CardContent>
      </Card>

      {/* 重新生成选项对话框 */}
      <Dialog open={selectedClassForRegenerate !== null} onOpenChange={open => !open && setSelectedClassForRegenerate(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>选择重新生成方式</DialogTitle>
            <DialogDescription>请选择要重新生成的内容</DialogDescription>
          </DialogHeader>

          <div className="space-y-3 mt-4">
            <Button variant="outline" className="w-full justify-start h-auto py-4" onClick={handleRegenerateClassZip}>
              <div className="text-left">
                <div className="font-medium mb-1">仅重新生成班级打包文件</div>
                <div className="text-xs text-gray-500">
                  只重新生成该班级的ZIP文件，不影响学生PDF文件
                </div>
              </div>
            </Button>

            <Button variant="outline" className="w-full justify-start h-auto py-4" onClick={handleRegenerateClassAllStudents}>
              <div className="text-left">
                <div className="font-medium mb-1">
                  重新生成所有学生PDF及班级打包文件
                </div>
                <div className="text-xs text-gray-500">
                  将删除该班级所有学生的PDF文件，并重新生成所有内容
                </div>
              </div>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>;
}
