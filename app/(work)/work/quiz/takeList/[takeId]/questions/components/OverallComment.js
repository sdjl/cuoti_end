"use client";

import { MessageCircle, Save, Sparkles, X } from "lucide-react";
// 整体评语组件，支持老师编辑整体评语和使用AI分析生成评语
import { useEffect, useState } from "react";
import { Button } from "../../../../../../../../components/ui/button.js";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../../../../../components/ui/card.js";
import { Textarea } from "../../../../../../../../components/ui/textarea.js";
import { useToast } from "../../../../../../../../hooks/use-toast.js";
import { DISPLAY_TEXT } from "../../../../../../../../lib/config/constants.js";
import { analyzeOverallCommentWithAIAction, updateQuizTakeOverallCommentAction } from "../actions.js";
export default function OverallComment({
  quizTake,
  onRefresh
}) {
  const {
    toast
  } = useToast();

  // 表单状态
  const [commentValue, setCommentValue] = useState(quizTake.teacherOverallComment || "");
  const [isSaving, setIsSaving] = useState(false);

  // AI分析相关状态
  const [isAIAnalyzing, setIsAIAnalyzing] = useState(false);
  const [hasAIResult, setHasAIResult] = useState(false);
  const [originalComment, setOriginalComment] = useState("");

  // 同步props变化
  useEffect(() => {
    setCommentValue(quizTake.teacherOverallComment || "");
  }, [quizTake.teacherOverallComment]);

  // 保存整体评语
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const result = await updateQuizTakeOverallCommentAction(quizTake._id, commentValue);
      if (result.success) {
        toast({
          title: "保存成功",
          description: "整体评语已保存"
        });
        onRefresh?.();
        setHasAIResult(false); // 保存后清除AI结果标记
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
      setOriginalComment(commentValue);

      // 2. 调用Server Action进行AI分析
      const result = await analyzeOverallCommentWithAIAction(quizTake._id);
      if (result.success) {
        // 3. 更新界面内容
        if (result.overallComment) {
          setCommentValue(result.overallComment);
        }

        // 4. 标记为AI结果
        setHasAIResult(true);
        toast({
          title: "AI分析完成",
          description: "已为您生成整体评语，请检查后保存"
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
    setCommentValue(originalComment);
    setHasAIResult(false);
    toast({
      title: "已取消AI结果",
      description: "内容已恢复到AI分析前的状态"
    });
  };
  return <Card className="bg-white">
      <CardHeader>
        <div className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-blue-600" />
          <CardTitle className="text-lg">
            {DISPLAY_TEXT.ORAL_KNOWLEDGE_QUIZ}整体评语
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 整体评语编辑区域 */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            老师整体评语
          </h4>
          <Textarea value={commentValue} onChange={e => setCommentValue(e.target.value)} placeholder={`请输入${DISPLAY_TEXT.ORAL_KNOWLEDGE_QUIZ}整体评语...`} className="text-sm bg-blue-50" rows={6} />
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
          <Button onClick={handleSave} disabled={isSaving || isAIAnalyzing} className="flex items-center gap-2">
            <Save className="h-4 w-4" />
            {isSaving ? "保存中..." : "保存"}
          </Button>
        </div>

        {/* 提示信息 */}
        <div className="text-xs text-gray-500 bg-yellow-50 p-3 rounded-lg border border-yellow-200">
          <p className="font-medium text-yellow-800 mb-1">💡 使用建议</p>
          <p>
            AI分析功能会根据每一题的老师评语，自动整理出整体评语。建议您先完成每一题的老师评语，再使用此AI分析功能。
          </p>
        </div>
      </CardContent>
    </Card>;
}
