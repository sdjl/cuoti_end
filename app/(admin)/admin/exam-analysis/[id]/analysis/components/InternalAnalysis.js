"use client";

import { AlertTriangle, Brain, FileText, Loader2 } from "lucide-react";
// 站内分析组件，用于使用系统内置AI逐页分析试卷内容，并显示PDF文本内容和AI分析结果
import { useEffect, useState } from "react";
import { getAIAnalysisBotId, startPageAIAnalysis } from "../actions.js";
import { Badge } from "../../../../../../../components/ui/badge.js";
import { Button } from "../../../../../../../components/ui/button.js";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../../../../../components/ui/card.js";
import { Progress } from "../../../../../../../components/ui/progress.js";
import { ScrollArea } from "../../../../../../../components/ui/scroll-area.js";
import { useToast } from "../../../../../../../hooks/use-toast.js";
const CARD_HEIGHT = 600;
export default function InternalAnalysis({
  examId,
  examPaper,
  analysisResults,
  setAnalysisResults,
  setShowAnalysisResults,
  setIsAnalyzing: setParentIsAnalyzing,
  shouldResetAnalysis,
  handleAnalysisReset
}) {
  const {
    toast
  } = useToast();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisContent, setAnalysisContent] = useState("");
  const [thinkingContent, setThinkingContent] = useState("");
  const [showThinking, setShowThinking] = useState(false);
  const [botId, setBotId] = useState("");

  // 逐页分析相关状态
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [allPagesResults, setAllPagesResults] = useState([]);

  // 加载bot id和计算总页数
  useEffect(() => {
    const loadBotId = async () => {
      try {
        const id = await getAIAnalysisBotId();
        setBotId(id);
      } catch (error) {
        console.error("加载bot id失败:", error);
      }
    };
    loadBotId();

    // 计算有题目的页数
    const pagesWithQuestions = examPaper.pages.filter(page => page.questions.some(q => q.questionText));
    setTotalPages(pagesWithQuestions.length);
  }, [examPaper]);

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
  const parseAIOutput = pageResults => {
    try {
      // 合并所有页面的AI输出
      const combinedOutput = pageResults.join("\n");
      const lines = combinedOutput.split("\n");
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
    } catch (error) {
      console.error("解析AI输出失败:", error);
      toast({
        title: "解析失败",
        description: "AI输出格式不正确，请重新分析",
        variant: "destructive"
      });
    }
  };

  // 流式内容处理
  const streamContent = chunks => {
    let fullContent = "";
    let fullThinking = "";
    for (const chunk of chunks) {
      if (chunk.type === "text") {
        fullContent += chunk.content;
      } else if (chunk.type === "thinking") {
        fullThinking += chunk.reasoning_content;
      }
    }
    if (fullThinking && !fullContent) {
      setShowThinking(true);
      setThinkingContent(fullThinking);
      setAnalysisContent("");
    } else if (fullContent) {
      setShowThinking(false);
      setThinkingContent("");
      setAnalysisContent(fullContent);
    }
    return fullContent;
  };

  // 分析单个页面
  const analyzePageByPage = async (startFromPage = 0) => {
    try {
      setIsAnalyzing(true);
      setParentIsAnalyzing(true);

      // 在开始分析时重置错误状态
      setHasError(false);
      setErrorMessage("");

      // 只在开始新的分析时清除内容，继续分析时保留
      if (startFromPage === 0) {
        setAnalysisContent("");
        setThinkingContent("");
        setShowThinking(false);
      }

      // 获取有题目的页面
      const pagesWithQuestions = examPaper.pages.filter(page => page.questions.some(q => q.questionText));
      const pageResults = [...allPagesResults];
      let analysisCompleted = false;

      // 从指定页面开始分析
      for (let i = startFromPage; i < pagesWithQuestions.length; i++) {
        const page = pagesWithQuestions[i];
        setCurrentPage(i + 1);
        try {
          const result = await startPageAIAnalysis(examId, page.pageNumber);
          if (!result.success) {
            throw new Error(result.error || `第${i + 1}页AI分析失败`);
          }

          // 检查返回的chunks是否有效
          if (!result.chunks || result.chunks.length === 0) {
            throw new Error(`第${i + 1}页AI分析没有返回有效数据`);
          }

          // 流式处理响应数据
          const pageContent = streamContent(result.chunks);

          // 验证页面内容是否有效
          if (!pageContent || pageContent.trim().length === 0) {
            throw new Error(`第${i + 1}页AI分析返回内容为空`);
          }

          // 将本页结果添加到页面结果数组
          if (pageResults.length <= i) {
            pageResults.push(pageContent);
          } else {
            pageResults[i] = pageContent;
          }
          setAllPagesResults([...pageResults]);

          // 短暂延迟，让用户看到进度更新
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (pageError) {
          console.error(`第${i + 1}页分析失败:`, pageError);
          setHasError(true);
          setErrorMessage(`第${i + 1}页分析失败: ${pageError instanceof Error ? pageError.message : "未知错误"}`);
          setCurrentPage(i + 1);

          // 清除分析内容，显示继续分析按钮
          setAnalysisContent("");
          setThinkingContent("");
          setShowThinking(false);
          toast({
            title: "分析失败",
            description: `第${i + 1}页分析失败，请点击"继续分析"重试`,
            variant: "destructive"
          });
          return; // 停止分析
        }
      }

      // 如果执行到这里，说明所有页面都分析完成了
      analysisCompleted = true;

      // 所有页面分析完成，合并结果
      if (analysisCompleted) {
        parseAIOutput(pageResults);
        setCurrentPage(pagesWithQuestions.length);

        // 清除错误状态，因为已经完全成功了
        setHasError(false);
        setErrorMessage("");
        toast({
          title: "分析完成",
          description: `已成功分析${pagesWithQuestions.length}页内容`
        });
      }
    } catch (error) {
      console.error("AI分析失败:", error);
      setHasError(true);
      setErrorMessage(error instanceof Error ? error.message : "AI分析失败");

      // 清除分析内容，显示继续分析按钮
      setAnalysisContent("");
      setThinkingContent("");
      setShowThinking(false);
      toast({
        title: "分析失败",
        description: error instanceof Error ? error.message : "AI分析失败",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
      setParentIsAnalyzing(false);
    }
  };

  // 开始AI分析
  const handleStartAnalysis = async () => {
    try {
      setAllPagesResults([]);
      setCurrentPage(0);
      await analyzePageByPage(0);
    } catch (error) {
      console.error("开始分析失败:", error);
      toast({
        title: "分析失败",
        description: "启动分析过程失败，请重试",
        variant: "destructive"
      });
    }
  };

  // 继续分析（从失败的页面开始）
  const handleContinueAnalysis = async () => {
    try {
      if (currentPage > 0) {
        await analyzePageByPage(currentPage - 1);
      } else {
        await handleStartAnalysis();
      }
    } catch (error) {
      console.error("继续分析失败:", error);
      toast({
        title: "分析失败",
        description: "继续分析过程失败，请重试",
        variant: "destructive"
      });
    }
  };

  // 监听重新分析标志
  useEffect(() => {
    if (shouldResetAnalysis) {
      // 重新分析时，清除所有本地状态
      setAnalysisContent("");
      setThinkingContent("");
      setShowThinking(false);
      setHasError(false);
      setErrorMessage("");
      setCurrentPage(0);
      setAllPagesResults([]);

      // 通知父组件重置完成
      handleAnalysisReset();
    }
  }, [shouldResetAnalysis, handleAnalysisReset]);

  // 获取PDF文本内容
  const pdfText = examPaper.analysisReport?.pdfWithParseText || "";

  // 计算进度百分比
  const progressPercentage = totalPages > 0 ? currentPage / totalPages * 100 : 0;
  return <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        {/* 左侧：PDF文本内容显示区域 */}
        <Card className="col-span-1 flex flex-col" style={{
        height: `${CARD_HEIGHT}px`
      }}>
          <CardHeader className="flex-shrink-0">
            <CardTitle className="flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              PDF文本内容
            </CardTitle>
            <CardDescription>
              {pdfText ? "解析PDF文件的文本内容如下" : "暂无PDF文本内容，请先上传解析PDF"}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden">
            {pdfText ? <ScrollArea className="w-full h-full rounded-md border p-4">
                <pre className="text-sm whitespace-pre-wrap break-words">
                  {pdfText}
                </pre>
              </ScrollArea> : <div className="flex items-center justify-center h-full border rounded-md">
                <div className="text-center text-gray-400">
                  <FileText className="h-12 w-12 mx-auto mb-2" />
                  <p>暂无PDF文本内容</p>
                  <p className="text-sm mt-1">请先上传解析PDF文件</p>
                </div>
              </div>}
          </CardContent>
        </Card>

        {/* 右侧：AI分析区域 */}
        <Card className="col-span-1 flex flex-col" style={{
        height: `${CARD_HEIGHT}px`
      }}>
          <CardHeader className="flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Brain className="h-5 w-5 mr-2" />
                <CardTitle>AI智能分析</CardTitle>
              </div>
              {botId && <Badge variant="outline" className="text-xs">
                  Bot ID: {botId}
                </Badge>}
            </div>
            <CardDescription>
              {isAnalyzing ? showThinking ? "AI正在思考中..." : `正在分析第${currentPage}页 (共${totalPages}页)` : hasError ? "分析中断，可以继续执行" : "点击开始按钮进行AI智能分析"}
            </CardDescription>

            {/* 进度条 */}
            {(isAnalyzing || currentPage > 0) && <div className="space-y-2">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>分析进度</span>
                  <span>
                    {currentPage}/{totalPages}
                  </span>
                </div>
                <Progress value={progressPercentage} className="h-2" />
              </div>}

            {/* 错误提示 */}
            {hasError && <div className="flex items-center text-red-600 text-sm">
                <AlertTriangle className="h-4 w-4 mr-1" />
                <span>{errorMessage}</span>
              </div>}
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden">
            {!hasError && (analysisContent || thinkingContent) ? <ScrollArea className="w-full h-full rounded-md border p-4">
                {showThinking && thinkingContent && <div className="text-sm text-gray-600 whitespace-pre-wrap break-words mb-4">
                    <div className="flex items-center mb-2">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      <span className="font-medium">AI思考中...</span>
                    </div>
                    {thinkingContent}
                  </div>}
                {!showThinking && analysisContent && <div className="text-sm whitespace-pre-wrap break-words">
                    {analysisContent}
                    {isAnalyzing && <span className="inline-block w-2 h-4 bg-blue-500 animate-pulse ml-1"></span>}
                  </div>}
              </ScrollArea> : <div className="flex items-center justify-center h-full">
                <div className="text-center space-y-4">
                  <Brain className="h-16 w-16 mx-auto text-blue-500" />
                  <h3 className="text-lg font-medium">AI智能分析</h3>
                  <p className="text-gray-500 text-sm max-w-sm">
                    逐页分析试卷内容，基于知识点和题目信息生成结构化的分析文本
                  </p>

                  {hasError ? <Button onClick={handleContinueAnalysis} disabled={isAnalyzing || !pdfText} className="mt-6 text-white" variant="destructive">
                      {isAnalyzing ? <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          分析中...
                        </> : "继续分析"}
                    </Button> : <Button onClick={handleStartAnalysis} disabled={isAnalyzing || !pdfText} className="mt-6">
                      {isAnalyzing ? <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          分析中...
                        </> : "开始分析"}
                    </Button>}

                  {!pdfText && <p className="text-sm text-red-500 mt-2">
                      请先上传解析PDF文件
                    </p>}
                </div>
              </div>}
          </CardContent>
        </Card>
      </div>
    </div>;
}
