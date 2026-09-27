// 错误归因列表组件，用于显示错误归因列表并提供编辑和删除操作

import { Loader2, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { CustomPagination } from "../../../../../components/common/Pagination.js";
import { Button } from "../../../../../components/ui/button.js";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../../../components/ui/card.js";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../../../../components/ui/dialog.js";
import { Input } from "../../../../../components/ui/input.js";
import { Label } from "../../../../../components/ui/label.js";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../../../components/ui/table.js";
import { useToast } from "../../../../../hooks/use-toast.js";
import { DISPLAY_TEXT } from "../../../../../lib/config/constants.js";
export default function MistakeList({
  mistakePoints,
  isLoading,
  totalCount,
  totalPages,
  currentPage,
  onPageChange,
  onEditMistakePoint,
  onDeleteMistakePoint
}) {
  const {
    toast
  } = useToast();
  const [pointToDelete, setPointToDelete] = useState(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editingPoint, setEditingPoint] = useState(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  // 打开删除对话框
  const openDeleteDialog = pointId => {
    setPointToDelete(pointId);
    setIsDeleteDialogOpen(true);
  };

  // 关闭删除对话框
  const closeDeleteDialog = () => {
    setIsDeleteDialogOpen(false);
    setPointToDelete(null);
  };

  // 确认删除
  const confirmDelete = async () => {
    if (pointToDelete) {
      try {
        setIsDeleting(true);
        const success = await onDeleteMistakePoint(pointToDelete);
        if (success) {
          toast({
            title: "成功",
            description: `${DISPLAY_TEXT.ERROR_ATTRIBUTION}删除成功`
          });
        } else {
          toast({
            title: "失败",
            description: `${DISPLAY_TEXT.ERROR_ATTRIBUTION}删除失败`,
            variant: "destructive"
          });
        }
      } catch (error) {
        console.error(`删除${DISPLAY_TEXT.ERROR_ATTRIBUTION}时发生错误:`, error);
        toast({
          title: "错误",
          description: `删除${DISPLAY_TEXT.ERROR_ATTRIBUTION}时发生错误`,
          variant: "destructive"
        });
      } finally {
        setIsDeleting(false);
        closeDeleteDialog();
      }
    }
  };

  // 打开编辑对话框
  const openEditDialog = point => {
    setEditingPoint(point);
    setEditName(point.name);
    setEditDescription(point.description);
    setIsEditDialogOpen(true);
  };

  // 关闭编辑对话框
  const closeEditDialog = () => {
    setIsEditDialogOpen(false);
    setEditingPoint(null);
    setEditName("");
    setEditDescription("");
  };

  // 确认编辑
  const confirmEdit = async () => {
    if (!editingPoint) return;
    if (!editName.trim()) {
      toast({
        title: "错误",
        description: `${DISPLAY_TEXT.ERROR_ATTRIBUTION}名称不能为空`,
        variant: "destructive"
      });
      return;
    }
    setIsEditing(true);
    try {
      const success = await onEditMistakePoint(editingPoint._id, editName.trim(), editDescription.trim());
      if (success) {
        toast({
          title: "成功",
          description: `${DISPLAY_TEXT.ERROR_ATTRIBUTION}编辑成功`
        });
        closeEditDialog();
      } else {
        toast({
          title: "失败",
          description: `${DISPLAY_TEXT.ERROR_ATTRIBUTION}编辑失败`,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error(`编辑${DISPLAY_TEXT.ERROR_ATTRIBUTION}时发生错误:`, error);
      toast({
        title: "错误",
        description: `编辑${DISPLAY_TEXT.ERROR_ATTRIBUTION}时发生错误`,
        variant: "destructive"
      });
    } finally {
      setIsEditing(false);
    }
  };
  return <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <CardTitle>{DISPLAY_TEXT.ERROR_ATTRIBUTION}列表</CardTitle>
            <CardDescription>
              <span>
                当前共有 {totalCount} 个{DISPLAY_TEXT.ERROR_ATTRIBUTION}
              </span>
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{DISPLAY_TEXT.ERROR_ATTRIBUTION}名称</TableHead>
                  <TableHead>描述</TableHead>
                  <TableHead className="text-center">错误次数</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? <TableRow>
                    <TableCell colSpan={4} className="text-center py-10">
                      <div className="flex justify-center items-center">
                        <Loader2 className="h-6 w-6 animate-spin mr-2" />
                        <span>加载中...</span>
                      </div>
                    </TableCell>
                  </TableRow> : mistakePoints.length > 0 ? mistakePoints.map(point => <TableRow key={point._id}>
                      <TableCell className="font-medium">
                        {point.name}
                      </TableCell>
                      <TableCell className="max-w-md">
                        <div className="truncate" title={point.description}>
                          {point.description || "暂无描述"}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${point.errorCount > 0 ? "bg-red-100 text-red-800" : "bg-gray-100 text-gray-800"}`}>
                          {point.errorCount}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="icon" onClick={() => openEditDialog(point)} title="编辑">
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="icon" onClick={() => openDeleteDialog(point._id)} title="删除" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>) : <TableRow>
                    <TableCell colSpan={4} className="text-center py-10">
                      <span className="text-muted-foreground">暂无数据</span>
                    </TableCell>
                  </TableRow>}
              </TableBody>
            </Table>
          </div>

          {/* 分页器 */}
          {totalPages > 1 && <div className="mt-6">
              <CustomPagination currentPage={currentPage} totalPages={totalPages} onPageChange={onPageChange} />
            </div>}
        </CardContent>
      </Card>

      {/* 删除确认对话框 */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription>
              您确定要删除这个{DISPLAY_TEXT.ERROR_ATTRIBUTION}
              吗？删除后将同时删除与该{DISPLAY_TEXT.ERROR_ATTRIBUTION}
              相关的所有关联数据，此操作不可撤销。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={closeDeleteDialog} disabled={isDeleting}>
              取消
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={isDeleting} className="text-white">
              {isDeleting ? <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  删除中...
                </> : "确认删除"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 编辑对话框 */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑{DISPLAY_TEXT.ERROR_ATTRIBUTION}</DialogTitle>
            <DialogDescription>
              修改{DISPLAY_TEXT.ERROR_ATTRIBUTION}的名称和描述信息。
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">
                {DISPLAY_TEXT.ERROR_ATTRIBUTION}名称
              </Label>
              <Input id="edit-name" value={editName} onChange={e => setEditName(e.target.value)} placeholder={`请输入${DISPLAY_TEXT.ERROR_ATTRIBUTION}名称`} onKeyDown={e => {
              if (e.key === "Enter") {
                e.preventDefault();
                confirmEdit();
              }
            }} />
            </div>
            <div>
              <Label htmlFor="edit-description">
                {DISPLAY_TEXT.ERROR_ATTRIBUTION}描述（可选）
              </Label>
              <Input id="edit-description" value={editDescription} onChange={e => setEditDescription(e.target.value)} placeholder={`请输入${DISPLAY_TEXT.ERROR_ATTRIBUTION}描述（可选）`} onKeyDown={e => {
              if (e.key === "Enter") {
                e.preventDefault();
                confirmEdit();
              }
            }} />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" disabled={isEditing}>
                取消
              </Button>
            </DialogClose>
            <Button onClick={confirmEdit} disabled={isEditing}>
              {isEditing ? <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  保存中...
                </> : "保存"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>;
}
