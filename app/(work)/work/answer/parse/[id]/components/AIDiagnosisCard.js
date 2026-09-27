"use client";

// AI诊断卡片组件，负责在解析页呈现诊断结果并触发分析、保存相关操作
import { Brain, Edit2,
/**
 * AI诊断卡片组件
 * 显示AI对学生答卷的综合诊断结果，支持生成、编辑和删除诊断
 */
Loader2, MessageSquare, Save, Trash2, X } from "lucide-react";
import { useState } from "react";
import { Button } from "../../../../../../../components/ui/button.js";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../../../../components/ui/card.js";
import { Label } from "../../../../../../../components/ui/label.js";
import { Textarea } from "../../../../../../../components/ui/textarea.js";
import { useToast } from "../../../../../../../hooks/use-toast.js";
export default function AIDiagnosisCard({
  studentAnswer,
  isAnalyzingAll = false,
  isSavingAll = false,
  isUpdatingStatus = false,
  onAnalyzeAll,
  onSaveAll,
  onToggleAnalysisStatus,
  onAIDiagnosis,
  onDeleteAIDiagnosis,
  onUpdateAIDiagnosis
}) {
  const {
    toast
  } = useToast();
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showStepGuide, setShowStepGuide] = useState(false);

  // 编辑状态下的诊断内容
  const [editingDiagnosis, setEditingDiagnosis] = useState({
    overallPerformance: "",
    strength: "",
    improvement: ""
  });
  const handleAIDiagnosis = async () => {
    if (isDiagnosing) return;
    try {
      setIsDiagnosing(true);
      toast({
        title: "开始AI诊断",
        description: "正在生成综合诊断报告..."
      });
      const result = await onAIDiagnosis();
      if (result.success) {
        toast({
          title: "AI诊断完成",
          description: "已生成综合诊断报告"
        });
      } else {
        toast({
          variant: "destructive",
          title: "AI诊断失败",
          description: result.error || "诊断失败，请重试"
        });
      }
    } catch (error) {
      console.error("AI诊断失败:", error);
      toast({
        variant: "destructive",
        title: "AI诊断失败",
        description: "发生未知错误，请重试"
      });
    } finally {
      setIsDiagnosing(false);
    }
  };
  const handleDeleteAIDiagnosis = async () => {
    if (isDeleting) return;
    try {
      setIsDeleting(true);
      toast({
        title: "删除AI诊断",
        description: "正在删除诊断结果..."
      });
      const result = await onDeleteAIDiagnosis();
      if (result.success) {
        toast({
          title: "删除成功",
          description: "AI诊断结果已删除"
        });
      } else {
        toast({
          variant: "destructive",
          title: "删除失败",
          description: result.error || "删除失败，请重试"
        });
      }
    } catch (error) {
      console.error("删除AI诊断失败:", error);
      toast({
        variant: "destructive",
        title: "删除失败",
        description: "发生未知错误，请重试"
      });
    } finally {
      setIsDeleting(false);
    }
  };
  const handleEditStart = () => {
    if (!studentAnswer?.aiDiagnosis) return;
    setEditingDiagnosis({
      overallPerformance: studentAnswer.aiDiagnosis.overallPerformance,
      strength: studentAnswer.aiDiagnosis.strength,
      improvement: studentAnswer.aiDiagnosis.improvement
    });
    setIsEditing(true);
  };
  const handleEditCancel = () => {
    setIsEditing(false);
    setEditingDiagnosis({
      overallPerformance: "",
      strength: "",
      improvement: ""
    });
  };
  const handleEditSave = async () => {
    if (isSaving) return;
    try {
      setIsSaving(true);
      toast({
        title: "保存诊断",
        description: "正在保存修改..."
      });
      const result = await onUpdateAIDiagnosis(editingDiagnosis);
      if (result.success) {
        toast({
          title: "保存成功",
          description: "诊断结果已更新"
        });
        setIsEditing(false);
      } else {
        toast({
          variant: "destructive",
          title: "保存失败",
          description: result.error || "保存失败，请重试"
        });
      }
    } catch (error) {
      console.error("保存诊断失败:", error);
      toast({
        variant: "destructive",
        title: "保存失败",
        description: "发生未知错误，请重试"
      });
    } finally {
      setIsSaving(false);
    }
  };
  return <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>操作面板</span>
          <div className="flex items-center gap-2">
            {/* 没有AI诊断结果时显示操作步骤开关 */}
            {!studentAnswer?.aiDiagnosis && <div className="flex items-center gap-2 mr-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <span className="text-sm text-gray-600">操作指南</span>
                  <div className="relative">
                    <input type="checkbox" checked={showStepGuide} onChange={e => setShowStepGuide(e.target.checked)} className="sr-only" />
                    <div className={`w-11 h-6 rounded-full border-2 transition-colors duration-200 ${showStepGuide ? "bg-blue-500 border-blue-500" : "bg-gray-200 border-gray-300"}`}>
                      <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200 ${showStepGuide ? "translate-x-5" : "translate-x-1"} mt-0.5`} />
                    </div>
                  </div>
                </label>
              </div>}
            <Button onClick={onAnalyzeAll} variant="default" size="sm" disabled={isAnalyzingAll} className="bg-blue-600 hover:bg-blue-700">
              {isAnalyzingAll ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Brain className="w-4 h-4 mr-2" />}
              {isAnalyzingAll ? "分析中" : "分析所有错题"}
            </Button>
            <Button onClick={onSaveAll} variant="outline" size="sm" disabled={isSavingAll}>
              {isSavingAll ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              {isSavingAll ? "保存中" : "保存所有错题"}
            </Button>
            <Button onClick={handleAIDiagnosis} variant="outline" size="sm" disabled={isDiagnosing} className="bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100">
              {isDiagnosing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <MessageSquare className="w-4 h-4 mr-2" />}
              {isDiagnosing ? "诊断中" : "AI综合诊断"}
            </Button>
            {onToggleAnalysisStatus && <Button onClick={onToggleAnalysisStatus} variant="outline" size="sm" disabled={isUpdatingStatus} className={studentAnswer?.isAnalysisCompleted ? "border-green-500 text-green-700 bg-green-50" : "border-orange-500 text-orange-700 bg-orange-50"}>
                {isUpdatingStatus ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                {isUpdatingStatus ? "更新中" : studentAnswer?.isAnalysisCompleted ? "已完成分析" : "标记完成"}
              </Button>}
          </div>
        </CardTitle>
      </CardHeader>

      {/* 只有在有内容要显示时才显示 CardContent */}
      {(!studentAnswer?.aiDiagnosis && showStepGuide || studentAnswer?.aiDiagnosis) && <CardContent>
          {/* 操作步骤详细内容 */}
          {!studentAnswer?.aiDiagnosis && showStepGuide && <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="bg-blue-100/50 rounded-lg p-3 mb-3">
                <p className="text-sm font-medium text-blue-800 mb-2">
                  请按以下步骤操作：
                </p>
                <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                  <li>
                    首先点击&ldquo;分析所有错题&rdquo;，让AI分析每道错题的答案和错因
                  </li>
                  <li>
                    然后点击&ldquo;保存所有错题&rdquo;，保存分析结果到数据库
                  </li>
                  <li>
                    点击&ldquo;AI综合诊断&rdquo;，AI会基于所有错题的分析结果生成综合诊断报告
                  </li>
                  <li>
                    点击&ldquo;标记完成&rdquo;按钮，列表中的分析按钮会从蓝色变成白色，用于判断哪些答卷已经分析完成
                  </li>
                </ol>
              </div>
              <div className="flex items-center text-sm text-blue-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                重要提示：如果跳过前两步，AI综合诊断时将无法获取到错题的详细分析材料
              </div>
            </div>}

          {/* AI诊断结果显示 */}
          {studentAnswer?.aiDiagnosis && <div className="space-y-4">
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium text-purple-800 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    AI综合诊断结果
                  </h4>
                  <div className="flex items-center gap-2">
                    {!isEditing && <Button onClick={handleEditStart} variant="outline" size="sm" className="text-blue-600 border-blue-200 hover:bg-blue-50">
                        <Edit2 className="w-4 h-4 mr-2" />
                        编辑
                      </Button>}
                    <Button onClick={handleDeleteAIDiagnosis} variant="outline" size="sm" disabled={isDeleting} className="text-red-600 border-red-200 hover:bg-red-50">
                      {isDeleting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
                      {isDeleting ? "删除中" : "删除诊断"}
                    </Button>
                  </div>
                </div>

                {isEditing ?
          // 编辑模式
          <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="overallPerformance" className="text-sm font-medium text-gray-700">
                        总体表现：
                      </Label>
                      <Textarea id="overallPerformance" value={editingDiagnosis.overallPerformance} onChange={e => setEditingDiagnosis(prev => ({
                ...prev,
                overallPerformance: e.target.value
              }))} className="resize-none" rows={3} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="strength" className="text-sm font-medium text-gray-700">
                        优势保持：
                      </Label>
                      <Textarea id="strength" value={editingDiagnosis.strength} onChange={e => setEditingDiagnosis(prev => ({
                ...prev,
                strength: e.target.value
              }))} className="resize-none" rows={3} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="improvement" className="text-sm font-medium text-gray-700">
                        重点提升：
                      </Label>
                      <Textarea id="improvement" value={editingDiagnosis.improvement} onChange={e => setEditingDiagnosis(prev => ({
                ...prev,
                improvement: e.target.value
              }))} className="resize-none" rows={3} />
                    </div>
                    <div className="flex items-center gap-2 pt-2">
                      <Button onClick={handleEditSave} size="sm" disabled={isSaving} className="bg-blue-600 hover:bg-blue-700">
                        {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                        {isSaving ? "保存中" : "保存"}
                      </Button>
                      <Button onClick={handleEditCancel} variant="outline" size="sm" disabled={isSaving}>
                        <X className="w-4 h-4 mr-2" />
                        取消
                      </Button>
                    </div>
                  </div> :
          // 查看模式
          <div className="space-y-3 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">
                        总体表现：
                      </span>
                      <span className="text-gray-600 ml-2">
                        {studentAnswer.aiDiagnosis.overallPerformance}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">
                        优势保持：
                      </span>
                      <span className="text-gray-600 ml-2">
                        {studentAnswer.aiDiagnosis.strength}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">
                        重点提升：
                      </span>
                      <span className="text-gray-600 ml-2">
                        {studentAnswer.aiDiagnosis.improvement}
                      </span>
                    </div>
                  </div>}
              </div>
            </div>}
        </CardContent>}
    </Card>;
}
