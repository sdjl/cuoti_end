"use client";

import { Loader2 } from "lucide-react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
// 试卷题目列表页面，用于查看试卷中的所有题目
import { useEffect, useState } from "react";
import ExamPaperQuestions from "../../../../../../components/admin/exam-info/ExamPaperQuestions.js";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../../../components/ui/card.js";
import { useToast } from "../../../../../../hooks/use-toast.js";
import { getExamPaperById } from "../../../../../../lib/collection/examPaper.js";
export default function ExamPaperQuestionsPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const examId = params.id;

  // 从 URL 获取页码参数
  const questionPageParam = searchParams.get("question_page");
  const initialQuestionPage = questionPageParam ? parseInt(questionPageParam) : 1;
  const [currentQuestionPage, setCurrentQuestionPage] = useState(initialQuestionPage);

  // 获取 from_exam_page 参数，用于返回到试卷列表
  const fromExamPage = searchParams.get("from_exam_page") || undefined;
  const [examPaper, setExamPaper] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const {
    toast
  } = useToast();

  // 获取试卷数据
  useEffect(() => {
    if (!examId) return;
    const fetchExamPaper = async () => {
      setIsLoading(true);
      try {
        const paper = await getExamPaperById(examId);
        setExamPaper(paper);
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
    fetchExamPaper();
  }, [examId, toast]);

  // 处理页码变更
  const handleQuestionPageChange = page => {
    setCurrentQuestionPage(page);
    updateUrlParams(page);
  };

  // 更新 URL 参数
  const updateUrlParams = page => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("question_page", page.toString());

    // 保留 from_exam_page 参数
    if (fromExamPage && !params.has("from_exam_page")) {
      params.set("from_exam_page", fromExamPage);
    }
    router.replace(`/admin/exam-papers/${examId}/questions?${params.toString()}`);
  };

  // 格式化时间戳为日期字符串
  const formatTime = timestamp => {
    return new Date(timestamp).toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    });
  };
  return <div className="space-y-6">
      {isLoading ? <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">加载中...</span>
        </div> : !examPaper ? <div className="text-center py-12">
          <p className="text-muted-foreground">未找到试卷数据</p>
        </div> : <div className="flex flex-col space-y-6 w-full">
          <Card className="w-full">
            <CardHeader>
              <CardTitle>试卷信息</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    标题
                  </p>
                  <p className="text-lg">{examPaper.title}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    科目
                  </p>
                  <p className="text-lg">{examPaper.subject}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    页数
                  </p>
                  <p className="text-lg">{examPaper.pdfPageCount || "未知"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    上传时间
                  </p>
                  <p className="text-lg">{formatTime(examPaper.created)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 题目显示区 */}
          {examPaper.pages && examPaper.pages.length > 0 && <ExamPaperQuestions examPaper={examPaper} initialPage={currentQuestionPage} onPageChange={handleQuestionPageChange} fromExamPage={fromExamPage} />}
        </div>}
    </div>;
}
