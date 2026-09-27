"use client";

import { Check, Copy, Edit, Loader2, PlusCircle, Trash2, X } from "lucide-react";
// 视频列表组件，用于显示视频列表并提供编辑、删除和复制视频ID等操作
import { useState } from "react";
import { CustomPagination } from "../../../../../../components/common/Pagination.js";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "../../../../../../components/ui/alert-dialog.js";
import { Badge } from "../../../../../../components/ui/badge.js";
import { Button } from "../../../../../../components/ui/button.js";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../../../../components/ui/card.js";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../../../../components/ui/table.js";
import { useToast } from "../../../../../../hooks/use-toast.js";
import { deleteVideo } from "../actions.js";
export default function VideoList({
  videos,
  isLoading = false,
  totalCount,
  totalPages,
  currentPage,
  onPageChange,
  onEdit,
  onDelete,
  onCreateVideo
}) {
  const {
    toast
  } = useToast();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [videoToDelete, setVideoToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // 复制到剪贴板
  const copyToClipboard = async (text, type) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "复制成功",
        description: `${type}已复制到剪贴板`
      });
    } catch (error) {
      console.error("复制失败:", error);
      toast({
        title: "复制失败",
        description: "无法访问剪贴板",
        variant: "destructive"
      });
    }
  };

  // 格式化日期
  const formatDate = timestamp => {
    return new Date(timestamp).toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    });
  };

  // 处理删除
  const handleDeleteClick = video => {
    setVideoToDelete(video);
    setDeleteDialogOpen(true);
  };
  const handleDeleteConfirm = async () => {
    if (!videoToDelete) return;
    setIsDeleting(true);
    try {
      const result = await deleteVideo(videoToDelete._id);
      if (result.success) {
        toast({
          title: "删除成功",
          description: result.message
        });
        onDelete(videoToDelete._id);
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
        description: `客户端错误: ${error instanceof Error ? error.message : String(error)}`,
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setVideoToDelete(null);
    }
  };
  return <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <CardTitle>视频列表</CardTitle>
            <CardDescription>
              <div className="flex items-center gap-2">
                <span>当前共有 {totalCount} 个视频</span>
                <Button onClick={onCreateVideo}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  新建视频
                </Button>
              </div>
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>视频标题</TableHead>
                  <TableHead>分类</TableHead>
                  <TableHead>创建时间</TableHead>
                  <TableHead>是否有视频ID</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? <TableRow>
                    <TableCell colSpan={5} className="text-center py-10">
                      <div className="flex justify-center items-center">
                        <Loader2 className="h-6 w-6 animate-spin mr-2" />
                        <span>加载中...</span>
                      </div>
                    </TableCell>
                  </TableRow> : videos.length > 0 ? videos.map(video => <TableRow key={video._id}>
                      <TableCell className="font-medium">
                        <button onClick={() => copyToClipboard(video.title, "视频标题")} className="text-left hover:text-primary transition-colors cursor-pointer" title="点击复制标题">
                          {video.title}
                        </button>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
                          {video.category}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(video.created)}</TableCell>
                      <TableCell>
                        {video.videoId ? <Check className="h-4 w-4 text-green-600" /> : <X className="h-4 w-4 text-red-600" />}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {/* 复制视频ID按钮 */}
                          {video.videoId && <Button variant="outline" size="icon" onClick={() => copyToClipboard(video.videoId, "视频ID")} title="复制视频ID">
                              <Copy className="h-4 w-4" />
                            </Button>}

                          {/* 编辑按钮 */}
                          <Button variant="outline" size="icon" onClick={() => onEdit(video)} title="编辑视频">
                            <Edit className="h-4 w-4" />
                          </Button>

                          {/* 删除按钮 */}
                          <Button variant="outline" size="icon" onClick={() => handleDeleteClick(video)} title="删除视频" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>) : <TableRow>
                    <TableCell colSpan={5} className="text-center py-10">
                      <div className="text-muted-foreground">暂无视频数据</div>
                    </TableCell>
                  </TableRow>}
              </TableBody>
            </Table>
          </div>

          {/* 分页组件 */}
          {totalPages > 1 && <div className="mt-4">
              <CustomPagination currentPage={currentPage} totalPages={totalPages} onPageChange={onPageChange} />
            </div>}
        </CardContent>
      </Card>

      {/* 删除确认对话框 */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              您确定要删除视频 &ldquo;{videoToDelete?.title}&rdquo;
              吗？此操作不可撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} disabled={isDeleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              <span className="text-white">
                {isDeleting ? "删除中..." : "确认删除"}
              </span>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>;
}
