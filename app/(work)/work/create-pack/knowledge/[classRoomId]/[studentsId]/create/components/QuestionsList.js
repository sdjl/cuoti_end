"use client";

// 班级定制题集创建页的题目列表，负责选择题目并发起生成
import { CheckSquare, FileText, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import BaseImage from "../../../../../../../../../components/common/BaseImage.js";
import { Badge } from "../../../../../../../../../components/ui/badge.js";
import { Button } from "../../../../../../../../../components/ui/button.js";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../../../../../../components/ui/card.js";
import { Checkbox } from "../../../../../../../../../components/ui/checkbox.js";
import { useToast } from "../../../../../../../../../hooks/use-toast.js";
import { createCustomQuestionPack } from "../actions.js";
export default function QuestionsList({
  questions,
  loading = false,
  studentId,
  classRoomId,
  subject,
  knowledgePoints,
  timeRangeDescription
}) {
  const [selectedQuestions, setSelectedQuestions] = useState(new Set());
  const [isAllSelected, setIsAllSelected] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const router = useRouter();
  const {
    toast
  } = useToast();

  // 当题目数据变化时，重置选择状态
  useEffect(() => {
    if (questions.length > 0) {
      // 默认全选
      const allQuestionIds = new Set(questions.map(q => q._id));
      setSelectedQuestions(allQuestionIds);
      setIsAllSelected(true);
    } else {
      setSelectedQuestions(new Set());
      setIsAllSelected(false);
    }
  }, [questions]);

  // 处理单个题目的选择
  const handleQuestionToggle = (questionId, checked) => {
    const newSelected = new Set(selectedQuestions);
    if (checked) {
      newSelected.add(questionId);
    } else {
      newSelected.delete(questionId);
    }
    setSelectedQuestions(newSelected);
    setIsAllSelected(newSelected.size === questions.length);
  };

  // 处理全选/取消全选
  const handleSelectAll = checked => {
    if (checked) {
      const allQuestionIds = new Set(questions.map(q => q._id));
      setSelectedQuestions(allQuestionIds);
    } else {
      setSelectedQuestions(new Set());
    }
    setIsAllSelected(checked);
  };

  // 处理题目卡片点击
  const handleQuestionCardClick = questionId => {
    const isCurrentlySelected = selectedQuestions.has(questionId);
    handleQuestionToggle(questionId, !isCurrentlySelected);
  };

  // 处理生成定制题集
  const handleGenerateCustomPack = async () => {
    if (selectedQuestions.size === 0) {
      toast({
        title: "提示",
        description: "请至少选择一道题目",
        variant: "destructive"
      });
      return;
    }
    setIsGenerating(true);
    try {
      const result = await createCustomQuestionPack({
        studentId,
        classRoomId,
        questionIds: Array.from(selectedQuestions),
        subject,
        knowledgePointsCount: knowledgePoints.length,
        knowledgePoints,
        timeRangeDescription
      });
      if (result.success) {
        toast({
          title: "成功",
          description: "定制题集生成成功！"
        });

        // 1秒后跳转到列表页面
        setTimeout(() => {
          router.push(`/work/create-pack/knowledge/${classRoomId}/${studentId}/list`);
        }, 1000);
      } else {
        toast({
          title: "生成失败",
          description: result.error || "未知错误",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("生成定制题集失败:", error);
      toast({
        title: "生成失败",
        description: error instanceof Error ? error.message : "未知错误",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };
  if (loading) {
    return <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            查询结果
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="text-gray-500">查询题目中...</div>
          </div>
        </CardContent>
      </Card>;
  }
  if (questions.length === 0) {
    return <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            查询结果
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="text-gray-500">未找到符合条件的题目</div>
            <p className="text-sm text-gray-400 mt-2">请尝试调整查询条件</p>
          </div>
        </CardContent>
      </Card>;
  }
  return <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          查询结果
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 统计信息和操作区域 */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* 全选控制 */}
              <div className="flex items-center gap-2">
                <Checkbox id="select-all-questions" checked={isAllSelected} onCheckedChange={handleSelectAll} />
                <label htmlFor="select-all-questions" className="font-medium cursor-pointer">
                  {isAllSelected ? "取消全选" : "全选"}
                </label>
              </div>

              {/* 已选择数量 */}
              <span className="text-gray-600">
                已选择 <Badge variant="default">{selectedQuestions.size}</Badge>{" "}
                道题目
              </span>
            </div>

            {/* 总数量 */}
            <span className="text-gray-600">
              共找到 <Badge variant="outline">{questions.length}</Badge> 道题目
            </span>
          </div>
        </div>

        {/* 题目列表 */}
        <div className="space-y-4 max-h-[600px] overflow-y-auto">
          {questions.map((question, index) => <div key={question._id} className={`border rounded-lg overflow-hidden hover:bg-gray-50 transition-colors cursor-pointer ${selectedQuestions.has(question._id) ? "border-2 border-blue-600" : "border-gray-200"}`} onClick={() => handleQuestionCardClick(question._id)}>
              {/* 题目图片区域 */}
              <div className="relative">
                {question.imageUrl ? <div className="w-full bg-gray-100">
                    <BaseImage src={question.imageUrl} alt={`题目 ${index + 1}`} width={800} height={600} className="w-full h-auto object-contain" />
                  </div> : <div className="w-full h-48 bg-gray-100 flex items-center justify-center">
                    <FileText className="w-16 h-16 text-gray-400" />
                    <span className="ml-2 text-gray-500">暂无图片</span>
                  </div>}
              </div>

              {/* 题目信息区域 */}
              <div className="p-4 bg-gray-50">
                {/* 序号、选择框、知识点、类型、难度 - 单行显示 */}
                <div className="flex flex-wrap items-center gap-3 text-xs">
                  {/* 序号和选择框 */}
                  <div className="flex items-center gap-2">
                    <Checkbox id={`question-${question._id}`} checked={selectedQuestions.has(question._id)} onCheckedChange={checked => handleQuestionToggle(question._id, !!checked)} onClick={e => e.stopPropagation()} />
                    <div className="text-xs text-gray-700 font-medium">
                      #{index + 1}
                    </div>
                  </div>

                  {/* 知识点标签 */}
                  {question.knowledgePoints && question.knowledgePoints.length > 0 && <div className="flex items-center gap-1">
                        <span className="text-gray-500">知识点：</span>
                        <div className="flex flex-wrap gap-1">
                          {question.knowledgePoints.map((point, idx) => <Badge key={idx} variant="outline" className="text-xs">
                              {point}
                            </Badge>)}
                        </div>
                      </div>}

                  {/* 题目类型 */}
                  {question.questionType && <div className="flex items-center gap-1">
                      <span className="text-gray-500">类型：</span>
                      <Badge variant="secondary" className="text-xs">
                        {question.questionType}
                      </Badge>
                    </div>}

                  {/* 题目难度 - 统一使用default样式 */}
                  <div className="flex items-center gap-1">
                    <span className="text-gray-500">难度：</span>
                    <Badge variant="default" className="text-xs">
                      {question.difficulty}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>)}
        </div>

        {/* 底部操作区域 */}
        <div className="flex justify-end pt-4 border-t">
          <Button onClick={handleGenerateCustomPack} disabled={selectedQuestions.size === 0 || isGenerating} size="lg" className="flex items-center gap-2">
            {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckSquare className="w-4 h-4" />}
            {isGenerating ? "生成中..." : `生成定制题集 (${selectedQuestions.size}道题目)`}
          </Button>
        </div>
      </CardContent>
    </Card>;
}
