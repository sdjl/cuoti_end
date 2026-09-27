"use client";

import { MessageCircle, Save, Sparkles, X } from "lucide-react";
// AI分析与老师评语组件，用于展示和编辑AI分析结果及老师评语
import { useEffect, useState } from "react";
import { Button } from "../../../../../../../../../components/ui/button.js";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../../../../../../components/ui/card.js";
import { Label } from "../../../../../../../../../components/ui/label.js";
import { RadioGroup, RadioGroupItem } from "../../../../../../../../../components/ui/radio-group.js";
import { Textarea } from "../../../../../../../../../components/ui/textarea.js";
import { useToast } from "../../../../../../../../../hooks/use-toast.js";
import { analyzeQuestionWithAIAction, updateQuizQuestionFieldsAction } from "../actions.js";
export default function AnalysisAndComments({
  quizQuestion,
  onRefresh
}) {
  const {
    toast
  } = useToast();

  // 表单状态
  const [aiJudgmentValue, setAIJudgmentValue] = useState(quizQuestion.aiJudgment || "none");
  const [aiAnalysisValue, setAIAnalysisValue] = useState(quizQuestion.aiAnalysis || "");
  const [teacherCommentValue, setTeacherCommentValue] = useState(quizQuestion.teacherComment || "");
  const [isSaving, setIsSaving] = useState(false);

  // AI分析相关状态
  const [isAIAnalyzing, setIsAIAnalyzing] = useState(false);
  const [hasAIResult, setHasAIResult] = useState(false);
  const [originalAIAnalysis, setOriginalAIAnalysis] = useState("");
  const [originalTeacherComment, setOriginalTeacherComment] = useState("");

  // 同步props变化
  useEffect(() => {
    setAIJudgmentValue(quizQuestion.aiJudgment || "none");
    setAIAnalysisValue(quizQuestion.aiAnalysis || "");
    setTeacherCommentValue(quizQuestion.teacherComment || "");
  }, [quizQuestion]);

  // 保存所有修改
  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      const updates = {
        aiJudgment: aiJudgmentValue === "none" ? undefined : aiJudgmentValue,
        aiAnalysis: aiAnalysisValue,
        teacherComment: teacherCommentValue
      };
      const result = await updateQuizQuestionFieldsAction(quizQuestion._id, updates);
      if (result.success) {
        toast({
          title: "保存成功",
          description: "所有内容已保存"
        });
        onRefresh?.();
      } else {
        toast({
          title: "保存失败",
          description: result.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("保存失败:", error);
      toast({
        title: "保存失败",
        description: "保存时发生错误，请重试",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  // AI分析功能
  const handleAIAnalysis = async () => {
    if (isAIAnalyzing) return;
    setIsAIAnalyzing(true);
    try {
      // 1. 备份原始内容
      setOriginalAIAnalysis(aiAnalysisValue);
      setOriginalTeacherComment(teacherCommentValue);

      // 2. 调用Server Action进行AI分析
      const result = await analyzeQuestionWithAIAction(quizQuestion._id);
      if (result.success) {
        // 3. 更新界面内容
        if (result.aiAnalysis) {
          setAIAnalysisValue(result.aiAnalysis);
        }
        if (result.teacherComment) {
          setTeacherCommentValue(result.teacherComment);
        }

        // 4. 标记为AI结果
        setHasAIResult(true);
        toast({
          title: "AI分析完成",
          description: "已为您生成分析内容，请检查后保存"
        });
      } else {
        toast({
          title: "AI分析失败",
          description: result.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("AI分析失败:", error);
      toast({
        title: "AI分析失败",
        description: error instanceof Error ? error.message : "分析过程中发生错误",
        variant: "destructive"
      });
    } finally {
      setIsAIAnalyzing(false);
    }
  };

  // 取消AI结果
  const handleCancelAIResult = () => {
    setAIAnalysisValue(originalAIAnalysis);
    setTeacherCommentValue(originalTeacherComment);
    setHasAIResult(false);
    toast({
      title: "已取消AI结果",
      description: "内容已恢复到AI分析前的状态"
    });
  };
  return <Card className="bg-white">
      <CardHeader>
        <div className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-purple-600" />
          <CardTitle className="text-lg">AI分析与老师评语</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* AI判定结果 */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-gray-700">AI判定结果</h4>
            <p className="text-xs text-gray-500">
              注：AI分析不会修改此判定结果
            </p>
          </div>
          <RadioGroup value={aiJudgmentValue} onValueChange={setAIJudgmentValue} className="flex flex-row gap-6">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="none" id="none" />
              <Label htmlFor="none" className="text-sm">
                未设置
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="passed" id="passed" />
              <Label htmlFor="passed" className="text-sm text-green-600">
                通过
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="failed" id="failed" />
              <Label htmlFor="failed" className="text-sm text-red-600">
                未通过
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* AI分析详情 */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">AI分析详情</h4>
          <Textarea value={aiAnalysisValue} onChange={e => setAIAnalysisValue(e.target.value)} placeholder="请输入AI分析详情..." className="text-sm bg-gray-50" rows={4} />
        </div>

        {/* 老师评语 */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            老师单题评语
          </h4>
          <Textarea value={teacherCommentValue} onChange={e => setTeacherCommentValue(e.target.value)} placeholder="请输入老师评语..." className="text-sm bg-blue-50" rows={4} />
        </div>

        {/* 按钮区域 */}
        <div className="flex justify-between items-center">
          {/* 左侧按钮 */}
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleAIAnalysis} disabled={isAIAnalyzing || isSaving} className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              {isAIAnalyzing ? "AI分析中..." : "AI分析"}
            </Button>

            {hasAIResult && <Button variant="outline" onClick={handleCancelAIResult} disabled={isAIAnalyzing || isSaving} className="flex items-center gap-2 text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 border-red-200">
                <X className="h-4 w-4" />
                取消AI结果
              </Button>}
          </div>

          {/* 右侧保存按钮 */}
          <Button onClick={handleSaveAll} disabled={isSaving || isAIAnalyzing} className="flex items-center gap-2">
            <Save className="h-4 w-4" />
            {isSaving ? "保存中..." : "保存"}
          </Button>
        </div>
      </CardContent>
    </Card>;
}
