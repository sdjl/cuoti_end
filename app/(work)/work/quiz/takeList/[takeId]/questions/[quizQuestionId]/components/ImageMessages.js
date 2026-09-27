"use client";

import { Image as ImageIcon, Trash2 } from "lucide-react";
// 图片消息组件，用于展示和管理学生上传的图片消息
import { useState } from "react";
import BaseImage from "../../../../../../../../../components/common/BaseImage.js";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "../../../../../../../../../components/ui/alert-dialog.js";
import { Button } from "../../../../../../../../../components/ui/button.js";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../../../../../../components/ui/card.js";
import { useToast } from "../../../../../../../../../hooks/use-toast.js";
import { deleteQuizSessionMessageAction } from "../actions.js";
export default function ImageMessages({
  imageMessages,
  onMessageDelete
}) {
  const {
    toast
  } = useToast();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // 处理图片点击
  const handleImageClick = imageUrl => {
    window.open(imageUrl, "_blank");
  };

  // 处理删除点击
  const handleDeleteClick = (messageId, event) => {
    event.stopPropagation(); // 阻止图片点击事件
    setMessageToDelete(messageId);
    setDeleteDialogOpen(true);
  };

  // 执行删除操作
  const handleConfirmDelete = async () => {
    if (!messageToDelete) return;
    setIsDeleting(true);
    try {
      const result = await deleteQuizSessionMessageAction(messageToDelete);
      if (result.success) {
        toast({
          title: "删除成功",
          description: "图片消息已删除"
        });
        onMessageDelete?.(messageToDelete);
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
      setMessageToDelete(null);
    }
  };
  if (imageMessages.length === 0) {
    return null;
  }
  return <Card className="bg-white">
      <CardHeader>
        <div className="flex items-center gap-2">
          <ImageIcon className="h-5 w-5 text-green-600" />
          <CardTitle className="text-lg">
            图片消息 ({imageMessages.length})
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {imageMessages.map((message, idx) => <div key={message._id} className="space-y-2">
              {message.imageFile && <div className="relative group">
                  <div className="relative cursor-pointer" onClick={() => handleImageClick(message.imageFile.fileUrl)}>
                    <BaseImage src={message.imageFile.fileUrl} alt={`学生上传图片 ${idx + 1}`} width={300} height={200} className="rounded-lg border max-w-full h-auto hover:opacity-90 transition-opacity" />
                  </div>
                  {/* hover时显示的删除按钮 */}
                  <Button variant="destructive" size="sm" onClick={e => handleDeleteClick(message._id, e)} className="absolute top-2 right-2 h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity bg-red-600 hover:bg-red-700 text-white">
                    <Trash2 className="h-3 w-3 text-white" />
                  </Button>
                </div>}
            </div>)}
        </div>
      </CardContent>

      {/* 删除确认对话框 */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              此操作将删除该图片消息及其关联的图片文件，此操作无法撤销，确定要继续吗？
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
    </Card>;
}
