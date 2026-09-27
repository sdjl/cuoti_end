"use client";

import { Brain, CheckCircle, Copy, FileText } from "lucide-react";
// 站外分析组件，用于显示AI分析文案供复制到站外AI平台使用，并提供手动分析结果输入和解析功能
import { useEffect, useState } from "react";
import { getExternalAnalysisData } from "../actions.js";
import { Button } from "../../../../../../../components/ui/button.js";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../../../../../components/ui/card.js";
import { ScrollArea } from "../../../../../../../components/ui/scroll-area.js";
import { Textarea } from "../../../../../../../components/ui/textarea.js";
import { useToast } from "../../../../../../../hooks/use-toast.js";
const CARD_HEIGHT = 600;
export default function ExternalAnalysis({
  examId,
  analysisResults,
  setAnalysisResults,
  setShowAnalysisResults
}) {
  const {
    toast
  } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [aiResponseFormat, setAiResponseFormat] = useState("");
  const [analysisText, setAnalysisText] = useState("");
  const [combinedText, setCombinedText] = useState("");
  const [isCopied, setIsCopied] = useState(false);
  const [manualAnalysisResult, setManualAnalysisResult] = useState("");

  // 加载数据
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);

        // 获取站外分析数据
        const result = await getExternalAnalysisData(examId);
        if (!result.success) {
          throw new Error(result.error || "获取数据失败");
        }
        setAiResponseFormat(result.aiResponseFormat);
        setAnalysisText(result.analysisText);

        // 合并两个部分的文本
        const combined = `${result.aiResponseFormat}\n\n${result.analysisText}`;
        setCombinedText(combined);
      } catch (error) {
        console.error("加载数据失败:", error);
        toast({
          title: "加载失败",
          description: "无法加载站外分析数据",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [examId, toast]);

  // 复制文本到剪贴板
  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(combinedText);
      setIsCopied(true);
      toast({
        title: "复制成功",
        description: "AI分析文案已复制到剪贴板"
      });

      // 3秒后重置复制状态
      setTimeout(() => {
        setIsCopied(false);
      }, 3000);
    } catch (error) {
      console.error("复制失败:", error);
      toast({
        title: "复制失败",
        description: "无法复制到剪贴板",
        variant: "destructive"
      });
    }
  };

  // 处理选择题答案：提取大写字母，每个字母一行
  const processChoiceAnswer = content => {
    // 首先尝试提取所有大写字母（传统选择题答案）
    const upperCaseLetters = content.match(/[A-Z]/g) || [];

    // 如果能提取到大写字母，返回去重后的字母
    if (upperCaseLetters.length > 0) {
      return [...new Set(upperCaseLetters)];
    }

    // 如果没有大写字母，检查是否有分号分隔的内容（如数字答案）
    if (content.includes(";") || content.includes("；")) {
      // 使用分号分割内容
      const parts = content.split(/[;；]/).map(p => p.trim()).filter(p => p.length > 0);
      return parts;
    }

    // 如果都没有，直接返回原始内容作为单个答案
    return [content];
  };

  // 解析AI输出结果并填充到表单
  const parseAIOutput = aiOutput => {
    try {
      const lines = aiOutput.split("\n");
      const newResults = [...analysisResults];

      // 清空所有题目的解析数据，准备重新填充AI分析结果
      newResults.forEach(result => {
        result.answer = [];
        result.parse = [];
        result.knowledgePoints = [];
        result.difficulty = "未知";
        result.easyToMistakeDetail = [];
      });
      for (const line of lines) {
        const trimmedLine = line.trim();

        // 跳过空行
        if (!trimmedLine) {
          continue;
        }
        try {
          // 匹配格式：数字-答案:内容 或 数字-解析:内容 或 数字-知识点:内容 或 数字-难度:内容 或 数字-易错细节:内容
          const match = trimmedLine.match(/^(\d+)-(答案|解析|知识点|难度|易错细节)[:：]\s*(.*)$/);
          if (match) {
            const questionNum = parseInt(match[1]);
            const type = match[2];
            const content = match[3].trim();

            // 找到对应的题目
            const questionIndex = newResults.findIndex(r => r.questionNumber === questionNum);
            if (questionIndex >= 0 && content) {
              if (type === "答案") {
                // 检查是否为选择题
                const isChoiceQuestion = newResults[questionIndex].questionType === "选择题";
                if (isChoiceQuestion) {
                  // 处理选择题答案
                  newResults[questionIndex].answer = processChoiceAnswer(content);
                } else {
                  // 非选择题直接存储原始内容，每个内容作为一项
                  newResults[questionIndex].answer = [content];
                }
              } else if (type === "解析") {
                newResults[questionIndex].parse = [content];
              } else if (type === "知识点") {
                // 使用分号分割知识点
                const points = content.split(/[;；]/).map(p => p.trim()).filter(p => p.length > 0);
                newResults[questionIndex].knowledgePoints = points;
              } else if (type === "难度") {
                // 验证难度值是否有效
                const validDifficulties = ["容易", "中等", "困难", "超难", "未知"];
                if (validDifficulties.includes(content)) {
                  newResults[questionIndex].difficulty = content;
                } else {
                  newResults[questionIndex].difficulty = "未知";
                }
              } else if (type === "易错细节") {
                // 使用分号分割易错细节
                const details = content.split(/[;；]/).map(d => d.trim()).filter(d => d.length > 0);
                newResults[questionIndex].easyToMistakeDetail = details;
              }
            }
          }
        } catch (lineError) {
          console.warn("解析行内容失败:", trimmedLine, lineError);
        }
      }
      setAnalysisResults(newResults);
      setShowAnalysisResults(true);
      toast({
        title: "解析成功",
        description: "AI分析结果已解析并填充到结果区域"
      });
    } catch (error) {
      console.error("解析AI输出失败:", error);
      toast({
        title: "解析失败",
        description: "AI输出格式不正确，请检查格式后重试",
        variant: "destructive"
      });
    }
  };

  // 处理手动分析结果
  const handleParseManualResult = () => {
    if (!manualAnalysisResult.trim()) {
      toast({
        title: "输入为空",
        description: "请先输入AI分析结果",
        variant: "destructive"
      });
      return;
    }
    parseAIOutput(manualAnalysisResult);
  };
  return <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        {/* 左侧：AI分析文案 */}
        <Card className="col-span-1 flex flex-col" style={{
        height: `${CARD_HEIGHT}px`
      }}>
          <CardHeader className="flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                <CardTitle>AI分析文案</CardTitle>
              </div>
              <Button variant="outline" size="sm" onClick={handleCopyText} disabled={isLoading || !combinedText} className={isCopied ? "text-green-600 border-green-600" : ""}>
                {isCopied ? <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    已复制
                  </> : <>
                    <Copy className="h-4 w-4 mr-2" />
                    复制
                  </>}
              </Button>
            </div>
            <CardDescription>
              包含AI响应格式要求和试卷分析内容，可复制到站外AI平台使用
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden">
            {isLoading ? <div className="flex items-center justify-center h-full">
                <div className="text-gray-500">正在加载数据...</div>
              </div> : combinedText ? <ScrollArea className="w-full h-full rounded-md border p-4">
                <div className="text-sm whitespace-pre-wrap break-words">
                  {/* AI响应格式要求部分 */}
                  {aiResponseFormat && <div className="mb-4">
                      <div className="text-gray-700 mb-4">
                        {aiResponseFormat}
                      </div>
                    </div>}

                  {/* 分析文本内容部分 */}
                  {analysisText && <div>
                      <div className="text-gray-700">{analysisText}</div>
                    </div>}
                </div>
              </ScrollArea> : <div className="flex items-center justify-center h-full border rounded-md">
                <div className="text-center text-gray-400">
                  <FileText className="h-12 w-12 mx-auto mb-2" />
                  <p>暂无分析文案</p>
                  <p className="text-sm mt-1">请检查配置和试卷数据</p>
                </div>
              </div>}
          </CardContent>
        </Card>

        {/* 右侧：手动分析结果输入区域 */}
        <Card className="col-span-1 flex flex-col" style={{
        height: `${CARD_HEIGHT}px`
      }}>
          <CardHeader className="flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Brain className="h-5 w-5 mr-2" />
                <CardTitle>手动分析结果</CardTitle>
              </div>
              <Button variant="default" size="sm" onClick={handleParseManualResult} disabled={!manualAnalysisResult.trim()}>
                <Brain className="h-4 w-4 mr-2" />
                解析结果
              </Button>
            </div>
            <CardDescription>
              将站外AI的分析结果粘贴到此处，然后点击解析结果按钮
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden">
            <div className="w-full h-full rounded-md border bg-muted/30 p-4">
              <Textarea value={manualAnalysisResult} onChange={e => setManualAnalysisResult(e.target.value)} placeholder={`请将AI分析结果粘贴到这里...

格式示例：
1-答案: A
1-解析: 这道题考查的是...
1-知识点: 数学函数;一次函数
1-难度: 中等
1-易错细节: 注意函数的定义域;计算时要注意符号

2-答案: B
2-解析: 根据题意可知...
2-知识点: 几何;圆的性质
2-难度: 困难
2-易错细节: 圆心的位置容易搞错;半径计算要仔细`} className="w-full h-full resize-none text-sm border-0 bg-transparent focus-visible:ring-0 focus:outline-none" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>;
}
