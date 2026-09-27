"use client";

import { AlertCircle, CheckCircle, Copy, Download, File, FileText, Package, RefreshCw } from "lucide-react";
// 错题批量任务学生 PDF 列表，负责展示状态并提供重新生成下载
import { useState } from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "../../../../../../../../components/ui/alert-dialog.js";
import { Badge } from "../../../../../../../../components/ui/badge.js";
import { Button } from "../../../../../../../../components/ui/button.js";
import { Card } from "../../../../../../../../components/ui/card.js";
import { Popover, PopoverContent, PopoverTrigger } from "../../../../../../../../components/ui/popover.js";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../../../../../../components/ui/table.js";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../../../../../../../../components/ui/tooltip.js";
import { useToast } from "../../../../../../../../hooks/use-toast.js";
import { downloadStudentPdfZipAction, regenerateStudentPdfAction } from "../actions.js";
import StatusBadge from "./StatusBadge.js";
export default function StudentPdfList({
  studentPdfs,
  isLoading,
  onRefresh
}) {
  const {
    toast
  } = useToast();
  const [regeneratingIds, setRegeneratingIds] = useState(new Set());
  const [downloadingIds, setDownloadingIds] = useState(new Set());
  const [confirmRegenerateId, setConfirmRegenerateId] = useState(null);

  // 复制下载链接
  const handleCopyUrl = (url, fileName) => {
    navigator.clipboard.writeText(url).then(() => {
      toast({
        title: "复制成功",
        description: `${fileName} 下载链接已复制到剪贴板`
      });
    });
  };

  // 重新生成PDF
  const handleRegenerate = async (pdfId, studentName) => {
    if (regeneratingIds.has(pdfId)) {
      return; // 防止重复点击
    }
    setConfirmRegenerateId(null);
    setRegeneratingIds(prev => new Set(prev).add(pdfId));
    try {
      const result = await regenerateStudentPdfAction(pdfId);
      if (result.success) {
        toast({
          title: "重新生成成功",
          description: `已将学生 ${studentName} 的PDF设置为等待生成状态`
        });

        // 刷新数据
        if (onRefresh) {
          onRefresh();
        }
      } else {
        toast({
          title: "重新生成失败",
          description: result.error || "操作失败",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("重新生成PDF失败:", error);
      toast({
        title: "重新生成失败",
        description: "发生未知错误",
        variant: "destructive"
      });
    } finally {
      setRegeneratingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(pdfId);
        return newSet;
      });
    }
  };

  // 打包下载学生PDF
  const handleDownloadZip = async pdf => {
    if (downloadingIds.has(pdf._id)) {
      return; // 防止重复点击
    }

    // 检查是否有PDF文件
    if (!pdf.mistakePdf || !pdf.answerPdf) {
      toast({
        title: "下载失败",
        description: "该学生的PDF文件尚未生成完成",
        variant: "destructive"
      });
      return;
    }
    setDownloadingIds(prev => new Set(prev).add(pdf._id));
    try {
      const result = await downloadStudentPdfZipAction(pdf._id);
      if (result.success && result.zipBase64) {
        // 将Base64转换为Blob
        const byteCharacters = atob(result.zipBase64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], {
          type: "application/zip"
        });

        // 创建下载链接
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = result.fileName || "student-pdfs.zip";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // 释放URL对象
        setTimeout(() => URL.revokeObjectURL(url), 100);
        toast({
          title: "下载成功",
          description: `正在下载 ${pdf.studentName} 的PDF文件`
        });
      } else {
        toast({
          title: "下载失败",
          description: result.error || "打包下载失败",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("打包下载失败:", error);
      toast({
        title: "下载失败",
        description: "发生未知错误",
        variant: "destructive"
      });
    } finally {
      setDownloadingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(pdf._id);
        return newSet;
      });
    }
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
            <TableHead>班级</TableHead>
            <TableHead>年级</TableHead>
            <TableHead>状态</TableHead>
            <TableHead>题集</TableHead>
            <TableHead>题目数量</TableHead>
            <TableHead className="text-center">已重新提交</TableHead>
            <TableHead className="text-center">顽固错题</TableHead>
            <TableHead className="text-center">重做正确率</TableHead>
            <TableHead>PDF</TableHead>
            <TableHead className="text-right">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {studentPdfs.map(pdf => <TableRow key={pdf._id}>
              <TableCell>
                <div className="font-medium">{pdf.studentName}</div>
              </TableCell>
              <TableCell>
                <div className="text-sm text-gray-900">{pdf.className}</div>
              </TableCell>
              <TableCell>
                {pdf.grade ? <Badge variant="outline">{pdf.grade}</Badge> : <span className="text-gray-400 text-sm">—</span>}
              </TableCell>
              <TableCell>
                <StatusBadge status={pdf.status} taskId={pdf._id} startTime={pdf.startTime} retryCount={pdf.retryCount} failureReason={pdf.failureReason} />
              </TableCell>
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
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="cursor-pointer inline-block">
                        {pdf.hasResubmittedAnswer ? <CheckCircle className="w-4 h-4 text-green-600" /> : <span className="text-gray-400 text-sm">—</span>}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="text-sm text-white">
                        <div>
                          已下载错题PDF：
                          {pdf.hasDownloadedMistakePdf ? <span className="text-green-400 font-medium">
                              是
                            </span> : <span className="text-white">否</span>}
                        </div>
                        <div>
                          已下载答案PDF：
                          {pdf.hasDownloadedAnswerPdf ? <span className="text-green-400 font-medium">
                              是
                            </span> : <span className="text-white">否</span>}
                        </div>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </TableCell>
              <TableCell className="text-center">
                {pdf.stubbornMistakeCount > 0 ? <span className="text-sm font-medium text-orange-600">
                    {pdf.stubbornMistakeCount}
                  </span> : <span className="text-gray-400 text-sm">0</span>}
              </TableCell>
              <TableCell className="text-center">
                {pdf.redoAccuracyRate !== null ? <span className={`text-sm font-medium ${pdf.redoAccuracyRate >= 0.8 ? "text-green-600" : pdf.redoAccuracyRate >= 0.5 ? "text-yellow-600" : "text-red-600"}`}>
                    {(pdf.redoAccuracyRate * 100).toFixed(0)}%
                  </span> : <span className="text-gray-400 text-sm">—</span>}
              </TableCell>
              <TableCell>
                {pdf.status === "cleaned" ? <Badge variant="secondary">已清理</Badge> : pdf.mistakePdf || pdf.answerPdf ? <Popover>
                    <PopoverTrigger asChild>
                      <Button size="sm" variant="outline">
                        <File className="h-3 w-3 mr-1" />
                        PDF
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-2">
                      <div className="flex flex-col gap-2">
                        {pdf.mistakePdf && <>
                            <Button size="sm" variant="outline" className="justify-start" onClick={() => window.open(pdf.mistakePdf.fileUrl, "_blank")}>
                              <Download className="h-3 w-3 mr-1" />
                              下载错题
                            </Button>
                            <Button size="sm" variant="ghost" className="justify-start" onClick={() => handleCopyUrl(pdf.mistakePdf.fileUrl, `${pdf.studentName}-错题PDF`)}>
                              <Copy className="h-3 w-3 mr-1" />
                              复制错题链接
                            </Button>
                          </>}
                        {pdf.answerPdf && <>
                            <Button size="sm" variant="outline" className="justify-start" onClick={() => window.open(pdf.answerPdf.fileUrl, "_blank")}>
                              <Download className="h-3 w-3 mr-1" />
                              下载答案
                            </Button>
                            <Button size="sm" variant="ghost" className="justify-start" onClick={() => handleCopyUrl(pdf.answerPdf.fileUrl, `${pdf.studentName}-答案PDF`)}>
                              <Copy className="h-3 w-3 mr-1" />
                              复制答案链接
                            </Button>
                          </>}
                      </div>
                    </PopoverContent>
                  </Popover> : <span className="text-gray-400 text-sm">—</span>}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex gap-2 justify-end">
                  {pdf.failureReason && <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-1 cursor-pointer text-red-600">
                            <AlertCircle className="h-4 w-4" />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <div className="text-sm font-medium mb-1 text-white">
                            失败原因：
                          </div>
                          <div className="text-sm text-white">
                            {pdf.failureReason}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>}
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button size="sm" variant="outline" onClick={() => setConfirmRegenerateId(pdf._id)} disabled={regeneratingIds.has(pdf._id)}>
                          <RefreshCw className={`h-4 w-4 ${regeneratingIds.has(pdf._id) ? "animate-spin" : ""}`} />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <span className="text-white">
                          {regeneratingIds.has(pdf._id) ? "处理中..." : "重新生成"}
                        </span>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button size="sm" variant="default" onClick={() => handleDownloadZip(pdf)} disabled={downloadingIds.has(pdf._id) || !pdf.mistakePdf || !pdf.answerPdf || pdf.status === "cleaned"}>
                          <Package className={`h-4 w-4 ${downloadingIds.has(pdf._id) ? "animate-spin" : ""}`} />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <span className="text-white">
                          {downloadingIds.has(pdf._id) ? "打包中..." : "打包下载"}
                        </span>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </TableCell>
            </TableRow>)}
        </TableBody>
      </Table>

      {/* 重新生成确认对话框 */}
      <AlertDialog open={confirmRegenerateId !== null} onOpenChange={open => !open && setConfirmRegenerateId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认重新生成</AlertDialogTitle>
            <AlertDialogDescription>
              此操作将删除该学生的现有PDF文件，并重新生成。同时会删除该班级的打包文件和任务的全部打包文件。
              <br />
              <br />
              确定要继续吗？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
            const pdf = studentPdfs.find(p => p._id === confirmRegenerateId);
            if (pdf) {
              handleRegenerate(pdf._id, pdf.studentName);
            }
          }}>
              确认重新生成
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>;
}
