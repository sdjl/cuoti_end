"use client";

/**
 * PDF文件列表组件
 *
 * 使用 Server Actions: app/(work)/work/dashboard/student/componentsServerActions/pdfFilesActions.ts
 *
 * 功能：
 * - 显示学生的PDF文件列表（课程错题集、知识点定制题集）
 * - 使用Tabs分类显示不同类型的PDF
 * - 显示PDF生成状态、下载状态、重新提交答案状态
 * - 提供PDF下载功能
 * - 提供"更多"链接跳转到完整列表页面
 */
import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";
import { CheckCircle, Download, FileText } from "lucide-react";
import { useEffect, useState } from "react";
import { Badge } from "../../../../../../components/ui/badge.js";
import { Button } from "../../../../../../components/ui/button.js";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../../../../../../components/ui/dialog.js";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../../../../components/ui/table.js";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../../../../components/ui/tabs.js";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../../../../../../components/ui/tooltip.js";
import { getStudentClassroomsAction } from "../actions.js";
import { getKnowledgeQuestionPacksAction, getMistakeBatchPdfsAction, getStudentTasksAction } from "../componentsServerActions/pdfFilesActions.js";
// 每个tab显示的PDF文件数量（修改此处可控制所有类型的显示数量）
const PDF_FILES_LIMIT = 5;
/**
 * 获取状态标记（与参考页面保持一致）
 */
function getStatusBadge(status) {
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
  const config = statusConfig[status] || {
    color: "bg-gray-100 text-gray-800",
    text: status
  };
  return <div className={`text-xs px-2 py-1 rounded-full inline-block ${config.color}`}>
      {config.text}
    </div>;
}

/**
 * 格式化时间显示
 */
function formatTime(timestamp) {
  return formatDistanceToNow(new Date(timestamp), {
    addSuffix: true,
    locale: zhCN
  });
}
export default function PDFFilesList({
  studentId,
  subject
}) {
  const [mistakeBatchPdfs, setMistakeBatchPdfs] = useState([]);
  const [knowledgePacks, setKnowledgePacks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [classrooms, setClassrooms] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [showClassroomDialog, setShowClassroomDialog] = useState(false);
  const [showTaskDialog, setShowTaskDialog] = useState(false);

  // 加载课程错题集PDF数据
  useEffect(() => {
    async function loadMistakeBatchPdfs() {
      setLoading(true);
      try {
        const result = await getMistakeBatchPdfsAction(studentId, subject, PDF_FILES_LIMIT);
        if (result.success) {
          setMistakeBatchPdfs(result.data);
        }
      } finally {
        setLoading(false);
      }
    }
    if (studentId && subject) {
      loadMistakeBatchPdfs();
    }
  }, [studentId, subject]);

  // 加载知识点定制题集数据
  useEffect(() => {
    async function loadKnowledgePacks() {
      setLoading(true);
      try {
        const result = await getKnowledgeQuestionPacksAction(studentId, subject, PDF_FILES_LIMIT);
        if (result.success) {
          setKnowledgePacks(result.data);
        }
      } finally {
        setLoading(false);
      }
    }
    if (studentId && subject) {
      loadKnowledgePacks();
    }
  }, [studentId, subject]);

  // 加载学生的班级信息
  useEffect(() => {
    async function loadClassrooms() {
      try {
        const result = await getStudentClassroomsAction(studentId);
        setClassrooms(result);
      } catch (error) {
        console.error("加载班级信息失败:", error);
      }
    }
    if (studentId) {
      loadClassrooms();
    }
  }, [studentId]);

  // 加载学生的任务信息
  useEffect(() => {
    async function loadTasks() {
      try {
        const result = await getStudentTasksAction(studentId, subject, 5);
        if (result.success) {
          setTasks(result.data);
        }
      } catch (error) {
        console.error("加载任务信息失败:", error);
      }
    }
    if (studentId && subject) {
      loadTasks();
    }
  }, [studentId, subject]);

  /**
   * 下载PDF文件
   */
  const handleDownload = url => {
    if (!url) {
      alert("文件不存在或尚未生成");
      return;
    }

    // 在新窗口打开PDF
    window.open(url, "_blank");
  };

  /**
   * 处理"更多课程错题集"点击
   */
  const handleMoreMistakeBatch = () => {
    if (tasks.length === 0) {
      alert("该学生暂无课程错题集任务");
      return;
    }
    if (tasks.length === 1) {
      // 只有一个任务，直接跳转
      window.open(`/work/create-pack/mistake-batch/list/${tasks[0]._id}?studentId=${studentId}`, "_blank");
    } else {
      // 多个任务，显示选择对话框
      setShowTaskDialog(true);
    }
  };

  /**
   * 处理"更多定制题集"点击
   */
  const handleMoreKnowledgePacks = () => {
    if (classrooms.length === 0) {
      alert("该学生未关联任何班级");
      return;
    }
    if (classrooms.length === 1) {
      // 只有一个班级，直接跳转
      window.open(`/work/create-pack/knowledge/${classrooms[0]._id}/${studentId}/list`, "_blank");
    } else {
      // 多个班级，显示选择对话框
      setShowClassroomDialog(true);
    }
  };

  /**
   * 选择班级后跳转
   */
  const handleClassroomSelect = classroomId => {
    setShowClassroomDialog(false);
    window.open(`/work/create-pack/knowledge/${classroomId}/${studentId}/list`, "_blank");
  };

  /**
   * 选择任务后跳转
   */
  const handleTaskSelect = taskId => {
    setShowTaskDialog(false);
    window.open(`/work/create-pack/mistake-batch/list/${taskId}?studentId=${studentId}`, "_blank");
  };
  return <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-600" />
          <h2 className="text-xl font-bold">近期PDF文件</h2>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleMoreMistakeBatch} className="text-sm text-blue-600 hover:text-blue-700">
            更多课程错题集
          </button>
          <button onClick={handleMoreKnowledgePacks} className="text-sm text-blue-600 hover:text-blue-700">
            更多定制题集
          </button>
        </div>
      </div>

      <Tabs defaultValue="mistake" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="mistake">课程错题集</TabsTrigger>
          <TabsTrigger value="knowledge">知识点定制题集</TabsTrigger>
        </TabsList>

        {/* 课程错题集 Tab */}
        <TabsContent value="mistake" className="mt-4">
          {loading ? <div className="text-center py-8 text-gray-500">加载中...</div> : mistakeBatchPdfs.length === 0 ? <div className="text-center py-8 text-gray-500">暂无数据</div> : <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>任务名称</TableHead>
                    <TableHead>班级</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>题集</TableHead>
                    <TableHead>题目数量</TableHead>
                    <TableHead>创建时间</TableHead>
                    <TableHead className="text-center">已下载</TableHead>
                    <TableHead className="text-center">已重新提交</TableHead>
                    <TableHead className="text-center">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mistakeBatchPdfs.map(pdf => <TableRow key={pdf._id}>
                      {/* 任务名称 */}
                      <TableCell className="font-medium">
                        {pdf.taskName}
                      </TableCell>

                      {/* 班级 */}
                      <TableCell>
                        <div className="text-sm text-gray-900">
                          {pdf.className}
                        </div>
                      </TableCell>

                      {/* 生成状态 */}
                      <TableCell>{getStatusBadge(pdf.status)}</TableCell>

                      {/* 题集 */}
                      <TableCell>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="cursor-pointer">
                                <Badge variant="secondary">
                                  {pdf.questionPacks.length} 个题集
                                </Badge>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                              {pdf.questionPacks.length > 0 ? <ul className="list-disc pl-4">
                                  {pdf.questionPacks.map(qp => <li key={qp._id}>{qp.name}</li>)}
                                </ul> : <span>无题集</span>}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableCell>

                      {/* 题目数量 */}
                      <TableCell>
                        <span className="text-sm font-medium">
                          {pdf.mistakeCount} 题
                        </span>
                      </TableCell>

                      {/* 创建时间 */}
                      <TableCell>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="text-sm text-gray-600 cursor-help">
                                {formatTime(pdf.created)}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>
                                {new Date(pdf.created).toLocaleString("zh-CN")}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableCell>

                      {/* 已下载错题PDF */}
                      <TableCell className="text-center">
                        {pdf.hasDownloadedMistakePdf ? <CheckCircle className="w-4 h-4 text-green-600 inline-block" /> : <span className="text-gray-400 text-sm">—</span>}
                      </TableCell>

                      {/* 已重新提交答案 */}
                      <TableCell className="text-center">
                        {pdf.hasResubmittedAnswer ? <CheckCircle className="w-4 h-4 text-green-600 inline-block" /> : <span className="text-gray-400 text-sm">—</span>}
                      </TableCell>

                      {/* 操作按钮 */}
                      <TableCell>
                        <div className="flex items-center justify-center gap-2">
                          {/* 下载错题PDF */}
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button size="sm" variant="outline" onClick={() => handleDownload(pdf.mistakePdfUrl)} disabled={!pdf.mistakePdfUrl}>
                                  <Download className="w-4 h-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>下载错题PDF</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>

                          {/* 下载答案PDF */}
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button size="sm" variant="outline" onClick={() => handleDownload(pdf.answerPdfUrl)} disabled={!pdf.answerPdfUrl}>
                                  <Download className="w-4 h-4 text-green-600" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>下载答案PDF</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </TableCell>
                    </TableRow>)}
                </TableBody>
              </Table>
            </div>}
        </TabsContent>

        {/* 知识点定制题集 Tab */}
        <TabsContent value="knowledge" className="mt-4">
          {loading ? <div className="text-center py-8 text-gray-500">加载中...</div> : knowledgePacks.length === 0 ? <div className="text-center py-8 text-gray-500">暂无数据</div> : <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>题目集合名称</TableHead>
                    <TableHead>班级名称</TableHead>
                    <TableHead className="text-center">题目数量</TableHead>
                    <TableHead>创建时间</TableHead>
                    <TableHead className="text-center">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {knowledgePacks.map(pack => <TableRow key={pack._id}>
                      {/* 题目集合名称 */}
                      <TableCell className="font-medium">{pack.name}</TableCell>

                      {/* 班级名称 */}
                      <TableCell>{pack.className}</TableCell>

                      {/* 题目数量 */}
                      <TableCell className="text-center">
                        {pack.questionCount}
                      </TableCell>

                      {/* 创建时间 */}
                      <TableCell>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="text-sm text-gray-600 cursor-help">
                                {formatTime(pack.created)}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>
                                {new Date(pack.created).toLocaleString("zh-CN")}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableCell>

                      {/* 操作按钮 */}
                      <TableCell>
                        <div className="flex items-center justify-center gap-2">
                          {/* 下载题目PDF */}
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button size="sm" variant="outline" onClick={() => handleDownload(pack.questionsPdfUrl)} disabled={!pack.questionsPdfUrl}>
                                  <Download className="w-4 h-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>
                                  {pack.questionsPdfUrl ? "下载题目PDF" : "请先生成PDF文件"}
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>

                          {/* 下载答案PDF */}
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button size="sm" variant="outline" onClick={() => handleDownload(pack.answersPdfUrl)} disabled={!pack.answersPdfUrl}>
                                  <Download className="w-4 h-4 text-green-600" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>
                                  {pack.answersPdfUrl ? "下载答案PDF" : "请先生成PDF文件"}
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </TableCell>
                    </TableRow>)}
                </TableBody>
              </Table>
            </div>}
        </TabsContent>
      </Tabs>

      {/* 班级选择对话框 */}
      <Dialog open={showClassroomDialog} onOpenChange={setShowClassroomDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>选择班级</DialogTitle>
            <DialogDescription>
              该学生属于多个班级，请选择要查看的班级
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2 py-4">
            {classrooms.map(classroom => <Button key={classroom._id} variant="outline" className="justify-start" onClick={() => handleClassroomSelect(classroom._id)}>
                {classroom.name}
              </Button>)}
          </div>
        </DialogContent>
      </Dialog>

      {/* 任务选择对话框 */}
      <Dialog open={showTaskDialog} onOpenChange={setShowTaskDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>选择任务</DialogTitle>
            <DialogDescription>
              该学生有多个课程错题集任务，请选择要查看的任务
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2 py-4">
            {tasks.map(task => <Button key={task._id} variant="outline" className="justify-start flex flex-col items-start h-auto py-3" onClick={() => handleTaskSelect(task._id)}>
                <span className="font-medium">{task.taskName}</span>
                <span className="text-xs text-gray-500">
                  {new Date(task.created).toLocaleString("zh-CN")}
                </span>
              </Button>)}
          </div>
        </DialogContent>
      </Dialog>
    </div>;
}
