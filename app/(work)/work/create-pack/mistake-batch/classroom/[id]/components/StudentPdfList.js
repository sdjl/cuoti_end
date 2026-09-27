"use client";

import { AlertCircle, CheckCircle, Copy, Download, FileText } from "lucide-react";
import { Badge } from "../../../../../../../../components/ui/badge.js";
import { Button } from "../../../../../../../../components/ui/button.js";
// 班级下学生错题包 PDF 列表，展示生成状态及操作入口
import { Card } from "../../../../../../../../components/ui/card.js";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../../../../../../components/ui/table.js";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../../../../../../../../components/ui/tooltip.js";
import { useToast } from "../../../../../../../../hooks/use-toast.js";
export default function StudentPdfList({
  studentPdfs,
  isLoading
}) {
  const {
    toast
  } = useToast();

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

  // 复制下载链接
  const handleCopyUrl = (url, fileName) => {
    navigator.clipboard.writeText(url).then(() => {
      toast({
        title: "复制成功",
        description: `${fileName} 下载链接已复制到剪贴板`
      });
    });
  };
  if (isLoading) {
    return <Card className="bg-white">
        <div className="text-center py-8">
          <p className="text-gray-500">加载中...</p>
        </div>
      </Card>;
  }
  if (studentPdfs.length === 0) {
    return <Card className="bg-white">
        <div className="text-center py-8">
          <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-500">暂无学生PDF数据</p>
        </div>
      </Card>;
  }
  return <Card className="bg-white">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>学生姓名</TableHead>
            <TableHead>状态</TableHead>
            <TableHead>题集</TableHead>
            <TableHead>题目数量</TableHead>
            <TableHead className="text-center">已下载</TableHead>
            <TableHead className="text-center">已重新提交</TableHead>
            <TableHead>错题PDF</TableHead>
            <TableHead>答案PDF</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {studentPdfs.map(pdf => <TableRow key={pdf._id}>
              <TableCell>
                <div className="font-medium">{pdf.studentName}</div>
              </TableCell>
              <TableCell>{getStatusBadge(pdf.status)}</TableCell>
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
              <TableCell>
                <span className="text-sm font-medium">
                  {pdf.mistakeCount} 题
                </span>
              </TableCell>
              <TableCell className="text-center">
                {pdf.hasDownloadedMistakePdf ? <CheckCircle className="w-4 h-4 text-green-600 inline-block" /> : <span className="text-gray-400 text-sm">—</span>}
              </TableCell>
              <TableCell className="text-center">
                {pdf.hasResubmittedAnswer ? <CheckCircle className="w-4 h-4 text-green-600 inline-block" /> : <span className="text-gray-400 text-sm">—</span>}
              </TableCell>
              <TableCell>
                {pdf.status === "cleaned" ? <Badge variant="secondary">已清理</Badge> : pdf.mistakePdf ? <div className="flex gap-1">
                    <Button size="sm" variant="outline" onClick={() => window.open(pdf.mistakePdf.fileUrl, "_blank")} title="下载错题PDF">
                      <Download className="h-3 w-3" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleCopyUrl(pdf.mistakePdf.fileUrl, `${pdf.studentName}-错题PDF`)} title="复制下载链接">
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div> : <span className="text-gray-400 text-sm">—</span>}
              </TableCell>
              <TableCell>
                {pdf.status === "cleaned" ? <Badge variant="secondary">已清理</Badge> : pdf.answerPdf ? <div className="flex gap-1">
                    <Button size="sm" variant="outline" onClick={() => window.open(pdf.answerPdf.fileUrl, "_blank")} title="下载答案PDF">
                      <Download className="h-3 w-3" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleCopyUrl(pdf.answerPdf.fileUrl, `${pdf.studentName}-答案PDF`)} title="复制下载链接">
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div> : pdf.failureReason ? <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-1 cursor-pointer text-red-600">
                          <AlertCircle className="h-4 w-4" />
                          <span className="text-sm">失败</span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <div className="text-sm font-medium mb-1">
                          失败原因：
                        </div>
                        <div className="text-sm">{pdf.failureReason}</div>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider> : <span className="text-gray-400 text-sm">—</span>}
              </TableCell>
            </TableRow>)}
        </TableBody>
      </Table>
    </Card>;
}
