"use client";

import { Eye, MessageSquare, QrCode, Trash2 } from "lucide-react";
// 非登录用户自主上传错题AI问答列表组件，展示学生错题记录、掌握情况、会话状态等信息，并提供查看详情、删除等操作
import { useEffect, useState } from "react";
import BaseImage from "../../../../../../../components/common/BaseImage.js";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "../../../../../../../components/ui/alert-dialog.js";
import { Button } from "../../../../../../../components/ui/button.js";
import { Card, CardContent } from "../../../../../../../components/ui/card.js";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../../../../../../../components/ui/dialog.js";
import { Popover, PopoverContent, PopoverTrigger } from "../../../../../../../components/ui/popover.js";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../../../../../components/ui/table.js";
import { generateQRCodeDataURL, generateWebViewURL } from "../../../../../../../lib/common/qrcode.js";
import { DISPLAY_TEXT } from "../../../../../../../lib/config/constants.js";
export default function GuestAIQuestionList({
  guestAiQuestionLogs,
  isLoading,
  onViewDetails,
  onViewStudentChat,
  onStudentClick,
  onDelete
}) {
  const [qrCodeData, setQrCodeData] = useState(new Map());

  // 生成二维码URL
  const generateGuestAIQuestionWebViewUrl = log => {
    // 生成学生端聊天记录的完整URL
    const chatUrl = `${window.location.origin}/mobile/records/guest-problems/${log.guestProblemQuestion._id}/useLogs`;

    // 生成webViewTitle: "${学生姓名}自主上传错题"
    const webViewTitle = `${log.guestStudentInfo.studentInfo.studentName}${DISPLAY_TEXT.SELF_UPLOAD_MISTAKE}`;
    return generateWebViewURL(chatUrl, webViewTitle);
  };

  // 当guestAiQuestionLogs变化时，预生成所有二维码
  useEffect(() => {
    const generateAllQRCodes = async () => {
      const newQrCodeData = new Map();
      for (const log of guestAiQuestionLogs) {
        const url = generateGuestAIQuestionWebViewUrl(log);
        const qrCode = await generateQRCodeDataURL(url);
        if (qrCode) {
          newQrCodeData.set(log.guestProblemQuestion._id, qrCode);
        }
      }
      setQrCodeData(newQrCodeData);
    };
    if (guestAiQuestionLogs.length > 0) {
      generateAllQRCodes();
    }
  }, [guestAiQuestionLogs]);

  // 格式化时间显示
  const formatTime = timestamp => {
    if (!timestamp) return {
      relative: "未知时间",
      absolute: "未知时间"
    };
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.floor(diffDays / 365);
    let relative;
    if (diffDays === 0) {
      relative = "今天";
    } else if (diffDays === 1) {
      relative = "昨天";
    } else if (diffDays < 30) {
      relative = `${diffDays}天前`;
    } else if (diffMonths < 12) {
      relative = `${diffMonths}月前`;
    } else {
      relative = `${diffYears}年前`;
    }
    const absolute = date.toLocaleString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    });
    return {
      relative,
      absolute
    };
  };

  // 获取难度文本
  const getDifficultyText = difficulty => {
    switch (difficulty) {
      case "容易":
        return "简单";
      case "中等":
        return "中等";
      case "困难":
        return "困难";
      case "超难":
        return "超难";
      case "未知":
        return "未知";
      default:
        return "未知";
    }
  };

  // 获取会话状态文本
  const getStatusText = status => {
    return status === "active" ? "进行中" : "已完成";
  };
  if (isLoading) {
    return <Card className="bg-white">
        <CardContent className="text-center py-8">
          <p className="text-gray-500">加载中...</p>
        </CardContent>
      </Card>;
  }
  if (guestAiQuestionLogs.length === 0) {
    return <Card className="bg-white">
        <CardContent className="text-center py-8">
          <p className="text-gray-500">
            暂无非登录用户{DISPLAY_TEXT.SELF_UPLOAD_MISTAKE}日志数据
          </p>
        </CardContent>
      </Card>;
  }
  return <Card className="bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>学生信息</TableHead>
            <TableHead>学校信息</TableHead>
            <TableHead>题目图片</TableHead>
            <TableHead>掌握情况</TableHead>
            <TableHead>会话状态</TableHead>
            <TableHead>创建时间</TableHead>
            <TableHead className="text-right">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {guestAiQuestionLogs.map(log => <TableRow key={log.guestProblemSession?._id || log.guestProblemQuestion._id}>
              {/* 学生信息 */}
              <TableCell>
                <div className="flex items-center space-x-2">
                  <div>
                    <div className="font-medium cursor-pointer hover:text-blue-600 hover:underline" onClick={() => {
                  if (log.guestStudentInfo.studentInfo.studentName === "未知学生") {
                    // 复制openid到剪贴板
                    navigator.clipboard.writeText(log.guestProblemQuestion.openid);
                    // 可以显示一个toast提示已复制
                  } else {
                    onStudentClick("name", log.guestStudentInfo.studentInfo.studentName);
                  }
                }} title={log.guestStudentInfo.studentInfo.studentName === "未知学生" ? "点击复制openid" : "点击筛选此学生"}>
                      {log.guestStudentInfo.studentInfo.studentName}
                    </div>
                    {/* 只有当不是"未知学生"时才显示openid */}
                    {log.guestStudentInfo.studentInfo.studentName !== "未知学生" && <div className="text-sm text-gray-500">
                        openid:{" "}
                        {log.guestProblemQuestion.openid.substring(0, 8)}
                        ...
                      </div>}
                  </div>
                </div>
              </TableCell>

              {/* 学校信息 */}
              <TableCell>
                <div className="flex items-center space-x-2">
                  <div>
                    <div className="text-sm font-medium">
                      {log.guestStudentInfo.studentInfo.schoolName || "未填写学校"}
                    </div>
                    <div className="text-xs text-gray-500">
                      {log.guestStudentInfo.studentInfo.grade || "未填写年级"}
                    </div>
                  </div>
                </div>
              </TableCell>

              {/* 题目图片 */}
              <TableCell>
                {(() => {
              const imageUrl = log.guestProblemQuestion.imageUrl;
              if (imageUrl) {
                return <Dialog>
                        <DialogTrigger asChild>
                          <div className="relative w-16 h-16 border rounded-md overflow-hidden cursor-pointer hover:shadow-lg transition-shadow">
                            <BaseImage src={imageUrl} alt="题目图片" fill className="object-cover" />
                          </div>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto flex flex-col items-center justify-center">
                          <DialogHeader className="w-full">
                            <DialogTitle>题目图片</DialogTitle>
                          </DialogHeader>
                          <div className="flex justify-center items-center flex-1 w-full">
                            <BaseImage src={imageUrl} alt="题目大图" width={800} height={600} className="max-w-full h-auto object-contain" />
                          </div>
                        </DialogContent>
                      </Dialog>;
              } else {
                return <div className="w-16 h-16 border rounded-md bg-gray-100 flex items-center justify-center">
                        <span className="text-xs text-gray-400">无图片</span>
                      </div>;
              }
            })()}
              </TableCell>

              {/* 掌握情况 */}
              <TableCell>
                <div className="flex items-center">
                  {log.guestProblemQuestion.isStudentMaster ? <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      已掌握
                    </span> : <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                      未掌握
                    </span>}
                </div>
              </TableCell>

              {/* 会话状态 */}
              <TableCell>
                <div className="text-sm">
                  <div className="font-medium">
                    {log.guestProblemSession ? getStatusText(log.guestProblemSession.status) : "未知"}
                  </div>
                  <div className="text-xs text-gray-500">
                    {log.guestProblemQuestion.subject} -{" "}
                    {getDifficultyText(log.guestProblemQuestion.difficulty)}
                  </div>
                  {log.guestProblemSession?.learningAssessment?.studentRating && <div className="text-xs text-yellow-600">
                      评分:{" "}
                      {log.guestProblemSession.learningAssessment.studentRating}
                      分
                    </div>}
                </div>
              </TableCell>

              {/* 创建时间 */}
              <TableCell>
                <div className="text-sm">
                  <div className="font-medium">
                    {formatTime(log.guestProblemQuestion.created).relative}
                  </div>
                  <div className="text-xs text-gray-500">
                    {formatTime(log.guestProblemQuestion.created).absolute}
                  </div>
                </div>
              </TableCell>

              {/* 操作按钮 */}
              <TableCell className="text-right">
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" size="sm" onClick={() => onViewDetails(log.guestProblemQuestion._id)} title="查看教师端详情">
                    <Eye className="h-3 w-3" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => onViewStudentChat(log.guestProblemQuestion._id)} title="查看学生端聊天记录" className="text-blue-600 hover:text-blue-700">
                    <MessageSquare className="h-3 w-3" />
                  </Button>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" title="二维码分享" className="text-green-600 hover:text-green-700">
                        <QrCode className="h-3 w-3" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent side="left" className="w-auto p-4">
                      <div className="text-center space-y-2">
                        <div className="text-sm font-medium text-gray-900">
                          扫码查看学生端记录
                        </div>
                        <div className="text-xs text-gray-500">
                          {log.guestStudentInfo.studentInfo.studentName}
                          {DISPLAY_TEXT.SELF_UPLOAD_MISTAKE}
                        </div>
                        {qrCodeData.get(log.guestProblemQuestion._id) ? <BaseImage src={qrCodeData.get(log.guestProblemQuestion._id) || ""} alt="二维码" width={192} height={192} className="w-48 h-48 mx-auto" /> : <div className="w-48 h-48 mx-auto bg-gray-100 flex items-center justify-center rounded">
                            <span className="text-sm text-gray-500">
                              生成中...
                            </span>
                          </div>}
                      </div>
                    </PopoverContent>
                  </Popover>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700" title="删除记录">
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>确认删除</AlertDialogTitle>
                        <AlertDialogDescription>
                          删除后，会删除整个{DISPLAY_TEXT.SELF_UPLOAD_MISTAKE}
                          会话及所有相关消息。此操作不可恢复，确定要删除吗？
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>取消</AlertDialogCancel>
                        <AlertDialogAction onClick={() => log.guestProblemSession && onDelete(log.guestProblemSession._id)} className="bg-red-600 hover:bg-red-700">
                          确定删除
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </TableCell>
            </TableRow>)}
        </TableBody>
      </Table>
    </Card>;
}
