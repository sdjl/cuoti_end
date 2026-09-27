"use client";

import { BookOpen, Calendar, CheckCircle, Edit, FileText, Loader2, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
// 定制题集列表组件，用于显示和管理学生的定制题集（查看、编辑、删除、生成PDF等操作）
import { useCallback, useEffect, useState } from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "../../../../../../../../../components/ui/alert-dialog.js";
import { Badge } from "../../../../../../../../../components/ui/badge.js";
import { Button } from "../../../../../../../../../components/ui/button.js";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../../../../../../components/ui/card.js";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../../../../../../../../../components/ui/dialog.js";
import { Input } from "../../../../../../../../../components/ui/input.js";
import { Label } from "../../../../../../../../../components/ui/label.js";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../../../../../../../components/ui/table.js";
import { Textarea } from "../../../../../../../../../components/ui/textarea.js";
import { useToast } from "../../../../../../../../../hooks/use-toast.js";
import { deleteAnswersPdf, deleteQuestionPack, deleteQuestionsPdf, deleteStudentAnswer, generateAnswersPdf, generateQuestionsPdf, getCustomQuestionPackList, updateQuestionPack } from "../actions.js";
import QuestionPackFilter from "./QuestionPackFilter.js";
export default function QuestionPackList({
  studentId,
  classRoomId
}) {
  const [loading, setLoading] = useState(true);
  const [questionPacks, setQuestionPacks] = useState([]);
  const [error, setError] = useState(null);
  const [deletingPackId, setDeletingPackId] = useState(null);
  const [deletingAnswerId, setDeletingAnswerId] = useState(null);
  const [generatingQuestionsPdf, setGeneratingQuestionsPdf] = useState(null);
  const [generatingAnswersPdf, setGeneratingAnswersPdf] = useState(null);
  const [deletingQuestionsPdf, setDeletingQuestionsPdf] = useState(null);
  const [deletingAnswersPdf, setDeletingAnswersPdf] = useState(null);

  // 编辑状态
  const [editingPack, setEditingPack] = useState(null);
  const [editForm, setEditForm] = useState({
    name: "",
    description: ""
  });
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // 检查当前是否有PDF操作正在进行
  const isPdfOperationInProgress = packId => {
    return generatingQuestionsPdf === packId || generatingAnswersPdf === packId || deletingQuestionsPdf === packId || deletingAnswersPdf === packId;
  };

  // 过滤状态
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("all");
  const [hasAnswerFilter, setHasAnswerFilter] = useState(undefined);
  const [hasQuestionsPdfFilter, setHasQuestionsPdfFilter] = useState(undefined);
  const [hasAnswersPdfFilter, setHasAnswersPdfFilter] = useState(undefined);
  const [isAnalysisCompletedFilter, setIsAnalysisCompletedFilter] = useState(undefined);
  const {
    toast
  } = useToast();
  const router = useRouter();

  // 重置过滤条件
  const handleResetFilters = useCallback(() => {
    setSearchTerm("");
    setSelectedSubject("all");
    setHasAnswerFilter(undefined);
    setHasQuestionsPdfFilter(undefined);
    setHasAnswersPdfFilter(undefined);
    setIsAnalysisCompletedFilter(undefined);
  }, []);
  const fetchQuestionPacks = useCallback(async () => {
    try {
      setLoading(true);
      const result = await getCustomQuestionPackList(studentId, classRoomId, selectedSubject === "all" ? undefined : selectedSubject, hasAnswerFilter, searchTerm || undefined, hasQuestionsPdfFilter, hasAnswersPdfFilter, isAnalysisCompletedFilter);
      if (result.success && result.data) {
        setQuestionPacks(result.data);
        setError(null);
      } else {
        setError(result.error || "获取题集列表失败");
        setQuestionPacks([]);
      }
    } catch (error) {
      console.error("获取题集列表失败:", error);
      setError("获取题集列表失败");
      setQuestionPacks([]);
    } finally {
      setLoading(false);
    }
  }, [studentId, classRoomId, selectedSubject, hasAnswerFilter, searchTerm, hasQuestionsPdfFilter, hasAnswersPdfFilter, isAnalysisCompletedFilter]);
  useEffect(() => {
    fetchQuestionPacks();
  }, [fetchQuestionPacks]);

  // 编辑相关函数
  const handleEditPack = pack => {
    setEditingPack(pack);
    setEditForm({
      name: pack.name,
      description: pack.description || ""
    });
    setIsEditDialogOpen(true);
  };
  const handleUpdatePack = async () => {
    if (!editingPack) return;
    setIsUpdating(true);
    try {
      const result = await updateQuestionPack(editingPack._id, {
        name: editForm.name,
        description: editForm.description
      });
      if (result.success) {
        toast({
          title: "更新成功",
          description: "题集信息已更新"
        });
        setIsEditDialogOpen(false);
        setEditingPack(null);
        await fetchQuestionPacks();
      } else {
        toast({
          title: "更新失败",
          description: result.error || "未知错误",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("更新题集失败:", error);
      toast({
        title: "更新失败",
        description: "未知错误",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  // 基础操作函数
  const handleDeletePack = async (questionPackId, questionPackName) => {
    setDeletingPackId(questionPackId);
    try {
      const result = await deleteQuestionPack(questionPackId);
      if (result.success) {
        toast({
          title: "删除成功",
          description: `题集"${questionPackName}"已删除`
        });
        await fetchQuestionPacks();
      } else {
        toast({
          title: "删除失败",
          description: result.error || "未知错误",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("删除题集失败:", error);
      toast({
        title: "删除失败",
        description: "未知错误",
        variant: "destructive"
      });
    } finally {
      setDeletingPackId(null);
    }
  };
  const handleDeleteAnswer = async (questionPackId, questionPackName) => {
    setDeletingAnswerId(questionPackId);
    try {
      const result = await deleteStudentAnswer(studentId, classRoomId, questionPackId);
      if (result.success) {
        const details = [];
        if (result.deletedItemCount) details.push(`${result.deletedItemCount}个答题记录`);
        if (result.deletedImageCount) details.push(`${result.deletedImageCount}个图片文件`);
        toast({
          title: "删除成功",
          description: `题集"${questionPackName}"的答卷已删除${details.length > 0 ? `（包含${details.join("、")}）` : ""}`
        });
        await fetchQuestionPacks();
      } else {
        toast({
          title: "删除失败",
          description: result.error || "未知错误",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("删除答卷失败:", error);
      toast({
        title: "删除失败",
        description: "未知错误",
        variant: "destructive"
      });
    } finally {
      setDeletingAnswerId(null);
    }
  };
  const handleViewQuestions = questionPackId => {
    const url = `/work/create-pack/knowledge/${classRoomId}/${studentId}/questions?packId=${questionPackId}`;
    window.open(url, "_blank");
  };
  const handleSubmitAnswer = questionPackId => {
    router.push(`/work/create-pack/knowledge/${classRoomId}/${studentId}/submit/${questionPackId}`);
  };

  // 分析报告相关函数
  const handleAiAnalysis = pack => {
    if (!pack.hasAnswer || !pack.studentAnswerId) {
      toast({
        title: "提示",
        description: "请先提交答卷后再进行AI分析",
        variant: "destructive"
      });
      return;
    }
    const url = `/work/answer/parse/${pack.studentAnswerId}`;
    window.open(url, "_blank");
  };
  const handleAnalysisReport = pack => {
    if (!pack.hasAnswer || !pack.studentAnswerId) {
      toast({
        title: "提示",
        description: "请先提交答卷后再查看分析报告",
        variant: "destructive"
      });
      return;
    }
    const url = `/mobile/answer/${pack.studentAnswerId}/report`;
    window.open(url, "_blank");
  };
  const handleViewAnswer = pack => {
    if (!pack.hasAnswer || !pack.studentAnswerId) {
      toast({
        title: "提示",
        description: "请先提交答卷后再查看答卷",
        variant: "destructive"
      });
      return;
    }
    const url = `/work/answer/view/${pack.studentAnswerId}`;
    window.open(url, "_blank");
  };

  // PDF操作函数
  const handleGenerateQuestionsPdf = async (questionPackId, questionPackName) => {
    setGeneratingQuestionsPdf(questionPackId);
    try {
      const result = await generateQuestionsPdf(studentId, classRoomId, questionPackId);
      if (result.success) {
        toast({
          title: "生成成功",
          description: `题集"${questionPackName}"的题目PDF已生成`
        });
        await fetchQuestionPacks();
      } else {
        toast({
          title: "生成失败",
          description: result.error || "未知错误",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("生成题目PDF失败:", error);
      toast({
        title: "生成失败",
        description: "未知错误",
        variant: "destructive"
      });
    } finally {
      setGeneratingQuestionsPdf(null);
    }
  };
  const handleGenerateAnswersPdf = async (questionPackId, questionPackName) => {
    setGeneratingAnswersPdf(questionPackId);
    try {
      const result = await generateAnswersPdf(studentId, classRoomId, questionPackId);
      if (result.success) {
        toast({
          title: "生成成功",
          description: `题集"${questionPackName}"的答案PDF已生成`
        });
        await fetchQuestionPacks();
      } else {
        toast({
          title: "生成失败",
          description: result.error || "未知错误",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("生成答案PDF失败:", error);
      toast({
        title: "生成失败",
        description: "未知错误",
        variant: "destructive"
      });
    } finally {
      setGeneratingAnswersPdf(null);
    }
  };
  const handleDownloadPdf = fileUrl => {
    window.open(fileUrl, "_blank");
  };
  const handleCopyPdfUrl = async (fileUrl, pdfType) => {
    try {
      await navigator.clipboard.writeText(fileUrl);
      toast({
        title: "复制成功",
        description: `${pdfType}PDF地址已复制到剪贴板`
      });
    } catch (error) {
      console.error("复制失败:", error);
      toast({
        title: "复制失败",
        description: "请手动复制",
        variant: "destructive"
      });
    }
  };
  const handleDeleteQuestionsPdf = async (questionPackId, questionPackName) => {
    setDeletingQuestionsPdf(questionPackId);
    try {
      const result = await deleteQuestionsPdf(questionPackId);
      if (result.success) {
        toast({
          title: "删除成功",
          description: `题集"${questionPackName}"的题目PDF已删除`
        });
        await fetchQuestionPacks();
      } else {
        toast({
          title: "删除失败",
          description: result.error || "未知错误",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("删除题目PDF失败:", error);
      toast({
        title: "删除失败",
        description: "未知错误",
        variant: "destructive"
      });
    } finally {
      setDeletingQuestionsPdf(null);
    }
  };
  const handleDeleteAnswersPdf = async (questionPackId, questionPackName) => {
    setDeletingAnswersPdf(questionPackId);
    try {
      const result = await deleteAnswersPdf(questionPackId);
      if (result.success) {
        toast({
          title: "删除成功",
          description: `题集"${questionPackName}"的答案PDF已删除`
        });
        await fetchQuestionPacks();
      } else {
        toast({
          title: "删除失败",
          description: result.error || "未知错误",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("删除答案PDF失败:", error);
      toast({
        title: "删除失败",
        description: "未知错误",
        variant: "destructive"
      });
    } finally {
      setDeletingAnswersPdf(null);
    }
  };
  const formatDate = timestamp => {
    const date = new Date(timestamp);
    return date.toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  // 渲染空状态或错误状态时也显示过滤器
  if (loading) {
    return <div className="space-y-4">
        <QuestionPackFilter searchTerm={searchTerm} onSearchTermChange={setSearchTerm} selectedSubject={selectedSubject} onSubjectChange={setSelectedSubject} hasAnswerFilter={hasAnswerFilter} onHasAnswerFilterChange={setHasAnswerFilter} hasQuestionsPdfFilter={hasQuestionsPdfFilter} onHasQuestionsPdfFilterChange={setHasQuestionsPdfFilter} hasAnswersPdfFilter={hasAnswersPdfFilter} onHasAnswersPdfFilterChange={setHasAnswersPdfFilter} isAnalysisCompletedFilter={isAnalysisCompletedFilter} onIsAnalysisCompletedFilterChange={setIsAnalysisCompletedFilter} onReset={handleResetFilters} />

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              定制题集列表
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <div className="text-gray-500">加载中...</div>
            </div>
          </CardContent>
        </Card>
      </div>;
  }
  if (error) {
    return <div className="space-y-4">
        <QuestionPackFilter searchTerm={searchTerm} onSearchTermChange={setSearchTerm} selectedSubject={selectedSubject} onSubjectChange={setSelectedSubject} hasAnswerFilter={hasAnswerFilter} onHasAnswerFilterChange={setHasAnswerFilter} hasQuestionsPdfFilter={hasQuestionsPdfFilter} onHasQuestionsPdfFilterChange={setHasQuestionsPdfFilter} hasAnswersPdfFilter={hasAnswersPdfFilter} onHasAnswersPdfFilterChange={setHasAnswersPdfFilter} isAnalysisCompletedFilter={isAnalysisCompletedFilter} onIsAnalysisCompletedFilterChange={setIsAnalysisCompletedFilter} onReset={handleResetFilters} />

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              定制题集列表
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <div className="text-red-500">{error}</div>
              <Button onClick={fetchQuestionPacks} className="mt-4" size="sm">
                重试
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>;
  }
  if (questionPacks.length === 0) {
    return <div className="space-y-4">
        <QuestionPackFilter searchTerm={searchTerm} onSearchTermChange={setSearchTerm} selectedSubject={selectedSubject} onSubjectChange={setSelectedSubject} hasAnswerFilter={hasAnswerFilter} onHasAnswerFilterChange={setHasAnswerFilter} hasQuestionsPdfFilter={hasQuestionsPdfFilter} onHasQuestionsPdfFilterChange={setHasQuestionsPdfFilter} hasAnswersPdfFilter={hasAnswersPdfFilter} onHasAnswersPdfFilterChange={setHasAnswersPdfFilter} isAnalysisCompletedFilter={isAnalysisCompletedFilter} onIsAnalysisCompletedFilterChange={setIsAnalysisCompletedFilter} onReset={handleResetFilters} />

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              定制题集列表
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <FileText className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <div className="text-gray-500">暂无定制题集</div>
              <p className="text-sm text-gray-400 mt-2">
                {searchTerm || selectedSubject !== "all" || hasAnswerFilter !== undefined || hasQuestionsPdfFilter !== undefined || hasAnswersPdfFilter !== undefined ? "没有找到符合条件的题集，请尝试调整筛选条件" : "去创建页面生成你的第一个定制题集吧！"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>;
  }
  return <div className="space-y-4">
      <QuestionPackFilter searchTerm={searchTerm} onSearchTermChange={setSearchTerm} selectedSubject={selectedSubject} onSubjectChange={setSelectedSubject} hasAnswerFilter={hasAnswerFilter} onHasAnswerFilterChange={setHasAnswerFilter} hasQuestionsPdfFilter={hasQuestionsPdfFilter} onHasQuestionsPdfFilterChange={setHasQuestionsPdfFilter} hasAnswersPdfFilter={hasAnswersPdfFilter} onHasAnswersPdfFilterChange={setHasAnswersPdfFilter} isAnalysisCompletedFilter={isAnalysisCompletedFilter} onIsAnalysisCompletedFilterChange={setIsAnalysisCompletedFilter} onReset={handleResetFilters} />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            定制题集列表
            <Badge variant="secondary" className="ml-2">
              {questionPacks.length}个
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>题集信息</TableHead>
                <TableHead className="w-28 text-center">基础操作</TableHead>
                <TableHead className="w-32 text-center">分析报告</TableHead>
                <TableHead className="w-28 text-center">题目PDF</TableHead>
                <TableHead className="w-28 text-center">答案PDF</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="space-y-4">
              {questionPacks.map((pack, index) => <TableRow key={pack._id} className={index > 0 ? "border-t-4 border-gray-100" : ""}>
                  <TableCell>
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <h3 className="font-medium text-lg text-gray-900">
                          {pack.name}
                        </h3>
                        <Badge variant="outline">{pack.subject}</Badge>
                        {pack.hasAnswer ? <>
                            <Badge variant="default" className="bg-green-600 text-white">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              已提交
                            </Badge>
                            {pack.isAnalysisCompleted && <Badge variant="default" className="bg-blue-600 text-white">
                                已分析
                              </Badge>}
                          </> : <Badge variant="secondary">
                            <XCircle className="w-3 h-3 mr-1" />
                            未提交
                          </Badge>}
                      </div>
                      <p className="text-gray-600 text-sm">
                        {pack.description}
                      </p>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Calendar className="w-4 h-4" />
                        <span>创建时间：{formatDate(pack.created)}</span>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="space-y-1">
                      <Button size="sm" onClick={() => handleSubmitAnswer(pack._id)} className="w-full text-xs px-2 py-1 h-7">
                        提交答卷
                      </Button>
                      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline" onClick={() => handleEditPack(pack)} className="w-full text-xs px-2 py-1 h-7">
                            <Edit className="w-2 h-2 mr-1" />
                            编辑
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                          <DialogHeader>
                            <DialogTitle>编辑题集信息</DialogTitle>
                            <DialogDescription>
                              修改题集的名称和描述信息
                            </DialogDescription>
                          </DialogHeader>
                          <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                              <Label htmlFor="name" className="text-right">
                                名称
                              </Label>
                              <Input id="name" value={editForm.name} onChange={e => setEditForm({
                            ...editForm,
                            name: e.target.value
                          })} className="col-span-3" />
                            </div>
                            <div className="grid grid-cols-4 items-start gap-4">
                              <Label htmlFor="description" className="text-right mt-2">
                                描述
                              </Label>
                              <Textarea id="description" value={editForm.description} onChange={e => setEditForm({
                            ...editForm,
                            description: e.target.value
                          })} className="col-span-3" placeholder="请输入题集描述（可选）" />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                              取消
                            </Button>
                            <Button type="button" onClick={handleUpdatePack} disabled={isUpdating || !editForm.name.trim()}>
                              {isUpdating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                              保存
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="outline" disabled={!pack.hasAnswer || deletingAnswerId === pack._id} className="w-full text-xs px-2 py-1 h-7">
                            {deletingAnswerId === pack._id ? <Loader2 className="w-2 h-2 animate-spin mr-1" /> : null}
                            删除答卷
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>确认删除答卷</AlertDialogTitle>
                            <AlertDialogDescription>
                              确定要删除题集&ldquo;{pack.name}
                              &rdquo;的答卷吗？删除后可以重新提交答卷。
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>取消</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteAnswer(pack._id, pack.name)} className="bg-orange-600 hover:bg-orange-700 text-white">
                              删除答卷
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="destructive" disabled={pack.hasAnswer || deletingPackId === pack._id} className="w-full text-white text-xs px-2 py-1 h-7">
                            {deletingPackId === pack._id ? <Loader2 className="w-2 h-2 animate-spin mr-1" /> : null}
                            删除题集
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>确认删除题集</AlertDialogTitle>
                            <AlertDialogDescription>
                              确定要删除题集&ldquo;{pack.name}
                              &rdquo;吗？此操作不可撤销，将永久删除题集。
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>取消</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeletePack(pack._id, pack.name)} className="bg-red-600 hover:bg-red-700 text-white">
                              删除题集
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="space-y-1">
                      <Button size="sm" variant="outline" onClick={() => handleAiAnalysis(pack)} className="w-full text-xs px-2 py-1 h-7" disabled={!pack.hasAnswer}>
                        AI分析
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleAnalysisReport(pack)} className="w-full text-xs px-2 py-1 h-7" disabled={!pack.hasAnswer}>
                        分析报告
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleViewAnswer(pack)} className="w-full text-xs px-2 py-1 h-7" disabled={!pack.hasAnswer}>
                        查看答卷
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleViewQuestions(pack._id)} className="w-full text-xs px-2 py-1 h-7">
                        查看题目
                      </Button>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="space-y-1">
                      {pack.questionsPdf ? <>
                          <Button size="sm" variant="outline" onClick={() => handleDownloadPdf(pack.questionsPdf.fileUrl)} className="w-full text-xs px-2 py-1 h-7">
                            下载PDF
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleCopyPdfUrl(pack.questionsPdf.fileUrl, "题目")} className="w-full text-xs px-2 py-1 h-7">
                            复制地址
                          </Button>
                          <Button size="sm" variant="outline" disabled className="w-full text-xs px-2 py-1 h-7">
                            生成PDF
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="destructive" disabled={isPdfOperationInProgress(pack._id)} className="w-full text-white text-xs px-2 py-1 h-7">
                                {deletingQuestionsPdf === pack._id ? <Loader2 className="w-2 h-2 animate-spin mr-1" /> : null}
                                删除PDF
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  确认删除题目PDF
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  确定要删除题集&ldquo;{pack.name}
                                  &rdquo;的题目PDF吗？此操作不可撤销。
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>取消</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteQuestionsPdf(pack._id, pack.name)} className="bg-red-600 hover:bg-red-700 text-white">
                                  删除PDF
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </> : <>
                          <Button size="sm" variant="outline" disabled className="w-full text-xs px-2 py-1 h-7">
                            下载PDF
                          </Button>
                          <Button size="sm" variant="outline" disabled className="w-full text-xs px-2 py-1 h-7">
                            复制地址
                          </Button>
                          <Button size="sm" onClick={() => handleGenerateQuestionsPdf(pack._id, pack.name)} disabled={isPdfOperationInProgress(pack._id)} className="w-full text-xs px-2 py-1 h-7">
                            {generatingQuestionsPdf === pack._id ? <Loader2 className="w-2 h-2 animate-spin mr-1" /> : null}
                            生成PDF
                          </Button>
                          <Button size="sm" variant="destructive" disabled className="w-full text-white text-xs px-2 py-1 h-7">
                            删除PDF
                          </Button>
                        </>}
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="space-y-1">
                      {pack.answersPdf ? <>
                          <Button size="sm" variant="outline" onClick={() => handleDownloadPdf(pack.answersPdf.fileUrl)} className="w-full text-xs px-2 py-1 h-7">
                            下载PDF
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleCopyPdfUrl(pack.answersPdf.fileUrl, "答案")} className="w-full text-xs px-2 py-1 h-7">
                            复制地址
                          </Button>
                          <Button size="sm" variant="outline" disabled className="w-full text-xs px-2 py-1 h-7">
                            生成PDF
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="destructive" disabled={isPdfOperationInProgress(pack._id)} className="w-full text-white text-xs px-2 py-1 h-7">
                                {deletingAnswersPdf === pack._id ? <Loader2 className="w-2 h-2 animate-spin mr-1" /> : null}
                                删除PDF
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  确认删除答案PDF
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  确定要删除题集&ldquo;{pack.name}
                                  &rdquo;的答案PDF吗？此操作不可撤销。
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>取消</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteAnswersPdf(pack._id, pack.name)} className="bg-red-600 hover:bg-red-700 text-white">
                                  删除PDF
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </> : <>
                          <Button size="sm" variant="outline" disabled className="w-full text-xs px-2 py-1 h-7">
                            下载PDF
                          </Button>
                          <Button size="sm" variant="outline" disabled className="w-full text-xs px-2 py-1 h-7">
                            复制地址
                          </Button>
                          <Button size="sm" onClick={() => handleGenerateAnswersPdf(pack._id, pack.name)} disabled={isPdfOperationInProgress(pack._id)} className="w-full text-xs px-2 py-1 h-7">
                            {generatingAnswersPdf === pack._id ? <Loader2 className="w-2 h-2 animate-spin mr-1" /> : null}
                            生成PDF
                          </Button>
                          <Button size="sm" variant="destructive" disabled className="w-full text-white text-xs px-2 py-1 h-7">
                            删除PDF
                          </Button>
                        </>}
                    </div>
                  </TableCell>
                </TableRow>)}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>;
}
