"use client";

// 学生答卷列表组件，显示学生的所有答卷记录，支持查看、删除、筛选和导出操作
import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";
import { AlertCircle, BarChart3, Brain, Calendar, CheckCircle2, Eye, FileText, QrCode, Trash2, XCircle } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import BaseImage from "../../../../../../../../../components/common/BaseImage.js";
import { Button } from "../../../../../../../../../components/ui/button.js";
import { Card, CardContent } from "../../../../../../../../../components/ui/card.js";
import { Checkbox } from "../../../../../../../../../components/ui/checkbox.js";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../../../../../../../../components/ui/dialog.js";
import { Popover, PopoverContent, PopoverTrigger } from "../../../../../../../../../components/ui/popover.js";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../../../../../../../components/ui/table.js";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../../../../../../../../../components/ui/tooltip.js";
import { generateQRCodeDataURL, generateWebViewURL } from "../../../../../../../../../lib/common/qrcode.js";
export default function StudentAnswerList({
  answers,
  isLoading,
  onViewAnswer,
  onDeleteAnswer,
  selectedAnswers = [],
  onSelectAnswer,
  onSelectAll,
  student
}) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedAnswerId, setSelectedAnswerId] = useState(null);
  const [qrCodeData, setQrCodeData] = useState(new Map());

  // 生成二维码URL
  const generateAnswerWebViewUrl = useCallback(answer => {
    // 生成学生端聊天记录的完整URL
    const chatUrl = `${window.location.origin}/mobile/answer/${answer._id}/report`;

    // 生成webViewTitle: "${学生姓名}-${题集名称}报告"，但如果题集名称已经以学生姓名开头则不重复
    let webViewTitle;
    const studentName = student?.name || "未知学生";
    const questionPackName = answer.questionPackName || "未知题集";
    if (questionPackName.startsWith(studentName)) {
      webViewTitle = `${questionPackName}报告`;
    } else {
      webViewTitle = `${studentName}-${questionPackName}报告`;
    }
    return generateWebViewURL(chatUrl, webViewTitle);
  }, [student]);

  // 当answers变化时，预生成所有二维码
  useEffect(() => {
    const generateAllQRCodes = async () => {
      const newQrCodeData = new Map();
      for (const answer of answers) {
        const url = generateAnswerWebViewUrl(answer);
        const qrCode = await generateQRCodeDataURL(url);
        if (qrCode) {
          newQrCodeData.set(answer._id, qrCode);
        }
      }
      setQrCodeData(newQrCodeData);
    };
    if (answers.length > 0 && student) {
      generateAllQRCodes();
    }
  }, [answers, student, generateAnswerWebViewUrl]);

  // 全选状态
  const isAllSelected = answers.length > 0 && selectedAnswers.length === answers.length;
  const isPartialSelected = selectedAnswers.length > 0 && selectedAnswers.length < answers.length;

  // 处理全选/取消全选
  const handleSelectAll = checked => {
    onSelectAll?.(checked);
  };

  // 处理单个选择
  const handleSelectAnswer = (answerId, checked) => {
    onSelectAnswer?.(answerId, checked);
  };

  // 处理删除确认
  const handleDeleteClick = answerId => {
    setSelectedAnswerId(answerId);
    setDeleteDialogOpen(true);
  };

  // 执行删除
  const handleConfirmDelete = () => {
    if (selectedAnswerId) {
      onDeleteAnswer(selectedAnswerId);
      setDeleteDialogOpen(false);
      setSelectedAnswerId(null);
    }
  };

  // 获取题集类型标记
  const getTypeBadge = type => {
    const typeConfig = {
      试卷: {
        color: "bg-blue-100 text-blue-800",
        text: "试卷"
      },
      错题集: {
        color: "bg-red-100 text-red-800",
        text: "错题集"
      },
      知识点: {
        color: "bg-green-100 text-green-800",
        text: "知识点"
      },
      自建: {
        color: "bg-purple-100 text-purple-800",
        text: "自建"
      }
    };
    const config = typeConfig[type] || {
      color: "bg-gray-100 text-gray-800",
      text: type || "未知"
    };
    return <div className={`text-xs px-2 py-1 rounded-full inline-block ${config.color}`}>
        {config.text}
      </div>;
  };

  // 格式化时间
  const formatDate = timestamp => {
    try {
      const date = new Date(timestamp);
      return formatDistanceToNow(date, {
        addSuffix: true,
        locale: zhCN
      });
    } catch {
      return "未知时间";
    }
  };

  // 格式化完整时间
  const formatFullDate = timestamp => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleString("zh-CN");
    } catch {
      return "未知时间";
    }
  };
  if (isLoading) {
    return <Card className="bg-white">
        <CardContent className="text-center py-8">
          <p className="text-gray-500">加载中...</p>
        </CardContent>
      </Card>;
  }
  if (answers.length === 0) {
    return <Card className="bg-white">
        <CardContent className="text-center py-8">
          <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-500">暂无答卷记录</p>
        </CardContent>
      </Card>;
  }
  return <>
      <Card className="bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              {onSelectAnswer && <TableHead className="w-12">
                  <Checkbox checked={isAllSelected} onCheckedChange={handleSelectAll} className={isPartialSelected ? "data-[state=checked]:bg-blue-600" : ""} />
                </TableHead>}
              <TableHead>题集名称</TableHead>
              <TableHead>班级</TableHead>
              <TableHead>课程</TableHead>
              <TableHead>类型</TableHead>
              <TableHead>错题数量</TableHead>
              <TableHead>提交时间</TableHead>
              <TableHead>已查看</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {answers.map(answer => <TableRow key={answer._id}>
                {onSelectAnswer && <TableCell>
                    <Checkbox checked={selectedAnswers.includes(answer._id)} onCheckedChange={checked => handleSelectAnswer(answer._id, checked)} />
                  </TableCell>}
                <TableCell>
                  <div className="font-medium">
                    {answer.questionPackName || "未知题集"}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    {answer.className ? <span className="text-green-600">{answer.className}</span> : <span className="text-gray-500">未知班级</span>}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    {answer.courseName ? <span className="text-blue-600">{answer.courseName}</span> : <span className="text-gray-500">无课程关联</span>}
                  </div>
                </TableCell>
                <TableCell>{getTypeBadge(answer.type || "")}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <XCircle className="h-4 w-4 text-orange-500" />
                    <span className="font-medium text-orange-600">
                      {answer.questionCount}
                    </span>
                    <span className="text-gray-500 text-sm">题</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1 cursor-help" title={formatFullDate(answer.created)}>
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      {formatDate(answer.created)}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <TooltipProvider>
                    {answer.hasViewedReport ? <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-1 cursor-help">
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                            <span className="text-sm text-green-600">
                              已查看
                            </span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <span>
                            {answer.reportViewedAt ? formatFullDate(answer.reportViewedAt) : "未知时间"}
                          </span>
                        </TooltipContent>
                      </Tooltip> : <span className="text-sm text-gray-400">未查看</span>}
                  </TooltipProvider>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" size="sm" onClick={() => onViewAnswer(answer)} title="查看答卷">
                      <Eye className="h-3 w-3" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => window.open(`/mobile/answer/${answer._id}/report`, "_blank")} title="查看单次答卷分析报告">
                      <BarChart3 className="h-3 w-3" />
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
                            扫码查看分析报告
                          </div>
                          <div className="text-xs text-gray-500">
                            {(() => {
                          const studentName = student?.name || "未知学生";
                          const questionPackName = answer.questionPackName || "未知题集";
                          return questionPackName.startsWith(studentName) ? `${questionPackName}报告` : `${studentName}-${questionPackName}报告`;
                        })()}
                          </div>
                          {qrCodeData.get(answer._id) ? <BaseImage src={qrCodeData.get(answer._id) || ""} alt="二维码" width={192} height={192} className="w-48 h-48 mx-auto" /> : <div className="w-48 h-48 mx-auto bg-gray-100 flex items-center justify-center rounded">
                              <span className="text-sm text-gray-500">
                                生成中...
                              </span>
                            </div>}
                        </div>
                      </PopoverContent>
                    </Popover>
                    <Button variant="outline" size="sm" className={answer.isAnalysisCompleted ? "border-gray-300 text-gray-600" // 已完成分析，默认颜色
                : "border-blue-500 text-blue-600 bg-blue-50 hover:bg-blue-100" // 未完成分析，蓝色提示
                } onClick={() => window.open(`/work/answer/parse/${answer._id}`, "_blank")} title={answer.isAnalysisCompleted ? "查看已完成的分析" : "需要进行AI分析"}>
                      <Brain className="h-3 w-3" />
                    </Button>

                    <Button variant="outline" size="sm" onClick={() => handleDeleteClick(answer._id)} title="删除答卷" className="bg-red-500 hover:bg-red-600 text-white hover:text-white border-red-500 hover:border-red-600">
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>)}
          </TableBody>
        </Table>
      </Card>

      {/* 删除确认对话框 */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              确认删除答卷
            </DialogTitle>
            <DialogDescription>
              此操作将永久删除该学生的答卷记录及所有相关的错题数据和图片文件。
              <br />
              <span className="font-medium text-red-600">此操作不可撤销</span>
              ，请确认是否要继续？
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              取消
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete} className="bg-red-500 hover:bg-red-600 text-white hover:text-white">
              确认删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>;
}
