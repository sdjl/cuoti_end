"use client";

import { Loader2 } from "lucide-react";
// AI配置管理页面，用于配置AI解析返回格式、Bot ID和各类提示词模板
import { useCallback, useEffect, useState } from "react";
import { Button } from "../../../../../components/ui/button.js";
import { useToast } from "../../../../../hooks/use-toast.js";
import { DISPLAY_TEXT } from "../../../../../lib/config/constants.js";
import { getAllAIConfig, getMistakePracticeTemplateDefault, getOverallCommentTemplateDefault, getPersonalMistakeTemplateDefault, getQuestionAnalysisTemplateDefault, updateAllAIConfig } from "./actions.js";
import { AIConfigFormatCard } from "./components/AIConfigFormatCard.js";
import { BotConfigCard } from "./components/BotConfigCard.js";
import { PromptTemplateCard } from "./components/PromptTemplateCard.js";
export default function AIConfigPage() {
  const [config, setConfig] = useState({
    aiResponseFormatRequirement: "",
    aiAnalysisAgentBotId: "",
    testDiagnosisAgentBotId: "",
    termMultiTestDiagnosisAgentBotId: "",
    questionInteractionAgentBotId: "",
    questionAnalysisPromptTemplate: "",
    overallCommentPromptTemplate: "",
    mistakePracticePromptTemplate: "",
    personalMistakePromptTemplate: ""
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const {
    toast
  } = useToast();
  const loadConfig = useCallback(async () => {
    try {
      setLoading(true);
      const result = await getAllAIConfig();
      if (result.success && result.data) {
        setConfig(result.data);
      } else {
        toast({
          variant: "destructive",
          title: "加载失败",
          description: result.message || "无法加载AI配置"
        });
      }
    } catch {
      toast({
        variant: "destructive",
        title: "加载失败",
        description: "发生未知错误"
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // 页面加载时获取配置
  useEffect(() => {
    loadConfig();
  }, [loadConfig]);
  const handleSave = useCallback(async () => {
    try {
      setSaving(true);
      const result = await updateAllAIConfig(config);
      if (result.success) {
        toast({
          title: "保存成功",
          description: "AI配置已全部更新"
        });
      } else {
        toast({
          variant: "destructive",
          title: "保存失败",
          description: result.message
        });
      }
    } catch {
      toast({
        variant: "destructive",
        title: "保存失败",
        description: "发生未知错误"
      });
    } finally {
      setSaving(false);
    }
  }, [config, toast]);
  const updateConfigField = useCallback((field, value) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);
  const handleResetTemplate = useCallback(async (templateType, fieldName) => {
    const templateNames = {
      question: "单题AI分析提示词模板",
      overall: "整体评语AI分析提示词模板",
      mistakePractice: `${DISPLAY_TEXT.COURSE_MISTAKE}AI分析提示词模板`,
      personalMistake: `${DISPLAY_TEXT.SELF_UPLOAD_MISTAKE}AI分析提示词模板`
    };
    const confirmed = window.confirm(`确定要重置"${templateNames[templateType]}"为默认值吗？此操作将覆盖当前内容。`);
    if (!confirmed) return;
    try {
      setResetting(true);
      let defaultValue = "";
      switch (templateType) {
        case "question":
          defaultValue = await getQuestionAnalysisTemplateDefault();
          break;
        case "overall":
          defaultValue = await getOverallCommentTemplateDefault();
          break;
        case "mistakePractice":
          defaultValue = await getMistakePracticeTemplateDefault();
          break;
        case "personalMistake":
          defaultValue = await getPersonalMistakeTemplateDefault();
          break;
      }

      // 直接更新表单状态，不保存到数据库
      updateConfigField(fieldName, defaultValue);
      toast({
        title: "重置成功",
        description: `已重置"${templateNames[templateType]}"为默认值，请点击保存配置以保存更改`
      });
    } catch {
      toast({
        variant: "destructive",
        title: "重置失败",
        description: "获取默认模板失败"
      });
    } finally {
      setResetting(false);
    }
  }, [toast, updateConfigField]);

  // 复制参数到剪贴板
  const copyParameterToClipboard = useCallback(async parameter => {
    try {
      await navigator.clipboard.writeText(parameter);
      toast({
        title: "复制成功",
        description: `已复制参数 ${parameter} 到剪贴板`
      });
    } catch {
      toast({
        variant: "destructive",
        title: "复制失败",
        description: "无法访问剪贴板，请手动复制"
      });
    }
  }, [toast]);
  const copyKeyToClipboard = useCallback(async key => {
    try {
      await navigator.clipboard.writeText(key);
      toast({
        title: "复制成功",
        description: `配置Key已复制到剪贴板`
      });
    } catch {
      toast({
        variant: "destructive",
        title: "复制失败",
        description: "无法复制到剪贴板"
      });
    }
  }, [toast]);
  if (loading) {
    return <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">加载配置中...</span>
      </div>;
  }
  return <div className="space-y-6">
      <AIConfigFormatCard value={config.aiResponseFormatRequirement} onChange={value => updateConfigField("aiResponseFormatRequirement", value)} onCopyKey={copyKeyToClipboard} />

      <BotConfigCard title="试卷解析 Bot ID" description='当你在Admin中上传试卷并切题后，进入"试卷解析"页面，解析每一个题目的答案、解析、知识点时使用此AI。' configKey="ai_analysis_agent_bot_id" value={config.aiAnalysisAgentBotId} onChange={value => updateConfigField("aiAnalysisAgentBotId", value)} onCopyKey={copyKeyToClipboard} />

      <BotConfigCard title="单次测验诊断 Bot ID" description="当老师在Work中分析了所有错题后，使用此AI生成单次测验的诊断报告。" configKey="test_diagnosis_agent_bot_id" value={config.testDiagnosisAgentBotId} onChange={value => updateConfigField("testDiagnosisAgentBotId", value)} onCopyKey={copyKeyToClipboard} />

      <BotConfigCard title="学期多次测验诊断 Bot ID" description="当某个学生增加了新的测验后，使用此AI重新生成该学生的本学期多次测验的诊断报告。" configKey="term_multi_test_diagnosis_agent_bot_id" value={config.termMultiTestDiagnosisAgentBotId} onChange={value => updateConfigField("termMultiTestDiagnosisAgentBotId", value)} onCopyKey={copyKeyToClipboard} />

      <BotConfigCard title="题目互动问答生成 Bot ID" description="用于生成题目的常见提问与答案，在AI与学生互动时，AI向学生提出问题的参考问题。" configKey="question_interaction_agent_bot_id" value={config.questionInteractionAgentBotId} onChange={value => updateConfigField("questionInteractionAgentBotId", value)} onCopyKey={copyKeyToClipboard} />

      <PromptTemplateCard title={`新生${DISPLAY_TEXT.ORAL_KNOWLEDGE_QUIZ} - 单题AI分析提示词模板`} description='用于分析学生单个题目解答情况的AI提示词模板。注意：返回格式不能修改，必须严格按照"解答思路点评："和"模仿老师评语："的格式返回。' configKey="questionAnalysisPromptTemplate" value={config.questionAnalysisPromptTemplate} onChange={value => updateConfigField("questionAnalysisPromptTemplate", value)} onCopyKey={copyKeyToClipboard} onCopyParameter={copyParameterToClipboard} onResetTemplate={handleResetTemplate} templateType="question" parameters={[
    {
      name: "${standardAnswers}",
      description: "题目的标准答案内容"
    },
    {
      name: "${standardParse}",
      description: "题目的标准解析内容"
    }, {
      name: "${studentAudioContents}",
      description: "学生的语音解答内容"
    }, {
      name: "${studentImageInfo}",
      description: "学生上传的图片信息说明"
    }]} showFormatWarning={true} resetting={resetting} saving={saving} />

      <PromptTemplateCard title={`新生${DISPLAY_TEXT.ORAL_KNOWLEDGE_QUIZ} - 整体评语AI分析提示词模板`} description="用于根据各个题目的评语生成整体评语的AI提示词模板。" configKey="overallCommentPromptTemplate" value={config.overallCommentPromptTemplate} onChange={value => updateConfigField("overallCommentPromptTemplate", value)} onCopyKey={copyKeyToClipboard} onCopyParameter={copyParameterToClipboard} onResetTemplate={handleResetTemplate} templateType="overall" parameters={[
    {
      name: "${teacherComments}",
      description: "各个题目的老师评语内容"
    }]} resetting={resetting} saving={saving} />

      <PromptTemplateCard title={`${DISPLAY_TEXT.COURSE_MISTAKE} - AI分析提示词模板`} description={`用于${DISPLAY_TEXT.COURSE_MISTAKE}场景，根据题目信息和学生答案信息生成模仿老师口气的评语内容。`} configKey="mistakePracticePromptTemplate" value={config.mistakePracticePromptTemplate} onChange={value => updateConfigField("mistakePracticePromptTemplate", value)} onCopyKey={copyKeyToClipboard} onCopyParameter={copyParameterToClipboard} onResetTemplate={handleResetTemplate} templateType="mistakePractice" parameters={[
    {
      name: "${questionInfo}",
      description: "题目信息"
    },
    {
      name: "${studentAnswer}",
      description: "学生答案信息"
    }]} resetting={resetting} saving={saving} />

      <PromptTemplateCard title={`${DISPLAY_TEXT.SELF_UPLOAD_MISTAKE} - AI分析提示词模板`} description={`用于${DISPLAY_TEXT.SELF_UPLOAD_MISTAKE}场景，根据题目信息和学生答案信息生成模仿老师口气的评语内容。`} configKey="personalMistakePromptTemplate" value={config.personalMistakePromptTemplate} onChange={value => updateConfigField("personalMistakePromptTemplate", value)} onCopyKey={copyKeyToClipboard} onCopyParameter={copyParameterToClipboard} onResetTemplate={handleResetTemplate} templateType="personalMistake" parameters={[
    {
      name: "${questionInfo}",
      description: "题目信息"
    },
    {
      name: "${studentAnswer}",
      description: "学生答案信息"
    }]} resetting={resetting} saving={saving} />

      <div className="flex justify-end space-x-2">
        <Button variant="outline" onClick={loadConfig} disabled={loading || saving || resetting}>
          重新加载
        </Button>
        <Button onClick={handleSave} disabled={saving || resetting}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          保存配置
        </Button>
      </div>
    </div>;
}
