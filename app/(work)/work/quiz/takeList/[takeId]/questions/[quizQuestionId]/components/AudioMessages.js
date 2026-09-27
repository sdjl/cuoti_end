"use client";

import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";
import { Edit, Eye, EyeOff, Mic, Save, Trash2, X } from "lucide-react";
// 语音消息组件，用于展示和管理学生的语音消息
import { useState } from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "../../../../../../../../../components/ui/alert-dialog.js";
import { Button } from "../../../../../../../../../components/ui/button.js";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../../../../../../components/ui/card.js";
import { Textarea } from "../../../../../../../../../components/ui/textarea.js";
import { useToast } from "../../../../../../../../../hooks/use-toast.js";
import { deleteQuizSessionMessageAction, updateQuizSessionMessageContentAction } from "../actions.js";
import AudioPlayer from "./AudioPlayer.js";
export default function AudioMessages({
  audioMessages,
  onMessageUpdate,
  onMessageDelete
}) {
  const {
    toast
  } = useToast();
  const [showAudioText, setShowAudioText] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editingContent, setEditingContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // 处理删除点击
  const handleDeleteClick = messageId => {
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
          description: "语音消息已删除"
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

  // 开始编辑文字
  const handleEditClick = (messageId, currentContent) => {
    setEditingMessageId(messageId);
    setEditingContent(currentContent || "");
  };

  // 取消编辑
  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditingContent("");
  };

  // 保存编辑
  const handleSaveEdit = async () => {
    if (!editingMessageId) return;
    setIsSaving(true);
    try {
      const result = await updateQuizSessionMessageContentAction(editingMessageId, editingContent);
      if (result.success) {
        toast({
          title: "更新成功",
          description: "语音文字内容已更新"
        });
        onMessageUpdate?.(editingMessageId, editingContent);
        setEditingMessageId(null);
        setEditingContent("");
      } else {
        toast({
          title: "更新失败",
          description: result.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("更新失败:", error);
      toast({
        title: "更新失败",
        description: "更新时发生错误，请重试",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };
  if (audioMessages.length === 0) {
    return null;
  }
  return <Card className="bg-white">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mic className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-lg">
              语音消息 ({audioMessages.length})
            </CardTitle>
          </div>
          <Button variant="outline" size="sm" onClick={() => setShowAudioText(!showAudioText)} className="flex items-center gap-1">
            {showAudioText ? <>
                <EyeOff className="h-3 w-3" />
                隐藏文字
              </> : <>
                <Eye className="h-3 w-3" />
                显示文字
              </>}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {audioMessages.map((message, idx) => <div key={message._id} className="space-y-2 p-3 border rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">
                语音 {idx + 1}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">
                  {formatDistanceToNow(new Date(message.created), {
                addSuffix: true,
                locale: zhCN
              })}
                </span>
                <Button variant="ghost" size="sm" onClick={() => handleDeleteClick(message._id)} className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50">
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>

            {message.audioFile && <AudioPlayer audioUrl={message.audioFile.fileUrl} duration={message.audioFile.duration} />}

            {showAudioText && message.content && <div className="mt-2">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs text-gray-500">语音转文字内容：</p>
                  {editingMessageId !== message._id && <Button variant="ghost" size="sm" onClick={() => handleEditClick(message._id, message.content || "")} className="h-6 w-6 p-0 text-blue-600 hover:text-blue-700">
                      <Edit className="h-3 w-3" />
                    </Button>}
                </div>

                {editingMessageId === message._id ? <div className="space-y-2">
                    <Textarea value={editingContent} onChange={e => setEditingContent(e.target.value)} className="text-sm" rows={3} />
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={handleCancelEdit} disabled={isSaving}>
                        <X className="h-3 w-3 mr-1" />
                        取消
                      </Button>
                      <Button variant="default" size="sm" onClick={handleSaveEdit} disabled={isSaving}>
                        <Save className="h-3 w-3 mr-1" />
                        {isSaving ? "保存中..." : "保存"}
                      </Button>
                    </div>
                  </div> : <p className="text-sm text-gray-600 whitespace-pre-wrap bg-gray-50 p-2 rounded">
                    {message.content}
                  </p>}
              </div>}
          </div>)}
      </CardContent>

      {/* 删除确认对话框 */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              此操作将删除该语音消息及其关联的音频文件，此操作无法撤销，确定要继续吗？
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
