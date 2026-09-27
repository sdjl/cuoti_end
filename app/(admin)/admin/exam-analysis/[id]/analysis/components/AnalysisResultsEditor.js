"use client";

import { FileText, RefreshCw } from "lucide-react";
// 解析结果编辑器组件，用于编辑和管理试卷中每道题的答案、解析、知识点、难度和易错细节等信息
import React, { useCallback, useEffect, useRef, useState } from "react";
import { saveAnalysisResults } from "../actions.js";
import { Button } from "../../../../../../../components/ui/button.js";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../../../../../components/ui/card.js";
import { useToast } from "../../../../../../../hooks/use-toast.js";
import QuestionAnalysisEditor from "./QuestionAnalysisEditor.js";
export default function AnalysisResultsEditor({
  examId,
  allKnowledgePoints,
  analysisResults,
  setAnalysisResults,
  showAnalysisResults,
  onReAnalysis,
  showReAnalysisButton = false,
  onSave,
  onNextError
}) {
  const {
    toast
  } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const questionRefs = useRef([]);
  useEffect(() => {
    questionRefs.current = analysisResults.map((_, index) => {
      if (!questionRefs.current[index]) {
        return React.createRef();
      }
      return questionRefs.current[index];
    });
  }, [analysisResults]);
  const checkQuestionErrors = useCallback(question => {
    const errors = {
      missingAnswer: !question.answer || question.answer.length === 0 || question.answer.filter(item => item.trim()).length === 0,
      missingParse: !question.parse || question.parse.length === 0 || question.parse.filter(item => item.trim()).length === 0,
      missingKnowledgePoints: !question.knowledgePoints || question.knowledgePoints.length === 0,
      invalidKnowledgePoints: question.knowledgePoints?.some(point => !allKnowledgePoints.includes(point)) || false
    };
    return Object.values(errors).some(Boolean);
  }, [allKnowledgePoints]);
  const getErrorQuestionIndexes = useCallback(() => {
    return analysisResults.map((question, index) => ({
      question,
      index
    })).filter(({
      question
    }) => checkQuestionErrors(question)).map(({
      index
    }) => index);
  }, [analysisResults, checkQuestionErrors]);
  const scrollToQuestion = useCallback(index => {
    const questionRef = questionRefs.current[index];
    if (questionRef?.current) {
      try {
        // 方法1：使用scrollIntoView（更可靠）
        questionRef.current.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });
      } catch {
        // 备选方法：使用getBoundingClientRect
        try {
          const rect = questionRef.current.getBoundingClientRect();
          const currentScrollTop = window.pageYOffset || document.documentElement.scrollTop;
          const elementTop = rect.top + currentScrollTop;
          window.scrollTo({
            top: Math.max(0, elementTop),
            behavior: "smooth"
          });
        } catch (fallbackError) {
          console.error("Fallback scroll error:", fallbackError);
        }
      }

      // 添加高亮效果
      questionRef.current.style.boxShadow = "0 0 0 3px rgba(239, 68, 68, 0.3)";
      setTimeout(() => {
        if (questionRef.current) {
          questionRef.current.style.boxShadow = "";
        }
      }, 2000);
    }
  }, []);
  const saveResults = useCallback(async () => {
    try {
      setIsSaving(true);
      const saveData = analysisResults.map(question => ({
        pageNumber: question.pageNumber,
        questionNumber: question.questionNumber,
        answer: question.answer.filter(item => item.trim()).map(item => item.trim()),
        parse: question.parse.filter(item => item.trim()).map(item => item.trim()),
        knowledgePoints: question.knowledgePoints,
        difficulty: question.difficulty,
        easyToMistakeDetail: question.easyToMistakeDetail.filter(item => item.trim()).map(item => item.trim())
      }));
      const result = await saveAnalysisResults(examId, saveData);
      if (result.success) {
        toast({
          title: "保存成功",
          description: "解析结果已保存到数据库"
        });
      } else {
        toast({
          title: "保存失败",
          description: result.error || "保存失败",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("保存解析结果失败:", error);
      toast({
        title: "保存失败",
        description: error instanceof Error ? error.message : "保存失败",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  }, [examId, analysisResults, toast]);

  useEffect(() => {
    const errorIndexes = getErrorQuestionIndexes();
    if (onSave && typeof window !== "undefined") {
      window.__analysisEditorSave = saveResults;
    }
    if (onNextError && typeof window !== "undefined") {
      window.__analysisEditorNextError = () => {
        // 重新获取最新的错误索引
        const currentErrorIndexes = getErrorQuestionIndexes();
        if (currentErrorIndexes.length > 0) {
          const currentIndex = window.__currentErrorIndex || 0;
          const nextIndex = (currentIndex + 1) % currentErrorIndexes.length;
          const targetQuestionIndex = currentErrorIndexes[nextIndex];
          window.__currentErrorIndex = nextIndex;
          scrollToQuestion(targetQuestionIndex);
        }
      };
    }
    if (typeof window !== "undefined") {
      window.__analysisEditorErrorCount = errorIndexes.length;
      window.__analysisEditorIsSaving = isSaving;
    }
  }, [analysisResults, saveResults, onSave, onNextError, getErrorQuestionIndexes, scrollToQuestion, isSaving]);
  const updateQuestionAnswer = useCallback((index, value) => {
    const newResults = [...analysisResults];
    newResults[index].answer = value.split("\n");
    setAnalysisResults(newResults);
  }, [analysisResults, setAnalysisResults]);
  const updateQuestionParse = useCallback((index, value) => {
    const newResults = [...analysisResults];
    newResults[index].parse = value.split("\n");
    setAnalysisResults(newResults);
  }, [analysisResults, setAnalysisResults]);
  const updateQuestionDifficulty = useCallback((index, value) => {
    const newResults = [...analysisResults];
    newResults[index].difficulty = value;
    setAnalysisResults(newResults);
  }, [analysisResults, setAnalysisResults]);
  const updateQuestionEasyToMistakeDetail = useCallback((index, value) => {
    const newResults = [...analysisResults];
    newResults[index].easyToMistakeDetail = value.split("\n");
    setAnalysisResults(newResults);
  }, [analysisResults, setAnalysisResults]);
  const addKnowledgePoint = useCallback((questionIndex, point) => {
    const newResults = [...analysisResults];
    if (!newResults[questionIndex].knowledgePoints.includes(point)) {
      newResults[questionIndex].knowledgePoints.push(point);
      setAnalysisResults(newResults);
    }
  }, [analysisResults, setAnalysisResults]);
  const removeKnowledgePoint = useCallback((questionIndex, point) => {
    const newResults = [...analysisResults];
    newResults[questionIndex].knowledgePoints = newResults[questionIndex].knowledgePoints.filter(p => p !== point);
    setAnalysisResults(newResults);
  }, [analysisResults, setAnalysisResults]);
  if (!showAnalysisResults) {
    return null;
  }
  return <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              解析结果
            </CardTitle>
            <CardDescription>编辑每道题的答案、解析和知识点</CardDescription>
          </div>
          {showReAnalysisButton && onReAnalysis && <div className="flex gap-2">
              <Button variant="outline" onClick={onReAnalysis} disabled={isSaving}>
                <RefreshCw className="h-4 w-4 mr-2" />
                重新分析
              </Button>
            </div>}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {analysisResults.map((question, index) => <QuestionAnalysisEditor key={`${question.pageNumber}-${question.questionNumber}`} question={question} index={index} allKnowledgePoints={allKnowledgePoints} forwardRef={questionRefs.current[index]} onUpdateAnswer={value => updateQuestionAnswer(index, value)} onUpdateParse={value => updateQuestionParse(index, value)} onUpdateDifficulty={value => updateQuestionDifficulty(index, value)} onUpdateEasyToMistakeDetail={value => updateQuestionEasyToMistakeDetail(index, value)} onAddKnowledgePoint={point => addKnowledgePoint(index, point)} onRemoveKnowledgePoint={point => removeKnowledgePoint(index, point)} />)}
        </div>
      </CardContent>
    </Card>;
}
