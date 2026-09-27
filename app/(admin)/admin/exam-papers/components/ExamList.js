// 试卷列表组件，用于显示试卷列表并提供查看、编辑、删除等操作

import { Copy, Eye, FileText, Loader2, Pencil, PlusCircle, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { CustomPagination } from "../../../../../components/common/Pagination.js";
import { Badge } from "../../../../../components/ui/badge.js";
import { Button } from "../../../../../components/ui/button.js";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../../../components/ui/card.js";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../../../../components/ui/dialog.js";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../../../components/ui/table.js";
export default function ExamList({
  examPapers,
  isLoading,
  totalCount,
  totalPages,
  currentPage,
  onPageChange,
  onDeletePaper,
  getSubjectName
}) {
  const [paperToDelete, setPaperToDelete] = useState(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // 打开删除对话框
  const openDeleteDialog = paperId => {
    setPaperToDelete(paperId);
    setIsDeleteDialogOpen(true);
  };

  // 关闭删除对话框
  const closeDeleteDialog = () => {
    setIsDeleteDialogOpen(false);
    setPaperToDelete(null);
  };

  // 确认删除
  const confirmDelete = async () => {
    if (paperToDelete) {
      try {
        setIsDeleting(true);
        await onDeletePaper(paperToDelete);
      } catch (error) {
        console.error("删除试卷失败:", error);
      } finally {
        setIsDeleting(false);
        closeDeleteDialog();
      }
    }
  };

  // 格式化时间戳为日期字符串
  const formatTime = timestamp => {
    return new Date(timestamp).toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    });
  };

  // 生成带页码参数的链接
  const generateLink = paperId => {
    return `/admin/exam-papers/${paperId}/questions?from_exam_page=${currentPage}`;
  };
  return <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <CardTitle>试卷列表</CardTitle>
            <CardDescription>
              <div className="flex items-center gap-2">
                <span>当前共有 {totalCount} 份试卷</span>
                <Link href="/admin/exam-papers/create">
                  <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    新增试卷
                  </Button>
                </Link>
              </div>
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>试卷标题</TableHead>
                  <TableHead>科目</TableHead>
                  <TableHead>页数</TableHead>
                  <TableHead>锁定状态</TableHead>
                  <TableHead>上传时间</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? <TableRow>
                    <TableCell colSpan={6} className="text-center py-10">
                      <div className="flex justify-center items-center">
                        <Loader2 className="h-6 w-6 animate-spin mr-2" />
                        <span>加载中...</span>
                      </div>
                    </TableCell>
                  </TableRow> : examPapers.length > 0 ? examPapers.map(paper => <TableRow key={paper._id}>
                      <TableCell className="font-medium">
                        {paper.title}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-primary/10">
                          {getSubjectName(paper.subject)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {paper.pdfPageCount ? paper.pdfPageCount : "-"}
                      </TableCell>
                      <TableCell>
                        {paper.isLocked ? <Badge className="bg-orange-100 text-orange-800 border-orange-200">
                            已锁定
                          </Badge> : <Badge variant="outline" className="bg-gray-100">
                            未锁定
                          </Badge>}
                      </TableCell>
                      <TableCell>{formatTime(paper.created)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="icon" onClick={() => window.open(`/admin/exam-papers/${paper._id}/view?from_exam_page=${currentPage}`, "_blank")} title="查看">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Link href={generateLink(paper._id)}>
                            <Button variant="outline" size="icon" title="查看题目">
                              <FileText className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Link href={`/admin/exam-papers/${paper._id}/edit?from_exam_page=${currentPage}`}>
                            <Button variant="outline" size="icon" title="编辑">
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button variant="outline" size="icon" onClick={() => window.open(`/admin/exam-papers/${paper._id}/copy`, "_blank")} title="复制试卷" disabled={!paper.isLocked}>
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="icon" onClick={() => openDeleteDialog(paper._id)} className="text-red-500 hover:bg-red-500 hover:text-white" title="删除" disabled={paper.isLocked}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>) : <TableRow>
                    <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                      没有找到符合条件的试卷
                    </TableCell>
                  </TableRow>}
              </TableBody>
            </Table>
          </div>

          {/* 分页控件 */}
          {totalPages > 1 && <div className="flex justify-center mt-6">
              <CustomPagination currentPage={currentPage} totalPages={totalPages} onPageChange={onPageChange} pageParamName="exam_page" />
            </div>}
        </CardContent>
      </Card>

      {/* 删除确认对话框 */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={open => {
      if (!isDeleting) {
        setIsDeleteDialogOpen(open);
        if (!open) {
          setPaperToDelete(null);
        }
      }
    }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription>
              您确定要删除这份试卷吗？此操作不可撤销。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={closeDeleteDialog} disabled={isDeleting}>
              取消
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={isDeleting} className="text-white">
              {isDeleting ? <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  删除中...
                </> : "确认删除"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>;
}
