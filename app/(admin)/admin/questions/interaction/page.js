"use client";

import { ArrowLeft, Info, Loader2 } from "lucide-react";
import { useSearchParams } from "next/navigation";
// 题目互动问题管理页面，用于为题目配置AI互动考察问题，包括AI生成和手动添加
import { useCallback, useEffect, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "../../../../../components/ui/alert.js";
import { Button } from "../../../../../components/ui/button.js";
import { useToast } from "../../../../../hooks/use-toast.js";
import { DISPLAY_TEXT } from "../../../../../lib/config/constants.js";
import { getQuestionByParams, getQuestionInteractions } from "./actions.js";
import AIGenerateForm from "./components/AIGenerateForm.js";
import InteractionList from "./components/InteractionList.js";
import QuestionDisplay from "./components/QuestionDisplay.js";
export default function QuestionInteractionPage() {
  const searchParams = useSearchParams();
  const {
    toast
  } = useToast();

  // 获取URL参数
  const examId = searchParams.get("examId");
  const pageNumber = searchParams.get("pageNumber");
  const questionNumber = searchParams.get("questionNumber");
  const [question, setQuestion] = useState(null);
  const [interactions, setInteractions] = useState([]);
  const [loading, setLoading] = useState(true);

  // 加载题目和互动问题数据
  const loadData = useCallback(async () => {
    if (!examId || !pageNumber || !questionNumber) {
      toast({
        title: "参数错误",
        description: "缺少必要的参数",
        variant: "destructive"
      });
      setLoading(false);
      return;
    }
    try {
      setLoading(true);

      // 并行加载题目信息和互动问题
      const [questionResult, interactionsResult] = await Promise.all([getQuestionByParams(examId, parseInt(pageNumber), parseInt(questionNumber)), getQuestionInteractions(examId, parseInt(pageNumber), parseInt(questionNumber))]);
      if (questionResult.success && questionResult.data) {
        setQuestion(questionResult.data);
      } else {
        toast({
          title: "加载失败",
          description: questionResult.message || "无法加载题目信息",
          variant: "destructive"
        });
      }
      if (interactionsResult.success && interactionsResult.data) {
        setInteractions(interactionsResult.data);
      }
    } catch (error) {
      console.error("加载数据失败:", error);
      toast({
        title: "加载失败",
        description: "发生未知错误",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [examId, pageNumber, questionNumber, toast]);

  useEffect(() => {
    loadData();
  }, [examId, pageNumber, questionNumber, loadData]);

  // 刷新互动问题列表
  const refreshInteractions = async () => {
    if (!examId || !pageNumber || !questionNumber) return;
    try {
      const result = await getQuestionInteractions(examId, parseInt(pageNumber), parseInt(questionNumber));
      if (result.success && result.data) {
        setInteractions(result.data);
      }
    } catch (error) {
      console.error("刷新互动问题失败:", error);
    }
  };
  if (loading) {
    return <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">加载中...</span>
      </div>;
  }
  if (!question) {
    return <div className="text-center py-12">
        <p className="text-muted-foreground">未找到题目信息</p>
        <Button variant="outline" className="mt-4" onClick={() => window.history.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          返回
        </Button>
      </div>;
  }
  return <div className="space-y-6">
      {/* 题目显示 */}
      <QuestionDisplay question={question} />

      {/* 已有的互动问题 */}
      <InteractionList interactions={interactions} onRefresh={refreshInteractions} questionId={question._id} />

      {/* AI生成新问题 */}
      <AIGenerateForm question={question} onSuccess={refreshInteractions} />

      {/* AI互动考察说明 */}
      <Alert className="border-blue-200 bg-blue-50">
        <Info className="h-4 w-4 text-blue-600" />
        <AlertTitle className="text-blue-800">AI互动考察功能说明</AlertTitle>
        <AlertDescription className="text-blue-700">
          <div className="space-y-2 mt-2">
            <p>
              • <strong>题库完善</strong>
              ：此功能用于提前为题目生成AI互动考察问题，完善题库内容
            </p>
            <p>
              • <strong>{DISPLAY_TEXT.COURSE_MISTAKE}复用</strong>
              ：学生在进行{DISPLAY_TEXT.COURSE_MISTAKE}
              时，AI会优先使用这些预设的考察问题与学生互动，提高互动质量
            </p>
            <p>
              • <strong>教师质量把控</strong>
              ：预设问题经过教师筛选和审核，相比AI临时生成的问题，具有更高的教学针对性和准确性
            </p>
            <p>
              • <strong>智能降级</strong>
              ：如果题目暂未配置互动问题，AI仍可基于题目内容自动生成问题，确保功能的连续性
            </p>
          </div>
        </AlertDescription>
      </Alert>
    </div>;
}
