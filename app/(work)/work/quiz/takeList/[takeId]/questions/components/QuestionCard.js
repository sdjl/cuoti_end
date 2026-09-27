"use client";

import { formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";
import { CheckCircle, Clock, ExternalLink, Eye, Image as ImageIcon, MessageCircle, Mic, Trash2, XCircle } from "lucide-react";
// 题目卡片组件，展示单个题目的信息、答题状态、AI判定结果和老师评语
import { useState } from "react";
import BaseImage from "../../../../../../../../components/common/BaseImage.js";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "../../../../../../../../components/ui/alert-dialog.js";
import { Badge } from "../../../../../../../../components/ui/badge.js";
import { Button } from "../../../../../../../../components/ui/button.js";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../../../../../components/ui/card.js";
import { Separator } from "../../../../../../../../components/ui/separator.js";
import { useToast } from "../../../../../../../../hooks/use-toast.js";
import { deleteQuizQuestionAction } from "../[quizQuestionId]/actions.js";
export default function QuestionCard({
  question,
  index,
  takeId,
  onDelete
}) {
  const {
    toast
  } = useToast();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  // 获取AI判定结果显示
  const getAIJudgmentBadge = judgment => {
    if (!judgment) return null;
    const config = {
      passed: {
        color: "bg-green-100 text-green-800",
        text: "AI判定通过"
      },
      failed: {
        color: "bg-red-100 text-red-800",
        text: "AI判定未通过"
      }
    };
    const badgeConfig = config[judgment];
    return <Badge variant="outline" className={`text-xs ${badgeConfig.color}`}>
        {badgeConfig.text}
      </Badge>;
  };

  // 获取正确性显示
  const getCorrectnessBadge = isCorrect => {
    if (isCorrect === undefined) {
      return <div className="flex items-center gap-1 text-gray-500">
          <Clock className="h-4 w-4" />
          <span className="text-xs">未提交</span>
        </div>;
    }
    return isCorrect ? <div className="flex items-center gap-1 text-green-600">
        <CheckCircle className="h-4 w-4" />
        <span className="text-xs">答案正确</span>
      </div> : <div className="flex items-center gap-1 text-red-600">
        <XCircle className="h-4 w-4" />
        <span className="text-xs">答案错误</span>
      </div>;
  };

  // 处理图片点击
  const handleImageClick = () => {
    if (question.examQuestion?.imageUrl) {
      window.open(question.examQuestion.imageUrl, "_blank");
    }
  };

  // 处理删除点击
  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
  };

  // 执行删除操作
  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteQuizQuestionAction(question._id);
      if (result.success) {
        toast({
          title: "删除成功",
          description: "题目记录及所有相关数据已删除"
        });
        onDelete?.(); // 调用父组件的刷新回调
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
    }
  };
  return <Card className="bg-white shadow-sm hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium">
            第 {index + 1} 题
          </CardTitle>
          <div className="flex items-center gap-2">
            {getCorrectnessBadge(question.isCorrect)}
            {getAIJudgmentBadge(question.aiJudgment)}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* 题目图片 */}
        {question.examQuestion?.imageUrl && <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700">题目图片</h4>
            <div className="relative cursor-pointer" onClick={handleImageClick}>
              <BaseImage src={question.examQuestion.imageUrl} alt={`第 ${index + 1} 题`} width={question.examQuestion.imageWidth || 600} height={question.examQuestion.imageHeight || 400} className="rounded-lg border max-w-full h-auto hover:opacity-90 transition-opacity" />
              <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white p-1 rounded">
                <ExternalLink className="h-4 w-4" />
              </div>
            </div>
          </div>}

        {/* 题目信息 */}
        {question.examQuestion && <div className="space-y-3">
            {/* 答案 */}
            {question.examQuestion.answer && question.examQuestion.answer.length > 0 && <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-1">
                    参考答案
                  </h4>
                  <div className="space-y-1">
                    {question.examQuestion.answer.map((ans, idx) => <p key={idx} className="text-sm text-gray-600 whitespace-pre-wrap">
                        {ans}
                      </p>)}
                  </div>
                </div>}

            {/* 解析 */}
            {question.examQuestion.parse && question.examQuestion.parse.length > 0 && <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-1">
                    解析
                  </h4>
                  <div className="space-y-1">
                    {question.examQuestion.parse.map((p, idx) => <p key={idx} className="text-sm text-gray-600 whitespace-pre-wrap">
                        {p}
                      </p>)}
                  </div>
                </div>}
          </div>}

        <Separator />

        {/* 学生答题信息 */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-700">学生答题信息</h4>
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>
                  创建：
                  {formatDistanceToNow(new Date(question.created), {
                  addSuffix: true,
                  locale: zhCN
                })}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>
                  更新：
                  {formatDistanceToNow(new Date(question.updated), {
                  addSuffix: true,
                  locale: zhCN
                })}
                </span>
              </div>
            </div>
          </div>

          {/* 语音和图片统计 */}
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <Mic className="h-4 w-4" />
              <span>{question.audioCount} 条语音</span>
            </div>
            <div className="flex items-center gap-1">
              <ImageIcon className="h-4 w-4" />
              <span>{question.imageCount} 张图片</span>
            </div>
          </div>

          {/* 选择的答案 */}
          {question.selectedOptions && question.selectedOptions.length > 0 && <div>
              <p className="text-xs text-gray-500 mb-1">选择的答案</p>
              <div className="flex flex-wrap gap-1">
                {question.selectedOptions.map((option, idx) => <Badge key={idx} variant="outline" className="text-xs">
                    {option}
                  </Badge>)}
              </div>
            </div>}

          {/* AI判定结果 */}
          <div>
            <p className="text-xs text-gray-500 mb-1">AI判定结果</p>
            <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
              {question.aiJudgment ? question.aiJudgment === "passed" ? "通过" : "未通过" : "-"}
            </p>
          </div>

          {/* AI分析详情 */}
          <div>
            <p className="text-xs text-gray-500 mb-1">AI分析详情</p>
            <p className="text-sm text-gray-600 whitespace-pre-wrap bg-gray-50 p-2 rounded">
              {question.aiAnalysis || "-"}
            </p>
          </div>

          {/* 老师单题评语 */}
          <div>
            <div className="flex items-center gap-1 mb-1">
              <MessageCircle className="h-3 w-3 text-blue-600" />
              <p className="text-xs text-gray-500">老师单题评语</p>
            </div>
            <p className="text-sm text-gray-600 whitespace-pre-wrap bg-blue-50 p-2 rounded">
              {question.teacherComment || "-"}
            </p>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex justify-between pt-2">
          <Button variant="outline" size="sm" onClick={() => window.open(`/work/quiz/takeList/${takeId}/questions/${question._id}`, "_blank")} className="flex items-center gap-1">
            <Eye className="h-3 w-3" />
            查看详情
          </Button>

          <Button variant="outline" size="sm" onClick={handleDeleteClick} className="flex items-center gap-1 text-red-600 hover:text-red-700 hover:bg-red-50">
            <Trash2 className="h-3 w-3" />
            删除
          </Button>
        </div>
      </CardContent>

      {/* 删除确认对话框 */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              此操作将删除该题目记录及所有相关数据，包括：
              <br />• 学生的答题会话记录
              <br />• 所有会话消息和文件
              <br />• 上传的音频和图片文件
              <br />
              <br />
              此操作无法撤销，确定要继续吗？
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
