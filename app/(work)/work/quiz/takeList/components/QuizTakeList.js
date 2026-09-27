"use client";

import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";
import { CheckCircle, Copy, Eye, FileQuestion, MessageCircle, MessageSquare, QrCode, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
// 口述核心知识点参与记录列表组件，展示学生提交的答案记录，支持查看详情和删除
import { useEffect, useState } from "react";
import BaseImage from "../../../../../../components/common/BaseImage.js";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "../../../../../../components/ui/alert-dialog.js";
import { Badge } from "../../../../../../components/ui/badge.js";
import { Button } from "../../../../../../components/ui/button.js";
import { Card, CardContent } from "../../../../../../components/ui/card.js";
import { Popover, PopoverContent, PopoverTrigger } from "../../../../../../components/ui/popover.js";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../../../../components/ui/table.js";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../../../../../../components/ui/tooltip.js";
import { useToast } from "../../../../../../hooks/use-toast.js";
import { generateQRCodeDataURL, generateWebViewURL } from "../../../../../../lib/common/qrcode.js";
import { DISPLAY_TEXT } from "../../../../../../lib/config/constants.js";
import { deleteQuizTakeAction } from "../actions.js";
export default function QuizTakeList({
  quizTakes,
  isLoading,
  onRefresh
}) {
  const router = useRouter();
  const {
    toast
  } = useToast();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [takeToDelete, setTakeToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [qrCodeData, setQrCodeData] = useState(new Map());

  // 生成二维码URL
  const generateQuizTakeWebViewUrl = take => {
    // 生成学生端解答记录的完整URL
    const recordUrl = `${window.location.origin}/mobile/records/quiz/${take._id}/useLogs`;

    // 生成webViewTitle: "${学生姓名}解答记录"
    const webViewTitle = `${take.student?.name || "学生"}解答记录`;
    return generateWebViewURL(recordUrl, webViewTitle);
  };

  // 当quizTakes变化时，预生成所有二维码
  useEffect(() => {
    const generateAllQRCodes = async () => {
      const newQrCodeData = new Map();
      for (const take of quizTakes) {
        const url = generateQuizTakeWebViewUrl(take);
        const qrCode = await generateQRCodeDataURL(url);
        if (qrCode) {
          newQrCodeData.set(take._id, qrCode);
        }
      }
      setQrCodeData(newQrCodeData);
    };
    if (quizTakes.length > 0) {
      generateAllQRCodes();
    }
  }, [quizTakes]);

  // 复制文本到剪贴板
  const copyToClipboard = async (text, label) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "复制成功",
        description: `${label}已复制到剪贴板`
      });
    } catch (error) {
      console.error("复制失败:", error);
      toast({
        title: "复制失败",
        description: "无法复制到剪贴板",
        variant: "destructive"
      });
    }
  };

  // 查看题目详情
  const handleViewQuestions = takeId => {
    router.push(`/work/quiz/takeList/${takeId}/questions`);
  };

  // 新窗口跳转到解答记录页面
  const handleViewStudentLogs = takeId => {
    const recordUrl = `/mobile/records/quiz/${takeId}/useLogs`;
    window.open(recordUrl, "_blank");
  };

  // 打开删除确认对话框
  const handleDeleteClick = takeId => {
    setTakeToDelete(takeId);
    setDeleteDialogOpen(true);
  };

  // 执行删除操作
  const handleConfirmDelete = async () => {
    if (!takeToDelete) return;
    setIsDeleting(true);
    try {
      const result = await deleteQuizTakeAction(takeToDelete);
      if (result.success) {
        toast({
          title: "删除成功",
          description: `${DISPLAY_TEXT.ORAL_KNOWLEDGE_QUIZ}记录及所有相关数据已删除`
        });
        onRefresh(); // 刷新列表
      } else {
        toast({
          title: "删除失败",
          description: result.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("删除失败:", error);
      toast({
        title: "删除失败",
        description: "删除时发生错误，请重试",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setTakeToDelete(null);
    }
  };

  // 获取状态标记
  const getStatusBadge = status => {
    const statusConfig = {
      draft: {
        color: "bg-yellow-100 text-yellow-800",
        text: "未提交"
      },
      submitted: {
        color: "bg-green-100 text-green-800",
        text: "已提交"
      }
    };
    const config = statusConfig[status] || statusConfig.draft;
    return <Badge variant="outline" className={`text-xs ${config.color}`}>
        {config.text}
      </Badge>;
  };

  // 格式化正确率显示
  const formatPassRate = (passedCount, totalCount) => {
    if (passedCount === undefined || totalCount === undefined || totalCount === 0) {
      return "-";
    }
    return `${passedCount}/${totalCount}`;
  };
  if (isLoading) {
    return <Card className="bg-white">
        <CardContent className="text-center py-8">
          <p className="text-gray-500">加载中...</p>
        </CardContent>
      </Card>;
  }
  if (quizTakes.length === 0) {
    return <Card className="bg-white">
        <CardContent className="text-center py-8">
          <FileQuestion className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-500">
            暂无学生提交的{DISPLAY_TEXT.ORAL_KNOWLEDGE_QUIZ}答案
          </p>
        </CardContent>
      </Card>;
  }
  return <TooltipProvider>
      <Card className="bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{DISPLAY_TEXT.ORAL_KNOWLEDGE_QUIZ}信息</TableHead>
              <TableHead>学生信息</TableHead>
              <TableHead>班级</TableHead>
              <TableHead>科目/年级</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>通过情况</TableHead>
              <TableHead>老师评语</TableHead>
              <TableHead>提交时间</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {quizTakes.map(take => <TableRow key={take._id}>
                {/* 口述核心知识点信息 */}
                <TableCell>
                  <div>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="font-medium text-gray-900 cursor-help">
                          {take.quiz?.title || `未知${DISPLAY_TEXT.ORAL_KNOWLEDGE_QUIZ}`}
                        </div>
                      </TooltipTrigger>
                      {take.quiz?.description && <TooltipContent>
                          <p className="max-w-xs">{take.quiz.description}</p>
                        </TooltipContent>}
                    </Tooltip>
                  </div>
                </TableCell>

                {/* 学生信息 */}
                <TableCell>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">
                        {take.student?.name || "-"}
                      </span>
                      {take.student?.name && <Button variant="ghost" size="sm" className="h-5 w-5 p-0 text-gray-400 hover:text-gray-600" onClick={() => copyToClipboard(take.student.name, "学生姓名")}>
                          <Copy className="h-3 w-3" />
                        </Button>}
                    </div>
                    {take.student?.studentCode && <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">
                          {take.student.studentCode}
                        </span>
                        <Button variant="ghost" size="sm" className="h-5 w-5 p-0 text-gray-400 hover:text-gray-600" onClick={() => copyToClipboard(take.student.studentCode, "学生编号")}>
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>}
                  </div>
                </TableCell>

                {/* 班级 */}
                <TableCell>
                  <div className="text-sm">
                    {take.classroom ? <Badge variant="outline" className="text-xs bg-purple-100 text-purple-800">
                        {take.classroom.name}
                      </Badge> : <span className="text-gray-400">-</span>}
                  </div>
                </TableCell>

                {/* 科目/年级 */}
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {take.quiz?.subject && <Badge variant="outline" className="text-xs bg-blue-100 text-blue-800">
                        {take.quiz.subject}
                      </Badge>}
                    {take.quiz?.grade && <Badge variant="outline" className="text-xs bg-gray-100 text-gray-800">
                        {take.quiz.grade}
                      </Badge>}
                  </div>
                </TableCell>

                {/* 状态 */}
                <TableCell>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(take.status)}
                    {take.status === "submitted" && <CheckCircle className="h-4 w-4 text-green-600" />}
                  </div>
                </TableCell>

                {/* 通过情况 */}
                <TableCell>
                  <div className="text-sm font-medium text-gray-900">
                    {formatPassRate(take.passedCount, take.totalCount)}
                  </div>
                </TableCell>

                {/* 老师评语 */}
                <TableCell>
                  <div className="flex items-center gap-2">
                    {take.teacherOverallComment ? <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-1 text-green-600 cursor-help">
                            <MessageCircle className="h-4 w-4" />
                            <span className="text-xs">有评语</span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">
                          <p className="max-w-xs">
                            {take.teacherOverallComment}
                          </p>
                        </TooltipContent>
                      </Tooltip> : <span className="text-xs text-gray-400">-</span>}
                  </div>
                </TableCell>

                {/* 提交时间 */}
                <TableCell>
                  <div className="text-sm text-gray-600">
                    {take.submitTime ? formatDistanceToNow(new Date(take.submitTime), {
                  addSuffix: true,
                  locale: zhCN
                }) : <span className="text-gray-400">-</span>}
                  </div>
                </TableCell>

                {/* 操作 */}
                <TableCell className="text-right">
                  <div className="flex justify-end space-x-2">
                    {/* 查看题目按钮 */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="outline" size="sm" onClick={() => handleViewQuestions(take._id)}>
                          <Eye className="h-3 w-3" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>查看本次{DISPLAY_TEXT.ORAL_KNOWLEDGE_QUIZ}的题目</p>
                      </TooltipContent>
                    </Tooltip>

                    {/* 查看解答记录按钮 */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="outline" size="sm" onClick={() => handleViewStudentLogs(take._id)} className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                          <MessageSquare className="h-3 w-3" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>新窗口查看学生解答记录</p>
                      </TooltipContent>
                    </Tooltip>

                    {/* 二维码按钮 */}
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" title="二维码分享" className="text-green-600 hover:text-green-700 hover:bg-green-50">
                          <QrCode className="h-3 w-3" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent side="left" className="w-auto p-4">
                        <div className="text-center space-y-2">
                          <div className="text-sm font-medium text-gray-900">
                            扫码查看学生端记录
                          </div>
                          <div className="text-xs text-gray-500">
                            {take.student?.name || "学生"}解答记录
                          </div>
                          {qrCodeData.get(take._id) ? <BaseImage src={qrCodeData.get(take._id) || ""} alt="二维码" width={192} height={192} className="w-48 h-48 mx-auto" /> : <div className="w-48 h-48 mx-auto bg-gray-100 flex items-center justify-center rounded">
                              <span className="text-sm text-gray-500">
                                生成中...
                              </span>
                            </div>}
                        </div>
                      </PopoverContent>
                    </Popover>

                    {/* 删除按钮 */}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="outline" size="sm" onClick={() => handleDeleteClick(take._id)} className="text-red-600 hover:text-red-700 hover:bg-red-50">
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>删除此{DISPLAY_TEXT.ORAL_KNOWLEDGE_QUIZ}记录</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </TableCell>
              </TableRow>)}
          </TableBody>
        </Table>
      </Card>

      {/* 删除确认对话框 */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              此操作将删除该{DISPLAY_TEXT.ORAL_KNOWLEDGE_QUIZ}
              记录及所有相关数据，包括：
              <br />• 学生的答题记录
              <br />• 所有会话记录和消息
              <br />• 上传的音频和图片文件
              <br />
              <br />
              此操作无法撤销，确定要继续吗？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} disabled={isDeleting} className="bg-red-600 hover:bg-red-700">
              {isDeleting ? "删除中..." : "确认删除"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </TooltipProvider>;
}
