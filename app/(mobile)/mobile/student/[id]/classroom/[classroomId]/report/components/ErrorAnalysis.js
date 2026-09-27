"use client";

import { Brain, Loader2 } from "lucide-react";
import { useState } from "react";
import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer } from "recharts";
import { Button } from "../../../../../../../../../components/ui/button.js";
import { DISPLAY_TEXT } from "../../../../../../../../../lib/config/constants.js";
import { generateErrorAnalysis } from "../actions.js";
/**
 * 错误归因组件 - 雷达图风格
 */
const ErrorAnalysis = ({
  errorAnalysisPrompt
}) => {
  const [errorData, setErrorData] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [hasAnalyzed, setHasAnalyzed] = useState(false);
  const [attemptCount, setAttemptCount] = useState(0);
  const [showRetryMessage, setShowRetryMessage] = useState(false);

  // 检查是否数据不足
  const isDataInsufficient = !errorAnalysisPrompt || errorAnalysisPrompt.trim() === "";
  // 检查是否已达到最大重试次数
  const maxAttempts = 3;
  const canRetry = attemptCount < maxAttempts;
  const handleStartAnalysis = async () => {
    setIsAnalyzing(true);
    setShowRetryMessage(false);
    try {
      console.log("开始AI错误归因分析...");
      console.log("使用预计算的提示字符串:", errorAnalysisPrompt);
      console.log("当前尝试次数:", attemptCount + 1);

      // 更新尝试次数
      setAttemptCount(prev => prev + 1);

      // 调用AI生成错误归因分析
      const analysisResult = await generateErrorAnalysis(errorAnalysisPrompt);
      console.log("AI分析结果:", analysisResult);
      setErrorData(analysisResult);
      setHasAnalyzed(true);
      setShowRetryMessage(false);
    } catch (error) {
      console.error("错误归因分析失败:", error);
      if (error instanceof Error) {
        if (error.message === "DATA_INSUFFICIENT") {
          // 数据不足错误
          setErrorData([{
            subject: "数据不足",
            value: 0
          }]);
          setHasAnalyzed(true);
          setShowRetryMessage(false);
        } else if (error.message === "AI_FORMAT_ERROR") {
          // AI格式错误，显示重试消息
          setShowRetryMessage(true);
          setHasAnalyzed(false);
        } else {
          // 其他错误
          setErrorData([{
            subject: "系统错误",
            value: 50
          }, {
            subject: "请重试",
            value: 30
          }]);
          setShowRetryMessage(true);
          setHasAnalyzed(false);
        }
      } else {
        // 未知错误
        setErrorData([{
          subject: "未知错误",
          value: 50
        }, {
          subject: "请重试",
          value: 30
        }]);
        setShowRetryMessage(true);
        setHasAnalyzed(false);
      }
    } finally {
      setIsAnalyzing(false);
    }
  };
  return <div className="bg-card rounded-lg border border-border overflow-hidden shadow-sm">
      {/* 组件标题 */}
      <div className="px-4 py-3 border-b border-border">
        <h3 className="text-base font-semibold text-card-foreground">
          错误归因雷达分析
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          AI智能分析错误原因分布
        </p>
      </div>

      {/* 内容区域 */}
      <div className="p-4">
        {isDataInsufficient ?
      // 显示数据不足提示
      <div className="h-64 flex flex-col items-center justify-center space-y-4">
            <div className="text-center">
              <Brain className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <h4 className="text-lg font-medium text-card-foreground mb-2">
                错误归因分析暂不可用
              </h4>
              <p className="text-sm text-muted-foreground max-w-sm">
                犯错原因数据不足，暂不能使用AI分析
              </p>
            </div>

            <Button disabled={true} className="mt-4" size="lg" variant="secondary">
              <Brain className="mr-2 h-4 w-4" />
              数据不足，无法分析
            </Button>
          </div> : !hasAnalyzed || showRetryMessage ?
      // 显示启动分析按钮或重试按钮
      <div className="h-64 flex flex-col items-center justify-center space-y-4">
            <div className="text-center">
              <Brain className={`h-12 w-12 mx-auto mb-3 ${showRetryMessage ? "text-orange-500" : "text-blue-500"}`} />
              <h4 className="text-lg font-medium text-card-foreground mb-2">
                {showRetryMessage ? "AI分析出错" : "AI错误归因分析"}
              </h4>
              <p className="text-sm text-muted-foreground max-w-sm">
                {showRetryMessage ? `AI分析出错，请重试（${attemptCount}/${maxAttempts}）` : "智能识别学习中的易错原因和改进方向"}
              </p>
            </div>

            <Button onClick={handleStartAnalysis} disabled={isAnalyzing || !canRetry} className="mt-4 text-white" size="lg" variant={showRetryMessage ? "destructive" : "default"}>
              {isAnalyzing ? <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  AI分析中，请稍等...
                </> : showRetryMessage ? <>
                  <Brain className="mr-2 h-4 w-4" />
                  {canRetry ? "重试分析" : "已达最大重试次数"}
                </> : <>
                  <Brain className="mr-2 h-4 w-4" />
                  启动AI分析
                </>}
            </Button>
          </div> :
      // 显示分析结果
      <>
            {/* 雷达图区域 */}
            <div className="h-64 mb-4">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={errorData} margin={{
              top: 20,
              right: 20,
              bottom: 20,
              left: 20
            }}>
                  <PolarGrid stroke="#e2e8f0" strokeDasharray="3 3" />
                  <PolarAngleAxis dataKey="subject" tick={{
                fontSize: 10,
                fill: "#64748b"
              }} className="text-xs" />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{
                fontSize: 8,
                fill: "#94a3b8"
              }} tickCount={4} />
                  <Radar name="错误频率" dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} strokeWidth={2} dot={{
                fill: "#3b82f6",
                strokeWidth: 2,
                r: 4
              }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {/* 分析说明 */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-card-foreground">
                AI分析结果说明（优先改进错误值高的）：
              </h4>
              <div className="grid grid-cols-1 gap-2">
                {errorData.map((item, index) => <div key={index} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                    <span className="text-sm text-card-foreground">
                      {item.subject}
                    </span>
                    <span className="text-sm font-medium text-blue-600">
                      {item.value}
                    </span>
                  </div>)}
              </div>
            </div>
          </>}
      </div>

      {/* 底部提示 */}
      <div className="px-4 py-3 bg-muted/50 border-t border-border">
        <p className="text-xs text-muted-foreground text-center">
          {hasAnalyzed ? "🎯 AI根据错题数据智能分析，仅作为参考，请结合实际情况进行改进" : `🤖 基于${DISPLAY_TEXT.SELF_UPLOAD_MISTAKE}记录，AI将分析易错原因并给出改进建议`}
        </p>
      </div>
    </div>;
};
export default ErrorAnalysis;
