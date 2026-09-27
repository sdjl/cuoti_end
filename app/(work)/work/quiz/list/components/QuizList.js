"use client";

import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";
import { Ban, BookOpen, Clock, Edit, Eye, FileQuestion, Lock, Play, QrCode, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import BaseImage from "../../../../../../components/common/BaseImage.js";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "../../../../../../components/ui/alert-dialog.js";
import { Button } from "../../../../../../components/ui/button.js";
// 口述核心知识点列表组件，用于展示和管理口述核心知识点列表
import { Card, CardContent } from "../../../../../../components/ui/card.js";
import { Popover, PopoverContent, PopoverTrigger } from "../../../../../../components/ui/popover.js";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../../../../components/ui/table.js";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../../../../../../components/ui/tooltip.js";
import { generateNormalURL, generateQRCodeDataURL } from "../../../../../../lib/common/qrcode.js";
import { DISPLAY_TEXT } from "../../../../../../lib/config/constants.js";
export default function QuizList({
  quizzes,
  participantCounts,
  isLoading,
  onDeleteQuiz,
  onToggleStatus
}) {
  const router = useRouter();
  const [operatingQuizId, setOperatingQuizId] = useState(null);
  const [qrCodeData, setQrCodeData] = useState(new Map());

  // 当quizzes数据更新时重置操作状态，这样状态切换后按钮就能重新点击
  useEffect(() => {
    if (operatingQuizId) {
      setOperatingQuizId(null);
    }
  }, [quizzes]);

  // 生成口述核心知识点二维码URL
  const generateQuizURL = quizId => {
    return generateNormalURL("/quiz", [quizId]);
  };

  // 当口述核心知识点数据变化时，预生成所有二维码
  useEffect(() => {
    const generateAllQRCodes = async () => {
      const newQrCodeData = new Map();
      for (const quiz of quizzes) {
        // 只为已锁定的口述核心知识点生成二维码
        if (quiz.status === "locked") {
          const url = generateQuizURL(quiz._id);
          const qrCode = await generateQRCodeDataURL(url);
          if (qrCode) {
            newQrCodeData.set(quiz._id, qrCode);
          }
        }
      }
      setQrCodeData(newQrCodeData);
    };
    if (quizzes.length > 0) {
      generateAllQRCodes();
    }
  }, [quizzes]);
  const handleDeleteClick = quizId => {
    setOperatingQuizId(quizId);
    onDeleteQuiz(quizId);
  };
  const handleToggleStatusClick = (quizId, currentStatus, questionCount) => {
    // 锁定时检查是否有题目
    if (currentStatus === "unlocked" && questionCount === 0) {
      return; // 阻止锁定
    }
    setOperatingQuizId(quizId);
    // 只允许 unlocked -> locked 的转换
    if (currentStatus === "unlocked") {
      onToggleStatus(quizId, "locked");
    }
  };

  // 处理关闭/重新打开口述核心知识点
  const handleToggleCloseStatus = (quizId, currentStatus) => {
    if (operatingQuizId) {
      return;
    }
    setOperatingQuizId(quizId);
    // locked 和 closed 之间可以互相转换
    const newStatus = currentStatus === "locked" ? "closed" : "locked";
    onToggleStatus(quizId, newStatus);
  };
  const handleEditQuiz = quizId => {
    router.push(`/work/quiz/edit/${quizId}`);
  };
  const handleManageQuestions = quizId => {
    router.push(`/work/quiz/edit/${quizId}/questions`);
  };

  // 获取状态标记
  const getStatusBadge = status => {
    const statusConfig = {
      locked: {
        color: "bg-green-100 text-green-800",
        text: "已锁定"
      },
      unlocked: {
        color: "bg-yellow-100 text-yellow-800",
        text: "未锁定"
      },
      closed: {
        color: "bg-red-100 text-red-800",
        text: "已关闭"
      }
    };
    const config = statusConfig[status] || statusConfig.unlocked;
    return <div className={`text-xs px-2 py-1 rounded-full inline-block hover:opacity-80 ${config.color}`}>
        {config.text}
      </div>;
  };
  if (isLoading) {
    return <Card className="bg-white">
        <CardContent className="text-center py-8">
          <p className="text-gray-500">加载中...</p>
        </CardContent>
      </Card>;
  }
  if (quizzes.length === 0) {
    return <Card className="bg-white">
        <CardContent className="text-center py-8">
          <FileQuestion className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-500">
            暂无{DISPLAY_TEXT.ORAL_KNOWLEDGE_QUIZ}数据
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
              <TableHead>科目/年级</TableHead>
              <TableHead>题目数量</TableHead>
              <TableHead>参与人数</TableHead>
              <TableHead>组队功能</TableHead>
              <TableHead>活动结束时间</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>创建时间</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {quizzes.map(quiz => <TableRow key={quiz._id}>
                <TableCell>
                  <div>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="font-medium text-gray-900 cursor-help">
                          {quiz.title}
                        </div>
                      </TooltipTrigger>
                      {quiz.description && <TooltipContent>
                          <p className="max-w-xs">{quiz.description}</p>
                        </TooltipContent>}
                    </Tooltip>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    <div className="text-xs px-2 py-1 rounded-full inline-block bg-blue-100 text-blue-800 w-fit">
                      {quiz.subject}
                    </div>
                    {quiz.grade && <div className="text-xs px-2 py-1 rounded-full inline-block bg-gray-100 text-gray-800 w-fit">
                        {quiz.grade}
                      </div>}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">
                      {quiz.questionIds?.length || 0}
                    </span>
                    <span className="ml-1">题</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">
                      {participantCounts[quiz._id] || 0}
                    </span>
                    <span className="ml-1">人</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <div>
                      {quiz.teamEnabled ? <div>
                          <div className="text-xs text-gray-500 mt-1">
                            {quiz.teamMaxSize || 5}人
                          </div>
                        </div> : <div className="text-xs px-2 py-1 rounded-full inline-block bg-gray-100 text-gray-600">
                          未开启
                        </div>}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  {quiz.teamEnabled && quiz.teamEndTime ? <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center space-x-1 cursor-help">
                          <Clock className="h-3 w-3 text-gray-400" />
                          <div className={`text-xs px-2 py-1 rounded-full ${Date.now() > quiz.teamEndTime ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"}`}>
                            {Date.now() > quiz.teamEndTime ? "已结束" : "进行中"}
                          </div>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>
                          结束时间：
                          {new Date(quiz.teamEndTime).toLocaleString("zh-CN", {
                      year: "numeric",
                      month: "2-digit",
                      day: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit"
                    }).replace(/\//g, "-")}
                        </p>
                      </TooltipContent>
                    </Tooltip> : quiz.teamEnabled ? <div className="text-xs text-gray-400">未设置</div> : <div className="text-xs text-gray-400">-</div>}
                </TableCell>
                <TableCell>{getStatusBadge(quiz.status)}</TableCell>
                <TableCell>
                  <div className="text-sm text-gray-600">
                    {formatDistanceToNow(new Date(quiz.created), {
                  addSuffix: true,
                  locale: zhCN
                })}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end space-x-2">
                    {/* 二维码按钮 - 只有已锁定的口述核心知识点才显示 */}
                    {quiz.status === "locked" && <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" size="sm" title={`${DISPLAY_TEXT.ORAL_KNOWLEDGE_QUIZ}二维码`} className="text-green-600 hover:text-green-700 hover:bg-green-50">
                            <QrCode className="h-3 w-3" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent side="left" className="w-auto p-4">
                          <div className="text-center space-y-2">
                            <div className="text-sm font-medium text-gray-900">
                              {DISPLAY_TEXT.ORAL_KNOWLEDGE_QUIZ}二维码
                            </div>
                            <div className="text-xs text-gray-500">
                              扫码参与{DISPLAY_TEXT.ORAL_KNOWLEDGE_QUIZ}
                            </div>
                            <div className="text-xs text-gray-600 truncate">
                              {DISPLAY_TEXT.ORAL_KNOWLEDGE_QUIZ}：{quiz.title}
                            </div>
                            {qrCodeData.get(quiz._id) ? <BaseImage src={qrCodeData.get(quiz._id) || ""} alt={`${DISPLAY_TEXT.ORAL_KNOWLEDGE_QUIZ}二维码`} width={192} height={192} className="w-48 h-48 mx-auto" /> : <div className="w-48 h-48 mx-auto bg-gray-100 flex items-center justify-center rounded">
                                <span className="text-sm text-gray-500">
                                  生成中...
                                </span>
                              </div>}
                            <div className="text-xs text-gray-500 space-y-1">
                              <div>科目：{quiz.subject}</div>
                              <div>
                                题目数量：{quiz.questionIds?.length || 0} 题
                              </div>
                            </div>
                          </div>
                        </PopoverContent>
                      </Popover>}

                    {/* 编辑按钮 */}
                    <Button variant="outline" size="sm" disabled={operatingQuizId === quiz._id} title={`编辑${DISPLAY_TEXT.ORAL_KNOWLEDGE_QUIZ}`} onClick={() => handleEditQuiz(quiz._id)}>
                      <Edit className="h-3 w-3" />
                    </Button>

                    {/* 管理题目按钮 */}
                    <Button variant="outline" size="sm" disabled={operatingQuizId === quiz._id} title="管理题目" onClick={() => handleManageQuestions(quiz._id)}>
                      <BookOpen className="h-3 w-3" />
                    </Button>

                    {/* 查看队伍按钮 - 只有开启组队功能的口述核心知识点才显示 */}
                    {quiz.teamEnabled && <Button variant="outline" size="sm" disabled={operatingQuizId === quiz._id} title="查看队伍" onClick={() => {
                  const url = `/work/quiz/team?quizId=${quiz._id}`;
                  window.open(url, "_blank");
                }}>
                        <Eye className="h-3 w-3" />
                      </Button>}

                    {/* 锁定按钮 - 只有未锁定的口述核心知识点才显示 */}
                    {quiz.status === "unlocked" && <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm" disabled={operatingQuizId === quiz._id || (quiz.questionIds?.length || 0) === 0} title={(quiz.questionIds?.length || 0) === 0 ? "需要至少添加一道题目才能锁定" : `锁定${DISPLAY_TEXT.ORAL_KNOWLEDGE_QUIZ}`}>
                            <Lock className="h-3 w-3" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              锁定{DISPLAY_TEXT.ORAL_KNOWLEDGE_QUIZ}
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              锁定后，学生可以开始参与
                              {DISPLAY_TEXT.ORAL_KNOWLEDGE_QUIZ}
                              ，但您将无法删除或修改题目。 确认要锁定
                              {DISPLAY_TEXT.ORAL_KNOWLEDGE_QUIZ}&ldquo;
                              {quiz.title}&rdquo;吗？
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>取消</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleToggleStatusClick(quiz._id, quiz.status, quiz.questionIds?.length || 0)}>
                              确认锁定
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>}

                    {/* 关闭/重新打开按钮 - 只有已锁定或已关闭的口述核心知识点才显示 */}
                    {(quiz.status === "locked" || quiz.status === "closed") && <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm" disabled={operatingQuizId === quiz._id} title={quiz.status === "locked" ? `关闭${DISPLAY_TEXT.ORAL_KNOWLEDGE_QUIZ}` : `重新打开${DISPLAY_TEXT.ORAL_KNOWLEDGE_QUIZ}`} className={quiz.status === "closed" ? "text-green-600 hover:text-green-700 hover:bg-green-50" : ""}>
                            {quiz.status === "locked" ? <Ban className="h-3 w-3" /> : <Play className="h-3 w-3" />}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              {quiz.status === "locked" ? `关闭${DISPLAY_TEXT.ORAL_KNOWLEDGE_QUIZ}` : `重新打开${DISPLAY_TEXT.ORAL_KNOWLEDGE_QUIZ}`}
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              {quiz.status === "locked" ? `关闭后，学生将无法继续参与${DISPLAY_TEXT.ORAL_KNOWLEDGE_QUIZ}，无法提交答案。关闭后可以重新打开。` : `重新打开后，学生可以继续参与${DISPLAY_TEXT.ORAL_KNOWLEDGE_QUIZ}并提交答案。`}
                              确认要
                              {quiz.status === "locked" ? "关闭" : "重新打开"}
                              {DISPLAY_TEXT.ORAL_KNOWLEDGE_QUIZ}&ldquo;
                              {quiz.title}&rdquo;吗？
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>取消</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleToggleCloseStatus(quiz._id, quiz.status)}>
                              确认
                              {quiz.status === "locked" ? "关闭" : "重新打开"}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>}

                    {/* 删除按钮 - 只有未锁定的口述核心知识点才能删除 */}
                    {quiz.status === "unlocked" && <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm" disabled={operatingQuizId === quiz._id} title={`删除${DISPLAY_TEXT.ORAL_KNOWLEDGE_QUIZ}`} className="text-red-600 hover:text-red-700 hover:bg-red-50">
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              删除{DISPLAY_TEXT.ORAL_KNOWLEDGE_QUIZ}
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              确认要删除{DISPLAY_TEXT.ORAL_KNOWLEDGE_QUIZ}
                              &ldquo;{quiz.title}&rdquo;吗？
                              删除后将无法恢复，所有相关的
                              {DISPLAY_TEXT.ORAL_KNOWLEDGE_QUIZ}记录也会被删除。
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>取消</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteClick(quiz._id)} className="bg-red-600 hover:bg-red-700 text-white">
                              确认删除
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>}
                  </div>
                </TableCell>
              </TableRow>)}
          </TableBody>
        </Table>
      </Card>
    </TooltipProvider>;
}
