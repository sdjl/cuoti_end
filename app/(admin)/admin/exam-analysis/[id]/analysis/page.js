"use client";

import { AlertTriangle, Loader2, Save } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
// 试卷分析页面，提供站内解析和站外解析两种方式，用于对试卷进行AI分析并编辑解析结果
import { useCallback, useEffect, useState } from "react";
import AnalysisResultsEditor from "./components/AnalysisResultsEditor.js";
import ExternalAnalysis from "./components/ExternalAnalysis.js";
import InternalAnalysis from "./components/InternalAnalysis.js";
import { Button } from "../../../../../../components/ui/button.js";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../../../../components/ui/tabs.js";
import { useToast } from "../../../../../../hooks/use-toast.js";
import { getSubjectKnowledgePoints } from "../../../../../../lib/config/knowledgeTree.js";
import { getExamPaperForAnalysis } from "./actions.js";
export default function ExamAnalysisPage() {
  const params = useParams();
  const router = useRouter();
  const {
    toast
  } = useToast();
  const examId = params.id;
  const [examPaper, setExamPaper] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [analysisResults, setAnalysisResults] = useState([]);
  const [showAnalysisResults, setShowAnalysisResults] = useState(false);
  const [allKnowledgePoints, setAllKnowledgePoints] = useState([]);
  const [activeTab, setActiveTab] = useState("internal");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [shouldResetAnalysis, setShouldResetAnalysis] = useState(false);

  // 错误检测相关状态
  const [errorCount, setErrorCount] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  // 检测题目错误的函数
  const checkQuestionErrors = useCallback(question => {
    const errors = {
      missingAnswer: !question.answer || question.answer.length === 0,
      missingParse: !question.parse || question.parse.length === 0 || question.parse.length === 1 && !question.parse[0].trim(),
      missingKnowledgePoints: !question.knowledgePoints || question.knowledgePoints.length === 0,
      invalidKnowledgePoints: question.knowledgePoints?.some(point => !allKnowledgePoints.includes(point)) || false
    };
    return Object.values(errors).some(Boolean);
  }, [allKnowledgePoints]);

  // 更新错误数量
  useEffect(() => {
    if (showAnalysisResults) {
      const errorQuestions = analysisResults.filter(checkQuestionErrors);
      setErrorCount(errorQuestions.length);
    }
  }, [analysisResults, checkQuestionErrors, showAnalysisResults]);

  // 保存分析结果
  const handleSave = useCallback(async () => {
    if (typeof window !== "undefined" && window.__analysisEditorSave) {
      setIsSaving(true);
      try {
        await window.__analysisEditorSave();
      } finally {
        setIsSaving(false);
      }
    }
  }, []);

  // 跳转到下一个错误
  const handleNextError = useCallback(() => {
    if (typeof window !== "undefined" && window.__analysisEditorNextError) {
      window.__analysisEditorNextError();
    }
  }, []);

  // 监听window对象的变化
  useEffect(() => {
    const interval = setInterval(() => {
      if (typeof window !== "undefined") {
        if (window.__analysisEditorErrorCount !== undefined) {
          setErrorCount(window.__analysisEditorErrorCount);
        }
        if (window.__analysisEditorIsSaving !== undefined) {
          setIsSaving(window.__analysisEditorIsSaving);
        }
      }
    }, 100);
    return () => clearInterval(interval);
  }, []);

  // 加载试卷数据
  useEffect(() => {
    const loadExamPaper = async () => {
      if (!examId) return;
      try {
        setIsLoading(true);
        const data = await getExamPaperForAnalysis(examId);
        if (!data) {
          toast({
            title: "错误",
            description: "试卷不存在或已被删除",
            variant: "destructive"
          });
          router.push("/admin/exam-analysis");
          return;
        }
        setExamPaper(data);

        // 加载知识点数据
        const knowledgePoints = await getSubjectKnowledgePoints(data.subject, false);
        setAllKnowledgePoints(knowledgePoints);

        // 初始化解析结果数据
        const results = [];
        let globalQuestionNumber = 1;
        for (const page of data.pages) {
          for (const question of page.questions) {
            if (question.questionText) {
              results.push({
                pageNumber: page.pageNumber,
                questionNumber: globalQuestionNumber,
                questionText: question.questionText,
                questionType: question.questionType,
                answer: question.answer || [],
                parse: question.parse || [],
                knowledgePoints: question.knowledgePoints || [],
                difficulty: question.difficulty || "未知",
                easyToMistakeDetail: question.easyToMistakeDetail || [],
                // 添加坐标信息
                leftTop: question.leftTop,
                rightBottom: question.rightBottom
              });
              globalQuestionNumber++;
            }
          }
        }
        setAnalysisResults(results);

        // 默认隐藏解析结果区域，需要用户分析成功后才显示
        setShowAnalysisResults(false);
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
    loadExamPaper();
  }, [examId, toast, router]);

  // 重新分析处理函数
  const handleReAnalysis = useCallback(() => {
    setShowAnalysisResults(false);
    setIsAnalyzing(false);
    setShouldResetAnalysis(true);
    // 清空所有题目的解析数据
    const newResults = analysisResults.map(result => ({
      ...result,
      answer: [],
      parse: [],
      knowledgePoints: [],
      difficulty: "未知",
      easyToMistakeDetail: []
    }));
    setAnalysisResults(newResults);
  }, [analysisResults]);

  // 重置分析状态的回调
  const handleAnalysisReset = useCallback(() => {
    setShouldResetAnalysis(false);
  }, []);
  if (isLoading) {
    return <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">加载中...</div>
      </div>;
  }
  if (!examPaper) {
    return <div className="text-center py-12">
        <p className="text-muted-foreground">未找到试卷数据</p>
      </div>;
  }
  return <div className="space-y-6">
      {/* 页面Header区域 - 显示保存按钮和错误检测按钮 */}
      {showAnalysisResults && !isAnalyzing && <div className="sticky top-0 z-40 bg-gradient-to-r from-slate-50 to-slate-100 border border-slate-200 shadow-lg rounded-lg py-4 px-6 backdrop-blur-sm bg-opacity-95">
          <div className="flex items-center justify-between max-w-screen-2xl mx-auto">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-slate-800">
                试卷解析编辑
              </h2>
              {errorCount > 0 && <span className="text-sm text-red-600 bg-red-50 px-2 py-1 rounded border border-red-200">
                  {errorCount} 个题目存在缺失内容
                </span>}
            </div>
            <div className="flex items-center gap-2">
              {/* 下一错误按钮 */}
              <Button variant={errorCount > 0 ? "destructive" : "outline"} onClick={handleNextError} disabled={errorCount === 0} size="sm" className={errorCount > 0 ? "text-white bg-red-600 hover:bg-red-700" : ""}>
                {errorCount > 0 ? <>
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    下一错误 ({errorCount})
                  </> : <>
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    无错误
                  </>}
              </Button>

              {/* 保存按钮 */}
              <Button onClick={handleSave} disabled={isSaving || errorCount > 0} size="sm">
                {isSaving ? <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    保存中...
                  </> : <>
                    <Save className="h-4 w-4 mr-2" />
                    保存结果
                  </>}
              </Button>
            </div>
          </div>
        </div>}

      {/* Tab切换 */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="internal">站内解析</TabsTrigger>
          <TabsTrigger value="external">站外解析</TabsTrigger>
        </TabsList>

        <TabsContent value="internal" className="mt-6">
          <InternalAnalysis examId={examId} examPaper={examPaper} analysisResults={analysisResults} setAnalysisResults={setAnalysisResults} setShowAnalysisResults={setShowAnalysisResults} setIsAnalyzing={setIsAnalyzing} shouldResetAnalysis={shouldResetAnalysis} handleAnalysisReset={handleAnalysisReset} />
        </TabsContent>

        <TabsContent value="external" className="mt-6">
          <ExternalAnalysis examId={examId} analysisResults={analysisResults} setAnalysisResults={setAnalysisResults} setShowAnalysisResults={setShowAnalysisResults} />
        </TabsContent>
      </Tabs>

      {/* 共享的解析结果编辑器 - 在分析中时隐藏 */}
      {!isAnalyzing && <AnalysisResultsEditor examId={examId} allKnowledgePoints={allKnowledgePoints} analysisResults={analysisResults} setAnalysisResults={setAnalysisResults} showAnalysisResults={showAnalysisResults} onReAnalysis={handleReAnalysis} showReAnalysisButton={activeTab === "internal"} onSave={handleSave} onNextError={handleNextError} />}
    </div>;
}
