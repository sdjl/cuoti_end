"use client";

// 运行控制页面，提供试卷管理和当前校园管理的操作功能，包括解除试卷锁定和删除当前校园
import { useState } from "react";
import { Button } from "../../../../../components/ui/button.js";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../../../../../components/ui/dialog.js";
import { useToast } from "../../../../../hooks/use-toast.js";
import { deleteCurrentSchool, unlockAllExamPapers } from "./actions.js";
export default function RunControlPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleteSchoolLoading, setIsDeleteSchoolLoading] = useState(false);
  const {
    toast
  } = useToast();
  const handleUnlockAllExamPapers = async () => {
    setIsLoading(true);
    try {
      const result = await unlockAllExamPapers();
      if (result.success) {
        toast({
          title: "操作成功",
          description: result.message
        });
      } else {
        toast({
          title: "操作失败",
          description: result.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "操作失败",
        description: `执行失败: ${error instanceof Error ? error.message : "未知错误"}`,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
      setIsDialogOpen(false);
    }
  };
  const handleDeleteCurrentSchool = async () => {
    setIsDeleteSchoolLoading(true);
    try {
      const result = await deleteCurrentSchool();
      if (result.success) {
        toast({
          title: "操作成功",
          description: result.message
        });
      } else {
        toast({
          title: "操作失败",
          description: result.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "操作失败",
        description: `删除失败: ${error instanceof Error ? error.message : "未知错误"}`,
        variant: "destructive"
      });
    } finally {
      setIsDeleteSchoolLoading(false);
    }
  };
  return <div className="container mx-auto">
      <div className="space-y-6">
        <div className="space-y-4">
          <div className="p-6 border border-border rounded-lg bg-card">
            <h2 className="text-xl font-semibold mb-4">试卷管理</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium mb-2">解除试卷锁定</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  此操作将删除所有题目数据（exam_question集合），并解除所有试卷的锁定状态。
                  <br />
                  <span className="text-destructive font-medium">
                    警告：此操作不可逆，请谨慎操作！
                  </span>
                </p>

                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="destructive" className="text-white">
                      解除所有试卷的锁定
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>确认操作</DialogTitle>
                      <DialogDescription className="py-2">
                        您确定要删除 exam_question 集合的所有数据并把 exam_paper
                        集合的所有数据的 isLocked 为 false 吗？
                        <span className="text-destructive font-medium inline-block mt-2">
                          此操作不可逆，请确认后再继续！
                        </span>
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isLoading}>
                        取消
                      </Button>
                      <Button variant="destructive" onClick={handleUnlockAllExamPapers} disabled={isLoading} className="text-white">
                        {isLoading ? "执行中..." : "确认执行"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>

          <div className="p-6 border border-border rounded-lg bg-card">
            <h2 className="text-xl font-semibold mb-4">当前校园管理</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium mb-2">删除当前校园</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  此操作将删除JWT中的当前校园设置和数据库中用户的当前校园数据。
                  <br />
                  <span className="text-destructive font-medium">
                    注意：删除后需要重新选择校园才能正常使用相关功能。
                  </span>
                </p>

                <Button variant="destructive" onClick={handleDeleteCurrentSchool} disabled={isDeleteSchoolLoading} className="text-white">
                  {isDeleteSchoolLoading ? "删除中..." : "删除当前校园"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>;
}
