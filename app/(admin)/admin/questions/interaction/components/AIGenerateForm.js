"use client";

import { Loader2, Plus, Sparkles, XCircle } from "lucide-react";
// AI生成互动问题表单组件，用于通过AI生成题目的互动考察问题
import { useState } from "react";
import { Button } from "../../../../../../components/ui/button.js";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../../../components/ui/card.js";
import { Label } from "../../../../../../components/ui/label.js";
import { Textarea } from "../../../../../../components/ui/textarea.js";
import { useToast } from "../../../../../../hooks/use-toast.js";
import { addInteraction, generateInteractionQuestions } from "../actions.js";
export default function AIGenerateForm({
  question,
  onSuccess
}) {
  const {
    toast
  } = useToast();
  const [generating, setGenerating] = useState(false);
  const [adding, setAdding] = useState(null);
  const [generatedQuestions, setGeneratedQuestions] = useState([]);

  // 生成AI问题
  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const result = await generateInteractionQuestions(question);
      if (result.success && result.data) {
        setGeneratedQuestions(result.data);
        toast({
          title: "生成成功",
          description: `已生成 ${result.data.length} 个互动问题`
        });
      } else {
        toast({
          title: "生成失败",
          description: result.message || "AI生成失败",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("AI生成失败:", error);
      toast({
        title: "生成失败",
        description: "发生未知错误",
        variant: "destructive"
      });
    } finally {
      setGenerating(false);
    }
  };

  // 添加问题到数据库
  const handleAddToDatabase = async index => {
    const generatedQuestion = generatedQuestions[index];
    if (!generatedQuestion.question.trim() || !generatedQuestion.answer.trim()) {
      toast({
        title: "添加失败",
        description: "问题和答案不能为空",
        variant: "destructive"
      });
      return;
    }
    setAdding(`${index}`);
    try {
      const result = await addInteraction(question._id, generatedQuestion.question.trim(), generatedQuestion.answer.trim());
      if (result.success) {
        toast({
          title: "添加成功",
          description: result.message
        });
        // 从生成的问题列表中移除已添加的问题
        setGeneratedQuestions(prev => prev.filter((_, i) => i !== index));
        onSuccess();
      } else {
        toast({
          title: "添加失败",
          description: result.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("添加互动问题失败:", error);
      toast({
        title: "添加失败",
        description: "发生未知错误",
        variant: "destructive"
      });
    } finally {
      setAdding(null);
    }
  };

  // 更新问题内容
  const updateQuestion = (index, field, value) => {
    setGeneratedQuestions(prev => prev.map((q, i) => i === index ? {
      ...q,
      [field]: value
    } : q));
  };

  // 删除生成的问题
  const removeGeneratedQuestion = index => {
    setGeneratedQuestions(prev => prev.filter((_, i) => i !== index));
  };
  return <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          AI生成互动问题
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 生成按钮 */}
        <div className="flex justify-center">
          <Button onClick={handleGenerate} disabled={generating} className="px-8">
            {generating ? <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                AI生成中...
              </> : <>
                <Sparkles className="h-4 w-4 mr-2" />
                生成互动问题
              </>}
          </Button>
        </div>

        {/* 生成的问题列表 */}
        {generatedQuestions.length > 0 && <div className="space-y-4">
            <div className="text-sm font-medium text-muted-foreground">
              AI生成的问题 ({generatedQuestions.length}个)
            </div>
            {generatedQuestions.map((generatedQuestion, index) => <div key={index} className="border rounded-lg p-4 bg-gradient-to-r from-blue-50 to-purple-50">
                <div className="flex justify-between items-start mb-3">
                  <div className="text-sm font-medium text-muted-foreground">
                    生成问题 {index + 1}
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => removeGeneratedQuestion(index)} className="h-8 w-8 p-0 text-destructive hover:text-white hover:bg-destructive" title="删除此问题">
                    <XCircle className="h-4 w-4" />
                  </Button>
                </div>

                <div className="space-y-3">
                  {/* 问题 */}
                  <div>
                    <Label className="text-xs font-medium text-blue-600">
                      问题
                    </Label>
                    <Textarea value={generatedQuestion.question} onChange={e => updateQuestion(index, "question", e.target.value)} className="mt-1" rows={2} />
                  </div>

                  {/* 答案 */}
                  <div>
                    <Label className="text-xs font-medium text-green-600">
                      答案
                    </Label>
                    <Textarea value={generatedQuestion.answer} onChange={e => updateQuestion(index, "answer", e.target.value)} className="mt-1" rows={2} />
                  </div>

                  {/* 添加按钮 */}
                  <div className="flex justify-end">
                    <Button size="sm" onClick={() => handleAddToDatabase(index)} disabled={adding === `${index}`}>
                      {adding === `${index}` ? <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          添加中...
                        </> : <>
                          <Plus className="h-4 w-4 mr-2" />
                          添加到题目
                        </>}
                    </Button>
                  </div>
                </div>
              </div>)}
          </div>}
      </CardContent>
    </Card>;
}
