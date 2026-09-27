"use client";

import { Copy, MessageCircle, Save, Sparkles, X } from "lucide-react";
// 老师评语组件，提供老师评语的编辑、保存功能，支持AI自动生成评语
import { useEffect, useState } from "react";
import { Button } from "../../../../../../../../../components/ui/button.js";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../../../../../../components/ui/card.js";
import { Textarea } from "../../../../../../../../../components/ui/textarea.js";
import { useToast } from "../../../../../../../../../hooks/use-toast.js";
import { DISPLAY_TEXT } from "../../../../../../../../../lib/config/constants.js";
import { analyzeMistakePracticeWithAIAction, updateMistakePracticeTeacherCommentAction } from "../actions.js";
export default function TeacherComment({
  details,
  onRefresh
}) {
  const {
    toast
  } = useToast();

  // 查找最新的会话（按创建时间倒序，取第一个）
  const latestSession = details.aiChatSessions.length > 0 ? details.aiChatSessions[0] : null;

  // 表单状态
  const [commentValue, setCommentValue] = useState(latestSession?.teacherComment || "");
  const [isSaving, setIsSaving] = useState(false);

  // AI分析相关状态
  const [isAIAnalyzing, setIsAIAnalyzing] = useState(false);
  const [hasAIResult, setHasAIResult] = useState(false);
  const [originalComment, setOriginalComment] = useState("");

  // 同步props变化
  useEffect(() => {
    const newLatestSession = details.aiChatSessions.length > 0 ? details.aiChatSessions[0] : null;
    setCommentValue(newLatestSession?.teacherComment || "");
  }, [details.aiChatSessions]);

  // 如果没有会话，显示提示
  if (!latestSession) {
    return <Card className="bg-white">
        <CardHeader>
          <div className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-lg">
              {DISPLAY_TEXT.COURSE_MISTAKE}老师评语
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <div className="text-gray-400 text-lg mb-2">💬</div>
            <p className="text-gray-500">暂无AI对话会话</p>
            <p className="text-sm text-gray-400 mt-1">
              请等待学生开始与AI对话后再添加评语
            </p>
          </div>
        </CardContent>
      </Card>;
  }

  // 保存老师评语
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const result = await updateMistakePracticeTeacherCommentAction(latestSession._id, commentValue);
      if (result.success) {
        toast({
          title: "保存成功",
          description: "老师评语已保存"
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
      const result = await analyzeMistakePracticeWithAIAction(details.studentAnswerItem._id);
      if (result.success) {
        // 3. 更新界面内容
        if (result.teacherComment) {
          setCommentValue(result.teacherComment);
        }

        // 4. 标记为AI结果
        setHasAIResult(true);
        toast({
          title: "AI分析完成",
          description: "已为您生成老师评语，请检查后保存"
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

  // 复制评语内容
  const handleCopyComment = async () => {
    if (!commentValue.trim()) {
      toast({
        title: "复制失败",
        description: "评语内容为空",
        variant: "destructive"
      });
      return;
    }
    try {
      await navigator.clipboard.writeText(commentValue);
      toast({
        title: "复制成功",
        description: "老师评语已复制到剪贴板"
      });
    } catch (error) {
      console.error("复制失败:", error);
      toast({
        title: "复制失败",
        description: "无法访问剪贴板，请手动复制",
        variant: "destructive"
      });
    }
  };
  return <Card className="bg-white">
      <CardHeader>
        <div className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-blue-600" />
          <CardTitle className="text-lg">
            {DISPLAY_TEXT.COURSE_MISTAKE}老师评语
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 老师评语编辑区域 */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">老师评语</h4>
          <Textarea value={commentValue} onChange={e => setCommentValue(e.target.value)} placeholder={`请输入${DISPLAY_TEXT.COURSE_MISTAKE}老师评语...`} className="text-sm bg-blue-50" rows={6} />
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

            <Button variant="outline" onClick={handleCopyComment} disabled={isAIAnalyzing || isSaving || !commentValue.trim()} className="flex items-center gap-2">
              <Copy className="h-4 w-4" />
              复制
            </Button>
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
            AI分析功能会根据题目信息（包含题目内容）和学生在AI对话中的回答内容，自动生成老师评语。
            评语将模仿老师的口气，评价学生的回答并给出改进建议。
          </p>
        </div>
      </CardContent>
    </Card>;
}
