"use client";

// 编辑班级课程使用状态及题包完成情况的弹窗组件
import { BookOpen, Package } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "../../../../../../../components/ui/button.js";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../../../../components/ui/card.js";
import { Checkbox } from "../../../../../../../components/ui/checkbox.js";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../../../../../../components/ui/dialog.js";
import { Label } from "../../../../../../../components/ui/label.js";
import { ScrollArea } from "../../../../../../../components/ui/scroll-area.js";
import { Switch } from "../../../../../../../components/ui/switch.js";
import { useToast } from "../../../../../../../hooks/use-toast.js";
import { getClassCourseStatusAction, updateClassCourseStatusAction } from "../actions.js";
export default function EditCourseStatusModal({
  isOpen,
  onClose,
  classId,
  courseId,
  courseName,
  onSuccess
}) {
  const {
    toast
  } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [completedQuestionPackIds, setCompletedQuestionPackIds] = useState([]);
  const [questionPacks, setQuestionPacks] = useState([]);

  // 加载课程状态数据
  const loadCourseStatus = async () => {
    if (!isOpen || !classId || !courseId) return;
    setLoading(true);
    try {
      const result = await getClassCourseStatusAction(classId, courseId);
      if (result.error) {
        toast({
          title: "加载失败",
          description: result.error,
          variant: "destructive"
        });
        return;
      }
      if (result.classCourse) {
        setIsCompleted(result.classCourse.isCompleted);
        setCompletedQuestionPackIds(result.classCourse.completedQuestionPackIds || []);
      }
      setQuestionPacks(result.questionPacks);
    } catch (error) {
      console.error("加载课程状态失败:", error);
      toast({
        title: "加载失败",
        description: "加载课程状态时发生错误",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // 当模态框打开时加载数据
  useEffect(() => {
    if (isOpen) {
      loadCourseStatus();
    } else {
      // 重置状态
      setIsCompleted(false);
      setCompletedQuestionPackIds([]);
      setQuestionPacks([]);
    }
  }, [isOpen, classId, courseId]);

  // 处理题集选择
  const handleQuestionPackToggle = questionPackId => {
    setCompletedQuestionPackIds(prev => prev.includes(questionPackId) ? prev.filter(id => id !== questionPackId) : [...prev, questionPackId]);
  };

  // 处理课程完成状态切换
  const handleCourseCompletedToggle = completed => {
    setIsCompleted(completed);
    if (completed) {
      // 如果标记课程为完成，则选中所有题集
      setCompletedQuestionPackIds(questionPacks.map(pack => pack._id));
    } else {
      // 如果取消课程完成，则清空已完成的题集
      setCompletedQuestionPackIds([]);
    }
  };

  // 保存更改
  const handleSave = async () => {
    setSaving(true);
    try {
      const result = await updateClassCourseStatusAction(classId, courseId, isCompleted, completedQuestionPackIds);
      if (result.success) {
        toast({
          title: "保存成功",
          description: "课程状态已更新"
        });
        onSuccess();
        onClose();
      } else {
        toast({
          title: "保存失败",
          description: result.error || "保存时发生错误",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("保存课程状态失败:", error);
      toast({
        title: "保存失败",
        description: "保存时发生错误",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };
  return <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            编辑课程完成状态
          </DialogTitle>
          <DialogDescription>课程：{courseName}</DialogDescription>
        </DialogHeader>

        {loading ? <div className="flex items-center justify-center py-8">
            <div className="text-gray-500">加载中...</div>
          </div> : <div className="space-y-6">
            {/* 课程完成状态 */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">课程完成状态</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  <Switch id="course-completed" checked={isCompleted} onCheckedChange={handleCourseCompletedToggle} />
                  <Label htmlFor="course-completed">
                    {isCompleted ? "课程已完成" : "课程未完成"}
                  </Label>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  {isCompleted ? "标记为已完成的课程将不会在答卷页面显示" : "未完成的课程会在答卷页面显示"}
                </p>
              </CardContent>
            </Card>

            {/* 题集完成状态 */}
            {!isCompleted && questionPacks.length > 0 && <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    题集完成状态 ({completedQuestionPackIds.length}/
                    {questionPacks.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-48">
                    <div className="space-y-3">
                      {questionPacks.map(pack => <div key={pack._id} className="flex items-start space-x-3 p-3 border rounded-lg">
                          <Checkbox id={`pack-${pack._id}`} checked={completedQuestionPackIds.includes(pack._id)} onCheckedChange={() => handleQuestionPackToggle(pack._id)} />
                          <div className="flex-1 min-w-0">
                            <Label htmlFor={`pack-${pack._id}`} className="text-sm font-medium cursor-pointer">
                              {pack.name}
                            </Label>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">
                                {pack.type}
                              </span>
                              <span className="text-xs text-gray-500">
                                {pack.subject}
                              </span>
                              <span className="text-xs text-gray-500">
                                {pack.questionIds?.length || 0} 题
                              </span>
                            </div>
                            {pack.description && <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                                {pack.description}
                              </p>}
                          </div>
                        </div>)}
                    </div>
                  </ScrollArea>
                  <p className="text-sm text-gray-500 mt-3">
                    已完成的题集将不会在答卷页面显示
                  </p>
                </CardContent>
              </Card>}

            {!isCompleted && questionPacks.length === 0 && <Card>
                <CardContent className="text-center py-6">
                  <Package className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                  <p className="text-gray-500">该课程暂无题集</p>
                </CardContent>
              </Card>}
          </div>}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            取消
          </Button>
          <Button onClick={handleSave} disabled={loading || saving}>
            {saving ? "保存中..." : "保存"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>;
}
