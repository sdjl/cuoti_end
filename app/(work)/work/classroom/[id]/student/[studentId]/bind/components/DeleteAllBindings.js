"use client";

// 删除所有绑定关系组件，用于批量删除学生的所有绑定关系
import { AlertTriangle } from "lucide-react";
import { useState } from "react";
import { Button } from "../../../../../../../../../components/ui/button.js";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../../../../../../../../components/ui/dialog.js";
import { Input } from "../../../../../../../../../components/ui/input.js";
import { Label } from "../../../../../../../../../components/ui/label.js";
import { useToast } from "../../../../../../../../../hooks/use-toast.js";
import { deleteAllStudentBindingsAction } from "../actions.js";
export default function DeleteAllBindings({
  student,
  classRoomId
}) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [inputStudentName, setInputStudentName] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const {
    toast
  } = useToast();
  const handleDeleteClick = () => {
    setIsDialogOpen(true);
    setInputStudentName("");
  };
  const handleConfirmDelete = async () => {
    if (!inputStudentName.trim()) {
      toast({
        title: "验证失败",
        description: "请输入学生姓名",
        variant: "destructive"
      });
      return;
    }
    if (inputStudentName.trim() !== student.name) {
      toast({
        title: "验证失败",
        description: "输入的学生姓名不正确",
        variant: "destructive"
      });
      return;
    }
    setIsDeleting(true);
    try {
      const {
        success,
        deletedCount,
        error
      } = await deleteAllStudentBindingsAction(classRoomId, student._id, inputStudentName.trim());
      if (!success) {
        toast({
          title: "删除失败",
          description: error || "删除绑定关系失败",
          variant: "destructive"
        });
        return;
      }
      toast({
        title: "删除成功",
        description: `已删除 ${deletedCount || 0} 条绑定关系`
      });
      setIsDialogOpen(false);
      setInputStudentName("");
    } catch (error) {
      console.error("删除绑定关系失败:", error);
      toast({
        title: "删除失败",
        description: "删除绑定关系时发生错误",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
    }
  };
  const handleCancel = () => {
    setIsDialogOpen(false);
    setInputStudentName("");
  };
  return <>
      <div className="bg-white rounded-lg border p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-red-500" />
          解除绑定关系
        </h3>
        <div className="space-y-4">
          <Button variant="destructive" onClick={handleDeleteClick} className="w-full text-white">
            删除此学生的所有已绑定关系
          </Button>
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              确认删除所有绑定关系
            </DialogTitle>
            <DialogDescription>
              ⚠️ 此操作不可恢复，请谨慎操作！删除后，所有已经绑定「
              {student.name}
              」的用户（包括学生本人、学生家长等）将无法继续查看和操作此学生的相关数据，需要重新扫码绑定。为确认此操作，请在下方输入学生的完整姓名。
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="student-name">
                学生姓名（请输入：{student.name}）
              </Label>
              <Input id="student-name" value={inputStudentName} onChange={e => setInputStudentName(e.target.value)} placeholder={`请输入"${student.name}"确认删除`} disabled={isDeleting} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancel} disabled={isDeleting}>
              取消
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete} disabled={isDeleting || inputStudentName.trim() !== student.name} className="text-white">
              {isDeleting ? "删除中..." : "确认删除"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>;
}
