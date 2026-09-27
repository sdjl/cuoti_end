"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
// 试卷切题详情页面，用于查看试卷信息、启动切题任务和查看切题结果
import { useCallback, useEffect, useRef, useState } from "react";
import ExamPaperQuestions from "../../../../../components/admin/exam-info/ExamPaperQuestions.js";
import { useToast } from "../../../../../hooks/use-toast.js";
import { getExamPaperById } from "../../../../../lib/collection/examPaper.js";
import { checkCuttingStatus, getCuttingServiceInfo, startAsyncCutting } from "./actions.js";
import CuttingFailureDisplay from "./components/CuttingFailureDisplay.js";
import CuttingOperationCard from "./components/CuttingOperationCard.js";
import CuttingSuccessAlert from "./components/CuttingSuccessAlert.js";
import ExamInfoCard from "./components/ExamInfoCard.js";
export default function ExamCuttingDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const examId = params.id;

  // 从 URL 获取页码参数
  const questionPageParam = searchParams.get("question_page");
  const initialQuestionPage = questionPageParam ? parseInt(questionPageParam) : 1;
  const [currentQuestionPage, setCurrentQuestionPage] = useState(initialQuestionPage);
  const [examPaper, setExamPaper] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCutting, setIsCutting] = useState(false);
  const [cuttingServiceInfo, setCuttingServiceInfo] = useState(null);
  const {
    toast
  } = useToast();

  // 用于轮询状态的计数
  const pollCountRef = useRef(0);
  const pollIntervalRef = useRef(null);
  const maxPollAttempts = 1000; // 最大轮询次数

  // 轮询检查切题状态
  const startPolling = useCallback(() => {
    // 重置轮询计数
    pollCountRef.current = 0;

    // 清除已有的轮询
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }

    // 设置新的轮询
    pollIntervalRef.current = setInterval(async () => {
      try {
        // 增加轮询计数
        pollCountRef.current += 1;

        // 检查是否达到最大轮询次数
        if (pollCountRef.current >= maxPollAttempts) {
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
          }

          // 显示轮询超时错误
          toast({
            title: "警告",
            description: "切题操作超时，但可能仍在后台继续。请稍后刷新页面查看结果。",
            variant: "destructive"
          });
          setIsCutting(false);
          return;
        }

        // 检查切题状态
        const statusResult = await checkCuttingStatus(examId);

        // 如果切题已完成（无论成功或失败），则刷新试卷数据并停止轮询
        if (statusResult.isCompleted) {
          // 刷新试卷数据
          const paper = await getExamPaperById(examId);
          setExamPaper(paper);

          // 更新切题状态
          setIsCutting(false);

          // 停止轮询
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
          }

          // 如果状态是失败，显示错误消息
          if (statusResult.status === "failed") {
            toast({
              title: "切题失败",
              description: statusResult.error || "切题过程中发生未知错误",
              variant: "destructive"
            });
          } else if (statusResult.status === "done") {
            toast({
              title: "切题成功",
              description: "试卷切题已完成",
              variant: "default"
            });
          }
        }
      } catch (error) {
        console.error("轮询状态检查失败:", error);
      }
    }, 5000); // 每5秒轮询一次
  }, [examId, toast]);

  // 获取试卷数据
  useEffect(() => {
    if (!examId) return;
    const fetchExamPaper = async () => {
      setIsLoading(true);
      try {
        const [paper, serviceInfo] = await Promise.all([getExamPaperById(examId), getCuttingServiceInfo()]);
        setExamPaper(paper);
        setCuttingServiceInfo(serviceInfo);

        // 如果获取到试卷数据，并且试卷已经完成切题，则停止切题状态
        if (paper) {
          if (paper.cuttingStatus === "done") {
            setIsCutting(false);
            // 如果正在轮询，则停止轮询
            if (pollIntervalRef.current) {
              clearInterval(pollIntervalRef.current);
              pollIntervalRef.current = null;
            }
          } else if (["cutting", "cropping", "pdf_splitting"].includes(paper.cuttingStatus)) {
            // 如果试卷正在切题中，则设置切题状态
            setIsCutting(true);
            // 如果没有在轮询，则开始轮询
            if (!pollIntervalRef.current) {
              startPolling();
            }
          }
        }
      } catch (error) {
        console.error("获取试卷数据失败:", error);
        toast({
          title: "错误",
          description: "获取试卷数据失败",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    // 立即执行一次获取数据
    fetchExamPaper();

    // 清理函数
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [examId, toast, startPolling]);

  // 处理页码变更
  const handleQuestionPageChange = page => {
    setCurrentQuestionPage(page);
    updateUrlParams(page);
  };

  // 更新 URL 参数
  const updateUrlParams = page => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("question_page", page.toString());
    router.replace(`/admin/exam-cutting/${examId}?${params.toString()}`);
  };

  // 处理开始切题
  const handleStartCutting = async () => {
    if (!examPaper || isCutting) return;
    try {
      setIsCutting(true);

      // 调用服务器操作开始异步切题
      const success = await startAsyncCutting(examId);
      if (!success) {
        toast({
          title: "错误",
          description: "启动切题任务失败",
          variant: "destructive"
        });
        setIsCutting(false);
        return;
      }

      // 启动轮询检查状态
      startPolling();
      toast({
        title: "已启动切题",
        description: "切题任务已在后台启动，请稍等片刻"
      });
    } catch (error) {
      console.error("开始切题失败:", error);
      toast({
        title: "错误",
        description: `开始切题失败: ${error instanceof Error ? error.message : String(error)}`,
        variant: "destructive"
      });
      setIsCutting(false);
    }
  };

  // 判断是否有识别结果
  const hasRecognizedQuestions = examPaper?.pages?.some(page => page.questions?.length > 0);
  return <div className="space-y-6">
      {!examPaper ? <div className="text-center py-12">
          <p className="text-muted-foreground">未找到试卷数据</p>
        </div> : <div className="flex flex-col space-y-6 w-full">
          {/* 试卷信息 */}
          <ExamInfoCard examPaper={examPaper} cuttingServiceInfo={cuttingServiceInfo} />

          {/* 操作按钮 */}
          <CuttingOperationCard examPaper={examPaper} isCutting={isCutting} isLoading={isLoading} onStartCutting={handleStartCutting} />

          {/* 切题成功提示 */}
          <CuttingSuccessAlert examPaper={examPaper} />

          {/* 切题失败时显示API返回数据 */}
          <CuttingFailureDisplay examPaper={examPaper} cuttingServiceInfo={cuttingServiceInfo} />

          {/* 识别结果显示区 */}
          {hasRecognizedQuestions && <ExamPaperQuestions examPaper={examPaper} initialPage={currentQuestionPage} onPageChange={handleQuestionPageChange} />}
        </div>}
    </div>;
}
