"use client";

import { Edit, Loader2, MessageSquare, Plus, Save, Trash2, X } from "lucide-react";
// 互动问题列表组件，用于显示、编辑、删除和手动添加题目的互动问题
import { useState } from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "../../../../../../components/ui/alert-dialog.js";
import { Button } from "../../../../../../components/ui/button.js";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../../../components/ui/card.js";
import { Label } from "../../../../../../components/ui/label.js";
import { Textarea } from "../../../../../../components/ui/textarea.js";
import { useToast } from "../../../../../../hooks/use-toast.js";
import { addInteraction, deleteInteraction } from "../actions.js";
export default function InteractionList({
  interactions,
  onRefresh,
  questionId
}) {
  const {
    toast
  } = useToast();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [interactionToDelete, setInteractionToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [editing, setEditing] = useState([]);
  const [editingValues, setEditingValues] = useState({});
  const [updating, setUpdating] = useState(null);

  // 手动添加问题的状态
  const [newQuestion, setNewQuestion] = useState({
    questionText: "",
    answer: ""
  });
  const [adding, setAdding] = useState(false);
  const handleDeleteClick = interactionId => {
    setInteractionToDelete(interactionId);
    setDeleteDialogOpen(true);
  };
  const handleDeleteConfirm = async () => {
    if (!interactionToDelete) return;
    setDeleting(true);
    try {
      const result = await deleteInteraction(interactionToDelete);
      if (result.success) {
        toast({
          title: "删除成功",
          description: result.message
        });
        onRefresh();
      } else {
        toast({
          title: "删除失败",
          description: result.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("删除互动问题失败:", error);
      toast({
        title: "删除失败",
        description: "发生未知错误",
        variant: "destructive"
      });
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
      setInteractionToDelete(null);
    }
  };

  // 开始编辑
  const handleEditStart = interaction => {
    setEditing(prev => [...prev, interaction._id]);
    setEditingValues(prev => ({
      ...prev,
      [interaction._id]: {
        questionText: interaction.questionText,
        answer: interaction.answer
      }
    }));
  };

  // 取消编辑
  const handleEditCancel = interactionId => {
    setEditing(prev => prev.filter(id => id !== interactionId));
    setEditingValues(prev => {
      const {
        [interactionId]: _,
        ...rest
      } = prev;
      return rest;
    });
  };

  // 保存编辑
  const handleEditSave = async interactionId => {
    const values = editingValues[interactionId];
    if (!values || !values.questionText.trim() || !values.answer.trim()) {
      toast({
        title: "保存失败",
        description: "问题和答案不能为空",
        variant: "destructive"
      });
      return;
    }
    setUpdating(interactionId);
    try {
      // 先删除旧的，再添加新的（简单的更新方式）
      await deleteInteraction(interactionId);
      await addInteraction(questionId, values.questionText.trim(), values.answer.trim());
      toast({
        title: "保存成功",
        description: "问题已更新"
      });
      handleEditCancel(interactionId);
      onRefresh();
    } catch (error) {
      console.error("保存互动问题失败:", error);
      toast({
        title: "保存失败",
        description: "发生未知错误",
        variant: "destructive"
      });
    } finally {
      setUpdating(null);
    }
  };

  // 更新编辑中的值
  const handleEditValueChange = (interactionId, field, value) => {
    setEditingValues(prev => ({
      ...prev,
      [interactionId]: {
        ...prev[interactionId],
        [field]: value
      }
    }));
  };

  // 手动添加新问题
  const handleAddNewQuestion = async () => {
    if (!newQuestion.questionText.trim() || !newQuestion.answer.trim()) {
      toast({
        title: "添加失败",
        description: "问题和答案不能为空",
        variant: "destructive"
      });
      return;
    }
    setAdding(true);
    try {
      const result = await addInteraction(questionId, newQuestion.questionText.trim(), newQuestion.answer.trim());
      if (result.success) {
        toast({
          title: "添加成功",
          description: result.message
        });
        setNewQuestion({
          questionText: "",
          answer: ""
        });
        onRefresh();
      } else {
        toast({
          title: "添加失败",
          description: result.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("添加互动问题失败:", error);
      toast({
        title: "添加失败",
        description: "发生未知错误",
        variant: "destructive"
      });
    } finally {
      setAdding(false);
    }
  };
  return <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            已有互动问题 ({interactions.length}个)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {interactions.length === 0 ? <div className="text-center py-8 text-muted-foreground">
              暂无互动问题，可以使用AI生成或手动添加
            </div> : <div className="space-y-4">
              {interactions.map((interaction, index) => {
            const isEditing = editing.includes(interaction._id);
            const editValues = editingValues[interaction._id];
            return <div key={interaction._id} className="border rounded-lg p-4 bg-card">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1 space-y-3">
                        <div>
                          <div className="text-sm font-medium text-muted-foreground mb-1">
                            问题 {index + 1}
                          </div>
                          {isEditing ? <Textarea value={editValues?.questionText || ""} onChange={e => handleEditValueChange(interaction._id, "questionText", e.target.value)} className="text-sm font-medium" rows={2} /> : <div className="text-sm font-medium text-blue-900 bg-blue-50 p-2 rounded">
                              {interaction.questionText}
                            </div>}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-muted-foreground mb-1">
                            参考答案
                          </div>
                          {isEditing ? <Textarea value={editValues?.answer || ""} onChange={e => handleEditValueChange(interaction._id, "answer", e.target.value)} className="text-sm" rows={2} /> : <div className="text-sm text-green-900 bg-green-50 p-2 rounded">
                              {interaction.answer}
                            </div>}
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        {isEditing ? <>
                            <Button variant="outline" size="sm" onClick={() => handleEditSave(interaction._id)} disabled={updating === interaction._id} className="text-green-600 hover:text-green-600">
                              {updating === interaction._id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleEditCancel(interaction._id)} disabled={updating === interaction._id} className="text-gray-600 hover:text-gray-600">
                              <X className="h-4 w-4" />
                            </Button>
                          </> : <>
                            <Button variant="outline" size="sm" onClick={() => handleEditStart(interaction)} disabled={deleting || !!updating} className="text-blue-600 hover:text-blue-600">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm" className="text-destructive hover:text-white hover:bg-destructive" onClick={() => handleDeleteClick(interaction._id)} disabled={deleting || !!updating}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>}
                      </div>
                    </div>
                  </div>;
          })}
            </div>}

          {/* 手动添加新问题区域 */}
          <div className="mt-6 pt-6 border-t">
            <div className="flex items-center gap-2 mb-4">
              <Plus className="h-5 w-5 text-primary" />
              <h3 className="text-sm font-medium">手动添加问题</h3>
            </div>
            <div className="space-y-4">
              <div>
                <Label className="text-xs font-medium text-blue-600">
                  问题
                </Label>
                <Textarea value={newQuestion.questionText} onChange={e => setNewQuestion(prev => ({
                ...prev,
                questionText: e.target.value
              }))} placeholder="请输入问题内容..." className="mt-1" rows={2} />
              </div>
              <div>
                <Label className="text-xs font-medium text-green-600">
                  答案
                </Label>
                <Textarea value={newQuestion.answer} onChange={e => setNewQuestion(prev => ({
                ...prev,
                answer: e.target.value
              }))} placeholder="请输入答案内容..." className="mt-1" rows={2} />
              </div>
              <div className="flex justify-end">
                <Button onClick={handleAddNewQuestion} disabled={adding} size="sm">
                  {adding ? <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      添加中...
                    </> : <>
                      <Plus className="h-4 w-4 mr-2" />
                      添加问题
                    </>}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 删除确认对话框 */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              您确定要删除这个互动问题吗？此操作不可撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} disabled={deleting} className="bg-destructive text-white hover:bg-destructive/90">
              {deleting ? <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  删除中...
                </> : "确认删除"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>;
}
